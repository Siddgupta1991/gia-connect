// Generates the app icon, adaptive icon layers, splash icon and favicon as PNG files.
// No dependencies: draws a white "G" mark with a pin dot on indigo and encodes PNG with zlib.
// Run with: npm run icons
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const INDIGO = [0x4f, 0x46, 0xe5];
const WHITE = [255, 255, 255];

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0;
    for (let x = 0; x < size; x++) {
      // 3x3 supersampling for smooth edges
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < 3; sy++)
        for (let sx = 0; sx < 3; sx++) {
          const p = pixel((x + (sx + 0.5) / 3) / size, (y + (sy + 0.5) / 3) / size);
          const pa = p[3] / 255;
          r += p[0] * pa; g += p[1] * pa; b += p[2] * pa; a += pa;
        }
      raw[o++] = a ? Math.round(r / a) : 0;
      raw[o++] = a ? Math.round(g / a) : 0;
      raw[o++] = a ? Math.round(b / a) : 0;
      raw[o++] = Math.round((a / 9) * 255);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** True when (u,v) in 0..1 space is inside the G mark scaled to `scale` of the canvas. */
function inMark(u, v, scale) {
  const x = (u - 0.5) / scale;
  const y = (v - 0.5) / scale;
  const r = Math.hypot(x, y);
  const outer = 0.5, inner = 0.31;
  const angle = Math.atan2(y, x); // 0 is to the right, positive is down
  // Ring with an opening on the upper right
  const inRing = r <= outer && r >= inner && !(angle > -Math.PI / 2.6 && angle < 0.02);
  // Crossbar of the G
  const inBar = y >= -0.005 && y <= 0.095 && x >= 0.02 && r <= outer;
  const inStem = x >= outer - 0.19 && x <= outer && y >= 0 && y <= 0.26 && r <= outer;
  return inRing || inBar || inStem;
}

const solid = (rgb) => [...rgb, 255];
const clear = [0, 0, 0, 0];

function roundedSquare(u, v, radius) {
  const dx = Math.max(Math.abs(u - 0.5) - (0.5 - radius), 0);
  const dy = Math.max(Math.abs(v - 0.5) - (0.5 - radius), 0);
  return Math.hypot(dx, dy) <= radius;
}

const out = (name, buf) => {
  writeFileSync(new URL(`../assets/${name}`, import.meta.url), buf);
  console.log('wrote', name, buf.length, 'bytes');
};

// iOS / general icon: full bleed indigo with white mark
out('icon.png', png(1024, (u, v) => (inMark(u, v, 0.56) ? solid(WHITE) : solid(INDIGO))));
// Android adaptive icon layers (mark inside the 66% safe zone)
out('android-icon-foreground.png', png(1024, (u, v) => (inMark(u, v, 0.4) ? solid(WHITE) : clear)));
out('android-icon-background.png', png(1024, () => solid(INDIGO)));
out('android-icon-monochrome.png', png(1024, (u, v) => (inMark(u, v, 0.4) ? solid(WHITE) : clear)));
// Splash: white mark on transparent, shown on the indigo splash background
out('splash-icon.png', png(512, (u, v) => (inMark(u, v, 0.9) ? solid(WHITE) : clear)));
// Web favicon
out('favicon.png', png(64, (u, v) => (!roundedSquare(u, v, 0.22) ? clear : inMark(u, v, 0.6) ? solid(WHITE) : solid(INDIGO))));
