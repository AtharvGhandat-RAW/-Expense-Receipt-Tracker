import sharp from 'sharp';
import { mkdirSync } from 'fs';

// Create a 1024x1024 app icon with:
// - Blue gradient background (Material blue)
// - White rupee symbol + receipt icon

const size = 1024;
const padding = 160;

// SVG for the icon
const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Background rounded square -->
  <rect width="${size}" height="${size}" rx="220" ry="220" fill="url(#bg)"/>

  <!-- Receipt/document shape -->
  <g transform="translate(${size/2 - 200}, ${padding + 20})" filter="url(#shadow)">
    <!-- Receipt body -->
    <path d="M40,0 L360,0 L360,620 L320,580 L280,620 L240,580 L200,620 L160,580 L120,620 L80,580 L40,620 Z"
          fill="white" opacity="0.95" rx="20"/>
    <!-- Lines on receipt -->
    <rect x="100" y="120" width="200" height="16" rx="8" fill="#2563eb" opacity="0.3"/>
    <rect x="100" y="180" width="160" height="16" rx="8" fill="#2563eb" opacity="0.2"/>
    <rect x="100" y="240" width="200" height="16" rx="8" fill="#2563eb" opacity="0.15"/>
  </g>

  <!-- Rupee symbol -->
  <g transform="translate(${size/2 - 120}, ${size/2 - 60})">
    <circle cx="120" cy="120" r="140" fill="white" opacity="0.2"/>
    <text x="120" y="165" font-family="Arial, sans-serif" font-size="220" font-weight="bold"
          fill="white" text-anchor="middle" dominant-baseline="middle">₹</text>
  </g>
</svg>
`;

// Generate icon
mkdirSync('assets', { recursive: true });

await sharp(Buffer.from(svg))
  .resize(1024, 1024)
  .png()
  .toFile('assets/icon-only.png');

// Generate a foreground for adaptive icons (just the symbol, transparent bg)
const fgSvg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Receipt/document shape -->
  <g transform="translate(${size/2 - 200}, ${padding + 20})">
    <path d="M40,0 L360,0 L360,620 L320,580 L280,620 L240,580 L200,620 L160,580 L120,620 L80,580 L40,620 Z"
          fill="white" opacity="0.95"/>
    <rect x="100" y="120" width="200" height="16" rx="8" fill="#2563eb" opacity="0.3"/>
    <rect x="100" y="180" width="160" height="16" rx="8" fill="#2563eb" opacity="0.2"/>
    <rect x="100" y="240" width="200" height="16" rx="8" fill="#2563eb" opacity="0.15"/>
  </g>
  <g transform="translate(${size/2 - 120}, ${size/2 - 60})">
    <text x="120" y="165" font-family="Arial, sans-serif" font-size="220" font-weight="bold"
          fill="#1d4ed8" text-anchor="middle" dominant-baseline="middle">₹</text>
  </g>
</svg>
`;

await sharp(Buffer.from(fgSvg))
  .resize(1024, 1024)
  .png()
  .toFile('assets/icon-foreground.png');

// Background color for adaptive icon
await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: { r: 37, g: 99, b: 235, alpha: 1 } }
})
  .png()
  .toFile('assets/icon-background.png');

// Splash screen
const splashSvg = `
<svg width="2732" height="2732" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="2732" height="2732" fill="url(#bg)"/>
  <g transform="translate(${2732/2 - 200}, ${2732/2 - 300})">
    <path d="M40,0 L360,0 L360,620 L320,580 L280,620 L240,580 L200,620 L160,580 L120,620 L80,580 L40,620 Z"
          fill="white" opacity="0.95"/>
    <rect x="100" y="120" width="200" height="16" rx="8" fill="#2563eb" opacity="0.3"/>
    <rect x="100" y="180" width="160" height="16" rx="8" fill="#2563eb" opacity="0.2"/>
    <rect x="100" y="240" width="200" height="16" rx="8" fill="#2563eb" opacity="0.15"/>
  </g>
  <g transform="translate(${2732/2 - 120}, ${2732/2 - 60})">
    <text x="120" y="165" font-family="Arial, sans-serif" font-size="220" font-weight="bold"
          fill="white" text-anchor="middle" dominant-baseline="middle">₹</text>
  </g>
  <text x="${2732/2}" y="${2732/2 + 340}" font-family="Arial, sans-serif" font-size="72" font-weight="bold"
        fill="white" text-anchor="middle" opacity="0.9">Expense Tracker</text>
</svg>
`;

await sharp(Buffer.from(splashSvg))
  .resize(2732, 2732)
  .png()
  .toFile('assets/splash.png');

// Dark splash
const splashDarkSvg = splashSvg.replace('#2563eb', '#1e3a5f').replace('#1d4ed8', '#0f172a');

await sharp(Buffer.from(splashDarkSvg))
  .resize(2732, 2732)
  .png()
  .toFile('assets/splash-dark.png');

console.log('✓ All icon & splash assets generated in /assets');
