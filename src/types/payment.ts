export interface PaymentDocument {
  id: string;
  folder: string; // e.g. "Plin", "Komunalije i čistoća", "Struja", "Voda"
  filename: string; // e.g. "Račun 6_2026.pdf"
  code?: string;
  itemInside?: string;
  ourDescription: string; // "Opis (za nas)"
  dueDate: string; // "Dospijeće" e.g. "31/07/26"
  amount: number; // e.g. 14.83
  paymentDate?: string; // "datum uplate"
  status: 'placeno' | 'kasnjenje' | 'naplata' | 'novo' | 'cekanje';
  invoiceNumber?: string; // "racun br"
  model: string; // e.g. "HR01"
  pnb: string; // Poziv na broj, npr. "12345-67890-01"
  iban: string; // e.g. "HR7124020061100662212"
  recipient: string; // Multiline name and address
  payer: string; // Multiline name and address
  description: string; // Opis plaćanja
  purposeCode: string; // Šifra namjene e.g. "GASB", "WTER"
  isUrgent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RevolutExtMode = '0' | '1' | '2' | '3' | '4' | '5';

export interface PurposeCodeInfo {
  code: string;
  name: string;
  category: string;
  definition: string;
}

export interface ModelInfo {
  code: string;
  name: string;
  structure: string;
  description: string;
  details: string;
  controlModule?: string;
}
