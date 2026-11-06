import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal pure Node PNG encoder
function createPNG(width, height, pixelShader) {
  // pixelShader(x, y, width, height) returns [r, g, b, a] in 0-255

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdr = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelShader(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// CRC32 table & computation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Drawing logic: Premium Ludo Die on dark navy (#0B1020)
function ludoIconShader(x, y, width, height, isMaskable) {
  const cx = width / 2;
  const cy = height / 2;
  const u = (x - cx) / (width / 2); // -1 to 1
  const v = (y - cy) / (height / 2); // -1 to 1
  const rDist = Math.sqrt(u * u + v * v);

  // Background: Deep dark navy (#0B1020 -> #151C35)
  let bgR = Math.round(11 + 10 * (1 - rDist));
  let bgG = Math.round(16 + 12 * (1 - rDist));
  let bgB = Math.round(32 + 25 * (1 - rDist));

  // If maskable, bleed full background
  const scale = isMaskable ? 0.72 : 0.82;
  const su = u / scale;
  const sv = v / scale;

  // Ludo Quadrant Corner Rings
  const distTL = Math.hypot(su + 0.65, sv + 0.65);
  const distTR = Math.hypot(su - 0.65, sv + 0.65);
  const distBL = Math.hypot(su + 0.65, sv - 0.65);
  const distBR = Math.hypot(su - 0.65, sv - 0.65);

  if (distTL < 0.22) return [16, 185, 129, 255]; // Emerald Green
  if (distTR < 0.22) return [239, 68, 68, 255];   // Crimson Red
  if (distBL < 0.22) return [59, 130, 246, 255];  // Royal Blue
  if (distBR < 0.22) return [234, 179, 8, 255];   // Amber Yellow

  // Rounded Square Die Face in Center (-0.5 to 0.5)
  const dX = Math.abs(su);
  const dY = Math.abs(sv);
  const cornerR = 0.12;
  let inBox = false;

  if (dX <= 0.48 && dY <= 0.48) {
    if (dX > 0.48 - cornerR && dY > 0.48 - cornerR) {
      const cDist = Math.hypot(dX - (0.48 - cornerR), dY - (0.48 - cornerR));
      if (cDist <= cornerR) inBox = true;
    } else {
      inBox = true;
    }
  }

  if (inBox) {
    // Die Border highlight
    const isBorder = (dX > 0.44 || dY > 0.44);
    if (isBorder) {
      return [168, 85, 247, 255]; // Purple border
    }

    // Inside die face: 6-dots layout (2 columns of 3 dots)
    const dotCols = [-0.22, 0.22];
    const dotRows = [-0.24, 0.0, 0.24];
    for (const c of dotCols) {
      for (const rw of dotRows) {
        if (Math.hypot(su - c, sv - rw) < 0.075) {
          return [254, 240, 138, 255]; // Glowing gold pips
        }
      }
    }

    // Gradient background inside die: Violet-indigo
    const dieGlow = (sv + 0.5) * 0.5;
    const dR = Math.round(30 + 40 * dieGlow);
    const dG = Math.round(20 + 25 * dieGlow);
    const dB = Math.round(65 + 75 * dieGlow);
    return [dR, dG, dB, 255];
  }

  // Soft purple glow around die
  if (rDist < 0.65) {
    const glow = (1 - (rDist / 0.65)) * 0.35;
    bgR = Math.min(255, Math.round(bgR + 130 * glow));
    bgG = Math.min(255, Math.round(bgG + 50 * glow));
    bgB = Math.min(255, Math.round(bgB + 230 * glow));
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate 192x192 PNG
const png192 = createPNG(192, 192, (x, y, w, h) => ludoIconShader(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// 2. Generate 512x512 PNG
const png512 = createPNG(512, 512, (x, y, w, h) => ludoIconShader(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// 3. Generate Maskable 512x512 PNG (safe margin)
const pngMaskable = createPNG(512, 512, (x, y, w, h) => ludoIconShader(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

// 4. Generate Apple Touch Icon 180x180 PNG
const pngApple = createPNG(180, 180, (x, y, w, h) => ludoIconShader(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

// 5. Generate Favicon
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png192);

console.log('Successfully generated all PWA PNG icons in /public!');
