"""
WCAG 2.1 AA Contrast Ratio Verifier for CareerMatch AI Design Tokens
Parses tokens.css directly and verifies all text/background pairs meet AA
(>= 4.5:1 for normal text, >= 3.0:1 for large/UI)
"""

import os
import re
import sys

TOKENS_PATH = os.path.join(os.path.dirname(__file__), "..", "frontend", "css", "tokens.css")

def hex_to_rgb(hex_str):
    hex_str = hex_str.strip().lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c*2 for c in hex_str])
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def relative_luminance(rgb):
    srgb = [c / 255.0 for c in rgb]
    lum = []
    for c in srgb:
        if c <= 0.03928:
            lum.append(c / 12.92)
        else:
            lum.append(((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2]

def contrast_ratio(hex1, hex2):
    lum1 = relative_luminance(hex_to_rgb(hex1))
    lum2 = relative_luminance(hex_to_rgb(hex2))
    l_max = max(lum1, lum2)
    l_min = min(lum1, lum2)
    return (l_max + 0.05) / (l_min + 0.05)

def parse_color(color_str, canvas_hex="#FFFFFF"):
    color_str = color_str.strip()
    if color_str.startswith('#'):
        return color_str
    rgba_m = re.match(r'rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d\.]+))?\s*\)', color_str)
    if rgba_m:
        r, g, b = int(rgba_m.group(1)), int(rgba_m.group(2)), int(rgba_m.group(3))
        a = float(rgba_m.group(4)) if rgba_m.group(4) is not None else 1.0
        bg_r, bg_g, bg_b = hex_to_rgb(canvas_hex)
        comp_r = round(r * a + bg_r * (1.0 - a))
        comp_g = round(g * a + bg_g * (1.0 - a))
        comp_b = round(b * a + bg_b * (1.0 - a))
        return f"#{comp_r:02x}{comp_g:02x}{comp_b:02x}"
    return None

def parse_tokens():
    with open(TOKENS_PATH, 'r', encoding='utf-8') as f:
        css = f.read()

    # Split into root (light) and dark sections
    root_match = re.search(r':root\s*\{(.*?)\n\}', css, re.DOTALL)
    dark_match = re.search(r'\[data-theme="dark"\]\s*\{(.*?)\n\}', css, re.DOTALL)

    def extract_vars(block, default_canvas):
        res = {}
        canvas = default_canvas
        # First pass for canvas
        for line in block.splitlines():
            line = line.strip()
            if line.startswith('--bg-canvas:') and '#' in line:
                val = line.split(':', 1)[1].split(';')[0].split('/*')[0].strip()
                if val.startswith('#'):
                    canvas = val
                    res['--bg-canvas'] = val
                    break

        for line in block.splitlines():
            line = line.strip()
            if line.startswith('--') and ':' in line:
                key, val = line.split(':', 1)
                val = val.split(';')[0].split('/*')[0].strip()
                c = parse_color(val, canvas)
                if c:
                    res[key.strip()] = c
        return res

    light_tokens = extract_vars(root_match.group(1), "#FBF9F5") if root_match else {}
    dark_tokens = extract_vars(dark_match.group(1), "#121417") if dark_match else {}
    return light_tokens, dark_tokens

def main():
    light, dark = parse_tokens()
    print("Testing Live Tokens from tokens.css against WCAG 2.1 AA...")

    light_checks = [
        ("Light Canvas vs Text Primary", light.get("--bg-canvas"), light.get("--text-primary"), 4.5),
        ("Light Canvas vs Text Secondary", light.get("--bg-canvas"), light.get("--text-secondary"), 4.5),
        ("Light Card vs Text Primary", light.get("--bg-card"), light.get("--text-primary"), 4.5),
        ("Light Card vs Text Secondary", light.get("--bg-card"), light.get("--text-secondary"), 4.5),
        ("Light Card vs Brand Accent", light.get("--bg-card"), light.get("--brand-accent"), 4.5),
        ("Light Score High BG vs High Text", light.get("--score-high-bg"), light.get("--score-high"), 4.5),
        ("Light Score Mid BG vs Mid Text", light.get("--score-mid-bg"), light.get("--score-mid"), 4.5),
        ("Light Score Low BG vs Low Text", light.get("--score-low-bg"), light.get("--score-low"), 4.5),
        ("Light Signal Info BG vs Info Text", light.get("--signal-info-bg"), light.get("--signal-info"), 4.5),
        ("Light Button Accent vs On-Accent", light.get("--brand-accent"), light.get("--on-accent"), 4.5),
    ]

    dark_checks = [
        ("Dark Canvas vs Text Primary", dark.get("--bg-canvas"), dark.get("--text-primary"), 4.5),
        ("Dark Canvas vs Text Secondary", dark.get("--bg-canvas"), dark.get("--text-secondary"), 4.5),
        ("Dark Card vs Text Primary", dark.get("--bg-card"), dark.get("--text-primary"), 4.5),
        ("Dark Card vs Text Secondary", dark.get("--bg-card"), dark.get("--text-secondary"), 4.5),
        ("Dark Card vs Brand Accent", dark.get("--bg-card"), dark.get("--brand-accent"), 4.5),
        ("Dark Score High BG vs High Text", dark.get("--score-high-bg"), dark.get("--score-high"), 4.5),
        ("Dark Score Mid BG vs Mid Text", dark.get("--score-mid-bg"), dark.get("--score-mid"), 4.5),
        ("Dark Score Low BG vs Low Text", dark.get("--score-low-bg"), dark.get("--score-low"), 4.5),
        ("Dark Signal Info BG vs Info Text", dark.get("--signal-info-bg"), dark.get("--signal-info"), 4.5),
        ("Dark Button Accent vs On-Accent", dark.get("--brand-accent"), dark.get("--on-accent"), 4.5),
    ]

    failures = 0
    for name, bg, fg, target in light_checks + dark_checks:
        if not bg or not fg:
            print(f"  [WARN] {name}: Missing token (bg={bg}, fg={fg})")
            failures += 1
            continue
        ratio = contrast_ratio(bg, fg)
        passed = ratio >= target
        status = "[PASS]" if passed else "[FAIL]"
        print(f"  {status} {name}: {ratio:.2f}:1 (Target: {target}:1)")
        if not passed:
            failures += 1

    if failures == 0:
        print("\nAll color pairs meet or exceed WCAG 2.1 AA requirements.")
    else:
        print(f"\n{failures} contrast pair(s) failed.")
    return failures

if __name__ == "__main__":
    sys.exit(main())
