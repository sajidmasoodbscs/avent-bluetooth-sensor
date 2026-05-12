#!/usr/bin/env python3
"""
IMU + Altitude BLE Visualizer for nRF54L15 — "Panasonic"
=========================================================
Polls two BLE commands each cycle:
  • GET:IMU  → accel (m/s²) + gyro (°/s)   tags 0x04 / 0x06
  • GET:PRES → pressure (hPa)               tag  0x05

Plots (full history from sample 0):
  ┌─────────────────┬─────────────────┐
  │  Acceleration   │    Gyroscope    │   row 0
  ├─────────────────┼─────────────────┤
  │ Altitude (m ASL)│  3D Trajectory  │   row 1
  └─────────────────┴─────────────────┘

Altitude formula — ISA barometric (troposphere, valid to ~11 km):
    alt = 44330 × (1 − (P / P0) ^ (1 / 5.255))
    P0 = 1013.25 hPa

At Peshawar (~340 m ASL) the altitude graph will hover around 340 m.
A red dashed baseline marks the very first sample so you can read
relative altitude change (Δ) at a glance in the status bar.

Pressure is polled every 5th IMU cycle (~1 Hz) — pressure changes
slowly so this keeps BLE traffic and latency low.

Complementary filter (α=0.98) fuses accel + gyro → orientation
→ gravity removal → double integration → 3-D position.

Dependencies:
    pip install bleak matplotlib numpy

Firmware fix required (GET:IMU handler in app_ble.c):
    get_gyro(&gx, &gy, &gz);   ← add this line before the gyro add_tlv calls
"""

import asyncio
import struct
import time
import threading

import numpy as np
import matplotlib
matplotlib.use("TkAgg")           # Linux default; swap to "Qt5Agg" if preferred
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.animation import FuncAnimation
from mpl_toolkits.mplot3d import Axes3D   # noqa: F401
from bleak import BleakClient, BleakScanner

# ──────────────────────────── BLE config ─────────────────────────────────────
SERVICE_UUID    = "12345678-1234-1234-1234-123456789abc"
CHAR_TX_UUID    = "12345678-1234-1234-1234-123456789abd"
CHAR_RX_UUID    = "12345678-1234-1234-1234-123456789abe"
DEVICE_NAME     = "Panasonic"
POLL_INTERVAL_S = 0.20    # 200 ms → 5 Hz IMU; pressure every 5th cycle = 1 Hz

# ──────────────────────────── TLV tags ───────────────────────────────────────
TAG_ACCEL = 0x04   # three consecutive float32: Ax, Ay, Az  (m/s²)
TAG_PRES  = 0x05   # one float32: pressure in hPa
TAG_GYRO  = 0x06   # three consecutive float32: Gx, Gy, Gz  (°/s)

# ──────────────────────────── Physics ────────────────────────────────────────
P0_HPA  = 1013.25   # ISA standard sea-level pressure (hPa)
ALPHA   = 0.98      # complementary filter: gyro trust factor
GRAVITY = 9.81      # m/s²

# ──────────────────────────── Colours ────────────────────────────────────────
DARK_BG    = "#0d1117"
PANEL_BG   = "#161b22"
GRID_COL   = "#21262d"
TEXT_COL   = "#e6edf3"
DIM_COL    = "#8b949e"

ACCEL_COLS = ["#ff6b6b", "#ffd93d", "#6bcb77"]
GYRO_COLS  = ["#c77dff", "#48cae4", "#f4a261"]
ALT_COL    = "#00d4aa"
ALT_BASE   = "#ff6b6b"
TRAJ_COL   = "#58a6ff"
TRAJ_START = "#6bcb77"
TRAJ_END   = "#ff6b6b"


