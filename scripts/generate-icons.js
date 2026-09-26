import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generateIconPng(width, height, isMaskable = false) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  // If maskable, safe zone is 80% of width (padding 10-15%)
  const maxRadius = isMaskable ? width * 0.38 : width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: Deep Navy Blue (#0F2B48)
      let r = 15, g = 43, b = 72, a = 255;

      // Outer decorative subtle circle ring
      if (dist <= maxRadius && dist > maxRadius * 0.94) {
        // Golden accent ring (#E2E8F0)
        r = 56; g = 189; b = 248; a = 255;
      } else if (dist <= maxRadius * 0.94) {
        // Inner badge: Royal Medical Blue (#1A4A72)
        r = 26; g = 74; b = 114; a = 255;

        // Draw Health Cross in center
        const crossArmW = maxRadius * 0.38;
        const crossArmL = maxRadius * 1.05;
        const inHoriz = Math.abs(dx) <= crossArmL / 2 && Math.abs(dy) <= crossArmW / 2;
        const inVert = Math.abs(dy) <= crossArmL / 2 && Math.abs(dx) <= crossArmW / 2;

        if (inHoriz || inVert) {
          // White Cross
          r = 255; g = 255; b = 255; a = 255;

          // Inner Medical Red/Emerald Center emblem
          const innerDist = Math.sqrt(dx * dx + dy * dy);
          if (innerDist <= crossArmW * 0.6) {
            // Emerald Green (#10B981)
            r = 16; g = 185; b = 129; a = 255;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflated),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 192x192
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateIconPng(192, 192, false));
// 512x512
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateIconPng(512, 512, false));
// 512x512 Maskable (with 15% safe padding)
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateIconPng(512, 512, true));
// 180x180 Apple Touch Icon
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateIconPng(180, 180, false));
// favicon
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generateIconPng(64, 64, false));

// SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F2B48"/>
      <stop offset="100%" stop-color="#1A4A72"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)"/>
  <circle cx="256" cy="256" r="190" fill="none" stroke="#38BDF8" stroke-width="8" stroke-dasharray="16 8"/>
  <circle cx="256" cy="256" r="170" fill="#1E3A8A" fill-opacity="0.5"/>
  <!-- Medical Cross -->
  <path d="M216 120 h80 v96 h96 v80 h-96 v96 h-80 v-96 h-96 v-80 h96 z" fill="#FFFFFF" rx="16"/>
  <!-- Center Emblem -->
  <circle cx="256" cy="256" r="48" fill="url(#accentGrad)"/>
  <!-- Caduceus/Heart Pulse icon inside -->
  <path d="M236 256 h12 l8 -16 l10 32 l8 -20 l6 4 h16" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

console.log('All PWA icons generated successfully in public/');
