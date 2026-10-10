"""Build alpha WebP UI atlases and exact-frame registry from the user's art pack.
Run with Python + Pillow; originals never modified. No image/API requests.
"""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art-source/Build_City_26_Building_Art'
manifest = json.loads((SOURCE / 'manifest.json').read_text())
output = ROOT / 'public/art/buildings'
output.mkdir(parents=True, exist_ok=True)
registry = []
for atlas in sorted({a['atlas'] for a in manifest['assets']}):
    source = SOURCE / atlas
    target = output / (source.stem + '.webp')
    with Image.open(source) as image:
        assert image.size == (1254, 1254) and image.mode == 'RGBA'
        image.save(target, 'WEBP', quality=84, method=6)
for a in manifest['assets']:
    registry.append({k:a[k] for k in ['id', 'nameVi', 'group', 'frame', 'anchor']} | {'atlas':'/art/buildings/' + Path(a['atlas']).stem + '.webp'})
(ROOT / 'src/config/building-art-assets.json').write_text(json.dumps(registry, ensure_ascii=False, separators=(',', ':')) + '\n')
print(json.dumps({'assets':len(registry), 'atlases':len(list(output.glob('*.webp'))), 'compressedBytes':sum(p.stat().st_size for p in output.glob('*.webp'))}))
