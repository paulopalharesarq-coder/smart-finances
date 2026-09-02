/**
 * High-Quality Pure Node.js PNG Icon Generator for PWA & iOS
 * Generates full-bleed, seamless icons with high-saturation 3D shopping cart artwork
 * without any embedded inner borders, frame artifacts, or corner cuts.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation
function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}
const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function writePNG(width, height, rgbaBuffer, outputPath) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdrChunk = createChunk('IHDR', ihdrData);

  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (width * 4 + 1);
    scanlines[scanlineOffset] = 0;
    rgbaBuffer.copy(scanlines, scanlineOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(outputPath, png);
}

// Distance to 2D line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Point in polygon test
function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Alpha blend over background
function blendPixel(buf, idx, r, g, b, alpha) {
  const a = Math.max(0, Math.min(1, alpha));
  if (a <= 0) return;
  const bgR = buf[idx];
  const bgG = buf[idx + 1];
  const bgB = buf[idx + 2];
  buf[idx] = Math.round(r * a + bgR * (1 - a));
  buf[idx + 1] = Math.round(g * a + bgG * (1 - a));
  buf[idx + 2] = Math.round(b * a + bgB * (1 - a));
  buf[idx + 3] = 255;
}

/**
 * Renders full bleed high-saturation 3D icon
 * @param {number} size - Canvas size in px
 * @param {boolean} isMaskable - If true, scale cart to safe zone (80%)
 */
