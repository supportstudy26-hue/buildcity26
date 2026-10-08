"""Add a bounded overview layer, without changing admin geometry or playable saves.
Usage: python scripts/geodata/prepare-archipelagos.py /path/to/osm-filtered
The VN extract has no Hoang Sa coast: show attributed reference points only.
"""
import hashlib, json, sys
from pathlib import Path
from shapely.geometry import Polygon

root = Path(__file__).resolve().parents[2]
source = Path(sys.argv[1])
out = root / 'public/geodata/vn-20261008'
ref = json.loads(Path(__file__).with_name('archipelago-reference.json').read_text())
provenance = json.loads((source/'input-manifest.json').read_text())
def dms(a): return round(a[0]+a[1]/60+a[2]/3600, 7)
points = [{'id':f'hs-{i+1}', 'name':name, 'anchor':[dms(lon),dms(lat)],
           'kind':'shoal' if name.startswith('Bãi') else 'island', 'source':ref['coordinateSource']}
          for i,(name,lon,lat) in enumerate(ref['hoangSa'])]
features=[]
for line in (source/'coast.jsonseq').open():
    f=json.loads(line); c=f['geometry']['coordinates']
    if f['geometry']['type']!='LineString' or not all(111.5<=p[0]<=117 and 7.5<=p[1]<=12 for p in c): continue
    props=f.get('properties',{}); original=props.get('name',''); name=props.get('name:vi') or original
    if f['id']=='w614161275': name='Đảo Trường Sa'
    if not name.startswith(('Đảo','Đá')): name=''
    # Retain every actual coast line within the window; avoid inventing island polygons.
    closed=c[0]==c[-1] and len(c)>=4
    features.append({'type':'Feature','id':f['id'],'geometry':f['geometry'],
                     'properties':{'name':name,'sourceName':original,'closed':closed}})
ts=[]
for f in features:
    name=f['properties']['name']
    if not name or not name.startswith(('Đảo','Đá')): continue
    c=f['geometry']['coordinates']; anchor=list(Polygon(c).representative_point().coords)[0] if f['properties']['closed'] else c[0]
    if name=='Đảo Trường Sa': anchor=[111.9196858,8.6446406] # OSM place node n5127953791.
    ts.append({'id':f['id'],'name':name,'anchor':list(anchor),'kind':'island' if name.startswith('Đảo') else 'rock',
               'source':'https://www.openstreetmap.org/way/'+f['id'][1:]})
data={'version':'vn-20261008','verifiedAt':ref['verifiedAt'],'administrativeSource':ref['administrativeSource'],
      'osmDate':provenance['osmDate'],'inputSHA256':provenance['inputSHA256'],
      'attribution':'© OpenStreetMap contributors · ODbL; reference coordinates: Cổng thông tin Đà Nẵng.',
      'archipelagos':[
          {'id':'hoang-sa','name':'Quần đảo Hoàng Sa','provinceId':'48','provinceName':'Đà Nẵng',
           'administrativeName':'Đặc khu Hoàng Sa','bbox':[111.1,15.6,113.05,17.3],'points':points,'coasts':[],
           'coverage':'12 điểm tham chiếu từ Cổng thông tin Đà Nẵng; chưa có đường bờ/DEM đảo được kiểm chứng.'},
          {'id':'truong-sa','name':'Quần đảo Trường Sa','provinceId':'56','provinceName':'Khánh Hòa',
           'administrativeName':'Đặc khu Trường Sa','bbox':[111.5,7.5,117,12],'points':ts,'coasts':features,
           'coverage':'Đường bờ có trong bản trích OSM 2023; phạm vi dữ liệu chưa đầy đủ, chưa có DEM đảo được kiểm chứng.'}
      ]}
payload=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode()
(out/'archipelagos.json').write_bytes(payload)
manifest=json.loads((out/'manifest.json').read_text())
manifest['files']['archipelagos.json']={'bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest()}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
print(f'{len(points)} Hoang Sa reference points; {len(ts)} named Truong Sa features; {len(features)} coast lines; {len(payload)} bytes')
