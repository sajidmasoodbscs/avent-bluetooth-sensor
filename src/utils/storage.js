const MAX_POINTS_PER_SENSOR = 500;

export function getSessionId() {
  let id = sessionStorage.getItem('sessionId');
  if (!id) {
    id = `${Date.now()}`;
    sessionStorage.setItem('sessionId', id);
  }
  return id;
}

export function appendSensorPoint(sensorKey, value) {
  const sessionId = getSessionId();
  const key = `sensorHistory.${sensorKey}.${sessionId}`;
  const now = Date.now();
  const raw = localStorage.getItem(key);
  const arr = raw ? JSON.parse(raw) : [];
  arr.push({ t: now, v: value });
  if (arr.length > MAX_POINTS_PER_SENSOR) arr.splice(0, arr.length - MAX_POINTS_PER_SENSOR);
  localStorage.setItem(key, JSON.stringify(arr));
}

export function readSensorHistory(sensorKey, limit = 200) {
  const sessionId = getSessionId();
  const key = `sensorHistory.${sensorKey}.${sessionId}`;
  const raw = localStorage.getItem(key);
  const arr = raw ? JSON.parse(raw) : [];
  if (arr.length > limit) return arr.slice(arr.length - limit);
  return arr;
}


