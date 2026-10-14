#!/usr/bin/env python3
# sepa_qr_generator.py
# -*- coding: utf-8 -*-
# -*- mode: python; python-indent-offset: 4; indent-tabs-mode: nil -*-
# vim: set ft=python ts=4 sw=4 et:

"""
SEPA Credit Transfer QR Code Generator (EPC060-08 Standard).
Supports multi-line spreadsheet cell copy-pasting (Beneficiary, Payer, Remittance info).
Compatible with Revolut, Croatian HUB3/SEPA banking apps, and European banks.
"""

import re
import sys

try:
    import segno
except ImportError:
    segno = None

try:
    import qrcode
except ImportError:
    qrcode = None


def clean_amount(val_str: str) -> float:
    """
    Cleans and converts input amount string (e.g., 'EUR 45,90', '1.234,56 €') to float.
    """
    if not val_str:
        return 0.0

    s = val_str.strip()
    for symbol in ["EUR", "eur", "€", "kn", "HRK", " "]:
        s = s.replace(symbol, "")

    if not s:
        return 0.0

    # Convert European decimal formatting (e.g., 1.234,56 -> 1234.56)
    if "," in s and "." in s:
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "," in s:
        s = s.replace(",", ".")

    try:
        return float(s)
    except ValueError:
        return 0.0


def flatten_multiline(text: str, join_str: str = " ") -> str:
    """
    Splits multi-line text (e.g. pasted spreadsheet cells) into clean lines
    and joins them using join_str.
    """
    if not text:
        return ""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return join_str.join(lines)


def parse_model_and_pnb(raw_pnb: str, raw_model: str = "") -> tuple:
    """
    Parses Model (e.g., HR01) and Poziv na broj from combined pastes
    (e.g., 'HR01 06428010-246842337-1') or separate entries.
    """
    pnb = raw_pnb.strip()
    model = raw_model.strip()

    if pnb and not model:
        m = re.match(r"^(HR\d{2})\s*(.*)$", pnb, re.IGNORECASE)
        if m:
            model = m.group(1).upper()
            pnb = m.group(2).strip()
        elif re.match(r"^\d{2}\s+(.*)$", pnb):
            parts = pnb.split(maxsplit=1)
            model = f"HR{parts[0]}"
            pnb = parts[1].strip()

    if model and not model.startswith("HR") and model.isdigit():
        model = f"HR{model}"

    return model.upper(), pnb


def read_input(prompt: str, allow_multiline: bool = True, join_str: str = " ") -> str:
    """
    Prompts the user for input. Supports single-line input or multi-line cell pastes.
    Pressing Enter on an empty line finishes multi-line entry.
    """
    # todo: cleanup removal of quotes
    r = read_input_inner(prompt, allow_multiline, join_str).strip()
    if not r: return r
    if r[0] == '"': r = r[1:]
    if r[-1] == '"': r = r[:-1]
    return r.strip()

def read_input_inner(prompt: str, allow_multiline: bool = True, join_str: str = " ") -> str:
    print(f"\n{prompt}")
    if allow_multiline:
        print("  (Type or paste cell text; press Enter on a blank line when done)")
        lines = []
        while True:
            try:
                line = input(" > ").strip()
                if not line:
                    if lines:
                        break
                    else:
                        return ""
                lines.append(line)
            except (EOFError, KeyboardInterrupt):
                break
        return flatten_multiline("\n".join(lines), join_str=join_str)
    else:
        try:
            return input(" > ").strip()
        except (EOFError, KeyboardInterrupt):
            return ""


