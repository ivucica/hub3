import { PaymentDocument, RevolutExtMode } from '../types/payment';

export function cleanAmount(valStr: string | number | undefined | null): number {
  if (valStr === undefined || valStr === null) return 0;
  if (typeof valStr === 'number') return isNaN(valStr) ? 0 : Math.round(valStr * 100) / 100;

  let s = valStr.trim();
  const removeSymbols = ['EUR', 'eur', '€', 'kn', 'HRK', ' ', '='];
  for (const sym of removeSymbols) {
    s = s.replaceAll(sym, '');
  }

  if (!s) return 0;

  // European decimal formatting (e.g. 1.234,56 -> 1234.56)
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replaceAll('.', '').replace(',', '.');
    } else {
      s = s.replaceAll(',', '');
    }
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }

  const num = parseFloat(s);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('hr-HR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' €';
}

export function formatSlipAmount(amount: number): string {
  // Format for the HUB-3 slip box e.g. "=14,83"
  const formatted = new Intl.NumberFormat('hr-HR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `=${formatted}`;
}

export function flattenMultiline(text: string, joinStr = ' '): string {
  if (!text) return '';
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .join(joinStr);
}

export function parseAddressLines(cellText: string): [string, string, string] {
  if (!cellText) return ['', '', ''];
  const lines = cellText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  return [lines[0] || '', lines[1] || '', lines[2] || ''];
}

export function parseModelAndPnb(rawPnb: string, rawModel = ''): { model: string; pnb: string } {
  let pnb = (rawPnb || '').trim();
  let model = (rawModel || '').trim().toUpperCase();

  if (pnb && !model) {
    const match = pnb.match(/^(HR\d{2})\s*(.*)$/i);
    if (match) {
      model = match[1].toUpperCase();
      pnb = match[2].trim();
    } else {
      const digitMatch = pnb.match(/^(\d{2})\s+(.*)$/);
      if (digitMatch) {
        model = `HR${digitMatch[1]}`;
        pnb = digitMatch[2].trim();
      }
    }
  }

  if (model && !model.startsWith('HR') && /^\d{2}$/.test(model)) {
    model = `HR${model}`;
  }

  return { model: model || 'HR01', pnb };
}

export function descExtender(
  mode: RevolutExtMode,
  structuredRef: string,
  textCell: string,
  payerCell: string
): string {
  const firstDescLine = (textCell || '').split(/\r?\n/)[0]?.trim() || '';
  const firstPayerLine = (payerCell || '').split(/\r?\n/)[0]?.trim() || '';
  const fullDesc = flattenMultiline(textCell, ', ');

  switch (mode) {
    case '0':
      return structuredRef;
    case '1':
      return [structuredRef, firstDescLine].filter(Boolean).join(' ');
    case '2':
      return [structuredRef, firstPayerLine, firstDescLine].filter(Boolean).join(' ');
    case '3':
      return [structuredRef, firstPayerLine].filter(Boolean).join(' ');
    case '4':
      return [structuredRef, fullDesc].filter(Boolean).join(' ');
    case '5':
      return [structuredRef, firstPayerLine, fullDesc].filter(Boolean).join(' ');
    default:
      return structuredRef;
  }
}

/**
 * Builds the official HUB-3 (PDF417) text payload according to Croatian Banking Association (HUB) v6 specification.
 */
export function buildHub3Payload(doc: Partial<PaymentDocument>): string {
  const amount = cleanAmount(doc.amount);
  const cents = Math.round(amount * 100);
  const centsStr = String(cents).padStart(15, '0');

  const [pName, pStreet, pCity] = parseAddressLines(doc.payer || '');
  const [rName, rStreet, rCity] = parseAddressLines(doc.recipient || '');
  const { model, pnb } = parseModelAndPnb(doc.pnb || '', doc.model || '');

  const iban = (doc.iban || '').replace(/\s+/g, '').toUpperCase().slice(0, 21);
  const purposeCode = (doc.purposeCode || '').trim().slice(0, 4).toUpperCase();
  const description = flattenMultiline(doc.description || '', ' ').slice(0, 35);

  const lines = [
    'HRVHUB30',
    'EUR',
    centsStr,
    pName.slice(0, 30),
    pStreet.slice(0, 27),
    pCity.slice(0, 27),
    rName.slice(0, 25),
    rStreet.slice(0, 25),
    rCity.slice(0, 27),
    iban,
    model.slice(0, 4),
    pnb.slice(0, 22),
    purposeCode,
    description,
  ];

  return lines.join('\n');
}

/**
 * Builds the EPC SEPA Credit Transfer QR code payload (EPC060-08 Standard)
 * with Revolut / international extension modes.
 */
export function buildSepaQrPayload(
  doc: Partial<PaymentDocument>,
  extensionMode: RevolutExtMode = '0',
  customExtension = ''
): { payload: string; structuredRef: string; unstructuredRef: string } {
  const amount = cleanAmount(doc.amount);
  const { model, pnb } = parseModelAndPnb(doc.pnb || '', doc.model || '');

  let baseStructuredRef = model && pnb ? `${model} ${pnb}` : (model || pnb);
  baseStructuredRef = baseStructuredRef.trim().slice(0, 35);

  const rawDesc = doc.description || '';
  const rawPayer = doc.payer || '';
  const sanitizedText = flattenMultiline(rawDesc, ', ');

  let finalStructuredRef = descExtender(extensionMode, baseStructuredRef, rawDesc, rawPayer);
  if (customExtension.trim()) {
    finalStructuredRef = `${finalStructuredRef} ${customExtension.trim()}`;
  }
  finalStructuredRef = finalStructuredRef.slice(0, 35);

  const unstructuredRef = (
    baseStructuredRef && sanitizedText
      ? `${baseStructuredRef}, ${sanitizedText}`
      : baseStructuredRef || sanitizedText
  ).slice(0, 140);

  const recipName = flattenMultiline(doc.recipient || '', ' ').slice(0, 70);
  const recipIban = (doc.iban || '').replace(/\s+/g, '').toUpperCase().slice(0, 34);
  const amountStr = amount > 0 ? `EUR${amount.toFixed(2)}` : '';
  const purposeCode = (doc.purposeCode || '').trim().slice(0, 4).toUpperCase();
  const payerInfo = flattenMultiline(doc.payer || '', ' ').slice(0, 70);

  const lines = [
    'BCD',
    '002',
    '1',
    'SCT',
    '', // BIC (optional)
    recipName,
    recipIban,
    amountStr,
    purposeCode,
    finalStructuredRef,
    unstructuredRef,
    payerInfo,
  ];

  return {
    payload: lines.join('\n'),
    structuredRef: finalStructuredRef,
    unstructuredRef,
  };
}

/**
 * Parses raw text from a scanned HUB-3 PDF417 barcode.
 */
export function parseScannedHub3(payload: string): Partial<PaymentDocument> | null {
  const lines = payload.split(/\r?\n/);
  if (!lines || lines.length < 10) return null;
  if (!lines[0].startsWith('HRVHUB30')) return null;

  const cents = parseInt(lines[2]?.trim() || '0', 10);
  const amount = isNaN(cents) ? 0 : cents / 100;

  const payerLines = [lines[3], lines[4], lines[5]].filter(Boolean).map(s => s.trim());
  const recipientLines = [lines[6], lines[7], lines[8]].filter(Boolean).map(s => s.trim());

  const iban = (lines[9] || '').trim();
  const model = (lines[10] || '').trim();
  const pnb = (lines[11] || '').trim();
  const purposeCode = (lines[12] || '').trim();
  const description = (lines[13] || '').trim();

  return {
    amount,
    payer: payerLines.join('\n'),
    recipient: recipientLines.join('\n'),
    iban,
    model: model || 'HR01',
    pnb,
    purposeCode,
    description,
    status: 'novo',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Parses raw text from a scanned SEPA EPC QR code.
 */
export function parseScannedSepaQr(payload: string): Partial<PaymentDocument> | null {
  const lines = payload.split(/\r?\n/);
  if (!lines || lines.length < 7) return null;
  if (!lines[0].startsWith('BCD') || lines[3] !== 'SCT') return null;

  const recipName = (lines[5] || '').trim();
  const iban = (lines[6] || '').trim();
  const amtStr = (lines[7] || '').replace('EUR', '').trim();
  const amount = cleanAmount(amtStr);
  const purposeCode = (lines[8] || '').trim();
  const refStructured = (lines[9] || '').trim();
  const refUnstructured = (lines[10] || '').trim();
  const payer = (lines[11] || '').trim();

  const { model, pnb } = parseModelAndPnb(refStructured);

  return {
    amount,
    recipient: recipName,
    iban,
    purposeCode,
    model: model || 'HR01',
    pnb: pnb || refStructured,
    description: refUnstructured || refStructured,
    payer,
    status: 'novo',
    updatedAt: new Date().toISOString(),
  };
}
