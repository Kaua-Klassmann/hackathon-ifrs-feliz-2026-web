import type { PoseLandmark } from "./tug-types";

const POSE_CONNECTIONS: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [27, 29],
  [27, 31],
  [24, 26],
  [26, 28],
  [28, 30],
  [28, 32],
];

let cachedColor: string | null = null;

function skeletonColor(canvas: HTMLCanvasElement): string {
  if (!cachedColor) {
    cachedColor = getComputedStyle(canvas).getPropertyValue("--success").trim() || "currentColor";
  }
  return cachedColor;
}

export function drawLandmarks(canvas: HTMLCanvasElement | null, video: HTMLVideoElement, landmarks: PoseLandmark[]) {
  if (!canvas) return;

  if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const color = skeletonColor(canvas);

  const toPixel = (p: PoseLandmark) => ({
    x: p.x * canvas.width,
    y: p.y * canvas.height,
  });

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (const [a, b] of POSE_CONNECTIONS) {
    const pa = landmarks[a];
    const pb = landmarks[b];
    if (!pa || !pb) continue;
    const { x: ax, y: ay } = toPixel(pa);
    const { x: bx, y: by } = toPixel(pb);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  ctx.fillStyle = color;
  for (const p of landmarks) {
    const { x, y } = toPixel(p);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  }
}
