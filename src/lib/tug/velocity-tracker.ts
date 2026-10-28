import { computeFrameMetrics } from "./pose-metrics";
import type { PoseLandmark } from "./tug-types";

export interface VelocitySample {
  timestampMs: number;
  vx: number;
  vy: number;
  vz: number;
  speed: number;
}

const VELOCITY_WINDOW_MS = 200;

interface PositionPoint {
  timestampMs: number;
  x: number;
  y: number;
  z: number;
}

export class VelocityTracker {
  private history: PositionPoint[] = [];

  push(landmarks: PoseLandmark[], timestampMs: number): VelocitySample | null {
    const m = computeFrameMetrics(landmarks, timestampMs);
    this.history.push({ timestampMs, x: m.hipCenter.x, y: m.hipCenter.y, z: m.hipCenter.z });

    const cutoffMs = timestampMs - VELOCITY_WINDOW_MS * 3;
    while (this.history.length > 2 && this.history[0].timestampMs < cutoffMs) this.history.shift();

    const reference = this.history.find((p) => p.timestampMs >= timestampMs - VELOCITY_WINDOW_MS);
    if (!reference || reference.timestampMs === timestampMs) return null;

    const dtSeconds = (timestampMs - reference.timestampMs) / 1000;
    if (dtSeconds <= 0) return null;

    const current = this.history[this.history.length - 1];
    const vx = (current.x - reference.x) / dtSeconds;
    const vy = (current.y - reference.y) / dtSeconds;
    const vz = (current.z - reference.z) / dtSeconds;

    return { timestampMs, vx, vy, vz, speed: Math.hypot(vx, vy, vz) };
  }

  reset() {
    this.history = [];
  }
}
