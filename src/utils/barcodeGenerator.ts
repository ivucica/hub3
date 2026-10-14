import bwipjs from 'bwip-js';

export function renderHub3Barcode(
  canvas: HTMLCanvasElement,
  payload: string,
  options?: { scale?: number; columns?: number }
): void {
  if (!canvas || !payload) return;

  try {
    bwipjs.toCanvas(canvas, {
      bcid: 'pdf417',
      text: payload,
      scale: options?.scale || 2,
      columns: options?.columns || 9, // HUB-3 standard requires 9 columns
      security: 4, // ECL 4 as per HUB-3 spec
      includetext: false,
    });
  } catch (err) {
    // If 9 columns fails due to aspect or width constraints with smaller text, fallback to 6
    try {
      bwipjs.toCanvas(canvas, {
        bcid: 'pdf417',
        text: payload,
        scale: options?.scale || 2,
        columns: 6,
        security: 4,
        includetext: false,
      });
    } catch (e2) {
      console.error('Failed to render PDF417 canvas:', e2);
    }
  }
}

export function renderSepaQr(
  canvas: HTMLCanvasElement,
  payload: string,
  options?: { scale?: number }
): void {
  if (!canvas || !payload) return;

  try {
    bwipjs.toCanvas(canvas, {
      bcid: 'qrcode',
      text: payload,
      scale: options?.scale || 4,
      eclevel: 'M', // EPC SEPA Standard requirement (Level M)
      includetext: false,
    });
  } catch (err) {
    console.error('Failed to render SEPA QR canvas:', err);
  }
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): void {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