# ──────────────────────────── ISA formula ────────────────────────────────────
def pressure_to_altitude_m(pressure_hpa: float) -> float:
    """
    Convert pressure (hPa) → altitude above mean sea level (m).
    ISA barometric formula:  h = 44330 × (1 − (P/P0)^(1/5.255))
    """
    if pressure_hpa <= 0.0:
        return 0.0
    return 44330.0 * (1.0 - (pressure_hpa / P0_HPA) ** (1.0 / 5.255))


# ──────────────────────────── Data store ─────────────────────────────────────
class SensorStore:
    """Thread-safe container. BLE thread writes; animation thread reads."""

    def __init__(self):
        self._lock = threading.Lock()

        # IMU history
        self.time_s: list[float] = []
        self.ax: list[float] = []
        self.ay: list[float] = []
        self.az: list[float] = []
        self.gx: list[float] = []
        self.gy: list[float] = []
        self.gz: list[float] = []

        # Pressure / altitude (own timeline — polled less often)
        self.alt_time_s: list[float]  = []
        self.altitude_m: list[float]  = []
        self._alt_baseline: float | None = None

        # 3-D dead-reckoning position
        self.pos_x: list[float] = []
        self.pos_y: list[float] = []
        self.pos_z: list[float] = []

        # Complementary filter state
        self._roll   = 0.0
        self._pitch  = 0.0
        self._vx = self._vy = self._vz = 0.0
        self._px = self._py = self._pz = 0.0
        self._t0:     float | None = None
        self._t_prev: float | None = None

    # ── TLV parser ────────────────────────────────────────────────────────────
    @staticmethod
    def parse_tlv(data: bytes) -> dict[int, list[float]]:
        result: dict[int, list[float]] = {}
        i = 0
        while i + 2 <= len(data):
            tag    = data[i]
            length = data[i + 1]
            i += 2
            if i + length > len(data):
                break
            if length == 4:
                val = struct.unpack_from("<f", data, i)[0]
                result.setdefault(tag, []).append(val)
            i += length
        return result

    # ── Complementary filter + position integration ───────────────────────────
    def _cf_step(self, ax, ay, az, gx_dps, gy_dps, gz_dps,
                 t_now: float) -> tuple[float, float, float]:
        if self._t_prev is None:
            self._roll  = np.arctan2(ay, az)
            self._pitch = np.arctan2(-ax, np.sqrt(ay**2 + az**2))
            self._t_prev = t_now
            return 0.0, 0.0, 0.0

        dt = max(t_now - self._t_prev, 1e-4)
        self._t_prev = t_now

        gx_r = np.radians(gx_dps)
        gy_r = np.radians(gy_dps)

        # Complementary filter
        roll_acc  = np.arctan2(ay, az)
        pitch_acc = np.arctan2(-ax, np.sqrt(ay**2 + az**2))
        self._roll  = ALPHA * (self._roll  + gx_r * dt) + (1 - ALPHA) * roll_acc
        self._pitch = ALPHA * (self._pitch + gy_r * dt) + (1 - ALPHA) * pitch_acc

        # Rotation body → world (roll + pitch; yaw unobservable without mag)
        cr, sr = np.cos(self._roll),  np.sin(self._roll)
        cp, sp = np.cos(self._pitch), np.sin(self._pitch)
        R = np.array([
            [ cp,   sp*sr,  sp*cr],
            [ 0,    cr,    -sr   ],
            [-sp,   cp*sr,  cp*cr],
        ])
        aw = R @ np.array([ax, ay, az])
        aw[2] -= GRAVITY

        # Zero-velocity update: bleed velocity when nearly stationary
        if np.linalg.norm(aw) < 0.15:
            aw[:] = 0.0
            self._vx *= 0.85; self._vy *= 0.85; self._vz *= 0.85

        self._vx += aw[0] * dt;  self._px += self._vx * dt
        self._vy += aw[1] * dt;  self._py += self._vy * dt
        self._vz += aw[2] * dt;  self._pz += self._vz * dt

        return self._px, self._py, self._pz

    # ── Public write methods ──────────────────────────────────────────────────
    def push_imu(self, ax, ay, az, gx_dps, gy_dps, gz_dps):
        t_now = time.monotonic()
        with self._lock:
            if self._t0 is None:
                self._t0 = t_now
            elapsed = t_now - self._t0
            px, py, pz = self._cf_step(ax, ay, az, gx_dps, gy_dps, gz_dps, t_now)
            self.time_s.append(elapsed)
            self.ax.append(ax);  self.ay.append(ay);  self.az.append(az)
            self.gx.append(gx_dps); self.gy.append(gy_dps); self.gz.append(gz_dps)
            self.pos_x.append(px); self.pos_y.append(py); self.pos_z.append(pz)

    def push_pressure(self, pressure_hpa: float):
        t_now = time.monotonic()
        with self._lock:
            if self._t0 is None:
                return   # clock not started yet — discard
            elapsed = t_now - self._t0
            alt = pressure_to_altitude_m(pressure_hpa)
            if self._alt_baseline is None:
                self._alt_baseline = alt
            self.alt_time_s.append(elapsed)
            self.altitude_m.append(alt)

    # ── Snapshot for animation thread ─────────────────────────────────────────
    def snapshot(self) -> dict:
        with self._lock:
            return {
                "t":        list(self.time_s),
                "ax":       list(self.ax),   "ay":  list(self.ay),  "az":  list(self.az),
                "gx":       list(self.gx),   "gy":  list(self.gy),  "gz":  list(self.gz),
                "px":       list(self.pos_x),"py":  list(self.pos_y),"pz": list(self.pos_z),
                "alt_t":    list(self.alt_time_s),
                "alt":      list(self.altitude_m),
                "alt_base": self._alt_baseline,
            }

    @property
    def sample_count(self) -> int:
        with self._lock:
            return len(self.time_s)


