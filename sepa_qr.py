#!/usr/bin/env python3
# sepa_qr_generator.py
# -*- coding: utf-8 -*-
# -*- mode: python; python-indent-offset: 4; indent-tabs-mode: nil -*-
# vim: set ft=python ts=4 sw=4 et:

"""
HUB-3 (PDF417) & SEPA EPC (QR) Code Toolkit.
SEPA Credit Transfer QR Code Generator (EPC060-08 Standard).
Supports multi-line spreadsheet cell copy-pasting (Beneficiary, Payer, Remittance info).
Compatible with Revolut, Croatian HUB3/SEPA banking apps, and European banks.
Features:
- Smart CSV batching (reads folder/filename for output paths)
- Multi-line cell pasting
- Webcam scanning with visual feedback and camera selection
"""

import os
import re
import csv
import sys

# Image / Barcode Generators
try:
    from pdf417gen import encode as pdf417_encode, render_image as pdf417_render
except ImportError:
    pdf417_encode = pdf417_render = None

try:
    import segno
except ImportError:
    segno = None

# Webcam / Scanning libraries
try:
    import cv2
    import zxingcpp
except ImportError:
    cv2 = zxingcpp = None


desc_extension_mode = 0


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
        s = s.replace(".", "").replace(",", ".") if s.rfind(",") > s.rfind(".") else s.replace(",", "")
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


def parse_address_lines(cell_text: str) -> tuple:
    if not cell_text: return "", "", ""
    lines = [line.strip() for line in str(cell_text).splitlines() if line.strip()]
    return (lines[0] if len(lines) >= 1 else "",
            lines[1] if len(lines) >= 2 else "",
            lines[2] if len(lines) >= 3 else "")

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


def read_multiline_input(prompt: str) -> str:
    print(f"\n{prompt}\n  (Type/paste text; press Enter on a blank line when done)")
    lines = []
    while True:
        try:
            line = input(" > ").strip()
            if not line:
                if lines: break
                else: return ""
            lines.append(line)
        except (EOFError, KeyboardInterrupt):
            break
    return "\n".join(lines)


# --- Payload Builders ---

def build_hub3_pdf417_payload(payer_cell, recip_cell, recip_iban, pnb_cell, amount, desc_cell, purpose_code) -> str:
    cents = int(round(amount * 100)) if amount > 0 else 0
    p_name, p_street, p_city = parse_address_lines(payer_cell)
    r_name, r_street, r_city = parse_address_lines(recip_cell)
    model, pnb = parse_model_and_pnb(pnb_cell)

    out = "\n".join([
        "HRVHUB30",
        "EUR", f"{cents:015d}",                        # amount
        p_name[:30], p_street[:27], p_city[:27],       # payer
        r_name[:30], r_street[:27], r_city[:27],       # recipient
        str(recip_iban).replace(" ", "").upper()[:21], # iban
        model[:4], pnb[:22],                           # structured ref
        purpose_code,                                  # payment purpose (WTER, ...)
        flatten_multiline(desc_cell, " ")[:35]         # unstructured ref
    ])
    print("WRITING HUB3: " + out)
    return out


def desc_extender(mode: str, structured_ref: str, text_cell: str, payer_cell: str) -> str:
    """'Revolut' mode applier. Returns structured ref to use instead.

    Args:
      mode: one of the following modes determining what to apply
        0. Nothing
        1. Add first line of description to reference
        2. Add first line of sender + first line of description to reference
        3. Add first line of sender to reference
        4. Add description to reference
        5. Add first line of sender + description to reference
        anything else: Nothing
      structured_ref: ref that would be included as-is (model+reference)
      text_cell: multiline text with description of payment
      payer_cell: multilne text with payer / transaction sender

    Returns:
      text that should be used instead of the structured_ref
    """

    if mode == "0":
      return structured_ref
    elif mode == "1":
      return structured_ref + " " + text_cell.split("\n")[0]
    elif mode == "2":
      return structured_ref + " " + payer_cell.split("\n")[0] + text_cell.split("\n")[0]
    elif mode == "3":
      return structured_ref + " " + payer_cell.split("\n")[0]
    elif mode == "4":
      return structured_ref + " " + flatten_multiline(text_cell, ", ")
    elif mode == "5":
      return structured_ref + " " + payer_cell.split("\n")[0] + flatten_multiline(text_cell, ", ")
    else:
      return structured_ref