function renderFullBleedIcon(size, isMaskable = false) {
  const buf = Buffer.alloc(size * size * 4);

  // Full bleed background gradient (100% continuous, no borders, no margins)
  const bgTop = [253, 247, 240]; // #fdf7f0
  const bgBot = [244, 227, 210]; // #f4e3d2

  for (let y = 0; y < size; y++) {
    const ny = y / (size - 1);
    const r = Math.round(bgTop[0] + (bgBot[0] - bgTop[0]) * ny);
    const g = Math.round(bgTop[1] + (bgBot[1] - bgTop[1]) * ny);
    const b = Math.round(bgTop[2] + (bgBot[2] - bgTop[2]) * ny);

    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = 255;
    }
  }

  // Normalized 512x512 coordinate space for crisp vector rasterization
  const scale = isMaskable ? (size / 512) * 0.78 : (size / 512) * 0.94;
  const offsetX = (size - 512 * scale) / 2;
  const offsetY = (size - 512 * scale) / 2 + (isMaskable ? 0 : 4 * scale);

  // Super-sampled 3D Shopping Cart Rasterizer
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Transform to normalized (nx, ny)
      const nx = (x - offsetX) / scale;
      const ny = (y - offsetY) / scale;

      // 1. Soft 3D Drop Shadow underneath cart
      const shadowDist1 = distToSegment(nx, ny, 160, 370, 390, 370);
      if (shadowDist1 < 48 && ny > 330) {
        const sAlpha = (1 - shadowDist1 / 48) * 0.28;
        blendPixel(buf, idx, 110, 50, 10, sAlpha);
      }
      const wheelShadow1 = Math.hypot(nx - 200, ny - 410);
      if (wheelShadow1 < 36) {
        const wsAlpha = (1 - wheelShadow1 / 36) * 0.35;
        blendPixel(buf, idx, 100, 45, 10, wsAlpha);
      }
      const wheelShadow2 = Math.hypot(nx - 355, ny - 410);
      if (wheelShadow2 < 36) {
        const wsAlpha = (1 - wheelShadow2 / 36) * 0.35;
        blendPixel(buf, idx, 100, 45, 10, wsAlpha);
      }

      // 2. 3D Wheels (Vibrant Orange & Golden Glow)
      const w1 = Math.hypot(nx - 200, ny - 388);
      if (w1 <= 36) {
        const edgeA = Math.min(1, (36 - w1) * 1.5);
        // 3D Spherical/Cylindrical lighting on wheel
        const wNormX = (nx - 200) / 36;
        const wNormY = (ny - 388) / 36;
        const wLight = Math.max(0, -wNormX * 0.4 - wNormY * 0.8);
        const wr = Math.round(255 * (0.85 + 0.15 * wLight));
        const wg = Math.round(145 * (0.75 + 0.25 * wLight) + 50 * wLight);
        const wb = Math.round(30 * (0.6 + 0.4 * wLight));
        blendPixel(buf, idx, wr, wg, wb, edgeA);

        // Wheel inner hub
        if (w1 <= 14) {
          const hubLight = 0.5 + 0.5 * Math.max(0, -wNormY);
          blendPixel(buf, idx, 255, 230, 190, 0.65 * hubLight);
        }
      }

      const w2 = Math.hypot(nx - 355, ny - 388);
      if (w2 <= 36) {
        const edgeA = Math.min(1, (36 - w2) * 1.5);
        const wNormX = (nx - 355) / 36;
        const wNormY = (ny - 388) / 36;
        const wLight = Math.max(0, -wNormX * 0.4 - wNormY * 0.8);
        const wr = Math.round(255 * (0.85 + 0.15 * wLight));
        const wg = Math.round(145 * (0.75 + 0.25 * wLight) + 50 * wLight);
        const wb = Math.round(30 * (0.6 + 0.4 * wLight));
        blendPixel(buf, idx, wr, wg, wb, edgeA);

        if (w2 <= 14) {
          const hubLight = 0.5 + 0.5 * Math.max(0, -wNormY);
          blendPixel(buf, idx, 255, 230, 190, 0.65 * hubLight);
        }
      }

      // 3. Orange 3D Lower Base Layer (Rich, saturated, punchy orange)
      const basePoly = [
        [120, 150],
        [150, 150],
        [182, 280],
        [205, 335],
        [375, 335],
        [418, 175],
        [430, 185],
        [395, 345],
        [200, 345],
        [170, 285],
        [135, 160],
        [115, 160]
      ];
      const distBase = distToSegment(nx, ny, 165, 200, 195, 335);
      const distBaseBot = distToSegment(nx, ny, 195, 335, 395, 335);
      const distBaseBack = distToSegment(nx, ny, 395, 335, 425, 180);

      const inOrangeLayer = (distBase <= 18) || (distBaseBot <= 18) || (distBaseBack <= 16);
      if (inOrangeLayer) {
        const minDist = Math.min(distBase, distBaseBot, distBaseBack);
        const edgeA = Math.min(1, (18 - minDist) * 1.5);
        const t = Math.max(0, Math.min(1, (ny - 150) / 200));
        // Vibrant saturated gradient: #ff851b to #e65100
        const orR = Math.round(255 * (1 - t * 0.1));
        const orG = Math.round(135 - t * 45);
        const orB = Math.round(20 - t * 15);
        blendPixel(buf, idx, orR, orG, orB, edgeA);
      }

      // 4. Cream & Pure White 3D Basket Body (High Contrast & Clear Depth)
      // Rounded basket polygon
      const basketBody = [
        [175, 175],
        [415, 175],
        [385, 310],
        [220, 310]
      ];
      const inBasket = pointInPoly(nx, ny, basketBody);
      if (inBasket) {
        const by = (ny - 175) / (310 - 175);
        const bx = (nx - 200) / (415 - 200);
        // Cream 3D lighting
        const crR = Math.round(255 - by * 8);
        const crG = Math.round(250 - by * 14 + bx * 4);
        const crB = Math.round(242 - by * 18);
        blendPixel(buf, idx, crR, crG, crB, 1.0);
      }

      // Handle and upper rim
      const handleDist = distToSegment(nx, ny, 105, 150, 145, 150);
      const handleSlant = distToSegment(nx, ny, 145, 150, 175, 230);
      const basketRim = distToSegment(nx, ny, 165, 175, 420, 175);
      const basketBottom = distToSegment(nx, ny, 215, 310, 385, 310);
      const basketRight = distToSegment(nx, ny, 420, 175, 385, 310);
      const basketLeft = distToSegment(nx, ny, 165, 175, 215, 310);

      const minRimDist = Math.min(handleDist, handleSlant, basketRim, basketBottom, basketRight, basketLeft);
      if (minRimDist <= 14) {
        const edgeA = Math.min(1, (14 - minRimDist) * 1.5);
        // Crisp white rim with subtle warm bevel
        const rY = Math.max(0, Math.min(1, (ny - 140) / 180));
        const rimR = Math.round(255);
        const rimG = Math.round(252 - rY * 6);
        const rimB = Math.round(246 - rY * 10);
        blendPixel(buf, idx, rimR, rimG, rimB, edgeA);
      }

      // Handle grip bulb
      const handleBulb = Math.hypot(nx - 105, ny - 150);
      if (handleBulb <= 15) {
        const edgeA = Math.min(1, (15 - handleBulb) * 1.5);
        blendPixel(buf, idx, 255, 255, 252, edgeA);
      }

      // Subtle glossy reflection line on top of basket rim
      const glossDist = distToSegment(nx, ny, 175, 173, 415, 173);
      if (glossDist <= 3) {
        const gAlpha = (1 - glossDist / 3) * 0.7;
        blendPixel(buf, idx, 255, 255, 255, gAlpha);
      }
    }
  }

  return buf;
}