# ──────────────────────────── BLE async loop ─────────────────────────────────
async def ble_loop(store: SensorStore, stop_event: threading.Event):
    print(f"[BLE] Scanning for '{DEVICE_NAME}'…")

    while not stop_event.is_set():
        device = None
        try:
            device = await BleakScanner.find_device_by_name(DEVICE_NAME, timeout=10.0)
        except Exception as e:
            print(f"[BLE] Scan error: {e}")

        if device is None:
            print(f"[BLE] '{DEVICE_NAME}' not found — retrying in 2 s…")
            await asyncio.sleep(2.0)
            continue

        print(f"[BLE] Found {device.name} ({device.address}) — connecting…")

        try:
            async with BleakClient(device, timeout=15.0) as client:
                print("[BLE] Connected. Starting sensor poll.")
                cycle = 0

                while not stop_event.is_set():
                    t_start = time.monotonic()

                    # ── GET:IMU (every cycle) ──────────────────────────────
                    try:
                        await client.write_gatt_char(CHAR_TX_UUID, b"GET:IMU",
                                                     response=True)
                        await asyncio.sleep(0.015)
                        raw = await client.read_gatt_char(CHAR_RX_UUID)
                    except Exception as e:
                        print(f"[BLE] IMU error: {e} — reconnecting…")
                        break

                    tlv   = SensorStore.parse_tlv(raw)
                    accel = tlv.get(TAG_ACCEL, [])
                    gyro  = tlv.get(TAG_GYRO,  [])

                    if len(accel) >= 3 and len(gyro) >= 3:
                        store.push_imu(accel[0], accel[1], accel[2],
                                       gyro[0],  gyro[1],  gyro[2])
                        n = store.sample_count
                        if n % 10 == 0:
                            print(
                                f"[BLE] #{n:4d} | "
                                f"A=({accel[0]:+.2f},{accel[1]:+.2f},{accel[2]:+.2f}) m/s² | "
                                f"G=({gyro[0]:+.2f},{gyro[1]:+.2f},{gyro[2]:+.2f}) °/s"
                            )
                    else:
                        print(f"[BLE] Bad IMU TLV: {raw.hex()}")

                    # ── GET:PRES (every 5th cycle ≈ 1 Hz) ─────────────────
                    if cycle % 5 == 0:
                        try:
                            await client.write_gatt_char(CHAR_TX_UUID, b"GET:PRES",
                                                         response=True)
                            await asyncio.sleep(0.015)
                            raw_p = await client.read_gatt_char(CHAR_RX_UUID)
                            tlv_p = SensorStore.parse_tlv(raw_p)
                            pres  = tlv_p.get(TAG_PRES, [])
                            if pres:
                                alt = pressure_to_altitude_m(pres[0])
                                store.push_pressure(pres[0])
                                print(f"[BLE] Pressure={pres[0]:.2f} hPa  "
                                      f"Altitude={alt:.1f} m ASL")
                        except Exception as e:
                            print(f"[BLE] Pressure error: {e}")

                    cycle += 1
                    elapsed = time.monotonic() - t_start
                    await asyncio.sleep(max(0.0, POLL_INTERVAL_S - elapsed))

        except Exception as e:
            print(f"[BLE] Connection error: {e} — retrying in 3 s…")
            await asyncio.sleep(3.0)

    print("[BLE] Loop exited.")


