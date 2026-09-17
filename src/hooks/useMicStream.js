import { useCallback, useEffect, useRef, useState } from 'react';
import { useBle } from '../ble/BleContext';
import {
  GET_COMMANDS,
  MIC_AUDIO_CHAR_UUID,
  MIC_EXPECTED_CHUNK_BYTES,
} from '../utils/bleProtocol';
import {
  MIC_SAMPLE_RATE,
  pcmBytesToInt16Array,
  downsampleWaveform,
  buildRmsEnvelope,
  generateDummyPcmChunk,
  createDummyMicState,
  buildWavBlob,
  downloadWav,
  playPcmSamples,
} from '../utils/micAudio';

export const USE_DUMMY_MIC_DATA = false;

const MAX_DISPLAY_SAMPLES = MIC_SAMPLE_RATE * 3;
const DUMMY_CHUNK_SAMPLES = 320;
const DUMMY_CHUNK_MS = (DUMMY_CHUNK_SAMPLES / MIC_SAMPLE_RATE) * 1000;

export function useMicStream(active = true) {
  const {
    isConnected,
    writeCommand,
    withGattLock,
    service,
    ensureMicService,
    setMicModeActive,
  } = useBle();

  const pcmRef = useRef(new Int16Array(0));
  const captureRef = useRef(new Int16Array(0));
  const isCapturingRef = useRef(false);
  const dummyStateRef = useRef(null);
  const dummyTimerRef = useRef(null);
  const playerRef = useRef(null);
  const micCharRef = useRef(null);
  const notifyHandlerRef = useRef(null);

  const [isRunning, setIsRunning] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [captureSampleCount, setCaptureSampleCount] = useState(0);
  const [waveformRows, setWaveformRows] = useState([]);
  const [envelopeRows, setEnvelopeRows] = useState([]);
  const [stats, setStats] = useState({ kbps: 0, notifications: 0, bytes: 0, lastChunkBytes: 0 });

  const bytesRef = useRef(0);
  const notifyRef = useRef(0);
  const startRef = useRef(null);

  const appendPcm = useCallback((samples) => {
    if (!samples.length) return;

    const prev = pcmRef.current;
    const merged = new Int16Array(prev.length + samples.length);
    merged.set(prev);
    merged.set(samples, prev.length);
    const trimmed = merged.length > MAX_DISPLAY_SAMPLES
      ? merged.subarray(merged.length - MAX_DISPLAY_SAMPLES)
      : merged;
    pcmRef.current = trimmed;
    setWaveformRows(downsampleWaveform(trimmed, 480));
    setEnvelopeRows(buildRmsEnvelope(trimmed, 512));

    if (isCapturingRef.current) {
      const capPrev = captureRef.current;
      const capMerged = new Int16Array(capPrev.length + samples.length);
      capMerged.set(capPrev);
      capMerged.set(samples, capPrev.length);
      captureRef.current = capMerged;
      setCaptureSampleCount(capMerged.length);
    }
  }, []);

  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  const reset = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }
    setIsPlaying(false);
    pcmRef.current = new Int16Array(0);
    captureRef.current = new Int16Array(0);
    bytesRef.current = 0;
    notifyRef.current = 0;
    startRef.current = null;
    dummyStateRef.current = createDummyMicState();
    setCaptureSampleCount(0);
    setIsCapturing(false);
    setWaveformRows([]);
    setEnvelopeRows([]);
    setStats({ kbps: 0, notifications: 0, bytes: 0, lastChunkBytes: 0 });
  }, []);

  const startCapture = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
      setIsPlaying(false);
    }
    captureRef.current = new Int16Array(0);
    setCaptureSampleCount(0);
    isCapturingRef.current = true;
    setIsCapturing(true);
  }, []);

  const stopCapture = useCallback(() => {
    isCapturingRef.current = false;
    setIsCapturing(false);
  }, []);

  const getExportSamples = useCallback(() => {
    if (captureRef.current.length > 0) return captureRef.current;
    return pcmRef.current;
  }, []);

  const captureDurationSec = captureSampleCount / MIC_SAMPLE_RATE;
  const hasExportableAudio = captureSampleCount > 0 || pcmRef.current.length > 0;

  const handleDownload = useCallback(() => {
    const samples = getExportSamples();
    if (!samples.length) return false;
    const suffix = isCapturing ? 'partial' : 'capture';
    return downloadWav(samples, `mic-${suffix}.wav`);
  }, [getExportSamples, isCapturing]);

  const handlePlay = useCallback(async () => {
    const samples = getExportSamples();
    if (!samples.length) return;

    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }

    setIsPlaying(true);
    try {
      const player = await playPcmSamples(samples, MIC_SAMPLE_RATE);
      playerRef.current = player;
      setTimeout(() => {
        setIsPlaying(false);
        playerRef.current = null;
      }, (player?.durationSec ?? 0) * 1000 + 100);
    } catch (e) {
      console.warn('[Mic] playback failed', e);
      setIsPlaying(false);
    }
  }, [getExportSamples]);

  const handleStopPlay = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const getWavBlob = useCallback(() => {
    const samples = getExportSamples();
    if (!samples.length) return null;
    return buildWavBlob(samples);
  }, [getExportSamples]);

  const handleNotification = useCallback((eventOrData) => {
    // Copy bytes — DataView may be reused by the BLE stack (Word guide).
    let bytes;
    if (eventOrData?.target?.value) {
      const v = eventOrData.target.value;
      bytes = new Uint8Array(v.buffer, v.byteOffset, v.byteLength).slice();
    } else if (eventOrData instanceof DataView) {
      bytes = new Uint8Array(eventOrData.buffer, eventOrData.byteOffset, eventOrData.byteLength).slice();
    } else {
      bytes = eventOrData instanceof Uint8Array
        ? eventOrData.slice()
        : new Uint8Array(eventOrData);
    }

    const chunkLen = bytes.byteLength;
    if (chunkLen !== MIC_EXPECTED_CHUNK_BYTES && notifyRef.current < 5) {
      console.warn('[Use case Mic] PCM chunk size', {
        bytes: chunkLen,
        expected: MIC_EXPECTED_CHUNK_BYTES,
        note: chunkLen < MIC_EXPECTED_CHUNK_BYTES
          ? 'Likely MTU truncation — firmware sends at most ATT_MTU-3'
          : 'Unexpected size',
      });
    }

    const chunk = pcmBytesToInt16Array(bytes);
    if (startRef.current == null) startRef.current = performance.now();
    bytesRef.current += chunkLen;
    notifyRef.current += 1;
    appendPcm(chunk);
    const elapsed = (performance.now() - startRef.current) / 1000;
    if (elapsed > 0) {
      const nextStats = {
        bytes: bytesRef.current,
        notifications: notifyRef.current,
        kbps: (bytesRef.current * 8) / elapsed / 1000,
        lastChunkBytes: chunkLen,
      };
      setStats(nextStats);
      if (notifyRef.current % 25 === 0) {
        console.log('[Use case Mic] PCM notification', {
          notifications: nextStats.notifications,
          bytes: nextStats.bytes,
          lastChunkBytes: chunkLen,
          expectedChunkBytes: MIC_EXPECTED_CHUNK_BYTES,
          kbps: nextStats.kbps.toFixed(1),
          capturing: isCapturingRef.current,
        });
      }
    }
  }, [appendPcm]);

  useEffect(() => {
    if (!active || !isRunning) {
      if (dummyTimerRef.current) {
        clearInterval(dummyTimerRef.current);
        dummyTimerRef.current = null;
      }
      return undefined;
    }

    if (USE_DUMMY_MIC_DATA) {
      if (startRef.current == null) startRef.current = performance.now();
      dummyTimerRef.current = setInterval(() => {
        const chunk = generateDummyPcmChunk(DUMMY_CHUNK_SAMPLES, dummyStateRef);
        handleNotification(new Uint8Array(chunk.buffer));
      }, DUMMY_CHUNK_MS);
      return () => {
        if (dummyTimerRef.current) {
          clearInterval(dummyTimerRef.current);
          dummyTimerRef.current = null;
        }
      };
    }

    if (!isConnected) return undefined;

    let cancelled = false;

    const startMicBle = async () => {
      try {
        // Word guide order: subscribe notifications FIRST, then GET:MIC.
        // Resolve mic service lazily (not during device connect).
        const micSvc = await ensureMicService?.();
        const mainSvc = service?.current;
        const ownerSvc = micSvc || mainSvc;
        if (!ownerSvc) {
          console.warn('[Mic] No GATT service available for audio characteristic');
          return;
        }

        let micChar;
        try {
          micChar = await ownerSvc.getCharacteristic(MIC_AUDIO_CHAR_UUID);
        } catch (charErr) {
          // Fallback: try main sensor service if mic service char missing
          if (micSvc && mainSvc && ownerSvc !== mainSvc) {
            micChar = await mainSvc.getCharacteristic(MIC_AUDIO_CHAR_UUID);
          } else {
            throw charErr;
          }
        }
        if (cancelled) return;

        const handler = (event) => handleNotification(event);
        notifyHandlerRef.current = handler;
        micCharRef.current = micChar;

        await micChar.startNotifications();
        micChar.addEventListener('characteristicvaluechanged', handler);
        console.log('[Use case Mic] notifications enabled', {
          charUuid: MIC_AUDIO_CHAR_UUID,
          viaMicService: Boolean(micSvc),
        });

        if (cancelled) return;

        await withGattLock(async () => {
          await writeCommand(new TextEncoder().encode(GET_COMMANDS.MIC));
        });
        setMicModeActive(true);
        console.log('[Use case Mic] GET:MIC sent (after subscribe)');
      } catch (e) {
        console.warn('[Mic] BLE subscribe / GET:MIC failed', e);
        setMicModeActive(false);
      }
    };

    startMicBle();

    return () => {
      cancelled = true;
      const stop = async () => {
        // Word guide: STOP:MIC first, then stop notifications.
        try {
          await withGattLock(async () => {
            await writeCommand(new TextEncoder().encode(GET_COMMANDS.STOP_MIC));
          });
        } catch (_) {
          /* ignore */
        } finally {
          setMicModeActive(false);
        }

        const micChar = micCharRef.current;
        if (micChar && notifyHandlerRef.current) {
          micChar.removeEventListener('characteristicvaluechanged', notifyHandlerRef.current);
          try {
            await micChar.stopNotifications();
          } catch (_) {
            /* ignore */
          }
        }
        micCharRef.current = null;
        notifyHandlerRef.current = null;
        console.log('[Use case Mic] STOP:MIC + notifications stopped');
      };
      stop();
    };
  }, [
    active,
    isRunning,
    isConnected,
    handleNotification,
    writeCommand,
    withGattLock,
    service,
    ensureMicService,
    setMicModeActive,
  ]);

  useEffect(() => () => {
    if (playerRef.current) playerRef.current.stop();
  }, []);

  return {
    waveformRows,
    envelopeRows,
    stats,
    isRunning,
    setIsRunning,
    isCapturing,
    isPlaying,
    captureDurationSec,
    hasExportableAudio,
    reset,
    startCapture,
    stopCapture,
    downloadWav: handleDownload,
    playRecording: handlePlay,
    stopPlayback: handleStopPlay,
    getWavBlob,
    useDummy: USE_DUMMY_MIC_DATA,
    micCharUuid: MIC_AUDIO_CHAR_UUID,
    sampleRate: MIC_SAMPLE_RATE,
    onBleNotification: handleNotification,
  };
}
