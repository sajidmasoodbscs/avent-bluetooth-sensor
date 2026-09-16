/** Mic AI chat session — localStorage only while BLE is connected. Cleared on connect/disconnect. */

export const MIC_AI_SESSION_KEY = 'micAiSessionChat';
const MAX_TURNS = 20;

export function clearMicAiSessionChat() {
  try {
    localStorage.removeItem(MIC_AI_SESSION_KEY);
  } catch (_) {
    /* ignore */
  }
}

export function readMicAiSessionChat() {
  try {
    const raw = localStorage.getItem(MIC_AI_SESSION_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

/**
 * @param {{ id: string, t: number, transcript: string, answer: string, audioBase64?: string, mimeType?: string }} turn
 */
export function appendMicAiSessionTurn(turn) {
  const list = readMicAiSessionChat();
  list.push(turn);
  while (list.length > MAX_TURNS) list.shift();
  try {
    localStorage.setItem(MIC_AI_SESSION_KEY, JSON.stringify(list));
  } catch (e) {
    // Quota — drop oldest audio first, then drop turns
    console.warn('[Mic AI] localStorage full, trimming', e);
    for (const item of list) {
      if (item.audioBase64) delete item.audioBase64;
    }
    try {
      localStorage.setItem(MIC_AI_SESSION_KEY, JSON.stringify(list));
    } catch (e2) {
      while (list.length > 5) list.shift();
      localStorage.setItem(MIC_AI_SESSION_KEY, JSON.stringify(list));
    }
  }
  return list;
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.split(',')[1];
      if (!base64) reject(new Error('Failed to encode audio'));
      else resolve(base64);
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

export function playAudioBase64(base64, mimeType = 'audio/wav') {
  if (!base64) return null;
  const audio = new Audio(`data:${mimeType};base64,${base64}`);
  audio.play().catch((e) => console.warn('[Mic AI] play failed', e));
  return audio;
}
