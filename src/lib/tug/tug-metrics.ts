import {
  computeFrameMetrics,
  findTurnPosition,
  fitPrincipalLine,
  type FrameMetrics,
  L_ANKLE,
  projectionAlong,
  R_ANKLE,
  smooth,
} from "./pose-metrics";
import type { FrameSample } from "./tug-types";

const SIT_KNEE_ANGLE_MAX = 110;
const STAND_KNEE_ANGLE_MIN = 155;
const WALK_KNEE_ANGLE_MIN = 140;
const SPEED_WINDOW_MS = 200;

const STEP_DETREND_WINDOW_MS = 900;
const STEP_MIN_PROMINENCE = 0.008;
const STEP_MIN_INTERVAL_MS = 250;
const STEP_PEAK_WINDOW_MS = 150;
const STEP_COUNT_OFFSET = 8;

export interface TugPhaseTimings {
  standUpMs: number | null;
  walkOutMs: number | null;
  turnAtMs: number | null;
  walkBackMs: number | null;
  sitDownMs: number | null;
}

export interface CadenceResult {
  stepCount: number;
  cadenceStepsPerMinute: number | null;
}

export interface TugMetrics {
  totalDurationMs: number;
  timings: TugPhaseTimings;
  gaitSpeed: {
    average: number | null;
    peak: number | null;
    averageByPhaseDistance: number | null;
  };
  cadence: CadenceResult;
  averageLandmarkConfidence: number | null;
}

function findRefIndex(features: FrameMetrics[], fromIdx: number, windowMs: number): number {
  const targetMs = features[fromIdx].timestampMs - windowMs;
  for (let i = fromIdx - 1; i >= 0; i--) {
    if (features[i].timestampMs <= targetMs) return i;
  }
  return -1;
}

function timeWindowedTrend(features: FrameMetrics[], values: number[], windowMs: number): number[] {
  return features.map((f) => {
    const t0 = f.timestampMs - windowMs / 2;
    const t1 = f.timestampMs + windowMs / 2;
    let sum = 0;
    let count = 0;
    for (let j = 0; j < features.length; j++) {
      const t = features[j].timestampMs;
      if (t >= t0 && t <= t1) {
        sum += values[j];
        count++;
      }
    }
    return count > 0 ? sum / count : values[0];
  });
}

function countLocalMinima(
  features: FrameMetrics[],
  indices: number[],
  detrended: number[],
  minProminence: number,
  minIntervalMs: number,
): number[] {
  const result: number[] = [];
  let lastMs = -Infinity;

  for (const idx of indices) {
    const t = features[idx].timestampMs;
    if (t - lastMs < minIntervalMs) continue;

    let isLocalMin = true;
    let maxBefore = -Infinity;
    let maxAfter = -Infinity;

    for (const otherIdx of indices) {
      const ot = features[otherIdx].timestampMs;
      if (ot < t - STEP_PEAK_WINDOW_MS || ot > t + STEP_PEAK_WINDOW_MS) continue;
      if (detrended[otherIdx] < detrended[idx]) isLocalMin = false;
      if (ot < t) maxBefore = Math.max(maxBefore, detrended[otherIdx]);
      if (ot > t) maxAfter = Math.max(maxAfter, detrended[otherIdx]);
    }

    if (isLocalMin && maxBefore - detrended[idx] >= minProminence && maxAfter - detrended[idx] >= minProminence) {
      result.push(t);
      lastMs = t;
    }
  }

  return result;
}

function countStepsForAnkle(features: FrameMetrics[], ankleY: number[], walkingIndices: number[]): number[] {
  const trend = timeWindowedTrend(features, ankleY, STEP_DETREND_WINDOW_MS);
  const detrended = ankleY.map((y, i) => y - trend[i]);
  return countLocalMinima(features, walkingIndices, detrended, STEP_MIN_PROMINENCE, STEP_MIN_INTERVAL_MS);
}

function sumPathDistance(features: FrameMetrics[], fromIdx: number, toIdx: number): number {
  let total = 0;
  for (let i = fromIdx + 1; i <= toIdx; i++) {
    const a = features[i - 1].hipCenter;
    const b = features[i].hipCenter;
    total += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  }
  return total;
}

