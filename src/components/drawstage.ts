import type { Snapshot } from "./snapshot";

const cachedSprites = new Map<string, HTMLCanvasElement>();
const SCALE = 0.95;

const UNIT_BODY_DIAMETER = 15 * SCALE;
const UNIT_BODY_RADIUS = UNIT_BODY_DIAMETER / 2;
const UNIT_SATELLITE_RADIUS = UNIT_BODY_RADIUS / 2;
const UNIT_SATELLITE_DISTANCE = UNIT_BODY_DIAMETER / 1.1;
const UNIT_SPRITE_SIZE = Math.ceil(
  (UNIT_SATELLITE_DISTANCE + UNIT_SATELLITE_RADIUS + 1) * 2
);
function drawUnitShape(
  ctx: CanvasRenderingContext2D,
  color: string,
  cx: number,
  cy: number,
) {
  ctx.fillStyle = color;
  ctx.strokeStyle = "#000";

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, UNIT_BODY_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const x = cx + UNIT_SATELLITE_DISTANCE * Math.cos(angle);
    const y = cy + UNIT_SATELLITE_DISTANCE * Math.sin(angle);
    const gapCenter = angle + Math.PI;
    const startAngle = gapCenter + Math.PI * 0.7 / 2;
    const endAngle = gapCenter - Math.PI * 0.7 / 2;
    const innerX = cx + UNIT_BODY_RADIUS * Math.cos(angle);
    const innerY = cy + UNIT_BODY_RADIUS * Math.sin(angle);
    const outerX = x;
    const outerY = y;
    const nx = Math.cos(angle + Math.PI / 2);
    const ny = Math.sin(angle + Math.PI / 2);
    const w1 = UNIT_SATELLITE_RADIUS * 0.4;
    const w2 = UNIT_SATELLITE_RADIUS * 0.7;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, UNIT_SATELLITE_RADIUS, startAngle, endAngle);
    ctx.beginPath();
    ctx.moveTo(innerX + nx * w1, innerY + ny * w1);
    ctx.lineTo(outerX + nx * w2, outerY + ny * w2);
    ctx.lineTo(outerX - nx * w2, outerY - ny * w2);
    ctx.lineTo(innerX - nx * w1, innerY - ny * w1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  }
}

function createUnitSprite(color: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = UNIT_SPRITE_SIZE;
  canvas.height = UNIT_SPRITE_SIZE;
  canvas.dataset.ready = "true";

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  drawUnitShape(ctx, color, UNIT_SPRITE_SIZE / 2, UNIT_SPRITE_SIZE / 2);

  return canvas;
}

function UnitView(color: string): HTMLCanvasElement {
  const cached = cachedSprites.get(color);
  if (cached) {
    return cached;
  }

  const sprite = createUnitSprite(color);
  cachedSprites.set(color, sprite);
  return sprite;
}

export default function drawStage(ctx: CanvasRenderingContext2D, world: Snapshot) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const scaleX = width / 100;
  const scaleY = height / 100;

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#4ade80";
  ctx.beginPath();
  for (const fd of world.food) {
    ctx.moveTo(fd.x * scaleX + 4, fd.y * scaleY);
    ctx.arc(fd.x * scaleX, fd.y * scaleY, 4, 0, Math.PI * 2);
  }
  ctx.fill();
  const unitSize = UNIT_SPRITE_SIZE;
  for (const un of world.units) {
    const cx = un.pos[0] * scaleX;
    const cy = un.pos[1] * scaleY;
    const x = cx - unitSize / 2;
    const y = cy - unitSize / 2;
    const sprite = UnitView(un.hex);

    if (sprite.dataset.ready === "true") {
      ctx.drawImage(sprite, x, y, unitSize, unitSize);
    } else {
      drawUnitShape(ctx, un.hex, cx, cy);
    }
  }
}
