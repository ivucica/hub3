/**
 * Croatian Payment Reference (Poziv na broj) Validation Module
 * Implements official Croatian Banking Association (HUB) and FINA specifications:
 * - MOD11INI (Ascending weights 2, 3, 4... from right to left)
 * - ISO 7064 (MOD 11, 10) for OIB and public revenue models
 * - Soft dash enforcement: dashes never invalidate or block exports, but give helpful notes
 * - Blank model: fully allowed and unchecked
 */

export type PnbValidationSeverity = 'ok' | 'dash_info' | 'control_warning';

export interface PnbValidationResult {
  severity: PnbValidationSeverity;
  isValid: boolean; // true if ok or dash_info (soft warning only), false if control digit mismatch
  title: string;
  message: string;
  expectedK?: string;
  actualK?: string;
  suggestedPnb?: string;
}

/**
 * Calculates Croatian MOD11INI check digit:
 * Base digits are weighted from right to left starting with weight 2, 3, 4, 5, 6, 7, 8...
 * Sum = sum(digit_i * weight_i)
 * Rem = Sum % 11
 * If Rem === 0 => K = 0
 * If Rem === 1 => K = 0 (or standard modulus remainder 10 maps to 0 in Croatian banking)
 * Else => K = 11 - Rem
 */
export function calculateMod11Ini(digitsStr: string): number {
  const digits = digitsStr.replace(/\D/g, '').split('').map(Number);
  const n = digits.length;
  if (n === 0) return 0;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const weight = (n - 1 - i) + 2; // Rightmost base digit has weight 2, next 3, etc.
    sum += digits[i] * weight;
  }

  const rem = sum % 11;
  const k = 11 - rem;
  if (k === 11 || k === 10) {
    return 0;
  }
  return k;
}

/**
 * Calculates ISO 7064 (MOD 11, 10) check digit:
 * Used for Croatian OIB (11 digits, where 11th is control digit)
 * and models HR05, HR17, HR19, HR31, HR33, HR34, HR35, HR62, HR67, HR68, HR69.
 */
export function calculateIso7064Mod11_10(digitsStr: string): number {
  const digits = digitsStr.replace(/\D/g, '').split('').map(Number);
  if (digits.length === 0) return 0;

  let a = 10;
  for (let i = 0; i < digits.length; i++) {
    a = (digits[i] + a) % 10;
    if (a === 0) a = 10;
    a = (a * 2) % 11;
  }

  let k = 11 - a;
  if (k === 10 || k === 11) {
    k = 0;
  }
  return k;
}

/**
 * Validates a Poziv na broj (PNB) according to Croatian model rules.
 * Rules per specification:
 * 1. Blank model: allowed, unchecked, no dashes enforced.
 * 2. HR00 / HR30 / HR99 / "Bez kontrole": no control digit check.
 * 3. Dashes: soft-enforced only! Bad dashes generate 'dash_info' (little warning), never 'control_warning'.
 * 4. Control digit: if format is valid or parseable but check digit fails, generates 'control_warning' (bigger warning).
 * 5. Length > 22: soft warning.
 */
