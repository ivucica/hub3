#!/usr/bin/env python3
import segno
from segno import helpers

def generate_sepa_qr(name, iban, amount, text, filename="sepa_payment_qr.png"):
    """
    Generates a valid EPC-compliant SEPA Credit Transfer QR code.
    """
    try:
        # The make_epc_qr helper correctly wraps the data into the line-separated EPC format
        qr = helpers.make_epc_qr(
            name=name,
            iban=iban,
            amount=amount,  # Float or Int (will format to EURxx.xx automatically)
            text=text       # Unstructured remittance info
        )
        
        # Save the QR code. Scale adjusts the resolution size.
        qr.save(filename, scale=4)
        print(f"Success! SEPA QR Code saved to {filename}")
        
    except Exception as e:
        print(f"Error generating QR code: {e}")


def build_raw_sepa_payload(name, iban, amount, text, email):
    # Ensure precision format for EUR amount (e.g., EUR45.90)
    formatted_amount = f"EUR{amount:.2f}" if amount else ""
    
    # Assemble the rigid 12-line layout dictated by the EPC standard
    lines = [
        "BCD",                               # 1: Service Tag
        "002",                               # 2: Version
        "1",                                 # 3: Character set (UTF-8)
        "SCT",                               # 4: Identification
        "",                                  # 5: BIC (Optional)
        name[:70],                           # 6: Name (Max 70 chars)
        iban.replace(" ", ""),               # 7: IBAN (Strip spaces)
        formatted_amount,                    # 8: Amount
        "",                                  # 9: Purpose code
        "",                                  # 10: Structured reference
        text[:140] if text else "",          # 11: Unstructured text (Max 140 chars)
        f"Email: {email}" if email else ""   # 12: Information line
    ]
    
    # Join using exact line feed (\n) characters
    return "\n".join(lines)


# Example Usage
if __name__ == "__main__":
    #generate_sepa_qr(
    #    name="John Doe",
    #    iban="DE89370400440532013000",
    #    amount=25.50,
    #    text="Invoice #2026-0041"
    #)
    print("--- SEPA QR Code Generator ---")
    
    # Collect data from terminal input
    user_name = input("Enter Beneficiary Name: ").strip()
    user_iban = input("Enter IBAN: ").strip()
    
    amount_raw = input("Enter Amount in EUR (e.g., 45.90 or leave blank): ").strip()
    user_amount = float(amount_raw) if amount_raw else 0.0
    
    user_text = input("Enter Remittance Text / Invoice Info: ").strip()
    user_email = input("Enter Contact Email (Line 12 Note): ").strip()
    output_filename = input("Enter output filename (default: sepa_input_qr.png): ").strip()
    
    if not output_filename:
        output_filename = "sepa_input_qr.png"

    # Process and build the QR payload
    payload = build_raw_sepa_payload(user_name, user_iban, user_amount, user_text, user_email)
    
    try:
        # Enforce Error Correction Level M as required by SEPA guidelines
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
        qr.add_data(payload)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(output_filename)
        
        print(f"\n[Success] SEPA QR code successfully generated and saved to '{output_filename}'!")
        
    except Exception as e:
        print(f"\n[Error] Failed to generate QR code: {e}")

import sys
sys.exit(0)
"""
alt
function generateSepaQrWithEmail(data) {
    const lines = [
        "BCD",                           // 1: Service Tag
        "002",                           // 2: Version
        "1",                             // 3: Encoding
        "SCT",                           // 4: Identification
        data.bic || "",                  // 5: BIC
        data.name.substring(0, 70),      // 6: Beneficiary Name
        data.iban.replace(/\s+/g, ''),   // 7: IBAN
        data.amount ? `EUR${parseFloat(data.amount).toFixed(2)}` : "", // 8: Amount
        "",                              // 9: Purpose Code
        "",                              // 10: Structured Reference
        data.text ? data.text.substring(0, 140) : "", // 11: Unstructured Text
        data.email ? `Email: ${data.email}` : ""      // 12: Information (EMAIL PLACED HERE)
    ];

    return lines.join("\n");
}
"""
