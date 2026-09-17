/**
 * Client helper: posts recorded WAV to /api/gemini-audio-qa.
 * On Vercel the API key stays private as GEMINI_API_KEY (no REACT_APP_ prefix).
 *
 * Optional local fallback: REACT_APP_GEMINI_API_KEY (only if /api is unavailable).
 */

const GEMINI_MODEL = 'gemini-3.6-flash';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = String(dataUrl).split(',')[1];
      if (!base64) reject(new Error('Failed to encode audio'));
      else resolve(base64);
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

function extractJsonObject(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

async function askGeminiDirect(base64, apiKey, mimeType = 'audio/wav') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64 } },
          {
            text: [
              'You are a helpful assistant for the Avnet Abacus Sensor Evaluation Board demo.',
              'Listen to the audio. Transcribe what the user said, then answer their question clearly.',
              'If the audio is unclear or empty, say so in transcript and answer.',
              'Respond with JSON only, no markdown, using exactly these keys:',
              '{"transcript":"...","answer":"..."}',
            ].join(' '),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || `Gemini HTTP ${res.status}`);
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || '')
    .join('')
    .trim();

  const parsed = extractJsonObject(text);
  if (parsed?.transcript != null || parsed?.answer != null) {
    return {
      transcript: String(parsed.transcript ?? '').trim() || '(no speech detected)',
      answer: String(parsed.answer ?? '').trim() || '(no answer)',
    };
  }
  return {
    transcript: '(could not parse transcript)',
    answer: text || '(empty Gemini response)',
  };
}

/**
 * @param {Blob} audioBlob
 * @param {{ mimeType?: string }} [options]
 * @returns {Promise<{ transcript: string, answer: string }>}
 */
export async function askGeminiWithAudio(audioBlob, options = {}) {
  const mimeType = options.mimeType || audioBlob?.type || 'audio/wav';
  if (!audioBlob || audioBlob.size < 100) {
    throw new Error('No audio. Record from the device, or upload an audio file.');
  }

  const audioBase64 = await blobToBase64(audioBlob);

  // Preferred: private server key on Vercel / vercel dev
  try {
    const res = await fetch('/api/gemini-audio-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType }),
    });

    if (res.ok) {
      return res.json();
    }

    // 404 = CRA local without serverless — try browser fallback key
    if (res.status !== 404) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.error || `API HTTP ${res.status}`);
    }
  } catch (err) {
    if (err?.message && !String(err.message).includes('Failed to fetch') && !String(err.message).includes('404')) {
      // rethrow API errors from server
      if (!String(err.message).includes('fetch')) throw err;
    }
  }

  const localKey = (process.env.REACT_APP_GEMINI_API_KEY || '').trim();
  if (localKey) {
    console.warn('[Mic AI] Using REACT_APP_GEMINI_API_KEY local fallback (key is public in the browser)');
    return askGeminiDirect(audioBase64, localKey, mimeType);
  }

  throw new Error(
    'Gemini API not configured. On Vercel add private env GEMINI_API_KEY (no REACT_APP_ prefix). For local CRA without vercel dev, you can temporarily set REACT_APP_GEMINI_API_KEY in .env',
  );
}

/** True when a local public fallback key exists (not needed on Vercel). */
export function hasLocalGeminiFallbackKey() {
  return Boolean((process.env.REACT_APP_GEMINI_API_KEY || '').trim());
}
