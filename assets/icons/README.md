# PWA Icons

This folder should contain the following PNG icons for the PWA:

| File | Size | Usage |
|------|------|-------|
| `icon-72x72.png` | 72×72 | Android small |
| `icon-96x96.png` | 96×96 | Android medium |
| `icon-128x128.png` | 128×128 | Chrome Web Store |
| `icon-144x144.png` | 144×144 | MS Tile |
| `icon-152x152.png` | 152×152 | iOS |
| `icon-192x192.png` | 192×192 | Android main |
| `icon-384x384.png` | 384×384 | High-res |
| `icon-512x512.png` | 512×512 | Splash screen |

## Generating Icons

Use the provided `icon.svg` as the source and generate PNGs using one of these methods:

### Option 1: Online Tools
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)

### Option 2: Command Line (ImageMagick)
```bash
# Install ImageMagick if not present
brew install imagemagick

# Generate all sizes
for size in 72 96 128 144 152 192 384 512; do
  convert icon.svg -resize ${size}x${size} icon-${size}x${size}.png
done
```

### Option 3: Using sharp (Node.js)
```javascript
const sharp = require('sharp');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('icon.svg')
    .resize(size, size)
    .png()
    .toFile(`icon-${size}x${size}.png`);
});
```
