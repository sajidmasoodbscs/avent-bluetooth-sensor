const MAX_SAMPLES = 900;

/**
 * Tracks humidity breath events and computes rise / recovery times (seconds).
 * Rise: 10% → 90% of spike amplitude above pre-event baseline.
 * Recovery: peak → back within margin of baseline.
 */
export class BreathResponseTracker {
  constructor(options = {}) {
    this.spikeThresholdRh = options.spikeThresholdRh ?? 4;
    this.recoveryMarginRh = options.recoveryMarginRh ?? 2.5;
    this.baselineAlpha = options.baselineAlpha ?? 0.04;
    this.riseLo = options.riseLo ?? 0.1;
    this.riseHi = options.riseHi ?? 0.9;

    this.reset();
  }

  reset() {
    this.t = [];
    this.temp = [];
    this.humid = [];
    this.baseline = null;
    this.phase = 'idle';
    this.eventBaseline = null;
    this.peakHumid = null;
    this.peakT = null;
    this.riseT0 = null;
    this.riseT1 = null;
    this.riseTLo = null;
    this.lastRiseTimeS = null;
    this.lastRecoveryTimeS = null;
    this._riseHiReached = false;
  }

  push(elapsedS, temperature, humidity) {
    if (temperature == null || humidity == null) return;

    this.t.push(elapsedS);
    this.temp.push(temperature);
    this.humid.push(humidity);
    if (this.t.length > MAX_SAMPLES) {
      this.t.shift();
      this.temp.shift();
      this.humid.shift();
    }

    if (this.baseline == null) {
      this.baseline = humidity;
      return;
    }

    const delta = humidity - this.baseline;

    if (this.phase === 'idle') {
      if (delta >= this.spikeThresholdRh) {
        this.phase = 'rising';
        this.eventBaseline = this.baseline;
        this.peakHumid = humidity;
        this.peakT = elapsedS;
        this.riseT0 = elapsedS;
        this.riseTLo = null;
        this.riseT1 = null;
        this._riseHiReached = false;
      } else {
        this.baseline = this.baseline * (1 - this.baselineAlpha) + humidity * this.baselineAlpha;
      }
      return;
    }

    if (this.phase === 'rising') {
      if (humidity > this.peakHumid) {
        this.peakHumid = humidity;
        this.peakT = elapsedS;
      }

      const amp = Math.max(this.peakHumid - this.eventBaseline, 0.5);
      const levelLo = this.eventBaseline + amp * this.riseLo;
      const levelHi = this.eventBaseline + amp * this.riseHi;

      if (this.riseTLo == null && humidity >= levelLo) {
        this.riseTLo = elapsedS;
      }
      if (!this._riseHiReached && humidity >= levelHi) {
        this._riseHiReached = true;
        this.riseT1 = elapsedS;
        if (this.riseTLo != null) {
          this.lastRiseTimeS = this.riseT1 - this.riseTLo;
        }
      }

      const prev = this.humid[this.humid.length - 2];
      if (prev != null && humidity < prev - 0.3 && humidity < this.peakHumid - 1) {
        this.phase = 'recovering';
        if (this.lastRiseTimeS == null && this.riseTLo != null) {
          this.lastRiseTimeS = elapsedS - this.riseTLo;
        }
      }
      return;
    }

    if (this.phase === 'recovering') {
      if (humidity > this.peakHumid) {
        this.peakHumid = humidity;
        this.peakT = elapsedS;
        this.phase = 'rising';
        return;
      }

      if (humidity <= this.eventBaseline + this.recoveryMarginRh) {
        this.lastRecoveryTimeS = elapsedS - this.peakT;
        this.baseline = humidity;
        this.phase = 'idle';
        this.eventBaseline = null;
        this.peakHumid = null;
        this.peakT = null;
        this.riseTLo = null;
        this.riseT1 = null;
        this._riseHiReached = false;
      }
    }
  }

  snapshot() {
    const n = this.t.length;
    return {
      t: [...this.t],
      temp: [...this.temp],
      humid: [...this.humid],
      baseline: this.baseline,
      phase: this.phase,
      riseTimeS: this.lastRiseTimeS,
      recoveryTimeS: this.lastRecoveryTimeS,
      currentTemp: n ? this.temp[n - 1] : null,
      currentHumid: n ? this.humid[n - 1] : null,
      peakHumid: this.peakHumid,
    };
  }
}

export function formatResponseSeconds(sec) {
  if (sec == null || !Number.isFinite(sec)) return '—';
  return `${sec.toFixed(1)} sec`;
}
