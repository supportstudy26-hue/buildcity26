"""Filter the pinned OpenStreetData country export without loading it into RAM.

python extract-jsonseq.py INPUT.geo.jsonseq.bz2 OUTPUT_DIR --osm-date YYYY-MM-DD
No credentials or live Overpass request. Preserve original feature IDs/coordinates.
"""
import argparse, bz2, hashlib, json, pathlib

p = argparse.ArgumentParser()
p.add_argument('input'); p.add_argument('output'); p.add_argument('--osm-date', required=True)
a = p.parse_args(); source = pathlib.Path(a.input); out = pathlib.Path(a.output)
out.mkdir(parents=True, exist_ok=True)
digest = hashlib.sha256()
with source.open('rb') as stream:
    for block in iter(lambda: stream.read(1024 * 1024), b''): digest.update(block)
counts = dict.fromkeys(['admin', 'water', 'coast', 'places'], 0)
files = {k: (out / (k + '.jsonseq')).open('w', encoding='utf-8') for k in counts}
try:
    with bz2.open(source, 'rt', encoding='utf-8') as stream:
        for line in stream:
            f = json.loads(line.lstrip('\x1e')); tags = f.get('properties', {}); key = None
            if tags.get('admin_level') == '4' and tags.get('boundary') == 'administrative': key = 'admin'
            elif tags.get('natural') == 'coastline': key = 'coast'
            elif tags.get('natural') == 'water' or tags.get('waterway') in ['river', 'riverbank', 'canal']: key = 'water'
            elif tags.get('place') in ['city', 'town']: key = 'places'
            if key:
                files[key].write(json.dumps(f, ensure_ascii=False, separators=(',', ':')) + '\n')
                counts[key] += 1
finally:
    for stream in files.values(): stream.close()
(out / 'input-manifest.json').write_text(json.dumps({
    'inputSHA256': digest.hexdigest(), 'inputBytes': source.stat().st_size,
    'osmDate': a.osm_date, 'counts': counts,
    'boundarySource': 'https://files.openstreetdata.org/extracts/VN.geo.jsonseq.bz2'
}, indent=2), encoding='utf-8')
print(json.dumps(counts))
