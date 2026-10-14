import { PaymentDocument } from '../types/payment';
import { INITIAL_DOCUMENTS } from '../data/initialData';

const STORAGE_KEY = 'hub3_sepa_session_v3';
const ACTIVE_DOC_ID_KEY = 'hub3_sepa_active_doc_id_v3';

export interface SessionData {
  version: number;
  appName: string;
  savedAt: string;
  activeDocId: string;
  documents: PaymentDocument[];
}

export function loadStoredSession(): { documents: PaymentDocument[]; activeDocId: string } {
  try {
    // Universally purge any previous session storage keys from earlier builds
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('hub3_sepa_session_v1') || key.startsWith('hub3_sepa_session_v2') || key === 'hub3_sepa_active_doc_id')) {
        localStorage.removeItem(key);
      }
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const storedActiveId = localStorage.getItem(ACTIVE_DOC_ID_KEY) || parsed[0].id;
        return { documents: parsed, activeDocId: storedActiveId };
      }
      if (parsed?.documents && Array.isArray(parsed.documents) && parsed.documents.length > 0) {
        return {
          documents: parsed.documents,
          activeDocId: parsed.activeDocId || parsed.documents[0].id,
        };
      }
    }
  } catch (err) {
    console.error('Failed to load local storage session:', err);
  }

  // Fallback to initial clean blank template
  return {
    documents: INITIAL_DOCUMENTS,
    activeDocId: INITIAL_DOCUMENTS[0].id,
  };
}

export function saveSessionToStorage(documents: PaymentDocument[], activeDocId: string): void {
  try {
    const session: SessionData = {
      version: 1,
      appName: 'HUB3-SEPA-PaymentManager',
      savedAt: new Date().toISOString(),
      activeDocId,
      documents,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem(ACTIVE_DOC_ID_KEY, activeDocId);
  } catch (err) {
    console.error('Failed to save session to local storage:', err);
  }
}

export function exportSessionToJson(documents: PaymentDocument[], activeDocId: string): void {
  const session: SessionData = {
    version: 1,
    appName: 'HUB3-SEPA-PaymentManager',
    savedAt: new Date().toISOString(),
    activeDocId,
    documents,
  };

  const jsonStr = JSON.stringify(session, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `hub3_sepa_sesija_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportedJson(jsonText: string): {
  documents: PaymentDocument[];
  activeDocId?: string;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonText);
    if (Array.isArray(data)) {
      if (data.length === 0) return { documents: [], error: 'JSON niz dokumenata je prazan.' };
      return { documents: data, activeDocId: data[0].id };
    }
    if (data && Array.isArray(data.documents)) {
      if (data.documents.length === 0) return { documents: [], error: 'Uvezena sesija ne sadrži dokumente.' };
      return { documents: data.documents, activeDocId: data.activeDocId || data.documents[0].id };
    }
    return { documents: [], error: 'Neispravna struktura JSON datoteke.' };
  } catch (err) {
    return { documents: [], error: `Greška pri čitanju JSON-a: ${(err as Error).message}` };
  }
}