def build_epc_sepa_qr_payload(name_cell, iban, amount, text_cell, payer_cell, pnb_cell) -> str:
    model, pnb = parse_model_and_pnb(pnb_cell)
    structured_ref = (f"{model} {pnb}" if model and pnb else (model or pnb))[:35]
    sanitized_text = flatten_multiline(text_cell, ", ")
    unstructured_ref = (f"{structured_ref}, {sanitized_text}" if structured_ref and sanitized_text else (structured_ref or sanitized_text))[:140]

    structured_ref = desc_extender(desc_extension_mode, structured_ref, text_cell, payer_cell)[:35]

    out = "\n".join([
        "BCD", "002", "1", "SCT",

        "",                                           # bic
        flatten_multiline(name_cell, " ")[:70],       # recipient
        re.sub(r"\s+", "", str(iban)).upper()[:34],   # iban
        f"EUR{amount:.2f}" if amount > 0 else "",     # amount
        "",                                           # purpose code
        structured_ref, unstructured_ref,             # unstructured and structured reference text
        flatten_multiline(payer_cell, " ")[:70]       # 'information' (payer name; could be email, ...)
    ])
    print("WRITING SEPA: " + out)
    return out


# --- File Generators ---

def generate_images(hub3_payload, sepa_payload, prefix="payment"):
    if pdf417_encode and pdf417_render:
        pdf417_render(pdf417_encode(hub3_payload, columns=6, security_level=4), scale=3, ratio=3).save(f"{prefix}_hub3.png")
        print(f"[+] HUB-3 PDF417 saved: {prefix}_hub3.png")

    filename = f"{prefix}_sepa.png"
    if segno:
        # Generate with Error Correction Level M as per EPC guidelines
        qr = segno.make(sepa_payload, error='m')
        qr.save(filename, scale=6)
        print(f"[+] SEPA QR saved:    {filename}")
    elif qrcode:
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
        qr.add_data(sepa_payload)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(filename)
        print(f"[+] SEPA QR saved:    {filename}")


# --- CSV Parser Helpers ---

def parse_csv_line(row, headers=None):
    if headers:
        clean_row = {k: v for k, v in zip(headers, row) if k}
        return {
            "folder": clean_row.get("rezija (folder)", ""),
            "filename": clean_row.get("filename", ""),
            "amount": clean_row.get("iznos", ""),
            "pnb": clean_row.get("model i poziv na broj", ""),
            "iban": clean_row.get("iban", ""),
            "recip": clean_row.get("primatelj", ""),
            "payer": clean_row.get("platitelj", ""),
            "desc": clean_row.get("opis placanja", ""),
            "purpose_code": clean_row.get("sifra namjene", ""),
        }
    else:
        # Fallback to column indices if user copied cells without the header row
        # (Based on the known 16-column layout of the spreadsheet)
        if len(row) >= 15:
            return {
                "folder": row[0],
                "filename": row[1],
                "amount": row[6],
                "pnb": row[10],
                "iban": row[11],
                "recip": row[12],
                "payer": row[13],
                "desc": row[14],
                "purpose_code": row[15],
            }
    return {}


# --- Webcam Scanner ---

def get_camera_index():
    """Probes video capture devices and allows the user to select one."""
    print("\n[*] Probing available cameras (this may take a few seconds)...")
    available_cams = []

    # Check first 5 indices to find available cameras
    for i in range(5):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            ret, _ = cap.read()
            if ret:
                available_cams.append(i)
        cap.release()

    if not available_cams:
        print("[Error] No cameras detected or permissions denied.")
        return -1

    if len(available_cams) == 1:
        print(f"[*] Found 1 camera (Index {available_cams[0]}).")
        return available_cams[0]

    print("[*] Multiple cameras detected:")
    for cam in available_cams:
        print(f"    [{cam}] Camera {cam}")

    while True:
        choice = input(f"Select camera index ({'/'.join(map(str, available_cams))}): ").strip()
        if choice.isdigit() and int(choice) in available_cams:
            return int(choice)
        print("[!] Invalid selection. Please enter a valid camera number.")

