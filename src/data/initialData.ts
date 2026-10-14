import { PaymentDocument } from '../types/payment';

/**
 * Clean default initial session: A single blank payment order.
 * No personal or sensitive data is included.
 */
export const INITIAL_DOCUMENTS: PaymentDocument[] = [
  {
    id: 'doc-blank-1',
    folder: 'Opće',
    filename: 'Nalog_1.pdf',
    ourDescription: 'Novi platni nalog',
    dueDate: '',
    amount: 0,
    status: 'novo',
    model: 'HR01',
    pnb: '',
    iban: '',
    recipient: '',
    payer: '',
    description: '',
    purposeCode: '',
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Fictional demonstration samples (populated ONLY on explicit demand by the user).
 * Uses strictly fictional names, addresses, and standard FINA specification examples.
 */
export const FICTIONAL_SAMPLE_DOCUMENTS: PaymentDocument[] = [
  {
    id: 'sample-doc-1',
    folder: 'Režije',
    filename: 'Primjer_Plin_Obracun.pdf',
    ourDescription: 'Ogledni račun - Plin (Fiktivni podaci)',
    dueDate: '15/11/26',
    amount: 24.50,
    status: 'novo',
    invoiceNumber: 'RAČ-2026-99001',
    model: 'HR01',
    pnb: '99001-12345678-01',
    iban: 'HR1210010051863000160',
    recipient: 'GRADSKA PLINARA PRIMJER d.o.o.\nRadnička cesta 1\n10000 Zagreb',
    payer: 'PETAR HORVAT\nIlica 100\n10000 Zagreb',
    description: 'Obračun potrošnje plina za ogledno razdoblje',
    purposeCode: 'GASB',
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-doc-2',
    folder: 'Režije',
    filename: 'Primjer_Struja_Rata.pdf',
    ourDescription: 'Ogledni račun - Struja (Fiktivni podaci)',
    dueDate: '20/11/26',
    amount: 38.20,
    status: 'novo',
    invoiceNumber: 'RAČ-2026-99002',
    model: 'HR00',
    pnb: '1000223344-9988-1',
    iban: 'HR9223400091510000000',
    recipient: 'ELEKTRA PRIMJER d.o.o.\nUlica grada Vukovara 10\n10000 Zagreb',
    payer: 'PETAR HORVAT\nIlica 100\n10000 Zagreb',
    description: 'Akontacijska rata električne energije',
    purposeCode: 'ELEC',
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-doc-3',
    folder: 'Režije',
    filename: 'Primjer_Voda.pdf',
    ourDescription: 'Ogledni račun - Voda (Fiktivni podaci)',
    dueDate: '25/11/26',
    amount: 12.80,
    status: 'novo',
    invoiceNumber: 'RAČ-2026-99003',
    model: 'HR01',
    pnb: '120045-998877-04',
    iban: 'HR9823600001500000000',
    recipient: 'VODOOPSKRBA PRIMJER d.o.o.\nFolnegovićeva 1\n10000 Zagreb',
    payer: 'PETAR HORVAT\nIlica 100\n10000 Zagreb',
    description: 'Vodoopskrba i odvodnja - ogledni primjer',
    purposeCode: 'WTER',
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
