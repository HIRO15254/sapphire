#!/usr/bin/env node

/**
 * PWAアイコン生成スクリプト
 *
 * シンプルなチェックマークアイコンを生成します
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, "..", "public");

// SVGテンプレート（Todoアプリのチェックマークアイコン）
const generateSVG = (size, maskable = false) => {
  const padding = maskable ? size * 0.2 : 0;
  const iconSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = iconSize / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${maskable ? `<rect width="${size}" height="${size}" fill="#228be6"/>` : ""}
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${maskable ? "#ffffff" : "#228be6"}"/>
  <path d="M ${cx - r * 0.4} ${cy} L ${cx - r * 0.1} ${cy + r * 0.3} L ${cx + r * 0.5} ${cy - r * 0.4}"
        stroke="${maskable ? "#228be6" : "#ffffff"}"
        stroke-width="${r * 0.15}"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"/>
</svg>`;
};

// SVGファイルを作成
const icons = [
  { name: "icon-192x192.svg", size: 192, maskable: false },
  { name: "icon-512x512.svg", size: 512, maskable: false },
  { name: "icon-192x192-maskable.svg", size: 192, maskable: true },
  { name: "icon-512x512-maskable.svg", size: 512, maskable: true },
];

console.log("Generating PWA icons...");

async function generateIcons() {
  for (const { name, size, maskable } of icons) {
    const svg = generateSVG(size, maskable);
    const pngName = name.replace(".svg", ".png");
    const filepath = join(publicDir, pngName);

    // SVGバッファからPNGに変換
    await sharp(Buffer.from(svg)).png().toFile(filepath);

    console.log(`✓ Created ${pngName}`);
  }

  console.log("\n✨ PWA icons generated successfully!");
}

generateIcons().catch(console.error);
