import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HistoryIcon from '@mui/icons-material/History';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { askGeminiWithAudio, hasLocalGeminiFallbackKey } from '../../utils/geminiAudioQa';
import { useBle } from '../../ble/BleContext';
import {
  appendMicAiSessionTurn,
  blobToBase64,
  clearMicAiSessionChat,
  playAudioBase64,
  readMicAiSessionChat,
} from '../../utils/micChatStorage';

const ACCEPT_AUDIO = 'audio/*,.wav,.mp3,.m4a,.ogg,.webm,.aac,.flac';

function guessMimeType(file) {
  if (file?.type) return file.type;
  const name = (file?.name || '').toLowerCase();
  if (name.endsWith('.wav')) return 'audio/wav';
  if (name.endsWith('.mp3')) return 'audio/mpeg';
  if (name.endsWith('.m4a')) return 'audio/mp4';
  if (name.endsWith('.ogg')) return 'audio/ogg';
  if (name.endsWith('.webm')) return 'audio/webm';
  if (name.endsWith('.aac')) return 'audio/aac';
  if (name.endsWith('.flac')) return 'audio/flac';
  return 'audio/wav';
}

/**
 * Current Q&A + optional file upload (no BLE required for upload test).
 * Session history in localStorage; cleared on BLE connect / disconnect.
 */
export default function MicAiPanel({ getWavBlob, hasExportableAudio, isCapturing }) {
  const { isConnected } = useBle();
  const prevConnectedRef = useRef(isConnected);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState(() => readMicAiSessionChat());
  const [uploadedFile, setUploadedFile] = useState(null);
  const localFallback = hasLocalGeminiFallbackKey();

  const canAskFromDevice = Boolean(hasExportableAudio && !isCapturing && isConnected);
  const canAskFromUpload = Boolean(uploadedFile);
  const canAsk = canAskFromDevice || canAskFromUpload;

  useEffect(() => {
    const wasConnected = prevConnectedRef.current;
    if (isConnected && !wasConnected) {
      setCurrent(null);
      setHistory([]);
      setError('');
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    if (!isConnected && wasConnected) {
      clearMicAiSessionChat();
      setCurrent(null);
      setHistory([]);
      setError('');
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected]);

  const runAsk = async (blob, mimeType, source) => {
    setError('');
    setLoading(true);
    try {
      if (!blob) throw new Error('No audio available');

      const audioBase64 = await blobToBase64(blob);
      const result = await askGeminiWithAudio(blob, { mimeType });
      const turn = {
        id: String(Date.now()),
        t: Date.now(),
        transcript: result.transcript || '(no speech detected)',
        answer: result.answer || '(no answer)',
        audioBase64,
        mimeType,
        source,
      };

      setCurrent(turn);
      const next = appendMicAiSessionTurn(turn);
      setHistory(next);
      console.log('[Mic AI] session turn saved', {
        id: turn.id,
        source,
        historyCount: next.length,
      });
    } catch (e) {
      console.warn('[Mic AI] failed', e);
      setError(e?.message || 'Gemini request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    // Prefer uploaded file when present (manual test path).
    if (uploadedFile) {
      await runAsk(uploadedFile, guessMimeType(uploadedFile), 'upload');
      return;
    }
    const blob = getWavBlob?.();
    await runAsk(blob, 'audio/wav', 'ble');
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size < 100) {
      setError('Audio file is too small.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Audio file is too large (max 20 MB).');
      return;
    }
    setError('');
    setUploadedFile(file);
  };

  const clearUpload = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openHistory = () => {
    setHistory(readMicAiSessionChat());
    setHistoryOpen(true);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 1,
        border: '1px solid #e0e0e0',
        backgroundColor: '#f7faf8',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Ask Google AI (Gemini)
      </Typography>
      <Typography variant="body2" sx={{ color: '#666', mb: 1.5 }}>
        Use board mic (Record → Stop → Ask), or <strong>upload an audio file</strong> to test
        the AI flow without the Bluetooth device.
      </Typography>

      <Alert severity="info" sx={{ mb: 1.5 }}>
        On Vercel set private env <code>GEMINI_API_KEY</code>. File upload does not need BLE.
        Device history is cleared when you reconnect.
        {localFallback ? ' Local public fallback key is also present.' : null}
      </Alert>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
        <Button
          variant="outlined"
          size="small"
          component="label"
          startIcon={<UploadFileIcon />}
          disabled={loading}
        >
          Upload audio
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept={ACCEPT_AUDIO}
            onChange={handleFileChange}
          />
        </Button>
        {uploadedFile && (
          <>
            <Typography variant="caption" sx={{ color: '#555', maxWidth: 220 }} noWrap title={uploadedFile.name}>
              {uploadedFile.name}
            </Typography>
            <Button size="small" color="inherit" onClick={clearUpload} disabled={loading}>
              Clear file
            </Button>
          </>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
          onClick={handleAsk}
          disabled={loading || !canAsk}
        >
          {loading ? 'Asking…' : uploadedFile ? 'Ask from uploaded file' : 'Ask Google AI'}
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<HistoryIcon />}
          onClick={openHistory}
          disabled={loading}
        >
          Session history ({history.length})
        </Button>
        {isCapturing && (
          <Typography variant="caption" sx={{ color: '#888' }}>
            Stop recording before asking from device
          </Typography>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          border: '1px solid #e8e8e8',
          backgroundColor: '#fff',
          minHeight: 100,
        }}
      >
        {!current && !loading && (
          <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 2 }}>
            No current answer yet. Record from device, or upload an audio file, then Ask.
          </Typography>
        )}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#888', py: 2 }}>
            <CircularProgress size={16} />
            <Typography variant="caption">Gemini is answering…</Typography>
          </Box>
        )}

        {current && !loading && (
          <Stack spacing={1.5}>
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#888', fontWeight: 600 }}>
                  Your question (transcript)
                  {current.source === 'upload' ? ' · uploaded file' : ' · device mic'}
                </Typography>
                {current.audioBase64 && (
                  <Button
                    size="small"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => playAudioBase64(current.audioBase64, current.mimeType)}
                  >
                    Play audio
                  </Button>
                )}
              </Stack>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {current.transcript}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#888', fontWeight: 600 }}>
                Gemini answer
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                {current.answer}
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>

      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pr: 6 }}>
          Session history
          <Typography variant="body2" sx={{ color: '#888', fontWeight: 400, mt: 0.5 }}>
            Chat for this session · cleared on BLE reconnect
          </Typography>
          <IconButton
            onClick={() => setHistoryOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {history.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
              No history yet.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {history.map((turn) => (
                <Box key={turn.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ alignSelf: 'flex-end', maxWidth: '90%' }}>
                    <Typography variant="caption" sx={{ color: '#888', fontWeight: 600, display: 'block', textAlign: 'right', mb: 0.35 }}>
                      You · {new Date(turn.t).toLocaleTimeString()}
                      {turn.source === 'upload' ? ' · upload' : ''}
                    </Typography>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        backgroundColor: '#e8f5e9',
                        border: '1px solid #c8e6c9',
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {turn.transcript}
                      </Typography>
                      {turn.audioBase64 && (
                        <Button
                          size="small"
                          sx={{ mt: 0.75 }}
                          startIcon={<PlayArrowIcon />}
                          onClick={() => playAudioBase64(turn.audioBase64, turn.mimeType)}
                        >
                          Play audio
                        </Button>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
                    <Typography variant="caption" sx={{ color: '#888', fontWeight: 600, display: 'block', mb: 0.35 }}>
                      Gemini
                    </Typography>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {turn.answer}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