def ble_thread_fn(store: SensorStore, stop_event: threading.Event):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(ble_loop(store, stop_event))
    finally:
        loop.close()


# ──────────────────────────── Figure layout ──────────────────────────────────
def build_figure():
    plt.style.use("dark_background")
    fig = plt.figure(figsize=(18, 11), facecolor=DARK_BG)
    fig.canvas.manager.set_window_title("nRF54L15 Sensor Visualizer — Panasonic")
    fig.patch.set_facecolor(DARK_BG)

    gs = gridspec.GridSpec(
        2, 2,
        figure=fig,
        left=0.06, right=0.97,
        top=0.93,  bottom=0.07,
        hspace=0.40, wspace=0.30,
    )

    ax_accel = fig.add_subplot(gs[0, 0], facecolor=PANEL_BG)
    ax_gyro  = fig.add_subplot(gs[0, 1], facecolor=PANEL_BG)
    ax_alt   = fig.add_subplot(gs[1, 0], facecolor=PANEL_BG)
    ax_3d    = fig.add_subplot(gs[1, 1], projection="3d")
    ax_3d.set_facecolor(PANEL_BG)

    def _style(ax, title, ylabel):
        ax.set_title(title, color=TEXT_COL, fontsize=11, pad=8)
        ax.set_xlabel("Time (s)", color=TEXT_COL, fontsize=9)
        ax.set_ylabel(ylabel,     color=TEXT_COL, fontsize=9)
        ax.tick_params(colors=TEXT_COL, labelsize=8)
        ax.spines[:].set_color(GRID_COL)
        ax.grid(True, color=GRID_COL, lw=0.6, linestyle="--", alpha=0.7)

    # Accel
    _style(ax_accel, "Acceleration  (m/s²)", "m/s²")
    ln_ax, = ax_accel.plot([], [], color=ACCEL_COLS[0], lw=1.4, label="Ax")
    ln_ay, = ax_accel.plot([], [], color=ACCEL_COLS[1], lw=1.4, label="Ay")
    ln_az, = ax_accel.plot([], [], color=ACCEL_COLS[2], lw=1.4, label="Az")
    ax_accel.legend(loc="upper right", fontsize=8,
                    facecolor=PANEL_BG, edgecolor=GRID_COL, labelcolor=TEXT_COL)

    # Gyro
    _style(ax_gyro, "Gyroscope  (°/s)", "°/s")
    ln_gx, = ax_gyro.plot([], [], color=GYRO_COLS[0], lw=1.4, label="Gx")
    ln_gy, = ax_gyro.plot([], [], color=GYRO_COLS[1], lw=1.4, label="Gy")
    ln_gz, = ax_gyro.plot([], [], color=GYRO_COLS[2], lw=1.4, label="Gz")
    ax_gyro.legend(loc="upper right", fontsize=8,
                   facecolor=PANEL_BG, edgecolor=GRID_COL, labelcolor=TEXT_COL)

    # Altitude
    _style(ax_alt, "Barometric Altitude  (m above sea level)", "Altitude (m)")
    ln_alt,  = ax_alt.plot([], [], color=ALT_COL,  lw=1.8, label="Altitude ASL")
    ln_base, = ax_alt.plot([], [], color=ALT_BASE, lw=1.0,
                           linestyle="--", alpha=0.75, label="Start baseline")
    ax_alt.legend(loc="upper right", fontsize=8,
                  facecolor=PANEL_BG, edgecolor=GRID_COL, labelcolor=TEXT_COL)

    # 3-D trajectory
    ax_3d.set_title("3D Position Trajectory  (m)", color=TEXT_COL, fontsize=11, pad=14)
    ax_3d.set_xlabel("X (m)", color=TEXT_COL, fontsize=9, labelpad=6)
    ax_3d.set_ylabel("Y (m)", color=TEXT_COL, fontsize=9, labelpad=6)
    ax_3d.set_zlabel("Z (m)", color=TEXT_COL, fontsize=9, labelpad=6)
    ax_3d.tick_params(colors=TEXT_COL, labelsize=7)
    for pane in [ax_3d.xaxis.pane, ax_3d.yaxis.pane, ax_3d.zaxis.pane]:
        pane.fill = False
        pane.set_edgecolor(GRID_COL)
    ax_3d.grid(True, color=GRID_COL, lw=0.5, linestyle="--", alpha=0.5)

    ln_traj,    = ax_3d.plot([], [], [], color=TRAJ_COL, lw=1.6, alpha=0.85)
    pt_start,   = ax_3d.plot([], [], [], "o", color=TRAJ_START, ms=7,
                              label="Start", zorder=5)
    pt_current, = ax_3d.plot([], [], [], "o", color=TRAJ_END,   ms=7,
                              label="Now",   zorder=5)
    ax_3d.legend(loc="upper left", fontsize=8,
                 facecolor=PANEL_BG, edgecolor=GRID_COL, labelcolor=TEXT_COL)

    # Header + status
    fig.text(0.5, 0.975,
             "nRF54L15 — Accel | Gyro | Barometric Altitude | 3D Trajectory",
             ha="center", va="top", color=TEXT_COL, fontsize=12, fontweight="bold")
    status_txt = fig.text(0.5, 0.005, "Waiting for BLE data…",
                          ha="center", va="bottom", color=DIM_COL, fontsize=9)

    return fig, dict(
        ln_ax=ln_ax, ln_ay=ln_ay, ln_az=ln_az,
        ln_gx=ln_gx, ln_gy=ln_gy, ln_gz=ln_gz,
        ln_alt=ln_alt, ln_base=ln_base,
        ln_traj=ln_traj, pt_start=pt_start, pt_current=pt_current,
        status=status_txt,
        ax_accel=ax_accel, ax_gyro=ax_gyro, ax_alt=ax_alt, ax_3d=ax_3d,
    )


