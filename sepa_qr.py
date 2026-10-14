#!/usr/bin/env python3
# sepa_qr_generator.py
# -*- coding: utf-8 -*-
# -*- mode: python; python-indent-offset: 4; indent-tabs-mode: nil -*-
# vim: set ft=python ts=4 sw=4 et:

"""
SEPA Credit Transfer QR Code Generator (EPC060-08 Standard).
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


def read_multiline_input(prompt: str) -> str:
    """
    Reads single or multi-line input row-by-row.
    Stops when an empty line is submitted (or press Enter on blank).
    Joins multiple lines with ', ' and strips newlines so the EPC payload isn't broken.
    """
    print(f"\n{prompt}")
    print("  (Paste your text line-by-line; press Enter on a blank line when done)")
    lines = []
    while True:
        try:
            line = input(" > ").strip()
            if not line:
                break
            lines.append(line)
        except (EOFError, KeyboardInterrupt):
            break

    return ", ".join(lines)


def build_raw_sepa_payload(
    name: str,
    iban: str,
    amount: float = 0.0,
    text: str = "",
    email: str = "",
    bic: str = "",
    purpose: str = "",
    model: str = "",
    poziv_na_broj: str = "",
    fallback_ref_in_unstructured: bool = True
) -> str:
    """
    Assembles the rigid 12-line EPC QR code payload (EPC060-08 standard).

    Line Layout:
    1: Service Tag ('BCD')
    2: Version ('002')
    3: Character Set ('1' = UTF-8)
    4: Identification ('SCT')
    5: BIC (Optional, Max 11 chars)
    6: Creditor Name (Max 70 chars)
    7: Creditor IBAN (Max 34 chars)
    8: Amount ('EURxx.xx', Max 12 chars)
    9: Purpose Code (Max 4 chars)
    10: Structured Reference (Max 35 chars)
    11: Unstructured Remittance Information (Max 140 chars)
    12: Information Line / Note (Max 70 chars)
    """
    # 1. IBAN & BIC
    clean_iban = iban.replace(" ", "").upper()[:34]
    clean_bic = bic.replace(" ", "").upper()[:11]

    # 2. Beneficiary Name
    clean_name = name.strip()[:70]

    # 3. Amount
    formatted_amount = f"EUR{amount:.2f}" if amount and amount > 0 else ""

    # 4. Purpose Code (e.g., WTER, RENT, OTHR)
    clean_purpose = purpose.strip().upper()[:4]

    # 5. Model + Poziv na broj (Structured Reference)
    model_clean = model.strip().upper()
    pnb_clean = poziv_na_broj.strip()

    if model_clean and not model_clean.startswith("HR") and model_clean.isdigit():
        model_clean = f"HR{model_clean}"

    if model_clean and pnb_clean:
        structured_ref = f"{model_clean} {pnb_clean}"
    elif model_clean or pnb_clean:
        structured_ref = model_clean or pnb_clean
    else:
        structured_ref = ""

    structured_ref = structured_ref[:35]

    # 6. Unstructured Text (Line 11) & Revolut / Foreign App Compatibility
    clean_text = ", ".join([line.strip() for line in text.splitlines() if line.strip()])

    if fallback_ref_in_unstructured and structured_ref:
        if clean_text:
            unstructured_ref = f"{structured_ref}, {clean_text}"
        else:
            unstructured_ref = structured_ref
    else:
        unstructured_ref = clean_text

    unstructured_ref = unstructured_ref[:140]

    # 7. Line 12 Note / Email
    info_line = email.strip()
    if info_line and not info_line.lower().startswith("email:") and "@" in info_line:
        info_line = f"Email: {info_line}"
    info_line = info_line[:70]

    # Assemble exactly 12 lines separated by \n
    lines = [
        "BCD",                 # 1: Service Tag
        "002",                 # 2: Version
        "1",                   # 3: Character set (UTF-8)
        "SCT",                 # 4: Identification
        clean_bic,             # 5: BIC
        clean_name,            # 6: Name
        clean_iban,            # 7: IBAN
        formatted_amount,      # 8: Amount
        clean_purpose,         # 9: Purpose code
        structured_ref,        # 10: Structured reference
        unstructured_ref,      # 11: Unstructured text
        info_line              # 12: Information line
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

    user_name = input("Enter Beneficiary Name: ").strip()
    user_iban = input("Enter IBAN: ").strip()
    user_bic = input("Enter BIC/SWIFT (optional): ").strip()

    amount_raw = input("Enter Amount in EUR (e.g. 45.90 or leave blank): ").strip()
    user_amount = clean_amount(amount_raw)

    user_model = input("Enter Model (e.g., HR01, HR00, HR12 or leave blank): ").strip()
    user_pnb = input("Enter Poziv na broj (e.g., 06428010-246842337-1): ").strip()
    user_purpose = input("Enter Šifra namjene / Purpose Code (e.g., WTER, RENT, OTHR): ").strip()

    user_text = read_multiline_input("Enter Remittance Text / Description / Invoice Info:")
    user_email = input("Enter Contact Email / Line 12 Note (optional): ").strip()

    output_filename = input("Enter output filename (default: sepa_input_qr.png): ").strip()
    if not output_filename:
        output_filename = "sepa_input_qr.png"

    payload = build_raw_sepa_payload(
        name=user_name,
        iban=user_iban,
        amount=user_amount,
        text=user_text,
        email=user_email,
        bic=user_bic,
        purpose=user_purpose,
        model=user_model,
        poziv_na_broj=user_pnb,
        fallback_ref_in_unstructured=True
    )

    print("\n--- Generated EPC Payload (12 Lines) ---")
    for idx, line in enumerate(payload.split("\n"), 1):
        print(f"Line {idx:2d}: {line}")

    generate_qr_image(payload, output_filename)

