import QRCode from 'qrcode';

const url = 'https://10.0.0.242:5173/?mock=true';
const path = '/Users/dietrichschmidt/.gemini/antigravity/brain/fc8184c9-0327-441d-be95-4feb3a97e1c6/qrcode.png';

QRCode.toFile(path, url, {
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  width: 300
}, (err) => {
  if (err) throw err;
  console.log(`QR code generated successfully at ${path}`);
});
