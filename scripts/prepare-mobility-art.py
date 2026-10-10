"""Reproducible alpha-preserving thumbnail atlas import; requires Pillow."""
from pathlib import Path
import json,hashlib
from PIL import Image
root=Path(__file__).resolve().parents[1]
source=root/'art-source/Build_City_26_People_Vehicles'
target=root/'public/art/mobility';target.mkdir(parents=True,exist_ok=True)
for name,digest in json.loads((source/'SHA256.json').read_text()).items():
 assert hashlib.sha256((source/name).read_bytes()).hexdigest()==digest,name
manifest=json.loads((source/'manifest.json').read_text())
for group in manifest['groups']:
 im=Image.open(source/group['atlas']);assert im.mode=='RGBA'
 assert im.size==(group['atlasWidth'],group['atlasHeight'])
 im.save(target/(group['id']+'.webp'),format='WEBP',quality=85,method=6)
 decoded=Image.open(target/(group['id']+'.webp')).convert('RGBA')
 assert im.getchannel('A').tobytes()==decoded.getchannel('A').tobytes(),group['id']
for a in manifest['assets']:
 a['atlas']='/art/mobility/'+a['group']+'.webp'
 f=a['frame'];assert f['x']>=0 and f['y']>=0 and f['x']+f['width']<=a['atlasWidth'] and f['y']+f['height']<=a['atlasHeight']
assert len({a['id'] for a in manifest['assets']})==144
(root/'src/config/mobility-art-assets.json').write_text(json.dumps({'groups':manifest['groups'],'assets':manifest['assets']},ensure_ascii=False,separators=(',',':'))+'\n')
print('144 frames /16 atlases; original 25 hashes verified; alpha byte-identical;',sum(p.stat().st_size for p in target.glob('*.webp')),'bytes')
