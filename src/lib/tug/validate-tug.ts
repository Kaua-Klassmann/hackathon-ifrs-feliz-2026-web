import {
  computeFrameMetrics,
  deviationFromLine,
  findTurnPosition,
  fitPrincipalLine,
  type FrameMetrics,
  median,
  projectionAlong,
  smooth,
} from "./pose-metrics";
import type { FrameSample } from "./tug-types";

export interface TugValidationResult {
  valid: boolean;
  reason?: string;
  turnAtMs?: number;
}

const SIT_KNEE_ANGLE_MAX = 110;
const WALK_KNEE_ANGLE_MIN = 140;
const SUSTAIN_MS = 400;
const MIN_SIT_PASS_RATIO = 0.8;
const MIN_WALK_FRAMES = 15;
const MIN_TRAVEL_TORSO_FACTOR = 2;
const LATERAL_TOLERANCE_FACTOR = 1.5;
const TURN_WINDOW_MS = 800;

function toFeatures(samples: FrameSample[]): FrameMetrics[] {
  return samples.map((s) => computeFrameMetrics(s.landmarks, s.timestampMs));
}

function passRatio(indices: number[], predicate: (i: number) => boolean): number {
  if (indices.length === 0) return 0;
  return indices.filter(predicate).length / indices.length;
}

export function validateTugSession(samples: FrameSample[]): TugValidationResult {
  if (samples.length < 10) {
    return { valid: false, reason: "Gravação muito curta ou paciente não detectado." };
  }

  const features = toFeatures(samples);
  const kneeAngles = smooth(features.map((f) => f.kneeAngle));
  const torsoScales = smooth(features.map((f) => f.torsoScale));

  const startWindowEndMs = samples[0].timestampMs + SUSTAIN_MS;
  const startIdx = features.map((_, i) => i).filter((i) => features[i].timestampMs <= startWindowEndMs);
  const startedSitting =
    startIdx.length > 0 && passRatio(startIdx, (i) => kneeAngles[i] < SIT_KNEE_ANGLE_MAX) >= MIN_SIT_PASS_RATIO;

  if (!startedSitting) {
    return { valid: false, reason: "O paciente precisa começar o teste sentado." };
  }

  const endWindowStartMs = samples[samples.length - 1].timestampMs - SUSTAIN_MS;
  const endIdx = features.map((_, i) => i).filter((i) => features[i].timestampMs >= endWindowStartMs);
  const endedSitting =
    endIdx.length > 0 && passRatio(endIdx, (i) => kneeAngles[i] < SIT_KNEE_ANGLE_MAX) >= MIN_SIT_PASS_RATIO;

  if (!endedSitting) {
    return { valid: false, reason: "O paciente precisa terminar o teste sentado." };
  }

  const walkIdx = features.map((_, i) => i).filter((i) => kneeAngles[i] >= WALK_KNEE_ANGLE_MIN);
  if (walkIdx.length < MIN_WALK_FRAMES) {
    return { valid: false, reason: "Não detectamos o paciente caminhando — levante, caminhe e retorne à cadeira." };
  }

  const line = fitPrincipalLine(walkIdx.map((i) => features[i].hipCenter));
  const projections = walkIdx.map((i) => projectionAlong(features[i].hipCenter, line));
  const turnIndex = walkIdx[findTurnPosition(projections)];
  const turnAtMs = features[turnIndex].timestampMs;

  const travelExtent = Math.max(...projections) - Math.min(...projections);
  const referenceScale = median(walkIdx.map((i) => torsoScales[i]));

  if (travelExtent < MIN_TRAVEL_TORSO_FACTOR * referenceScale) {
    return {
      valid: false,
      reason: "O paciente precisa caminhar até o ponto de virada e voltar até a cadeira.",
      turnAtMs,
    };
  }

  let violationStartMs: number | null = null;

  for (const i of walkIdx) {
    const f = features[i];
    const nearTurn = Math.abs(f.timestampMs - turnAtMs) < TURN_WINDOW_MS;

    if (nearTurn) {
      violationStartMs = null;
      continue;
    }

    const deviation = deviationFromLine(f.hipCenter, line);
    const tolerance = torsoScales[i] * LATERAL_TOLERANCE_FACTOR;

    if (deviation > tolerance) {
      if (violationStartMs === null) violationStartMs = f.timestampMs;
      if (f.timestampMs - violationStartMs > SUSTAIN_MS) {
        return {
          valid: false,
          reason: "Desvio lateral detectado — o paciente saiu da trajetória reta durante a caminhada.",
          turnAtMs,
        };
      }
    } else {
      violationStartMs = null;
    }
  }

  return { valid: true, turnAtMs };
}

export function debugTugFeatures(samples: FrameSample[]) {
  const features = toFeatures(samples);
  const kneeAnglesSmoothed = smooth(features.map((f) => f.kneeAngle));
  const torsoScalesSmoothed = smooth(features.map((f) => f.torsoScale));
  return features.map((f, i) => ({
    ...f,
    kneeAngleSmoothed: kneeAnglesSmoothed[i],
    torsoScaleSmoothed: torsoScalesSmoothed[i],
  }));
}
