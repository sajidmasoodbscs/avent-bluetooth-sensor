/**
 * Vercel serverless — keeps Gemini key private (no REACT_APP_ prefix).
 * Env: GEMINI_API_KEY  (Google AI Studio: https://aistudio.google.com/apikey)
 */

const GEMINI_MODEL = 'gemini-3.6-flash';

function extractJsonObject(text) {
  if (!text) return null;
  const trimmed = String(text).trim();
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

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return sendJson(res, 204, {});
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) {
    return sendJson(res, 500, {
      error: 'Missing GEMINI_API_KEY on the server. Add it in Vercel → Settings → Environment Variables (no REACT_APP_ prefix).',
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }
  }

  const audioBase64 = body?.audioBase64;
  const mimeType = body?.mimeType || 'audio/wav';
  if (!audioBase64 || typeof audioBase64 !== 'string' || audioBase64.length < 50) {
    return sendJson(res, 400, { error: 'Missing audioBase64' });
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const geminiBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
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

  try {
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });
    const payload = await geminiRes.json().catch(() => ({}));
    if (!geminiRes.ok) {
      return sendJson(res, geminiRes.status, {
        error: payload?.error?.message || `Gemini HTTP ${geminiRes.status}`,
      });
    }

    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || '')
      .join('')
      .trim();

    const parsed = extractJsonObject(text);
    if (parsed?.transcript != null || parsed?.answer != null) {
      return sendJson(res, 200, {
        transcript: String(parsed.transcript ?? '').trim() || '(no speech detected)',
        answer: String(parsed.answer ?? '').trim() || '(no answer)',
      });
    }

    return sendJson(res, 200, {
      transcript: '(could not parse transcript)',
      answer: text || '(empty Gemini response)',
    });
  } catch (err) {
    return sendJson(res, 502, { error: err?.message || 'Gemini request failed' });
  }
};
