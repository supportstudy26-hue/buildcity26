"""Extract only relevant public OSM data offline. Input: Geofabrik .osm.pbf.
Requires osmium (PyPI). No frontend dependency, keys or live Overpass requests.
"""
import osmium,json,pathlib,sys
src=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
files={k:(out/(k+'.jsonseq')).open('w') for k in ['admin','water','coast','places']};counts=dict.fromkeys(files,0)
factory=osmium.geom.GeoJSONFactory()
def write(key,obj,geom):
 j={'type':'Feature','id':str(obj.id),'properties':dict(obj.tags),'geometry':json.loads(geom)}
 files[key].write(json.dumps(j,ensure_ascii=False,separators=(',',':'))+'\n');counts[key]+=1
class Extract(osmium.SimpleHandler):
 def node(self,n):
  if n.tags.get('place') in ['city','town']:write('places',n,factory.create_point(n))
 def way(self,w):
  try:
   if w.tags.get('natural')=='coastline':write('coast',w,factory.create_linestring(w))
   elif w.tags.get('waterway') in ['river','canal'] and not w.is_closed():write('water',w,factory.create_linestring(w))
  except RuntimeError:pass
 def area(self,a):
  key='admin' if a.tags.get('boundary')=='administrative' and a.tags.get('admin_level')=='4' else 'water' if a.tags.get('natural')=='water' or a.tags.get('waterway')=='riverbank' else None
  if key:
   try:write(key,a,factory.create_multipolygon(a))
   except RuntimeError:pass
reader=osmium.io.Reader(str(src));header=reader.header();print('snapshot',header.get('osmosis_replication_timestamp'));reader.close()
Extract().apply_file(str(src),locations=True,idx='flex_mem')
for f in files.values():f.close()
print(counts)
for l in (out/'admin.jsonseq').read_text().splitlines():
 j=json.loads(l);print(j['id'],j['properties'].get('name'),j['properties'].get('ISO3166-2'))
