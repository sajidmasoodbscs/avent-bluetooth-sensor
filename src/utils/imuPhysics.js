/** ISA barometric altitude (troposphere) + complementary-filter trajectory (matches imu_ble_visualizer.py). */

const P0_HPA = 1013.25;
const ALPHA = 0.98;
const GRAVITY = 9.81;
const ZUPT_THRESH = 0.15;
const VEL_DECAY = 0.85;

export function pressureToAltitudeM(pressureHpa) {
  if (pressureHpa <= 0) return 0;
  return 44330 * (1 - (pressureHpa / P0_HPA) ** (1 / 5.255));
}

function matVec3(R, v) {
  return [
    R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2],
    R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2],
    R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2],
  ];
}

function norm3(v) {
  return Math.hypot(v[0], v[1], v[2]);
}

/**
 * Mutable store: BLE thread equivalent — push samples, then snapshot() for UI.
 */
export class ImuTrajectoryStore {
  constructor() {
    this.timeS = [];
    this.ax = [];
    this.ay = [];
    this.az = [];
    this.gx = [];
    this.gy = [];
    this.gz = [];
    this.altTimeS = [];
    this.altitudeM = [];
    this.altBaseline = null;
    this.posX = [];
    this.posY = [];
    this.posZ = [];
    this._roll = 0;
    this._pitch = 0;
    this._vx = 0;
    this._vy = 0;
    this._vz = 0;
    this._px = 0;
    this._py = 0;
    this._pz = 0;
    this._t0 = null;
    this._tPrev = null;
  }

  _cfStep(ax, ay, az, gxDps, gyDps, gzDps, tNow) {
    if (this._tPrev == null) {
      this._roll = Math.atan2(ay, az);
      this._pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
      this._tPrev = tNow;
      return [0, 0, 0];
    }

    const dt = Math.max(tNow - this._tPrev, 1e-4);
    this._tPrev = tNow;

    const gxR = (gxDps * Math.PI) / 180;
    const gyR = (gyDps * Math.PI) / 180;

    const rollAcc = Math.atan2(ay, az);
    const pitchAcc = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
    this._roll = ALPHA * (this._roll + gxR * dt) + (1 - ALPHA) * rollAcc;
    this._pitch = ALPHA * (this._pitch + gyR * dt) + (1 - ALPHA) * pitchAcc;

    const cr = Math.cos(this._roll);
    const sr = Math.sin(this._roll);
    const cp = Math.cos(this._pitch);
    const sp = Math.sin(this._pitch);
    const R = [
      [cp, sp * sr, sp * cr],
      [0, cr, -sr],
      [-sp, cp * sr, cp * cr],
    ];
    let aw = matVec3(R, [ax, ay, az]);
    aw = [aw[0], aw[1], aw[2] - GRAVITY];

    if (norm3(aw) < ZUPT_THRESH) {
      aw = [0, 0, 0];
      this._vx *= VEL_DECAY;
      this._vy *= VEL_DECAY;
      this._vz *= VEL_DECAY;
    }

    this._vx += aw[0] * dt;
    this._vy += aw[1] * dt;
    this._vz += aw[2] * dt;
    this._px += this._vx * dt;
    this._py += this._vy * dt;
    this._pz += this._vz * dt;

    return [this._px, this._py, this._pz];
  }

  pushImu(ax, ay, az, gxDps, gyDps, gzDps, monotonicS) {
    if (this._t0 == null) this._t0 = monotonicS;
    const elapsed = monotonicS - this._t0;
    const [px, py, pz] = this._cfStep(ax, ay, az, gxDps, gyDps, gzDps, monotonicS);
    this.timeS.push(elapsed);
    this.ax.push(ax);
    this.ay.push(ay);
    this.az.push(az);
    this.gx.push(gxDps);
    this.gy.push(gyDps);
    this.gz.push(gzDps);
    this.posX.push(px);
    this.posY.push(py);
    this.posZ.push(pz);
  }

  pushPressure(pressureHpa, monotonicS) {
    if (this._t0 == null) return;
    const elapsed = monotonicS - this._t0;
    const alt = pressureToAltitudeM(pressureHpa);
    if (this.altBaseline == null) this.altBaseline = alt;
    this.altTimeS.push(elapsed);
    this.altitudeM.push(alt);
  }

  reset() {
    this.timeS = [];
    this.ax = [];
    this.ay = [];
    this.az = [];
    this.gx = [];
    this.gy = [];
    this.gz = [];
    this.altTimeS = [];
    this.altitudeM = [];
    this.altBaseline = null;
    this.posX = [];
    this.posY = [];
    this.posZ = [];
    this._roll = 0;
    this._pitch = 0;
    this._vx = 0;
    this._vy = 0;
    this._vz = 0;
    this._px = 0;
    this._py = 0;
    this._pz = 0;
    this._t0 = null;
    this._tPrev = null;
  }

  snapshot() {
    return {
      t: [...this.timeS],
      ax: [...this.ax],
      ay: [...this.ay],
      az: [...this.az],
      gx: [...this.gx],
      gy: [...this.gy],
      gz: [...this.gz],
      px: [...this.posX],
      py: [...this.posY],
      pz: [...this.posZ],
      altT: [...this.altTimeS],
      alt: [...this.altitudeM],
      altBase: this.altBaseline,
    };
  }

  get sampleCount() {
    return this.timeS.length;
  }
}
