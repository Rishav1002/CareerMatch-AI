"""
Generate crisp vector SVG logo mark matching media_1794074486720_7915e406.png:
4-fold rotational vortex emblem in golden-yellow to orange-peach gradient,
with sweeping curved outer tails, inner curling flames, and circular terminal nodes.
"""

import math

def generate_svg():
    # 4-fold rotational symmetry centered at (100, 100) on a 200x200 canvas
    # Single arm definition:
    # Outer crescent tail sweeping outward and curling down:
    # starts near top-left, curves over top right, tapers down.
    # Inner flame sweeping up from inner vortex and terminating with a rounded node dot.

    arm_path = (
        "M -24 -76 "
        "C -8 -88, 20 -86, 46 -68 "
        "C 64 -54, 70 -36, 64 -20 "
        "C 58 -6, 44 4, 32 -4 "
        "C 22 -12, 22 -26, 28 -38 "
        "C 34 -50, 24 -64, 4 -68 "
        "C -12 -72, -22 -68, -24 -76 Z"
    )

    inner_flame = (
        "M -50 -35 "
        "C -28 -50, -4 -42, 6 -24 "
        "C 14 -8, 8 10, -4 20 "
        "C -16 28, -32 24, -38 10 "
        "C -44 -4, -36 -18, -22 -22 "
        "C -10 -26, -18 -38, -50 -35 Z"
    )

    node_dot = '<circle cx="6" cy="-76" r="6.5" fill="#FDE047" />'

    # The 4 rotated arms:
    arms_svg = []
    for deg in (0, 90, 180, 270):
        arms_svg.append(f'''    <g transform="rotate({deg})">
      <path d="{arm_path}" fill="url(#cmGoldGrad)" opacity="0.95" />
      <path d="{inner_flame}" fill="url(#cmGoldGrad)" opacity="0.95" />
      {node_dot}
    </g>''')

    full_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="cmGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="35%" stop-color="#FBBF24" />
      <stop offset="70%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>
  </defs>
  <g transform="translate(100, 100)">
{chr(10).join(arms_svg)}
  </g>
</svg>'''

    symbol_svg = f'''<symbol id="cm-logo" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="cmGoldGradSymbol" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="35%" stop-color="#FBBF24" />
      <stop offset="70%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>
  </defs>
  <g transform="translate(100, 100)">
{chr(10).join(arms_svg).replace('url(#cmGoldGrad)', 'url(#cmGoldGradSymbol)')}
  </g>
</symbol>'''

    return full_svg, symbol_svg

if __name__ == "__main__":
    full, sym = generate_svg()
    with open("frontend/assets/logo-mark.svg", "w", encoding="utf-8") as f:
        f.write(full)
    with open("frontend/assets/favicon.svg", "w", encoding="utf-8") as f:
        f.write(full)
    with open("frontend/assets/logo-symbol.html", "w", encoding="utf-8") as f:
        f.write(sym)
    print("Logo SVG assets generated successfully.")