# ──────────────────────────── Animation callback ─────────────────────────────
def update_plot(frame, store: SensorStore, artists: dict):
    d = store.snapshot()
    n = len(d["t"])
    if n < 2:
        return list(artists.values())

    t     = np.array(d["t"])
    t_end = t[-1] + 0.5

    # Accel
    for key, series in [("ln_ax", d["ax"]), ("ln_ay", d["ay"]), ("ln_az", d["az"])]:
        artists[key].set_data(t, series)
    all_a = d["ax"] + d["ay"] + d["az"]
    artists["ax_accel"].set_xlim(0, t_end)
    artists["ax_accel"].set_ylim(min(all_a) - 1.0, max(all_a) + 1.0)

    # Gyro
    for key, series in [("ln_gx", d["gx"]), ("ln_gy", d["gy"]), ("ln_gz", d["gz"])]:
        artists[key].set_data(t, series)
    all_g = d["gx"] + d["gy"] + d["gz"]
    artists["ax_gyro"].set_xlim(0, t_end)
    artists["ax_gyro"].set_ylim(min(all_g) - 1.0, max(all_g) + 1.0)

    # Altitude
    alt_t    = d["alt_t"]
    alt_m    = d["alt"]
    alt_base = d["alt_base"]
    alt_str  = "—"
    delta_str = ""

    if len(alt_m) >= 2:
        ta  = np.array(alt_t)
        am  = np.array(alt_m)
        artists["ln_alt"].set_data(ta, am)

        if alt_base is not None:
            # Dashed baseline spans the full x range
            x_end = max(t_end, ta[-1] + 0.5)
            artists["ln_base"].set_data([0, x_end], [alt_base, alt_base])

        ax_alt = artists["ax_alt"]
        ax_alt.set_xlim(0, max(t_end, ta[-1] + 0.5))
        span = max(am.max() - am.min(), 2.0)
        mid  = (am.max() + am.min()) / 2.0
        ax_alt.set_ylim(mid - span * 0.75, mid + span * 0.75)

        alt_str   = f"{am[-1]:.1f} m"
        if alt_base is not None:
            delta_str = f"  Δ={am[-1] - alt_base:+.1f} m"

    # 3-D trajectory
    px = np.array(d["px"]); py = np.array(d["py"]); pz = np.array(d["pz"])
    artists["ln_traj"].set_data(px, py)
    artists["ln_traj"].set_3d_properties(pz)
    artists["pt_start"].set_data([px[0]],  [py[0]]);  artists["pt_start"].set_3d_properties([pz[0]])
    artists["pt_current"].set_data([px[-1]],[py[-1]]); artists["pt_current"].set_3d_properties([pz[-1]])

    ax3 = artists["ax_3d"]
    for vals, setter in [(px, ax3.set_xlim), (py, ax3.set_ylim), (pz, ax3.set_zlim)]:
        lo, hi = vals.min(), vals.max()
        span = max(hi - lo, 0.1)
        mid  = (lo + hi) / 2.0
        setter(mid - span * 0.65, mid + span * 0.65)

    # Status bar
    artists["status"].set_text(
        f"Samples: {n}  |  "
        f"A=({d['ax'][-1]:+.2f}, {d['ay'][-1]:+.2f}, {d['az'][-1]:+.2f}) m/s²  |  "
        f"G=({d['gx'][-1]:+.2f}, {d['gy'][-1]:+.2f}, {d['gz'][-1]:+.2f}) °/s  |  "
        f"Alt={alt_str}{delta_str}  |  "
        f"Pos=({px[-1]:+.3f}, {py[-1]:+.3f}, {pz[-1]:+.3f}) m"
    )

    return list(artists.values())


# ──────────────────────────── Main ───────────────────────────────────────────
def main():
    store      = SensorStore()
    stop_event = threading.Event()

    ble_t = threading.Thread(target=ble_thread_fn, args=(store, stop_event), daemon=True)
    ble_t.start()

    fig, artists = build_figure()
    fig.canvas.mpl_connect("close_event", lambda e: stop_event.set())

    anim = FuncAnimation(       # noqa: F841 — must stay alive
        fig, update_plot,
        fargs=(store, artists),
        interval=200,
        blit=False,             # 3-D axes require blit=False
        cache_frame_data=False,
    )

    try:
        plt.show()
    except KeyboardInterrupt:
        pass
    finally:
        stop_event.set()
        print("[Main] Done.")


if __name__ == "__main__":
    main()