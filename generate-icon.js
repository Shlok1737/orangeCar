const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, pixelFn) {
  // Build uncompressed scanlines
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    scanlines[offset++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      scanlines[offset++] = r;
      scanlines[offset++] = g;
      scanlines[offset++] = b;
      scanlines[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(scanlines);

  // CRC32 table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const full = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(full), 0);
    return Buffer.concat([len, full, crcBuf]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate a 32x32 pixel cat head icon
const iconBuffer = createPng(32, 32, (x, y) => {
  // Center is at (16, 17)
  const dx = x - 16;
  const dy = y - 18;

  // Ears
  const leftEar = (x >= 6 && x <= 13 && y >= 4 && y <= 15 && (x - 6) + (y - 4) >= 5 && (13 - x) + (y - 4) <= 12);
  const rightEar = (x >= 18 && x <= 25 && y >= 4 && y <= 15 && (25 - x) + (y - 4) >= 5 && (x - 18) + (y - 4) <= 12);

  if (leftEar || rightEar) {
    if ((x >= 8 && x <= 11 && y >= 7 && y <= 12) || (x >= 20 && x <= 23 && y >= 7 && y <= 12)) {
      return [255, 175, 168, 255]; // Pink inner ear
    }
    return [232, 122, 36, 255]; // Orange fur
  }

  // Head circle
  const distSq = (dx * dx) / (12 * 12) + (dy * dy) / (10 * 10);
  if (distSq <= 1.0) {
    // Eyes
    if ((x === 11 || x === 12) && (y === 16 || y === 17)) return [50, 168, 82, 255]; // Green eye
    if ((x === 19 || x === 20) && (y === 16 || y === 17)) return [50, 168, 82, 255];
    if (x === 12 && y === 16) return [20, 20, 20, 255]; // Pupil
    if (x === 20 && y === 16) return [20, 20, 20, 255];
    if (x === 11 && y === 16) return [255, 255, 255, 255]; // Highlight
    if (x === 19 && y === 16) return [255, 255, 255, 255];

    // Nose
    if ((x === 15 || x === 16) && y === 20) return [255, 123, 123, 255];

    // Muzzle / white cheeks
    if (Math.abs(dx) <= 5 && dy >= 2 && dy <= 6) return [255, 244, 234, 255];

    // Forehead tabby stripes
    if ((x === 15 || x === 16) && y >= 11 && y <= 15) return [133, 50, 5, 255];
    if ((x === 11 || x === 12) && y >= 12 && y <= 14) return [133, 50, 5, 255];
    if ((x === 19 || x === 20) && y >= 12 && y <= 14) return [133, 50, 5, 255];

    return [232, 122, 36, 255]; // Base orange
  }

  return [0, 0, 0, 0]; // Transparent
});

fs.mkdirSync(path.join(__dirname, 'assets'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'assets', 'tray-icon.png'), iconBuffer);
console.log('Saved assets/tray-icon.png successfully!');
