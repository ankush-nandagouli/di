#!/usr/bin/env python3
import os
import sys
import random
import string
from datetime import datetime

# Try to import Pillow for high-fidelity certificate image drawing.
try:
    from PIL import Image, ImageDraw, ImageFont, ImageEnhance
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False

def generate_unique_key():
    """
    Generates a unique key like: dkm-current_year-6digit_alphanumeric.
    Example: DKM-2026-H8K3A2
    """
    current_year = datetime.now().year
    # Generate 6 uppercase alphanumeric characters
    chars = string.ascii_uppercase + string.digits
    unique_6 = ''.join(random.choices(chars, k=6))
    return f"DKM-{current_year}-{unique_6}"

def draw_html_svg_certificate(output_path, name, course_name, institution, date_str, cert_id):
    """
    Alternative high-fidelity vector SVG generator when PIL (Pillow) is not in context.
    Outputs a premium visual vector layout wrapping certificate nodes.
    """
    svg_content = f"""<svg viewBox="0 0 1000 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Outer Border Design -->
  <rect x="15" y="15" width="970" height="670" fill="#040d12" stroke="#d97706" stroke-width="6" rx="10" />
  <rect x="25" y="25" width="950" height="650" fill="none" stroke="#22d3ee" stroke-width="1.5" stroke-dasharray="8 4" rx="8" />
  
  <!-- Subtle Ornamental Corner Borders -->
  <path d="M 40 100 L 40 40 L 100 40" fill="none" stroke="#d97706" stroke-width="3" />
  <path d="M 960 100 L 960 40 L 900 40" fill="none" stroke="#d97706" stroke-width="3" />
  <path d="M 40 600 L 40 660 L 100 660" fill="none" stroke="#d97706" stroke-width="3" />
  <path d="M 960 600 L 960 660 L 900 660" fill="none" stroke="#d97706" stroke-width="3" />

  <!-- Background decorative watermarks -->
  <circle cx="500" cy="350" r="180" fill="none" stroke="#22d3ee" stroke-opacity="0.04" stroke-width="1" />
  <circle cx="500" cy="350" r="220" fill="none" stroke="#d97706" stroke-opacity="0.03" stroke-width="1.5" stroke-dasharray="15 5" />
  
  <!-- Header Text -->
  <text x="500" y="110" font-family="'Courier New', Courier, monospace" font-size="14" font-weight="bold" fill="#22d3ee" text-anchor="middle" letter-spacing="4">DAKSHYAM INNOVATIONS COOPERATIVE CELL</text>
  <text x="500" y="140" font-family="sans-serif" font-size="10" font-weight="900" fill="#64748b" text-anchor="middle" letter-spacing="6">NEP ALIGNED PHYSICAL DIGITAL WORKSPACES</text>
  
  <!-- Main Title -->
  <text x="500" y="230" font-family="sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">CERTIFICATE OF COMPLETION</text>
  <text x="500" y="270" font-family="'Courier New', Courier, monospace" font-size="12" font-weight="bold" fill="#475569" text-anchor="middle">THIS OFFICIAL PROTOCOL DOCUMENT IS GRANTED TO</text>
  
  <!-- Student Name Inside Box -->
  <rect x="250" y="295" width="500" height="60" fill="#091e25" stroke="#22d3ee" stroke-width="1" stroke-opacity="0.25" rx="6" />
  <text x="500" y="337" font-family="sans-serif" font-size="30" font-weight="bold" fill="#fbbf24" text-anchor="middle" letter-spacing="1">{name}</text>
  
  <!-- Course parameters -->
  <text x="500" y="395" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">for successfully concluding deep manual curricula and training programs in</text>
  <text x="500" y="430" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">{course_name}</text>
  <text x="500" y="465" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">conducted in cooperation with</text>
  <text x="500" y="492" font-family="sans-serif" font-size="15" font-weight="bold" fill="#e2e8f0" text-anchor="middle">{institution}</text>
  
  <line x1="300" y1="520" x2="700" y2="520" stroke="#d97706" stroke-width="1" stroke-opacity="0.3" />

  <!-- Footnotes starting metadata -->
  <g transform="translate(100, 570)">
    <text x="0" y="15" font-family="'Courier New', Courier, monospace" font-size="11" fill="#475569" font-weight="bold">AUTHORIZED DATE</text>
    <text x="0" y="35" font-family="sans-serif" font-size="12" fill="#e2e8f0" font-weight="bold">{date_str}</text>
    <line x1="0" y1="2" x2="160" y2="2" stroke="#22d3ee" stroke-width="1" stroke-opacity="0.4" />
  </g>

  <g transform="translate(500, 560)" text-anchor="middle">
     <circle cx="0" cy="18" r="28" fill="#1e293b" stroke="#d97706" stroke-width="1.5" />
     <path d="M -10 18 L 0 8 L 10 18 L 5 18 L 5 28 L -5 28 L -5 18 Z" fill="#22d3ee" />
     <text x="0" y="60" font-family="'Courier New', Courier, monospace" font-size="9" fill="#22d3ee" font-weight="bold" letter-spacing="1">DAKSHYAM SEAL</text>
  </g>

  <g transform="translate(740, 570)" text-anchor="end">
    <text x="0" y="15" font-family="'Courier New', Courier, monospace" font-size="11" fill="#475569" font-weight="bold">VERIFIED METRIC SIGNATURE</text>
    <text x="0" y="35" font-family="sans-serif" font-size="11" fill="#fbbf24" font-weight="bold" letter-spacing="1">{cert_id}</text>
    <line x1="-160" y1="2" x2="0" y2="2" stroke="#22d3ee" stroke-width="1" stroke-opacity="0.4" />
  </g>

  <!-- Location node indicator footer -->
  <text x="500" y="655" font-family="'Courier New', Courier, monospace" font-size="8.5" fill="#475569" text-anchor="middle" letter-spacing="1.5">REGIONAL HUB: WARASEONI, BALAGHAT, CENTRAL MP • CREDENTIAL VERIFICATION PANEL ACTIVE</text>
</svg>
"""
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        print(f"✓ Vector SVG Certificate successfully drawn to: {output_path}")
        return True
    except Exception as e:
        print(f"❌ Error writing SVG file: {e}")
        return False

