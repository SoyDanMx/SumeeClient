/**
 * Genera icon.png, adaptive-icon.png, splash-icon.png y favicon para la app cliente Tulbox.
 * - icon / splash: gradiente violeta + isotipo blanco + logotipo "Tulbox"
 * - adaptive: isotipo blanco sobre PNG transparente (fondo desde app.json #820AD1)
 *
 * Desde la raíz: node scripts/generate-tulbox-client-icons.cjs
 */
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const masterSvg = path.join(root, 'assets/brand/app-icon-tulbox-client.svg');
const whiteIsotypeSvg = path.join(root, 'assets/brand/tulbox-isotype-white.svg');

async function makeAdaptiveForeground(size) {
  const logoPx = Math.round(size * 0.54);
  const logoBuf = await sharp(whiteIsotypeSvg).resize(logoPx, logoPx).png().toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logoBuf, gravity: 'center' }])
    .png()
    .toFile(path.join(root, 'assets/adaptive-icon.png'));

  console.log('Wrote assets/adaptive-icon.png');
}

(async () => {
  await sharp(masterSvg).resize(1024, 1024).png().toFile(path.join(root, 'assets/icon.png'));
  console.log('Wrote assets/icon.png');

  await makeAdaptiveForeground(1024);

  await sharp(masterSvg).resize(1024, 1024).png().toFile(path.join(root, 'assets/splash-icon.png'));
  console.log('Wrote assets/splash-icon.png');

  await sharp(path.join(root, 'assets/icon.png')).resize(48, 48).png().toFile(path.join(root, 'assets/favicon.png'));
  console.log('Wrote assets/favicon.png');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
