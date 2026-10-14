// Node.js pure script to generate simple valid PNG icons for PWA compliance
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createPng(width, height, isMaskable = false) {
  // Pre-calculate CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcBuf = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    buf.writeUInt32BE(crc32(crcBuf), 8 + len);
    return buf;
  }

  // PNG header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = chunk('IHDR', ihdrData);

  // Raw image data: height rows, each row has 1 filter byte (0) + width * 4 bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // No filter

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background: Crimson red (#dc2626)
      let r = 220, g = 38, b = 38, a = 255;

      // Draw stylized white inner card
      const inCard = (x >= width * 0.2 && x <= width * 0.8 && y >= height * 0.25 && y <= height * 0.75);
      if (inCard) {
        // Red header of slip
        if (y <= height * 0.35) {
          r = 239; g = 68; b = 68; a = 255;
        } else {
          r = 255; g = 255; b = 255; a = 255;
          // Perforated line
          if (Math.abs(x - width * 0.62) < 2 && Math.floor(y / 4) % 2 === 0) {
            r = 203; g = 213; b = 225;
          }
          // Simulated QR/barcode box
          if (x >= width * 0.25 && x <= width * 0.45 && y >= height * 0.52 && y <= height * 0.70) {
            if ((Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0) {
              r = 30; g = 41; b = 59;
            } else {
              r = 241; g = 245; b = 249;
            }
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idat = chunk('IDAT', compressedData);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64));

console.log('Successfully generated PWA icon assets in /public');
