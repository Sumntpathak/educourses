/* ════════════════════════════════════════════════════════════════
   Canvas Utilities — shared drawing helpers for certificates & pamphlets
════════════════════════════════════════════════════════════════ */

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawGradientRect(ctx, x, y, w, h, r, color1, color2, angle = 0) {
  const grad = ctx.createLinearGradient(x, y, x + w * Math.cos(angle), y + h * Math.sin(angle || 1));
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
}

export function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '', lines = [];
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return lines.length;
}

export function drawBorder(ctx, W, H, thickness, color1, color2) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.strokeStyle = grad;
  ctx.lineWidth = thickness;
  ctx.strokeRect(thickness / 2, thickness / 2, W - thickness, H - thickness);
}

export function drawDecorativeCorners(ctx, W, H, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  const s = size;
  // Top-left
  ctx.beginPath(); ctx.moveTo(20, 20 + s); ctx.lineTo(20, 20); ctx.lineTo(20 + s, 20); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(W - 20 - s, 20); ctx.lineTo(W - 20, 20); ctx.lineTo(W - 20, 20 + s); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(20, H - 20 - s); ctx.lineTo(20, H - 20); ctx.lineTo(20 + s, H - 20); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(W - 20 - s, H - 20); ctx.lineTo(W - 20, H - 20); ctx.lineTo(W - 20, H - 20 - s); ctx.stroke();
}

export function downloadCanvas(canvas, filename) {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export function shareOnWhatsApp(text) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}
