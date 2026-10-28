import type { PoseLandmark } from "./tug-types";

export const L_SHOULDER = 11;
export const R_SHOULDER = 12;
export const L_HIP = 23;
export const R_HIP = 24;
export const L_KNEE = 25;
export const R_KNEE = 26;
export const L_ANKLE = 27;
export const R_ANKLE = 28;

export interface FrameMetrics {
  hipCenter: { x: number; y: number; z: number };
  shoulderCenter: { x: number; y: number };
  shoulderWidth: number;
  kneeAngle: number;
  torsoScale: number;
  timestampMs: number;
}

function angleAtKnee(hip: PoseLandmark, knee: PoseLandmark, ankle: PoseLandmark): number {
  const v1 = { x: hip.x - knee.x, y: hip.y - knee.y };
  const v2 = { x: ankle.x - knee.x, y: ankle.y - knee.y };
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);
  if (mag1 === 0 || mag2 === 0) return 180;
  const cos = Math.min(1, Math.max(-1, (v1.x * v2.x + v1.y * v2.y) / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function computeFrameMetrics(landmarks: PoseLandmark[], timestampMs: number): FrameMetrics {
  const lm = landmarks;
  const hipCenter = {
    x: (lm[L_HIP].x + lm[R_HIP].x) / 2,
    y: (lm[L_HIP].y + lm[R_HIP].y) / 2,
    z: (lm[L_HIP].z + lm[R_HIP].z) / 2,
  };
  const shoulderCenter = {
    x: (lm[L_SHOULDER].x + lm[R_SHOULDER].x) / 2,
    y: (lm[L_SHOULDER].y + lm[R_SHOULDER].y) / 2,
  };
  const shoulderWidth = Math.hypot(
    lm[L_SHOULDER].x - lm[R_SHOULDER].x,
    lm[L_SHOULDER].y - lm[R_SHOULDER].y,
  );
  const kneeAngle =
    (angleAtKnee(lm[L_HIP], lm[L_KNEE], lm[L_ANKLE]) + angleAtKnee(lm[R_HIP], lm[R_KNEE], lm[R_ANKLE])) / 2;
  const torsoScale = Math.hypot(hipCenter.x - shoulderCenter.x, hipCenter.y - shoulderCenter.y);

  return { hipCenter, shoulderCenter, shoulderWidth, kneeAngle, torsoScale, timestampMs };
}

export interface PrincipalLine {
  mx: number;
  my: number;
  ux: number;
  uy: number;
}

export function fitPrincipalLine(points: { x: number; y: number }[]): PrincipalLine {
  const n = points.length;
  const mx = points.reduce((sum, p) => sum + p.x, 0) / n;
  const my = points.reduce((sum, p) => sum + p.y, 0) / n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of points) {
    const dx = p.x - mx;
    const dy = p.y - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }

  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  return { mx, my, ux: Math.cos(angle), uy: Math.sin(angle) };
}

export function projectionAlong(p: { x: number; y: number }, line: PrincipalLine): number {
  return line.ux * (p.x - line.mx) + line.uy * (p.y - line.my);
}

export function deviationFromLine(p: { x: number; y: number }, line: PrincipalLine): number {
  return Math.abs(-line.uy * (p.x - line.mx) + line.ux * (p.y - line.my));
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function findTurnPosition(projections: number[]): number {
  const startProjection = median(projections.slice(0, Math.min(5, projections.length)));
  let turnPos = 0;
  let maxDistance = -Infinity;
  for (let k = 0; k < projections.length; k++) {
    const distance = Math.abs(projections[k] - startProjection);
    if (distance > maxDistance) {
      maxDistance = distance;
      turnPos = k;
    }
  }
  return turnPos;
}

export function smooth(values: number[], window = 5): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(values.length, i + Math.floor(window / 2) + 1);
    const slice = values.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}