def scan_from_webcam(expected_format="HUB3"):
    if not (cv2 and zxingcpp):
        print("[Error] Webcam scanning requires OpenCV and zxing-cpp.")
        return None

    cam_idx = get_camera_index()
    if cam_idx < 0:
        return None

    cap = cv2.VideoCapture(cam_idx)
    print(f"\n[*] Camera {cam_idx} active. Window opened.")
    print(f"[*] Continuously scanning for {expected_format}...")
    print("[*] Position the code in the frame. Press 'q' in the video window to cancel.")

    decoded_payload = None
    while True:
        ret, frame = cap.read()
        if not ret: continue

        # Read barcodes before applying UI overlays
        results = zxingcpp.read_barcodes(frame)

        # Persistent UI overlays
        cv2.putText(frame, f"Scanning for {expected_format}... (Auto)", (15, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(frame, "Press 'q' to cancel", (15, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        for result in results:
            # Draw a blue bounding box around ANY detected barcode to show it is actively "seeing" codes
            try:
                p1 = (result.position.top_left.x, result.position.top_left.y)
                p2 = (result.position.top_right.x, result.position.top_right.y)
                p3 = (result.position.bottom_right.x, result.position.bottom_right.y)
                p4 = (result.position.bottom_left.x, result.position.bottom_left.y)
                cv2.line(frame, p1, p2, (255, 0, 0), 3)
                cv2.line(frame, p2, p3, (255, 0, 0), 3)
                cv2.line(frame, p3, p4, (255, 0, 0), 3)
                cv2.line(frame, p4, p1, (255, 0, 0), 3)

                format_name = str(result.format).split('.')[-1]
                cv2.putText(frame, format_name, (p1[0], max(p1[1] - 10, 0)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
            except Exception:
                pass

            # Check for Target match
            is_match = False
            if expected_format == "HUB3" and result.format == zxingcpp.BarcodeFormat.PDF417:
                if result.text.startswith("HRVHUB30"):
                    decoded_payload = result.text
                    is_match = True
            elif expected_format == "SEPA" and result.format == zxingcpp.BarcodeFormat.QRCode:
                if result.text.startswith("BCD\n002\n1\nSCT"):
                    decoded_payload = result.text
                    is_match = True

            # Flash Green Box on Match
            if is_match:
                try:
                    cv2.line(frame, p1, p2, (0, 255, 0), 5)
                    cv2.line(frame, p2, p3, (0, 255, 0), 5)
                    cv2.line(frame, p3, p4, (0, 255, 0), 5)
                    cv2.line(frame, p4, p1, (0, 255, 0), 5)
                except Exception:
                    pass

        cv2.imshow("Scanner", frame)

        if decoded_payload:
            cv2.waitKey(600)  # Pause briefly so the user sees the green success box
            break

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    # macOS GUI flush workaround (ensures the window actually disappears immediately)
    for _ in range(5):
        cv2.waitKey(1)

    return decoded_payload


def process_scanned_hub3(payload: str):
    print(f"RAW HUB3 PAYLOAD: {payload}")
    lines = payload.split('\n')
    print("\n--- Scanned HUB3 Data ---")
    print(f"Recipient: {lines[6].strip()}")
    print(f"IBAN: {lines[9].strip()}")
    print(f"Amount: {int(lines[2].strip()) / 100.0} EUR")

    # Generate its SEPA twin
    sepa = build_epc_sepa_qr_payload(
        name_cell=f"{lines[6].strip()} {lines[7].strip()} {lines[8].strip()}",
        iban=lines[9].strip(),
        amount=int(lines[2].strip()) / 100.0,
        text_cell=lines[13].strip(),
        payer_cell=f"{lines[3].strip()} {lines[4].strip()} {lines[5].strip()}",
        pnb_cell=f"{lines[10].strip()} {lines[11].strip()}"
    )
    generate_images(payload, sepa, "from_hub3")


def process_scanned_sepa(payload: str):
    print(f"RAW SEPA PAYLOAD: {payload}")
    lines = payload.split('\n')
    amt_str = lines[7].strip().replace("EUR", "")
    amount = float(amt_str) if amt_str else 0.0

    print("\n--- Scanned SEPA Data ---")
    print(f"Recipient: {lines[5].strip()}")
    print(f"IBAN: {lines[6].strip()}")
    print(f"Amount: {amount} EUR")

    # Generate its HUB3 twin
    hub3 = build_hub3_pdf417_payload(
        payer_cell=lines[11].strip(),
        recip_cell=lines[5].strip(),
        recip_iban=lines[6].strip(),
        pnb_cell=lines[9].strip(),
        amount=amount,
        desc_cell=lines[10].strip(),
        purpose_code=""
    )
    generate_images(hub3, payload, "from_sepa")


# --- Main Menu & Execution ---

def main():
    print("==================================================")
    print("  HUB-3 & SEPA Code Toolkit (Generation & Scanning)")
    print("==================================================")
    print("Revolut / international mode?")
    print("0. No")
    print("1. Add first line of description to reference")
    print("2. Add first line of sender + first line of description to reference")
    print("3. Add first line of sender to reference")
    print("4. Add description to reference")
    print("5. Add first line of sender + description to reference")
    print("Note: patches QR code's structured mode only")

    global desc_extension_mode
    desc_extension_mode = input("\nSelect an option (0-5): ").strip()

    print("1. Manual Entry / Spreadsheet Cell Paste")
    print("2. Batch CSV Paste (Uses spreadsheet headers)")
    print("3. Scan HUB-3 PDF417 from Webcam -> Generate SEPA")
    print("4. Scan SEPA QR from Webcam -> Generate HUB-3")
    print("5. Exit")

    choice = input("\nSelect an option (1-5): ").strip()

    if choice == '1':
        recip = read_multiline_input("Primatelj / Beneficiary:")
        iban = read_multiline_input("IBAN Primatelja:")
        amount = clean_amount(read_multiline_input("Iznos / Amount (EUR):"))
        pnb = read_multiline_input("Model i Poziv na broj:")
        desc = read_multiline_input("Opis plaćanja / Description:")
        payer = read_multiline_input("Platitelj / Payer:")
        purpose_code = read_multiline_input("Šifra namjene (WTER, ...):")

        hub3 = build_hub3_pdf417_payload(payer, recip, iban, pnb, amount, desc, purpose_code)
        sepa = build_epc_sepa_qr_payload(recip, iban, amount, desc, payer, pnb)
        generate_images(hub3, sepa, "manual")

    elif choice == '2':
        csv_data = read_multiline_input("Paste CSV (Select cells from Excel/Sheets, preferably including headers):")
        if not csv_data: return

        try:
            dialect = csv.Sniffer().sniff(csv_data)
        except csv.Error:
            dialect = csv.excel_tab

        reader = list(csv.reader(csv_data.splitlines(), dialect=dialect))
        if not reader: return

        # Detect Header Row (checks if keywords exist in the first row)
        first_row_lower = [str(x).strip().lower() for x in reader[0]]
        has_headers = any(h in first_row_lower for h in ["iban", "iznos", "primatelj"])

        headers = first_row_lower if has_headers else None
        data_rows = reader[1:] if has_headers else reader

        for i, row in enumerate(data_rows, 1):
            if not any(row): continue

            parsed = parse_csv_line(row, headers)
            if not parsed.get("iban") and not parsed.get("recip"):
                continue # Skip rows lacking minimum required data

            amt = clean_amount(parsed["amount"])

            hub3 = build_hub3_pdf417_payload(parsed["payer"], parsed["recip"], parsed["iban"], parsed["pnb"], amt, parsed["desc"], parsed["purpose_code"])
            sepa = build_epc_sepa_qr_payload(parsed["recip"], parsed["iban"], amt, parsed["desc"], parsed["payer"], parsed["pnb"])

            # File / Folder Routing
            folder = str(parsed.get("folder", "")).strip()
            filename = str(parsed.get("filename", "")).strip()

            if filename:
                base_name, _ = os.path.splitext(filename) # Strips .pdf
            else:
                base_name = f"row_{i}"

            if folder:
                os.makedirs(folder, exist_ok=True)
                prefix = os.path.join(folder, base_name)
            else:
                prefix = base_name

            print(f"\nProcessing row {i}: {str(parsed['recip'])[:20]}...")
            generate_images(hub3, sepa, prefix)

    elif choice == '3':
        payload = scan_from_webcam("HUB3")
        if payload: process_scanned_hub3(payload)

    elif choice == '4':
        payload = scan_from_webcam("SEPA")
        if payload: process_scanned_sepa(payload)

if __name__ == "__main__":
    main()
