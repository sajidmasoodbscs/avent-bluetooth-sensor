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
import { askGeminiWithAudio, hasLocalGeminiFallbackKey } from '../../utils/geminiAudioQa';
import { useBle } from '../../ble/BleContext';
import {
  appendMicAiSessionTurn,
  blobToBase64,
  clearMicAiSessionChat,
  playAudioBase64,
  readMicAiSessionChat,
} from '../../utils/micChatStorage';

/**
 * Modal shows current audio Q&A only.
 * Session history (all turns + audio) in localStorage while BLE connected;
 * cleared on BLE connect / disconnect.
 */
export default function MicAiPanel({ getWavBlob, hasExportableAudio, isCapturing }) {
  const { isConnected } = useBle();
  const prevConnectedRef = useRef(isConnected);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState(() => readMicAiSessionChat());
  const localFallback = hasLocalGeminiFallbackKey();

  useEffect(() => {
    const wasConnected = prevConnectedRef.current;
    if (isConnected && !wasConnected) {
      // Fresh BLE connect — cache already cleared in ConnectModal; reset UI
      setCurrent(null);
      setHistory([]);
      setError('');
    }
    if (!isConnected && wasConnected) {
      clearMicAiSessionChat();
      setCurrent(null);
      setHistory([]);
      setError('');
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected]);

  const handleAsk = async () => {
    setError('');
    setLoading(true);
    try {
      const blob = getWavBlob?.();
      if (!blob) throw new Error('No audio recorded');

      const audioBase64 = await blobToBase64(blob);
      const result = await askGeminiWithAudio(blob);
      const turn = {
        id: String(Date.now()),
        t: Date.now(),
        transcript: result.transcript || '(no speech detected)',
        answer: result.answer || '(no answer)',
        audioBase64,
        mimeType: 'audio/wav',
      };

      setCurrent(turn);
      const next = appendMicAiSessionTurn(turn);
      setHistory(next);
      console.log('[Mic AI] session turn saved', { id: turn.id, historyCount: next.length });
    } catch (e) {
      console.warn('[Mic AI] failed', e);
      setError(e?.message || 'Gemini request failed');
    } finally {
      setLoading(false);
    }
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
        Record → Stop → Ask. This panel shows the <strong>current</strong> question and answer.
        Use Session history for the full chat (audio + answers) while BLE stays connected.
      </Typography>

      <Alert severity="info" sx={{ mb: 1.5 }}>
        On Vercel set private env <code>GEMINI_API_KEY</code>. History is stored in localStorage
        only for this BLE connection and is cleared when you connect again.
        {localFallback ? ' Local public fallback key is also present.' : null}
      </Alert>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
          onClick={handleAsk}
          disabled={loading || isCapturing || !hasExportableAudio || !isConnected}
        >
          {loading ? 'Asking…' : 'Ask Google AI'}
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
            Stop recording before asking
          </Typography>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {/* Current turn only */}
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
            No current answer yet. Record, stop, then Ask Google AI.
          </Typography>
        )}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#888', py: 2, justifyContent: 'center' }}>
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
            Chat for this BLE connection only · cleared on reconnect
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
              No history yet for this connection.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {history.map((turn) => (
                <Box key={turn.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ alignSelf: 'flex-end', maxWidth: '90%' }}>
                    <Typography variant="caption" sx={{ color: '#888', fontWeight: 600, display: 'block', textAlign: 'right', mb: 0.35 }}>
                      You · {new Date(turn.t).toLocaleTimeString()}
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
