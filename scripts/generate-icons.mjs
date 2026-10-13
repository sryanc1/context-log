import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const source = 'assets/icon.svg';
const outDir = 'public';

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-maskable-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

await mkdir(outDir, { recursive: true });

for (const { file, size } of targets) {
  await sharp(source, { density: 384 }).resize(size, size).png().toFile(`${outDir}/${file}`);
  console.log(`wrote ${outDir}/${file}`);
}