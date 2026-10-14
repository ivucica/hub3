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
 * Corrects Latin-1 / Windows-1252 / CP437 mojibake where UTF-8 encoded Croatian diacritics
 * (Č, č, Ć, ć, Đ, đ, Š, š, Ž, ž) were misinterpreted during PDF417 or QR decoding.
 * e.g. "RAÄŒUN" -> "RAČUN", "FOLNEGOVIÄ†A" -> "FOLNEGOVIĆA"
 */
export function fixMojibakeUtf8(str: string): string {
  if (!str) return '';

  // 1. Direct targeted replacement for Croatian diacritics in Latin-1 / Win-1252
  let text = str
    .replace(/ÄŒ/g, 'Č')
    .replace(/Ä\u008c/g, 'Č')
    .replace(/Ä\u008d/g, 'č')
    .replace(/Ä†/g, 'Ć')
    .replace(/Ä\u0086/g, 'Ć')
    .replace(/Ä‡/g, 'ć')
    .replace(/Ä\u0087/g, 'ć')
    .replace(/Ä\u0090/g, 'Đ')
    .replace(/Ä‘/g, 'đ')
    .replace(/Ä\u0091/g, 'đ')
    .replace(/Å\u00a0/g, 'Š')
    .replace(/Å /g, 'Š')
    .replace(/Å¡/g, 'š')
    .replace(/Å\u00a1/g, 'š')
    .replace(/Å½/g, 'Ž')
    .replace(/Å\u00bd/g, 'Ž')
    .replace(/Å¾/g, 'ž')
    .replace(/Å\u00be/g, 'ž');

  // 2. Binary byte re-interpretation if other characters still contain mojibake sequences
  if (/Ä|Å|Ã/.test(text)) {
    try {
      const win1252Map: Record<number, number> = {
        0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
        0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
        0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
        0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
        0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
        0x017e: 0x9e, 0x0178: 0x9f,
      };

      const bytes: number[] = [];
      let valid = true;
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code <= 0xff) {
          bytes.push(code);
        } else if (win1252Map[code] !== undefined) {
          bytes.push(win1252Map[code]);
        } else {
          valid = false;
          break;
        }
      }

      if (valid && bytes.length > 0) {
        const decoded = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
        return decoded;
      }
    } catch {
      // Fallback: keep string with replacements applied
    }
  }

  return text;
}

/**
 * Parses raw text from a scanned HUB-3 PDF417 barcode.
 */
export function parseScannedHub3(rawPayload: string): Partial<PaymentDocument> | null {
  const payload = fixMojibakeUtf8(rawPayload);
  const lines = payload.split(/\r?\n/);
  if (!lines || lines.length < 10) return null;
  if (!lines[0].startsWith('HRVHUB30')) return null;

  const cents = parseInt(lines[2]?.trim() || '0', 10);
  const amount = isNaN(cents) ? 0 : cents / 100;

  const payerLines = [lines[3], lines[4], lines[5]]
    .filter(Boolean)
    .map(s => fixMojibakeUtf8(s.trim()));
  const recipientLines = [lines[6], lines[7], lines[8]]
    .filter(Boolean)
    .map(s => fixMojibakeUtf8(s.trim()));

  const iban = (lines[9] || '').trim();
  const model = (lines[10] || '').trim();
  const pnb = (lines[11] || '').trim();
  const purposeCode = (lines[12] || '').trim();
  const description = fixMojibakeUtf8((lines[13] || '').trim());

  return {
    amount,
    payer: payerLines.join('\n'),
    recipient: recipientLines.join('\n'),
    iban,
    model: model || 'HR01',
    pnb,
    purposeCode,
    description,
    status: 'cekanje',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Parses raw text from a scanned SEPA EPC QR code.
 */
export function parseScannedSepaQr(rawPayload: string): Partial<PaymentDocument> | null {
  const payload = fixMojibakeUtf8(rawPayload);
  const lines = payload.split(/\r?\n/);
  if (!lines || lines.length < 7) return null;
  if (!lines[0].startsWith('BCD') || lines[3] !== 'SCT') return null;

  const recipName = fixMojibakeUtf8((lines[5] || '').trim());
  const iban = (lines[6] || '').trim();
  const amtStr = (lines[7] || '').replace('EUR', '').trim();
  const amount = cleanAmount(amtStr);
  const purposeCode = (lines[8] || '').trim();
  const refStructured = (lines[9] || '').trim();
  const refUnstructured = fixMojibakeUtf8((lines[10] || '').trim());
  const payer = fixMojibakeUtf8((lines[11] || '').trim());

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
    status: 'cekanje',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Parses common Croatian date formats (DD/MM/YY, DD/MM/YYYY, DD.MM.YYYY., YYYY-MM-DD).
 */
export function parseDateString(dateStr: string | undefined): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const s = dateStr.trim().replace(/\.$/, '');

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  const slashParts = s.split('/');
  if (slashParts.length === 3) {
    const day = parseInt(slashParts[0], 10);
    const month = parseInt(slashParts[1], 10) - 1;
    let year = parseInt(slashParts[2], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const dotParts = s.split('.');
  if (dotParts.length >= 3) {
    const day = parseInt(dotParts[0], 10);
    const month = parseInt(dotParts[1], 10) - 1;
    let year = parseInt(dotParts[2], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Derives payment status based on business rules:
 * - placeno = datum uplate (paymentDate) je unesen
 * - kasnjenje = datum dospijeća je prošao
 * - naplata = preostalo manje od 14 dana do dospijeća
 * - cekanje = više od 14 dana do dospijeća
 */
export function computeDerivedStatus(
  dueDateStr: string | undefined,
  paymentDateStr: string | undefined,
  currentDate = new Date()
): { status: PaymentDocument['status']; reason: string; diffDays?: number } {
  if (paymentDateStr && paymentDateStr.trim()) {
    return { status: 'placeno', reason: `Plaćeno (${paymentDateStr.trim()})` };
  }

  const dueDate = parseDateString(dueDateStr);
  if (!dueDate) {
    return { status: 'cekanje', reason: 'Bez datuma dospijeća' };
  }

  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'kasnjenje',
      reason: `Kasni ${Math.abs(diffDays)} d.`,
      diffDays,
    };
  } else if (diffDays <= 14) {
    return {
      status: 'naplata',
      reason: `Dospijeva za ${diffDays} d.`,
      diffDays,
    };
  } else {
    return {
      status: 'cekanje',
      reason: `Čekanje (${diffDays} d. do roka)`,
      diffDays,
    };
  }
}

