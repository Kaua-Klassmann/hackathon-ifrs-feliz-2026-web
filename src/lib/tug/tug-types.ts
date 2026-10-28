export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface FrameSample {
  timestampMs: number;
  landmarks: PoseLandmark[];
}
