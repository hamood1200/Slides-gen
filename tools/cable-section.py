"""Draw a cable cross-section as SVG: rings from the conductor outwards, each labelled
with its English name and a short Arabic note. Inlined by the renderer, so it uses the deck's fonts.

    python3 tools/cable-section.py decks/hv-cables/img/sections.json

sections.json: { "out-file.svg": [ ["Conductor", "ينقل التيار", "conductor", 70, "Carries the current"], ... ] }
each layer is [english name, arabic note, kind, thickness, english note]; kinds: conductor screen xlpe wires tape lead jacket
writes out-file.svg (Arabic notes) and out-file-en.svg (English notes)
"""
import json, math, sys, os

FILL = {'conductor': '#d98b50', 'screen': '#8e939c', 'xlpe': '#ffffff', 'wires': '#ffffff',
        'tape': '#c3c7cd', 'lead': '#565c68', 'jacket': '#a8322d'}

def section(layers, lang='ar'):
    W, H, cx, cy = 1000, 640, 300, 320
    rs, r = [], 0
    for _, _, _, th, *_ in layers:
        rs.append((r, r + th)); r += th
    k = 288 / r                                   # scale so the cable is 576 px across
    rs = [(a * k, b * k) for a, b in rs]
    o = [f'<svg class="xsec" direction="ltr" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">']
    for (en, ar, kind, *_), (a, b) in reversed(list(zip(layers, rs))):
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{b:.1f}" fill="{FILL[kind]}" stroke="#142846" stroke-width="1.2"/>')
        if kind == 'wires':                       # a ring of copper wires
            rm, d = (a + b) / 2, (b - a) / 2 * 0.8
            n = int(2 * math.pi * rm / (2 * d + 5))
            o += [f'<circle cx="{cx + rm * math.cos(2 * math.pi * i / n):.1f}" cy="{cy + rm * math.sin(2 * math.pi * i / n):.1f}" r="{d:.1f}" fill="#d98b50"/>' for i in range(n)]
        if kind == 'conductor':                   # stranded: rings of round wires
            d = b / 5.2
            for ring in range(0, 5):
                n = max(1, ring * 6)
                o += [f'<circle cx="{cx + ring * d * 1.02 * math.cos(2 * math.pi * i / n):.1f}" cy="{cy + ring * d * 1.02 * math.sin(2 * math.pi * i / n):.1f}" r="{d * .46:.1f}" fill="#f0b07c" stroke="#b5652f" stroke-width="1"/>' for i in range(n)]
    # leaders: a dot on each layer along the horizontal radius, up (inner half) or down (outer half) to its label row
    fam = 'IBM Plex Sans Arabic' if lang == 'ar' else 'IBM Plex Sans'
    n = len(layers); top = (n + 1) // 2
    ys = [40 + i * (H - 90) / (n - 1) for i in range(n)]
    for i, ((en, ar, kind, _, note), (a, b)) in enumerate(zip(layers, rs)):
        x = cx + (a + b) / 2 if kind != 'conductor' else cx
        y = ys[i]
        txt = ar if lang == 'ar' else note
        o.append(f'<path d="M{x:.1f} {cy} V{y:.1f} H640" fill="none" stroke="#142846" stroke-width="1.6"/>')
        o.append(f'<circle cx="{x:.1f}" cy="{cy}" r="4" fill="#142846"/><circle cx="640" cy="{y:.1f}" r="4" fill="#142846"/>')
        o.append(f'<text x="656" y="{y + 2:.1f}" font-family="IBM Plex Sans" font-weight="600" font-size="25" fill="#142846">{en}</text>')
        o.append(f'<text x="656" y="{y + 32:.1f}" direction="ltr" font-family="{fam}" font-size="21" fill="#c8323c">{txt}</text>')
    o.append('</svg>')
    return '\n'.join(o)

if __name__ == '__main__':
    spec = sys.argv[1]
    for f, layers in json.load(open(spec)).items():
        for lang, name in (('ar', f), ('en', f[:-4] + '-en.svg')):
            open(os.path.join(os.path.dirname(spec), name), 'w').write(section(layers, lang))
            print(name)
