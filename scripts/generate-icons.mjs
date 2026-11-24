// Regenerates every app icon from the one design in src/app/icon.svg.
// Run with: node scripts/generate-icons.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync("src/app/icon.svg");
mkdirSync("public/icons", { recursive: true });

const png = (size) => sharp(svg, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** Full-bleed teal with the waves kept inside the centre, so any mask shape (circle, squircle) still shows them. */
async function maskable(size) {
  const base = sharp({ create: { width: size, height: size, channels: 4, background: "#0f766e" } });
  const inner = Math.round(size * 0.78);
  // Only the bars (no rounded tile of their own), drawn on the full-bleed background.
  const bars = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g stroke="#fff" stroke-width="40" stroke-linecap="round">
      <line x1="132" y1="226" x2="132" y2="286"/><line x1="194" y1="176" x2="194" y2="336"/><line x1="256" y1="122" x2="256" y2="390"/>
      <line x1="318" y1="176" x2="318" y2="336"/><line x1="380" y1="226" x2="380" y2="286"/></g></svg>`
  );
  const barsPng = await sharp(bars, { density: 384 }).resize(inner, inner).png().toBuffer();
  const offset = Math.round((size - inner) / 2);
  return base.composite([{ input: barsPng, left: offset, top: offset }]).png({ compressionLevel: 9 }).toBuffer();
}

/** A .ico holding PNG images (supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

writeFileSync("public/icons/icon-192.png", await png(192));
writeFileSync("public/icons/icon-512.png", await png(512));
writeFileSync("public/icons/apple-touch-icon.png", await png(180));
writeFileSync("public/icons/icon-maskable-512.png", await maskable(512));
writeFileSync(
  "src/app/favicon.ico",
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(size) }))))
);
console.log("icons written");