def draw_raster_certificate(output_path, name, course_name, institution, date_str, cert_id):
    """
    Renders a premium high-resolution certificate JPEG image using Pillow.
    If custom fonts are missing, falls back cleanly to default system fonts.
    """
    if not PILLOW_AVAILABLE:
        print("Pillow library not imported. Falling back to decorative SVG vector formatting.")
        svg_path = output_path.replace('.jpg', '.svg').replace('.png', '.svg')
        return draw_html_svg_certificate(svg_path, name, course_name, institution, date_str, cert_id)

    # Core canvas size: 2000 x 1400 px
    width, height = 2000, 1400
    img = Image.new('RGB', (width, height), color='#040d12')
    draw = ImageDraw.Draw(img)

    # Decorative border lines
    draw.rectangle([30, 30, width-30, height-30], fill=None, outline='#d97706', width=12)
    draw.rectangle([50, 50, width-50, height-50], fill=None, outline='#22d3ee', width=3)

    # Draw Corner ornaments
    draw.line([70, 150, 70, 70, 150, 70], fill='#d97706', width=6)
    draw.line([width-70, 150, width-70, 70, width-150, 70], fill='#d97706', width=6)
    draw.line([70, height-150, 70, height-70, 150, height-70], fill='#d97706', width=6)
    draw.line([width-70, height-150, width-70, height-70, width-150, height-70], fill='#d97706', width=6)

    # Fallback fonts configuration
    try:
        title_font = ImageFont.truetype("arial.ttf", 75)
        sub_font = ImageFont.truetype("arial.ttf", 30)
        name_font = ImageFont.truetype("arial.ttf", 60)
        meta_font = ImageFont.truetype("arial.ttf", 25)
    except IOError:
        title_font = ImageFont.load_default()
        sub_font = ImageFont.load_default()
        name_font = ImageFont.load_default()
        meta_font = ImageFont.load_default()

    # Title lines
    draw.text((width/2, 200), "DAKSHYAM INNOVATIONS COOPERATIVE CELL", fill='#22d3ee', font=meta_font, anchor="mm")
    draw.text((width/2, 260), "NEP 2020 ROBOTICS & COMP LIT LAB INTEGRATIONS", fill='#64748b', font=meta_font, anchor="mm")
    
    draw.text((width/2, 450), "CERTIFICATE OF COMPLETION", fill='#ffffff', font=title_font, anchor="mm")
    draw.text((width/2, 550), "This official protocol document certifies that student candidate", fill='#475569', font=sub_font, anchor="mm")
    
    # Render Student name container box
    draw.rectangle([width/2 - 500, 620, width/2 + 500, 750], fill='#091e25', outline='#22d3ee', width=2)
    draw.text((width/2, 685), name, fill='#fbbf24', font=name_font, anchor="mm")

    # Course description blocks
    draw.text((width/2, 830), "has successfully finished our manuals, labs, and physical training program in", fill='#94a3b8', font=sub_font, anchor="mm")
    draw.text((width/2, 910), course_name, fill='#ffffff', font=name_font, anchor="mm")
    draw.text((width/2, 980), f"conducted in official synchronization with {institution}", fill='#e2e8f0', font=sub_font, anchor="mm")

    # Footer elements
    draw.line([400, 1080, width-400, 1080], fill='#d97706', width=2)
    draw.text((300, 1160), "AUTHORIZED DATE", fill='#475569', font=meta_font, anchor="ma")
    draw.text((300, 1200), date_str, fill='#e2e8f0', font=sub_font, anchor="ma")

    draw.text((width-300, 1160), "UNIQUE KEY SIGNATURE", fill='#475569', font=meta_font, anchor="ma")
    draw.text((width-300, 1200), cert_id, fill='#fbbf24', font=sub_font, anchor="ma", spacing=2)

    # Location footer note
    draw.text((width/2, 1320), "REGIONAL BASE: WARASEONI DISTRICT BALAGHAT, MADHYA PRADESH (MP)", fill='#475569', font=meta_font, anchor="mm")

    img.save(output_path, "JPEG", quality=95)
    print(f"✓ Raster JPEG Certificate successfully generated to: {output_path}")
    return True