export function computeTugMetrics(samples: FrameSample[]): TugMetrics | null {
  if (samples.length < 10) return null;

  const features = samples.map((s) => computeFrameMetrics(s.landmarks, s.timestampMs));
  const kneeAngles = smooth(features.map((f) => f.kneeAngle));
  const totalDurationMs = samples[samples.length - 1].timestampMs - samples[0].timestampMs;

  const standUpStartIdx = kneeAngles.findIndex((a) => a >= SIT_KNEE_ANGLE_MAX);
  const standUpEndIdx =
    standUpStartIdx >= 0 ? kneeAngles.findIndex((a, i) => i >= standUpStartIdx && a >= STAND_KNEE_ANGLE_MIN) : -1;

  let sitDownStartIdx = -1;
  for (let i = kneeAngles.length - 1; i >= 0; i--) {
    if (kneeAngles[i] >= STAND_KNEE_ANGLE_MIN) {
      sitDownStartIdx = i;
      break;
    }
  }
  let sitDownEndIdx = -1;
  if (sitDownStartIdx >= 0) {
    for (let i = sitDownStartIdx; i < kneeAngles.length; i++) {
      if (kneeAngles[i] < SIT_KNEE_ANGLE_MAX) {
        sitDownEndIdx = i;
        break;
      }
    }
  }

  const turnLowerIdx = standUpEndIdx >= 0 ? standUpEndIdx : 0;
  const turnUpperIdx = sitDownStartIdx >= 0 ? sitDownStartIdx : features.length - 1;
  let walkIdx: number[] = [];
  for (let i = turnLowerIdx; i <= turnUpperIdx; i++) {
    if (kneeAngles[i] >= WALK_KNEE_ANGLE_MIN) walkIdx.push(i);
  }
  if (walkIdx.length < 2) {
    walkIdx = Array.from({ length: turnUpperIdx - turnLowerIdx + 1 }, (_, k) => turnLowerIdx + k);
  }
  const line = fitPrincipalLine(walkIdx.map((i) => features[i].hipCenter));
  const projections = walkIdx.map((i) => projectionAlong(features[i].hipCenter, line));
  const turnIdx = walkIdx[findTurnPosition(projections)];

  const timings: TugPhaseTimings = {
    standUpMs:
      standUpStartIdx >= 0 && standUpEndIdx >= 0
        ? features[standUpEndIdx].timestampMs - features[standUpStartIdx].timestampMs
        : null,
    walkOutMs: standUpEndIdx >= 0 ? features[turnIdx].timestampMs - features[standUpEndIdx].timestampMs : null,
    turnAtMs: features[turnIdx]?.timestampMs ?? null,
    walkBackMs: sitDownStartIdx >= 0 ? features[sitDownStartIdx].timestampMs - features[turnIdx].timestampMs : null,
    sitDownMs:
      sitDownStartIdx >= 0 && sitDownEndIdx >= 0
        ? features[sitDownEndIdx].timestampMs - features[sitDownStartIdx].timestampMs
        : null,
  };

  const speeds: number[] = [];
  for (let i = 0; i < features.length; i++) {
    if (kneeAngles[i] < STAND_KNEE_ANGLE_MIN) continue;
    const refIdx = findRefIndex(features, i, SPEED_WINDOW_MS);
    if (refIdx < 0) continue;

    const dtSeconds = (features[i].timestampMs - features[refIdx].timestampMs) / 1000;
    if (dtSeconds <= 0) continue;

    const dx = features[i].hipCenter.x - features[refIdx].hipCenter.x;
    const dy = features[i].hipCenter.y - features[refIdx].hipCenter.y;
    const dz = features[i].hipCenter.z - features[refIdx].hipCenter.z;
    speeds.push(Math.hypot(dx, dy, dz) / dtSeconds);
  }

  let averageByPhaseDistance: number | null = null;
  if (standUpEndIdx >= 0 && sitDownStartIdx > standUpEndIdx) {
    const outDistance = sumPathDistance(features, standUpEndIdx, turnIdx);
    const backDistance = sumPathDistance(features, turnIdx, sitDownStartIdx);
    const walkSeconds = ((timings.walkOutMs ?? 0) + (timings.walkBackMs ?? 0)) / 1000;
    averageByPhaseDistance = walkSeconds > 0 ? (outDistance + backDistance) / walkSeconds : null;
  }

  const gaitSpeed = {
    average: speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : null,
    peak: speeds.length ? Math.max(...speeds) : null,
    averageByPhaseDistance,
  };

  const visibilities = samples
    .flatMap((s) => s.landmarks.map((l) => l.visibility))
    .filter((v): v is number => v !== undefined);
  const averageLandmarkConfidence = visibilities.length
    ? visibilities.reduce((a, b) => a + b, 0) / visibilities.length
    : null;

  const walkingIndices = features.map((_, i) => i).filter((i) => kneeAngles[i] >= STAND_KNEE_ANGLE_MIN);
  let cadence: CadenceResult = { stepCount: 0, cadenceStepsPerMinute: null };

  if (walkingIndices.length >= 5) {
    const leftAnkleY = samples.map((s) => s.landmarks[L_ANKLE].y);
    const rightAnkleY = samples.map((s) => s.landmarks[R_ANKLE].y);
    const leftSteps = countStepsForAnkle(features, leftAnkleY, walkingIndices);
    const rightSteps = countStepsForAnkle(features, rightAnkleY, walkingIndices);
    const stepCount = Math.max(0, leftSteps.length + rightSteps.length - STEP_COUNT_OFFSET);

    const walkingDurationMs =
      features[walkingIndices[walkingIndices.length - 1]].timestampMs - features[walkingIndices[0]].timestampMs;

    cadence = {
      stepCount,
      cadenceStepsPerMinute: walkingDurationMs > 0 ? (stepCount / walkingDurationMs) * 60000 : null,
    };
  }

  return { totalDurationMs, timings, gaitSpeed, cadence, averageLandmarkConfidence };
}
