/** Panasonic BLE protocol — single source of truth (matches Panasonic_BLE_Protocol_Guide.pdf). */

export const BLE_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
export const BLE_TX_UUID = '12345678-1234-1234-1234-123456789abd';
export const BLE_RX_UUID = '12345678-1234-1234-1234-123456789abe';
export const BLE_ALERT_UUID = '12345678-1234-1234-1234-123456789abf';

/** Legacy mic PCM notifications (same service after GET:MIC). */
export const MIC_AUDIO_CHAR_UUID = 'a1b2c3d4-0002-4000-8000-00805f9b34fb';

export const TLV = {
  TEMP: 0x01,
  HUMID: 0x02,
  IRTEMP: 0x03,
  ACCEL: 0x04,
  PRES: 0x05,
  GYRO: 0x06,
  PIR: 0x07,
  OCCUPANCY: 0x08,
  TILT: 0x09,
  MOTION: 0x0a,
  PRESSURE_ALERT: 0x0b,
  /** Barometric pressure float32, hPa (from GET:ALT). */
  BARO_PRESS: 0x0c,
  /** Altitude change vs baseline, float32, centimeters (+ = up). */
  ALT_CHANGE: 0x0d,
};

export const GET_COMMANDS = {
  TEMP: 'GET:TEMP',
  HUMID: 'GET:HUMID',
  IRTEMP: 'GET:IRTEMP',
  TEMPHUMID: 'GET:TEMPHUMID',
  IMU: 'GET:IMU',
  PRES: 'GET:PRES',
  ALT: 'GET:ALT',
  PIR: 'GET:PIR',
  ALL: 'GET:ALL',
  MIC: 'GET:MIC',
  STOP_MIC: 'STOP:MIC',
};

export const SENSOR_GET_CMD = {
  temperature: GET_COMMANDS.TEMPHUMID,
  humidity: GET_COMMANDS.TEMPHUMID,
  temphumid: GET_COMMANDS.TEMPHUMID,
  irTemperature: GET_COMMANDS.IRTEMP,
  imuAccel: GET_COMMANDS.IMU,
  imuGyro: GET_COMMANDS.IMU,
  pressure: GET_COMMANDS.PRES,
  baroPressure: GET_COMMANDS.ALT,
  pir: GET_COMMANDS.PIR,
  all: GET_COMMANDS.ALL,
};

export const ALERT_LABELS = {
  [TLV.OCCUPANCY]: ['vacant', 'occupied'],
  [TLV.TILT]: ['stable', 'warning', 'alarm'],
  [TLV.MOTION]: ['idle', 'motion', 'spike'],
  [TLV.PRESSURE_ALERT]: ['baseline', 'push', 'pull', 'spike'],
};

export const ALERT_KEYS = {
  [TLV.OCCUPANCY]: 'occupancy',
  [TLV.TILT]: 'tilt',
  [TLV.MOTION]: 'motion',
  [TLV.PRESSURE_ALERT]: 'pressureAlert',
};

/** Firmware sends Pascals; app displays hPa. Values above 5000 are treated as Pa. */
export function normalizePressure(value) {
  if (value == null || Number.isNaN(value)) return value;
  return value > 5000 ? value / 100 : value;
}

/** Barometric readings outside this range are treated as parse noise. */
export function isPlausiblePressure(hpa) {
  return Number.isFinite(hpa) && hpa > 50 && hpa < 1500;
}

/**
 * Parse one or more back-to-back TLV records from a poll response.
 * @returns {{ type: number, value: number }[]}
 */