def main():
    if len(sys.argv) < 2:
        print("\n--- DAKSHYAM INNOVATIONS CERTIFICATE GENERATION TOOL (PYTHON) ---")
        print("Usage:")
        print("  python generator.py --test            (Dry-runs a dummy certificate output)")
        print("  python generator.py <name> <course> <school> <date> [output_file.jpg]")
        print("\nExample:")
        print("  python generator.py \"Ayush Patel\" \"IoT Embedded Systems Batch\" \"Govt Excellence Balaghat\" \"2026-06-23\"")
        print("-----------------------------------------------------------------\n")
        return

    first_arg = sys.argv[1]
    
    if first_arg == "--test":
        test_key = generate_unique_key()
        print(f"Testing generator... Key: {test_key}")
        draw_html_svg_certificate("test_certificate.svg", "Dev Sample Name", "Robotics Autonomous Rover Track", "Polytechnic College Waraseoni", "2026-06-23", test_key)
        draw_raster_certificate("test_certificate.jpg", "Dev Sample Name", "Robotics Autonomous Rover Track", "Polytechnic College Waraseoni", "2026-06-23", test_key)
        return

    name = sys.argv[1]
    course = sys.argv[2] if len(sys.argv) > 2 else "Advanced IoT Development"
    school = sys.argv[3] if len(sys.argv) > 3 else "Waraseoni Regional Setup"
    date_val = sys.argv[4] if len(sys.argv) > 4 else datetime.now().strftime("%Y-%m-%d")
    output_fn = sys.argv[5] if len(sys.argv) > 5 else "dakshyam_certificate.jpg"

    unique_id = generate_unique_key()
    print(f"Generating credential document...\nStudent Name: {name}\nTraining Course: {course}\nPartner School: {school}\nIssuing Date : {date_val}\nUniquely Signed ID: {unique_id}\n")

    draw_raster_certificate(output_fn, name, course, school, date_val, unique_id)
    # Also write a vector backup
    svg_fn = output_fn.replace(".jpg", ".svg").replace(".png", ".svg")
    draw_html_svg_certificate(svg_fn, name, course, school, date_val, unique_id)

if __name__ == "__main__":
    main()