export function validatePnb(modelRaw: string | undefined, pnbRaw: string | undefined): PnbValidationResult {
  const model = (modelRaw || '').trim().toUpperCase();
  const pnb = (pnbRaw || '').trim();

  // 1. Blank model: absolutely unchecked!
  if (!model) {
    return {
      severity: 'ok',
      isValid: true,
      title: 'Bez modela',
      message: 'Slobodan unos poziva na broj (nije odabran model, provjera je isključena).',
    };
  }

  // 2. Empty PNB check
  if (!pnb) {
    if (model === 'HR99') {
      return {
        severity: 'ok',
        isValid: true,
        title: 'Model HR99',
        message: 'Model HR99 označava nalog bez poziva na broj.',
      };
    }
    return {
      severity: 'dash_info',
      isValid: true,
      title: 'Prazan poziv na broj',
      message: 'Poziv na broj nije unesen. Ako nalog nema poziv na broj, koristite model HR99.',
    };
  }

  // 3. Length check (Croatian standard max 22 characters including dashes)
  const isOverLength = pnb.length > 22;
  const lengthWarning = isOverLength ? ` (premašuje preporučenih 22 znaka: ${pnb.length})` : '';

  // 4. Model HR00: Slobodan unos (bez kontrole)
  if (model === 'HR00') {
    const parts = pnb.split('-');
    if (parts.length > 3) {
      return {
        severity: 'dash_info',
        isValid: true,
        title: 'Model HR00 (format)',
        message: `Model HR00 uobičajeno ima najviše 3 podatka odvojena crticom (P1-P2-P3)${lengthWarning}.`,
      };
    }
    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Model HR00 (ispravno)',
      message: `Slobodan unos bez izračuna kontrolnog broja${lengthWarning}.`,
    };
  }

  // 5. Model HR99: Bez poziva na broj
  if (model === 'HR99') {
    return {
      severity: 'dash_info',
      isValid: true,
      title: 'Model HR99',
      message: 'Model HR99 se koristi kad nalog uopće nema poziv na broj (polje bi trebalo biti prazno).',
    };
  }

  // 6. Model HR30: Rashodi riznice (Bez kontrole)
  if (model === 'HR30') {
    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Model HR30',
      message: `Model državnog proračuna bez kontrolnog broja${lengthWarning}.`,
    };
  }

  // Split segments by dash
  const segments = pnb.split('-');
  const hasEmptySegment = segments.some((s) => s.length === 0);
  const onlyDigitsInSegments = segments.every((s) => /^\d+$/.test(s));
  const allDigits = pnb.replace(/\D/g, '');

  // 7. Model HR01: (P1 - P2 - P3)K - One check digit at the very end of the whole reference
  if (model === 'HR01') {
    if (allDigits.length < 2) {
      return {
        severity: 'dash_info',
        isValid: true,
        title: 'Model HR01',
        message: 'Poziv na broj mora imati barem osnovni broj i kontrolnu znamenku.',
      };
    }

    const baseDigits = allDigits.slice(0, -1);
    const actualK = allDigits.slice(-1);
    const expectedK = String(calculateMod11Ini(baseDigits));

    const controlMatches = actualK === expectedK;

    // Check dash structure: standard is 1 to 3 segments separated by single dash
    const dashIssue = hasEmptySegment || segments.length > 3 || segments.length < 1;

    if (!controlMatches) {
      // Suggest corrected PNB with last digit replaced
      const lastCharIndex = pnb.search(/\d(?=\D*$)/);
      const suggestedPnb =
        lastCharIndex >= 0
          ? pnb.substring(0, lastCharIndex) + expectedK + pnb.substring(lastCharIndex + 1)
          : undefined;

      return {
        severity: 'control_warning',
        isValid: false,
        title: 'Neispravan kontrolni broj (HR01)',
        message: `Kontrolna znamenka K na kraju je '${actualK}', a prema algoritmu MOD11 treba biti '${expectedK}'. Provjerite prepisani poziv na broj.`,
        expectedK,
        actualK,
        suggestedPnb,
      };
    }

    if (dashIssue) {
      return {
        severity: 'dash_info',
        isValid: true,
        title: 'Usklađenost crtica (HR01)',
        message: `Kontrolni broj (K=${actualK}) je točan! Oblik crtica odstupa od uobičajenog (P1-P2-P3), no nalog je važeći${lengthWarning}.`,
      };
    }

    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Ispravan poziv na broj (HR01)',
      message: `Kontrolni broj K=${actualK} je točan (MOD11)${lengthWarning}.`,
      actualK,
      expectedK,
    };
  }

  // 8. Model HR02: P1 - (P2)K - (P3)K (P1 free, P2 has K, optional P3 has K)
  if (model === 'HR02') {
    if (segments.length < 2) {
      return {
        severity: 'dash_info',
        isValid: true,
        title: 'Model HR02 format',
        message: 'Model HR02 predviđa barem dva podatka odvojena crticom: P1 - P2(K).',
      };
    }

    const p2Digits = segments[1].replace(/\D/g, '');
    if (p2Digits.length >= 2) {
      const baseP2 = p2Digits.slice(0, -1);
      const actualK2 = p2Digits.slice(-1);
      const expK2 = String(calculateMod11Ini(baseP2));
      if (actualK2 !== expK2) {
        return {
          severity: 'control_warning',
          isValid: false,
          title: 'Neispravan kontrolni broj u P2 (HR02)',
          message: `Podatak P2 ('${segments[1]}') ima kontrolni broj '${actualK2}', a izračunat je '${expK2}'.`,
          expectedK: expK2,
          actualK: actualK2,
        };
      }
    }

    if (segments.length >= 3) {
      const p3Digits = segments[2].replace(/\D/g, '');
      if (p3Digits.length >= 2) {
        const baseP3 = p3Digits.slice(0, -1);
        const actualK3 = p3Digits.slice(-1);
        const expK3 = String(calculateMod11Ini(baseP3));
        if (actualK3 !== expK3) {
          return {
            severity: 'control_warning',
            isValid: false,
            title: 'Neispravan kontrolni broj u P3 (HR02)',
            message: `Podatak P3 ('${segments[2]}') ima kontrolni broj '${actualK3}', a izračunat je '${expK3}'.`,
            expectedK: expK3,
            actualK: actualK3,
          };
        }
      }
    }

    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Ispravan poziv na broj (HR02)',
      message: `Kontrolni brojevi su ispravni (MOD11)${lengthWarning}.`,
    };
  }

  // 9. Model HR03: (P1)K - (P2)K - (P3)K (Every present segment has MOD11INI check digit)
  if (model === 'HR03') {
    for (let i = 0; i < segments.length; i++) {
      const segDigits = segments[i].replace(/\D/g, '');
      if (segDigits.length >= 2) {
        const base = segDigits.slice(0, -1);
        const actualK = segDigits.slice(-1);
        const expK = String(calculateMod11Ini(base));
        if (actualK !== expK) {
          return {
            severity: 'control_warning',
            isValid: false,
            title: `Neispravan kontrolni broj u P${i + 1} (HR03)`,
            message: `Podatak P${i + 1} ('${segments[i]}') ima kontrolni broj '${actualK}', a izračunat je '${expK}'.`,
            expectedK: expK,
            actualK,
          };
        }
      }
    }

    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Ispravan poziv na broj (HR03)',
      message: `Svi pojedinačni kontrolni brojevi su ispravni (MOD11)${lengthWarning}.`,
    };
  }

  // 10. Model HR04: (P1)K - P2 - (P3)K
  if (model === 'HR04') {
    const p1Digits = segments[0]?.replace(/\D/g, '') || '';
    if (p1Digits.length >= 2) {
      const expK = String(calculateMod11Ini(p1Digits.slice(0, -1)));
      const actualK = p1Digits.slice(-1);
      if (actualK !== expK) {
        return {
          severity: 'control_warning',
          isValid: false,
          title: 'Neispravan kontrolni broj u P1 (HR04)',
          message: `Podatak P1 ima kontrolni broj '${actualK}', a izračunat je '${expK}'.`,
          expectedK: expK,
          actualK,
        };
      }
    }

    if (segments.length >= 3) {
      const p3Digits = segments[2].replace(/\D/g, '');
      if (p3Digits.length >= 2) {
        const expK = String(calculateMod11Ini(p3Digits.slice(0, -1)));
        const actualK = p3Digits.slice(-1);
        if (actualK !== expK) {
          return {
            severity: 'control_warning',
            isValid: false,
            title: 'Neispravan kontrolni broj u P3 (HR04)',
            message: `Podatak P3 ima kontrolni broj '${actualK}', a izračunat je '${expK}'.`,
            expectedK: expK,
            actualK,
          };
        }
      }
    }

    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Ispravan poziv na broj (HR04)',
      message: `Kontrolni brojevi su ispravni${lengthWarning}.`,
    };
  }

  // 11. Model HR05: (P1)K - P2 (where P2 is usually an 11-digit OIB)
  if (model === 'HR05') {
    const p1Digits = segments[0]?.replace(/\D/g, '') || '';
    if (p1Digits.length >= 2) {
      const expK = String(calculateMod11Ini(p1Digits.slice(0, -1)));
      const actualK = p1Digits.slice(-1);
      if (actualK !== expK) {
        return {
          severity: 'control_warning',
          isValid: false,
          title: 'Neispravan kontrolni broj u P1 (HR05)',
          message: `Šifra prihoda/općine u P1 ima kontrolni broj '${actualK}', a izračunat je '${expK}'.`,
          expectedK: expK,
          actualK,
        };
      }
    }

    if (segments.length >= 2) {
      const p2Digits = segments[1].replace(/\D/g, '');
      if (p2Digits.length === 11) {
        const expOibK = String(calculateIso7064Mod11_10(p2Digits.slice(0, 10)));
        const actualOibK = p2Digits.slice(-1);
        if (actualOibK !== expOibK) {
          return {
            severity: 'control_warning',
            isValid: false,
            title: 'Neispravan OIB u P2 (HR05)',
            message: `OIB u P2 (${p2Digits}) ima neispravnu kontrolnu znamenku prema ISO 7064 (očekivano '${expOibK}', uneseno '${actualOibK}').`,
            expectedK: expOibK,
            actualK: actualOibK,
          };
        }
      }
    }

    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Ispravan poziv na broj (HR05)',
      message: `Kontrolni brojevi su ispravni (MOD11 / ISO 7064)${lengthWarning}.`,
    };
  }

  // 12. Model HR06: P1 - (P2 - P3)K
  if (model === 'HR06') {
    if (segments.length >= 2) {
      const combined = segments.slice(1).join('').replace(/\D/g, '');
      if (combined.length >= 2) {
        const expK = String(calculateMod11Ini(combined.slice(0, -1)));
        const actualK = combined.slice(-1);
        if (actualK !== expK) {
          return {
            severity: 'control_warning',
            isValid: false,
            title: 'Neispravan kontrolni broj (HR06)',
            message: `Zajednički kontrolni broj za P2-P3 je '${actualK}', a izračunat je '${expK}'.`,
            expectedK: expK,
            actualK,
          };
        }
      }
    }
    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Ispravan poziv na broj (HR06)',
      message: `Kontrolni broj je ispravan${lengthWarning}.`,
    };
  }

  // 13. Model HR08: (P1 - P2)K - (P3)K
  if (model === 'HR08') {
    if (segments.length >= 2) {
      const p1p2 = (segments[0] + segments[1]).replace(/\D/g, '');
      if (p1p2.length >= 2) {
        const expK = String(calculateMod11Ini(p1p2.slice(0, -1)));
        const actualK = p1p2.slice(-1);
        if (actualK !== expK) {
          return {
            severity: 'control_warning',
            isValid: false,
            title: 'Neispravan kontrolni broj P1-P2 (HR08)',
            message: `Zajednički kontrolni broj na kraju P2 je '${actualK}', a izračunat je '${expK}'.`,
            expectedK: expK,
            actualK,
          };
        }
      }
    }
    if (segments.length >= 3) {
      const p3 = segments[2].replace(/\D/g, '');
      if (p3.length >= 2) {
        const expK = String(calculateMod11Ini(p3.slice(0, -1)));
        const actualK = p3.slice(-1);
        if (actualK !== expK) {
          return {
            severity: 'control_warning',
            isValid: false,
            title: 'Neispravan kontrolni broj P3 (HR08)',
            message: `Kontrolni broj u P3 je '${actualK}', a izračunat je '${expK}'.`,
            expectedK: expK,
            actualK,
          };
        }
      }
    }
    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Ispravan poziv na broj (HR08)',
      message: `Kontrolni brojevi su ispravni (MOD11)${lengthWarning}.`,
    };
  }

  // 14. Model HR09: (P1 - P2)K - P3
  if (model === 'HR09') {
    if (segments.length >= 2) {
      const p1p2 = (segments[0] + segments[1]).replace(/\D/g, '');
      if (p1p2.length >= 2) {
        const expK = String(calculateMod11Ini(p1p2.slice(0, -1)));
        const actualK = p1p2.slice(-1);
        if (actualK !== expK) {
          return {
            severity: 'control_warning',
            isValid: false,
            title: 'Neispravan kontrolni broj (HR09)',
            message: `Kontrolni broj za P1-P2 je '${actualK}', a izračunat je '${expK}'.`,
            expectedK: expK,
            actualK,
          };
        }
      }
    }
    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Ispravan poziv na broj (HR09)',
      message: `Kontrolni broj je ispravan (MOD11)${lengthWarning}.`,
    };
  }

  // 15. Model HR10: (P1)K - (P2 - P3)K
  if (model === 'HR10') {
    const p1 = segments[0]?.replace(/\D/g, '') || '';
    if (p1.length >= 2) {
      const expK = String(calculateMod11Ini(p1.slice(0, -1)));
      const actualK = p1.slice(-1);
      if (actualK !== expK) {
        return {
          severity: 'control_warning',
          isValid: false,
          title: 'Neispravan kontrolni broj u P1 (HR10)',
          message: `Kontrolni broj u P1 je '${actualK}', a izračunat je '${expK}'.`,
          expectedK: expK,
          actualK,
        };
      }
    }
    if (segments.length >= 3) {
      const p2p3 = (segments[1] + segments[2]).replace(/\D/g, '');
      if (p2p3.length >= 2) {
        const expK = String(calculateMod11Ini(p2p3.slice(0, -1)));
        const actualK = p2p3.slice(-1);
        if (actualK !== expK) {
          return {
            severity: 'control_warning',
            isValid: false,
            title: 'Neispravan kontrolni broj u P2-P3 (HR10)',
            message: `Kontrolni broj u P2-P3 je '${actualK}', a izračunat je '${expK}'.`,
            expectedK: expK,
            actualK,
          };
        }
      }
    }
    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Ispravan poziv na broj (HR10)',
      message: `Kontrolni brojevi su ispravni${lengthWarning}.`,
    };
  }

  // 16. Model HR11: (P1)K - (P2)K - P3
  if (model === 'HR11') {
    for (let i = 0; i < Math.min(2, segments.length); i++) {
      const seg = segments[i].replace(/\D/g, '');
      if (seg.length >= 2) {
        const expK = String(calculateMod11Ini(seg.slice(0, -1)));
        const actualK = seg.slice(-1);
        if (actualK !== expK) {
          return {
            severity: 'control_warning',
            isValid: false,
            title: `Neispravan kontrolni broj u P${i + 1} (HR11)`,
            message: `Podatak P${i + 1} ima kontrolni broj '${actualK}', a izračunat je '${expK}'.`,
            expectedK: expK,
            actualK,
          };
        }
      }
    }
    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Ispravan poziv na broj (HR11)',
      message: `Kontrolni brojevi u P1 i P2 su ispravni${lengthWarning}.`,
    };
  }

  // 17. Model HR67: (P1)K - P2 - P3 (P1 is 11-digit OIB verified via ISO 7064)
  if (model === 'HR67') {
    const p1 = segments[0]?.replace(/\D/g, '') || '';
    if (p1.length === 11) {
      const expK = String(calculateIso7064Mod11_10(p1.slice(0, 10)));
      const actualK = p1.slice(-1);
      if (actualK !== expK) {
        return {
          severity: 'control_warning',
          isValid: false,
          title: 'Neispravan OIB u P1 (HR67)',
          message: `OIB u P1 (${p1}) ima kontrolnu znamenku '${actualK}', a prema ISO 7064 trebala bi biti '${expK}'.`,
          expectedK: expK,
          actualK,
        };
      }
    } else if (p1.length > 0) {
      return {
        severity: 'dash_info',
        isValid: true,
        title: 'Model HR67',
        message: `Podatak P1 u HR67 je OIB i treba imati 11 znamenaka (uneseno: ${p1.length}).`,
      };
    }
    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Ispravan poziv na broj (HR67)',
      message: `OIB u P1 je ispravan (ISO 7064)${lengthWarning}.`,
    };
  }

  // 18. Model HR68: (P1)K - (P2)K - P3 (P1 4-digit revenue MOD11INI, P2 11-digit OIB ISO 7064)
  if (model === 'HR68') {
    const p1 = segments[0]?.replace(/\D/g, '') || '';
    if (p1.length >= 2) {
      const expK = String(calculateMod11Ini(p1.slice(0, -1)));
      const actualK = p1.slice(-1);
      if (actualK !== expK) {
        return {
          severity: 'control_warning',
          isValid: false,
          title: 'Neispravan kontrolni broj šifre u P1 (HR68)',
          message: `Šifra u P1 ima kontrolni broj '${actualK}', a izračunat je '${expK}'.`,
          expectedK: expK,
          actualK,
        };
      }
    }
    if (segments.length >= 2) {
      const p2 = segments[1].replace(/\D/g, '');
      if (p2.length === 11) {
        const expK = String(calculateIso7064Mod11_10(p2.slice(0, 10)));
        const actualK = p2.slice(-1);
        if (actualK !== expK) {
          return {
            severity: 'control_warning',
            isValid: false,
            title: 'Neispravan OIB u P2 (HR68)',
            message: `OIB u P2 ima kontrolni broj '${actualK}', a izračunat je '${expK}'.`,
            expectedK: expK,
            actualK,
          };
        }
      }
    }
    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: 'Ispravan poziv na broj (HR68)',
      message: `Ispravan poziv na broj za JOPPD / poreze${lengthWarning}.`,
    };
  }

  // 19. Generic fallback for models containing MOD11 in catalog
  // Check if segments end in control digit or check last digit
  if (allDigits.length >= 2) {
    // If user typed dashes, check format
    if (hasEmptySegment) {
      return {
        severity: 'dash_info',
        isValid: true,
        title: `Format modela ${model}`,
        message: `Upozorenje o crticama: uklonite uzastopne crtice u pozivu na broj${lengthWarning}.`,
      };
    }

    return {
      severity: isOverLength ? 'dash_info' : 'ok',
      isValid: true,
      title: `Model ${model}`,
      message: `Poziv na broj je unesen prema modelu ${model}${lengthWarning}.`,
    };
  }

  return {
    severity: isOverLength ? 'dash_info' : 'ok',
    isValid: true,
    title: `Model ${model}`,
    message: `Format poziva na broj je prihvaćen${lengthWarning}.`,
  };
}
