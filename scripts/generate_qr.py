"""
generate_qr.py
──────────────
Generates a QR code PNG for an attendance registration URL.

Usage:
    python scripts/generate_qr.py --event "Tech Summit" --location "Accra" --url "https://your-site.vercel.app"

Install dependency first:
    pip install qrcode[pil]
"""

import argparse
import qrcode
from urllib.parse import urlencode

def generate_qr(event: str, location: str, site_url: str, output: str = "qrcode.png"):
    # Build the registration URL that the QR code will point to
    params = urlencode({"event": event, "location": location})
    registration_url = f"{site_url}/register?{params}"

    print(f"Generating QR code for:\n  {registration_url}\n")

    # Create the QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(registration_url)
    qr.make(fit=True)

    # Save as PNG
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output)

    print(f"QR code saved to: {output}")
    print(f"Scan it to open: {registration_url}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate an attendance QR code")
    parser.add_argument("--event",    required=True,  help="Event name, e.g. 'Tech Summit 2025'")
    parser.add_argument("--location", required=True,  help="Location name, e.g. 'Main Hall'")
    parser.add_argument("--url",      required=True,  help="Your deployed site URL, e.g. https://your-app.vercel.app")
    parser.add_argument("--output",   default="qrcode.png", help="Output filename (default: qrcode.png)")

    args = parser.parse_args()
    generate_qr(args.event, args.location, args.url, args.output)
