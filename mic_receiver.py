"""
Bleak receiver for nRF54L15 BLE mic stream.

Usage:
    pip install bleak
    python mic_receiver.py
"""
import asyncio
import struct
import time
import wave
from bleak import BleakClient, BleakScanner

DEVICE_NAME = "nRF54L_Mic"
AUDIO_CHAR_UUID = "a1b2c3d4-0002-4000-8000-00805f9b34fb"

SAMPLE_RATE = 16000
RECORD_SECONDS = 10   # change as desired

async def main():
    print(f"Scanning for '{DEVICE_NAME}'...")
    device = await BleakScanner.find_device_by_name(DEVICE_NAME, timeout=10.0)
    if not device:
        print("Device not found.")
        return

    print(f"Found {device.address}, connecting...")

    pcm_chunks = []
    bytes_received = 0
    notifications = 0
    start_time = None

    def handle_notification(_sender, data: bytearray):
        nonlocal bytes_received, notifications, start_time
        if start_time is None:
            start_time = time.time()
        pcm_chunks.append(bytes(data))
        bytes_received += len(data)
        notifications += 1

    async with BleakClient(device, timeout=20.0) as client:
        # Bleak negotiates a higher MTU automatically on most platforms
        # (Linux/Android). On macOS/Windows the OS picks the MTU.
        try:
            mtu = client.mtu_size
            print(f"MTU: {mtu}")
        except Exception:
            pass

        await client.start_notify(AUDIO_CHAR_UUID, handle_notification)
        print(f"Subscribed. Recording for {RECORD_SECONDS}s...")

        await asyncio.sleep(RECORD_SECONDS)

        await client.stop_notify(AUDIO_CHAR_UUID)

    elapsed = time.time() - start_time if start_time else 1
    kbps = (bytes_received * 8) / elapsed / 1000
    print(f"\nReceived {bytes_received} bytes in {elapsed:.1f}s "
          f"({kbps:.1f} kbps, {notifications} notifications)")

    raw_path = "mic.raw"
    wav_path = "mic.wav"

    with open(raw_path, "wb") as f:
        for c in pcm_chunks:
            f.write(c)
    print(f"Wrote {raw_path}")

    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)            # 16-bit
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(b"".join(pcm_chunks))
    print(f"Wrote {wav_path} — open in Audacity or any player")

if __name__ == "__main__":
    asyncio.run(main())