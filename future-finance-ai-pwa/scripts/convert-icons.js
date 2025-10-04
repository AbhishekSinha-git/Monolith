import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertSvgToPng(inputPath, outputPath, size) {
    try {
        const svg = readFileSync(inputPath);
        await sharp(svg)
            .resize(size, size)
            .png()
            .toFile(outputPath);
        console.log(`Created ${outputPath}`);
    } catch (error) {
        console.error(`Error converting ${inputPath}:`, error);
    }
}

async function main() {
    const sizes = [192, 512];
    for (const size of sizes) {
        await convertSvgToPng(
            join(dirname(__filename), '..', 'public', 'icons', `icon-${size}x${size}.svg`),
            join(dirname(__filename), '..', 'public', 'icons', `icon-${size}x${size}.png`),
            size
        );
    }
}

main().catch(console.error);