export function parseTLV(dataView) {
  const view = dataView instanceof DataView
    ? dataView
    : new DataView(dataView.buffer, dataView.byteOffset, dataView.byteLength);
  const items = [];
  let offset = 0;

  while (offset + 2 <= view.byteLength) {
    const type = view.getUint8(offset);
    const len = view.getUint8(offset + 1);
    const valueOffset = offset + 2;
    if (valueOffset + len > view.byteLength) break;

    let value;
    if (type === TLV.PIR) {
      if (len === 2) {
        value = view.getInt16(valueOffset, true);
      } else if (len === 4) {
        value = view.getFloat32(valueOffset, true);
      }
    } else if (type >= TLV.OCCUPANCY && type <= TLV.PRESSURE_ALERT) {
      if (len >= 1) value = view.getUint8(valueOffset);
    } else if (len === 4) {
      const raw = view.getFloat32(valueOffset, true);
      if (type === TLV.PRES || type === TLV.BARO_PRESS) {
        value = normalizePressure(raw);
      } else {
        value = raw;
      }
    }

    if (value !== undefined) {
      items.push({ type, value });
    }
    offset = valueOffset + len;
  }

  return items;
}

/** Map parsed TLV items to `latestData` shape used across the app. */
export function tlvItemsToSensorData(items) {
  const data = {};
  for (const { type, value } of items) {
    switch (type) {
      case TLV.TEMP:
        data.temperature = value;
        break;
      case TLV.HUMID:
        data.humidity = value;
        break;
      case TLV.IRTEMP:
        data.irTemperature = value;
        break;
      case TLV.ACCEL:
        data.accel = [...(data.accel || []), value];
        break;
      case TLV.PRES:
        if (isPlausiblePressure(value)) data.pressure = value;
        break;
      case TLV.BARO_PRESS:
        if (isPlausiblePressure(value)) data.baroPressure = value;
        break;
      case TLV.ALT_CHANGE:
        data.altChangeCm = value;
        break;
      case TLV.GYRO:
        data.gyro = [...(data.gyro || []), value];
        break;
      case TLV.PIR:
        data.pir = value;
        break;
      default:
        break;
    }
  }
  return data;
}

/** Human-readable TLV tag for console debugging. */
export function tlvTypeLabel(type) {
  const entry = Object.entries(TLV).find(([, v]) => v === type);
  return entry ? `${entry[0]} (0x${type.toString(16).padStart(2, '0')})` : `UNKNOWN (0x${type.toString(16).padStart(2, '0')})`;
}

/**
 * Parse TLV with per-record metadata — use to verify tags like 0x0D in DevTools.
 * @returns {{ type: number, len: number, value?: number, label: string }[]}
 */
export function parseTLVDetailed(dataView) {
  const view = dataView instanceof DataView
    ? dataView
    : new DataView(dataView.buffer, dataView.byteOffset, dataView.byteLength);
  const records = [];
  let offset = 0;

  while (offset + 2 <= view.byteLength) {
    const type = view.getUint8(offset);
    const len = view.getUint8(offset + 1);
    const valueOffset = offset + 2;
    const record = { type, len, label: tlvTypeLabel(type) };
    if (valueOffset + len > view.byteLength) {
      record.truncated = true;
      records.push(record);
      break;
    }
    if (len === 4 && type !== TLV.PIR && !(type >= TLV.OCCUPANCY && type <= TLV.PRESSURE_ALERT)) {
      record.value = view.getFloat32(valueOffset, true);
      if (type === TLV.PRES || type === TLV.BARO_PRESS) {
        record.value = normalizePressure(record.value);
      }
    } else if (len === 2 && type === TLV.PIR) {
      record.value = view.getInt16(valueOffset, true);
    } else if (len >= 1 && type >= TLV.OCCUPANCY && type <= TLV.PRESSURE_ALERT) {
      record.value = view.getUint8(valueOffset);
    } else if (len === 0) {
      record.empty = true;
    }
    records.push(record);
    offset = valueOffset + len;
  }

  return records;
}
export function parseAlertNotification(dataView) {
  const view = dataView instanceof DataView
    ? dataView
    : new DataView(dataView.buffer, dataView.byteOffset, dataView.byteLength);
  if (view.byteLength < 3) return null;
  const type = view.getUint8(0);
  const state = view.getUint8(2);
  const key = ALERT_KEYS[type];
  if (!key) return null;
  const labels = ALERT_LABELS[type] || [];
  return {
    type,
    state,
    key,
    label: labels[state] ?? `state ${state}`,
  };
}

export function getAlertLabel(type, state) {
  const labels = ALERT_LABELS[type];
  return labels?.[state] ?? `state ${state}`;
}