// Generate matching scalable SVG
function generateVectorSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Full-bleed continuous cream gradient -->
    <linearGradient id="bgGradFull" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fdf7f0"/>
      <stop offset="100%" stop-color="#f4e3d2"/>
    </linearGradient>

    <!-- Vibrant 3D orange gradient -->
    <linearGradient id="vibrantOrange" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff9233"/>
      <stop offset="100%" stop-color="#e65100"/>
    </linearGradient>

    <!-- 3D wheel gradient -->
    <linearGradient id="wheelGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffa34d"/>
      <stop offset="100%" stop-color="#d35400"/>
    </linearGradient>

    <!-- Crisp cream basket fill -->
    <linearGradient id="creamBasket" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fbf1e8"/>
    </linearGradient>

    <!-- Soft drop shadow filter -->
    <filter id="cartDepthShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#803800" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Full-bleed background with zero borders or frames -->
  <rect width="512" height="512" fill="url(#bgGradFull)"/>

  <!-- Cart Shadow & Assembly -->
  <g filter="url(#cartDepthShadow)">
    <!-- 3D Wheels -->
    <circle cx="200" cy="388" r="36" fill="url(#wheelGrad)"/>
    <circle cx="200" cy="388" r="14" fill="#ffebd9" opacity="0.8"/>
    <circle cx="355" cy="388" r="36" fill="url(#wheelGrad)"/>
    <circle cx="355" cy="388" r="14" fill="#ffebd9" opacity="0.8"/>

    <!-- Vibrant Orange 3D Lower Base -->
    <path d="M 120 150 L 145 150 L 180 275 L 205 335 L 375 335 L 420 175" 
          fill="none" 
          stroke="url(#vibrantOrange)" 
          stroke-width="32" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>

    <!-- 3D Cream Basket Body -->
    <polygon points="175,175 415,175 385,310 220,310" fill="url(#creamBasket)"/>

    <!-- Crisp White Upper Rim & Frame -->
    <path d="M 105 150 L 145 150 L 175 230 L 220 310 L 385 310 L 420 175 L 170 175" 
          fill="none" 
          stroke="#ffffff" 
          stroke-width="24" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>
          
    <circle cx="105" cy="150" r="14" fill="#ffffff"/>
  </g>
</svg>`;
}

function generateAllIcons() {
  const iconsDir = path.join(__dirname, '..', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('[ICONS] Generating high-contrast, full-bleed icon assets...');

  // 1. apple-touch-icon.png (180x180) - Full bleed continuous background for iOS native look
  console.log('Generating apple-touch-icon.png (180x180, full bleed)...');
  const buf180 = renderFullBleedIcon(180, false);
  writePNG(180, 180, buf180, path.join(iconsDir, 'apple-touch-icon.png'));

  // 2. icon-192.png (192x192) - Full bleed
  console.log('Generating icon-192.png (192x192, full bleed)...');
  const buf192 = renderFullBleedIcon(192, false);
  writePNG(192, 192, buf192, path.join(iconsDir, 'icon-192.png'));

  // 3. icon-512.png (512x512) - Full bleed
  console.log('Generating icon-512.png (512x512, full bleed)...');
  const buf512 = renderFullBleedIcon(512, false);
  writePNG(512, 512, buf512, path.join(iconsDir, 'icon-512.png'));

  // 4. icon-maskable-192.png (192x192) - Full bleed background with cart inside safe zone
  console.log('Generating icon-maskable-192.png (192x192, safe zone)...');
  const bufMask192 = renderFullBleedIcon(192, true);
  writePNG(192, 192, bufMask192, path.join(iconsDir, 'icon-maskable-192.png'));

  // 5. icon-maskable-512.png (512x512) - Full bleed background with cart inside safe zone
  console.log('Generating icon-maskable-512.png (512x512, safe zone)...');
  const bufMask512 = renderFullBleedIcon(512, true);
  writePNG(512, 512, bufMask512, path.join(iconsDir, 'icon-maskable-512.png'));

  // 6. favicon-32.png (32x32)
  console.log('Generating favicon-32.png (32x32)...');
  const buf32 = renderFullBleedIcon(32, false);
  writePNG(32, 32, buf32, path.join(iconsDir, 'favicon-32.png'));

  // 7. icon.svg
  console.log('Generating icon.svg...');
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), generateVectorSVG(), 'utf8');

  console.log('✨ All full-bleed, high-contrast PWA icons generated successfully!');
}

generateAllIcons();
