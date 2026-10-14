import { PaymentDocument } from '../types/payment';
import { cleanAmount, parseModelAndPnb } from './paymentUtils';

/**
 * Parses raw CSV or TSV string, properly handling quoted multiline cells.
 */
export function parseDelimitedText(rawText: string): string[][] {
  const text = rawText.trim();
  if (!text) return [];

  // Determine delimiter: inspect first line
  const firstLine = text.split(/\r?\n/)[0] || '';
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  let delimiter = '\t';
  if (tabCount >= 2) {
    delimiter = '\t';
  } else if (semiCount > commaCount && semiCount >= 2) {
    delimiter = ';';
  } else if (commaCount >= 2) {
    delimiter = ',';
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function parseBatchData(rawText: string): {
  documents: PaymentDocument[];
  warnings: string[];
} {
  const rows = parseDelimitedText(rawText);
  const documents: PaymentDocument[] = [];
  const warnings: string[] = [];

  if (rows.length === 0) {
    return { documents, warnings: ['Tekst je prazan ili nema prepoznatljivih redaka.'] };
  }

  // Find header row or use index-based layout
  let headerRowIndex = -1;
  let headers: string[] = [];

  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const lowerRow = rows[r].map(c => c.toLowerCase());
    const hasKeyColumns = lowerRow.some(c =>
      c.includes('iban') || c.includes('primatelj') || c.includes('iznos') || c.includes('poziv')
    );
    if (hasKeyColumns) {
      headerRowIndex = r;
      headers = lowerRow;
      break;
    }
  }

  const getCol = (row: string[], colNames: string[], defaultIdx: number): string => {
    if (headers.length > 0) {
      for (const name of colNames) {
        const idx = headers.findIndex(h => h.includes(name));
        if (idx !== -1 && row[idx] !== undefined) {
          return row[idx];
        }
      }
    }
    return row[defaultIdx] || '';
  };

  const dataRows = headerRowIndex !== -1 ? rows.slice(headerRowIndex + 1) : rows;

  dataRows.forEach((row, i) => {
    // Skip empty lines or pure metadata rows (e.g. 'tekst\ttekst...')
    if (!row.some(Boolean)) return;
    if (row[0]?.toLowerCase() === 'tekst' && row[1]?.toLowerCase() === 'tekst') return;

    const folder = getCol(row, ['rezija', 'folder'], 0);
    const filename = getCol(row, ['filename', 'datoteka'], 1);
    const code = getCol(row, ['kod'], 2);
    const itemInside = getCol(row, ['stavka'], 3);
    const ourDescription = getCol(row, ['opis (za nas)', 'nas opis'], 4);
    const dueDate = getCol(row, ['dospijece', 'dospijeće'], 5);
    const rawAmount = getCol(row, ['iznos', 'cijena'], 6);
    const paymentDate = getCol(row, ['datum uplate'], 7);
    const rawStatus = getCol(row, ['status'], 8).toLowerCase();
    const invoiceNumber = getCol(row, ['racun br', 'račun br'], 9);
    const rawPnb = getCol(row, ['model i poziv', 'poziv na broj', 'pnb'], 10);
    const iban = getCol(row, ['iban'], 11).replace(/\s+/g, '').toUpperCase();
    const recip = getCol(row, ['primatelj'], 12);
    const payer = getCol(row, ['platitelj'], 13);
    const desc = getCol(row, ['opis placanja', 'opis plaćanja'], 14);
    const purpose = getCol(row, ['sifra namjene', 'šifra namjene', 'namjena'], 15);

    const amount = cleanAmount(rawAmount);

    if (!iban && !recip && amount <= 0) {
      warnings.push(`Redak ${i + 1}: Preskočen jer nema IBAN, primatelja niti iznos.`);
      return;
    }

    const { model, pnb } = parseModelAndPnb(rawPnb);

    let status: PaymentDocument['status'] = 'novo';
    if (rawStatus.includes('plac') || rawStatus.includes('paid')) status = 'placeno';
    else if (rawStatus.includes('kasn') || rawStatus.includes('overdue')) status = 'kasnjenje';
    else if (rawStatus.includes('naplata') || rawStatus.includes('charge')) status = 'naplata';
    else if (rawStatus.includes('cek') || rawStatus.includes('pend')) status = 'cekanje';

    const doc: PaymentDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      folder: folder || 'Opće',
      filename: filename || `Uplatnica_${i + 1}.pdf`,
      code,
      itemInside,
      ourDescription: ourDescription || filename || `Stavka ${i + 1}`,
      dueDate: dueDate || '',
      amount,
      paymentDate: paymentDate || '',
      status,
      invoiceNumber,
      model,
      pnb,
      iban,
      recipient: recip,
      payer: payer,
      description: desc,
      purposeCode: purpose.trim().slice(0, 4).toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    documents.push(doc);
  });

  return { documents, warnings };
}

/**
 * Exports documents to a TSV or CSV string matching the format.
 */
export function exportToDelimited(documents: PaymentDocument[], delimiter: '\t' | ';' | ',' = '\t'): string {
  const headers = [
    'Rezija (folder)',
    'Filename',
    'Kod (ako odvojen)',
    'Stavka unutar file',
    'Opis (za nas)',
    'Dospijece',
    'Iznos',
    'datum uplate (ako je rijeseno)',
    'status',
    'racun br',
    'model i poziv na broj',
    'iban',
    'primatelj',
    'platitelj',
    'opis placanja',
    'sifra namjene',
  ];

  const escapeCell = (str: string | number | undefined | null): string => {
    if (str === undefined || str === null) return '';
    const s = String(str);
    if (s.includes('"') || s.includes(delimiter) || s.includes('\n') || s.includes('\r')) {
      return `"${s.replaceAll('"', '""')}"`;
    }
    return s;
  };

  const rows: string[] = [headers.map(escapeCell).join(delimiter)];

  for (const doc of documents) {
    const formattedAmount = `${doc.amount.toFixed(2).replace('.', ',')} €`;
    const modelAndPnb = doc.model && doc.pnb ? `${doc.model} ${doc.pnb}` : (doc.model || doc.pnb || '');

    const row = [
      escapeCell(doc.folder),
      escapeCell(doc.filename),
      escapeCell(doc.code || ''),
      escapeCell(doc.itemInside || ''),
      escapeCell(doc.ourDescription),
      escapeCell(doc.dueDate),
      escapeCell(formattedAmount),
      escapeCell(doc.paymentDate || ''),
      escapeCell(doc.status),
      escapeCell(doc.invoiceNumber || ''),
      escapeCell(modelAndPnb),
      escapeCell(doc.iban),
      escapeCell(doc.recipient),
      escapeCell(doc.payer),
      escapeCell(doc.description),
      escapeCell(doc.purposeCode),
    ];

    rows.push(row.join(delimiter));
  }

  return rows.join('\n');
}