def build_raw_sepa_payload(
    name: str,
    iban: str,
    amount: float = 0.0,
    text: str = "",
    email_or_note: str = "",
    bic: str = "",
    purpose: str = "",
    model: str = "",
    poziv_na_broj: str = "",
    fallback_ref_in_unstructured: bool = True
) -> str:
    """
    Assembles the rigid 12-line EPC QR code payload (EPC060-08 standard).
    """
    # 1. Clean IBAN & BIC
    clean_iban = re.sub(r"\s+", "", iban).upper()[:34]
    clean_bic = re.sub(r"\s+", "", bic).upper()[:11]

    # 2. Beneficiary Name (Flatten multi-line cell pastes -> Max 70 chars)
    clean_name = flatten_multiline(name, join_str=" ")[:70]

    # 3. Format Amount (EURxx.xx)
    formatted_amount = f"EUR{amount:.2f}" if amount and amount > 0 else ""

    # 4. Purpose Code (e.g., WTER, RENT, OTHR)
    clean_purpose = re.sub(r"\s+", "", purpose).upper()[:4]

    # 5. Model + Poziv na broj (Structured Reference -> Max 35 chars)
    parsed_model, parsed_pnb = parse_model_and_pnb(poziv_na_broj, model)
    if parsed_model and parsed_pnb:
        structured_ref = f"{parsed_model} {parsed_pnb}"
    elif parsed_model or parsed_pnb:
        structured_ref = parsed_model or parsed_pnb
    else:
        structured_ref = ""
    structured_ref = structured_ref[:35]

    # 6. Unstructured Text (Line 11) & Revolut / Foreign App Compatibility
    clean_text = flatten_multiline(text, join_str=", ")

    if fallback_ref_in_unstructured and structured_ref:
        if clean_text:
            unstructured_ref = f"{structured_ref}, {clean_text}"
        else:
            unstructured_ref = structured_ref
    else:
        unstructured_ref = clean_text

    unstructured_ref = unstructured_ref[:140]

    # 7. Line 12 Note / Payer Info / Email (Max 70 chars)
    clean_info = flatten_multiline(email_or_note, join_str=" ")
    if clean_info and not clean_info.lower().startswith("email:") and "@" in clean_info:
        clean_info = f"Email: {clean_info}"
    clean_info = clean_info[:70]

    # Assemble rigid 12-line EPC payload
    lines = [
        "BCD",                 # 1: Service Tag
        "002",                 # 2: Version
        "1",                   # 3: Character set (UTF-8)
        "SCT",                 # 4: Identification
        clean_bic,             # 5: BIC
        clean_name,            # 6: Beneficiary Name
        clean_iban,            # 7: IBAN
        formatted_amount,      # 8: Amount
        clean_purpose,         # 9: Purpose code
        structured_ref,        # 10: Structured reference
        unstructured_ref,      # 11: Unstructured text
        clean_info             # 12: Information line / Note
    ]

    return "\n".join(lines)


def generate_qr_image(payload: str, filename: str = "sepa_payment_qr.png"):
    """
    Generates QR code PNG image using Segno or qrcode library.
    """
    if segno:
        # Generate with Error Correction Level M as per EPC guidelines
        qr = segno.make(payload, error='m')
        qr.save(filename, scale=6)
        print(f"\n[Success] SEPA QR code saved to '{filename}' (using Segno).")
    elif qrcode:
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
        qr.add_data(payload)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(filename)
        print(f"\n[Success] SEPA QR code saved to '{filename}' (using qrcode).")
    else:
        print("\n[Error] Neither 'segno' nor 'qrcode' module is installed.")
        print("Install either using: pip install segno OR pip install qrcode pillow")


if __name__ == "__main__":
    print("==========================================")
    print("      SEPA Credit Transfer QR Generator   ")
    print("==========================================")

    user_name = read_input("Enter Beneficiary Name (supports multi-line cell paste):", allow_multiline=True, join_str=" ")
    user_iban = read_input("Enter IBAN:", allow_multiline=False)
    user_bic = read_input("Enter BIC/SWIFT (optional):", allow_multiline=False)

    amount_raw = read_input("Enter Amount in EUR (e.g. 14.83 or leave blank):", allow_multiline=False)
    user_amount = clean_amount(amount_raw)

    user_pnb = read_input("Enter Model & Poziv na broj (e.g., HR01 0645062-360262155-260):", allow_multiline=True, join_str=" ")
    user_purpose = read_input("Enter Šifra namjene / Purpose Code (e.g., WTER, RENT, OTHR):", allow_multiline=False)

    user_text = read_input("Enter Remittance Text / Description / Invoice Info (supports multi-line cell paste):", allow_multiline=True, join_str=", ")
    user_payer = read_input("Enter Platitelj / Contact Email / Line 12 Note (optional):", allow_multiline=True, join_str=" ")

    output_filename = read_input("Enter output filename (default: sepa_input_qr.png):", allow_multiline=False)
    if not output_filename:
        output_filename = "sepa_input_qr.png"

    payload = build_raw_sepa_payload(
        name=user_name,
        iban=user_iban,
        amount=user_amount,
        text=user_text,
        email_or_note=user_payer,
        bic=user_bic,
        purpose=user_purpose,
        poziv_na_broj=user_pnb,
        fallback_ref_in_unstructured=True
    )

    print("\n--- Generated EPC Payload (12 Lines) ---")
    for idx, line in enumerate(payload.split("\n"), 1):
        print(f"Line {idx:2d}: {line}")

    generate_qr_image(payload, output_filename)
