"""Build versioned ODbL boundary/hydro + Terrarium DEM packages, offline.
python prepare-vietnam.py FILTERED_OSM_DIR CACHE_DIR OUTPUT_DIR
Input geometry date MUST be declared with --osm-date. No invented fallback.
"""
import argparse,json,pathlib,hashlib,math,concurrent.futures,requests,numpy as np
import unicodedata
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import threading
local=threading.local()
def session():
 if not hasattr(local,"session"):
  local.session=requests.Session();local.session.mount("https://",HTTPAdapter(max_retries=Retry(total=4,backoff_factor=1,status_forcelist=[429,500,502,503,504])))
 return local.session
from PIL import Image
from shapely.geometry import shape,mapping,Point,box,LineString
from shapely.ops import unary_union,transform
from shapely import contains_xy,make_valid,prepare,points,line_locate_point,line_interpolate_point,get_x,get_y,length
from shapely.strtree import STRtree
from pyproj import Transformer
p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('cache');p.add_argument('output');p.add_argument('--osm-date',required=True);a=p.parse_args()
root=pathlib.Path(a.input);cache=pathlib.Path(a.cache);out=pathlib.Path(a.output);cache.mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
provenance=json.loads((root/'input-manifest.json').read_text())
if provenance['osmDate']!=a.osm_date:raise ValueError('Input capture date differs from --osm-date')
def rows(name):return [json.loads(l) for l in (root/(name+'.jsonseq')).read_text().splitlines()]
def dump(path,data):path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
def norm(s):return s.removeprefix('Tỉnh ').removeprefix('Thành phố ')
def match(s):return ''.join(c for c in unicodedata.normalize('NFD',norm(s).lower().replace('đ','d')) if not unicodedata.combining(c) and not c.isspace())
admins={norm(f['properties'].get('name','')):f for f in rows('admin') if f['geometry']['type'] in ['Polygon','MultiPolygon'] and f['properties'].get('ISO3166-2','').startswith('VN-')}
places=rows('places');waters=rows('water');coasts=rows('coast');watergeom=[make_valid(shape(f['geometry'])) for f in waters];coastgeom=[shape(f['geometry']) for f in coasts if f['geometry']['type']=='LineString'];wt=STRtree(watergeom);ct=STRtree(coastgeom)
catalog=json.loads((pathlib.Path(__file__).parent/'catalog-source.json').read_text());features=[];regions=[];used=[];checks=[]
for code,name,kind,aliases,settlement in catalog:
 # Known whole-province mergers from NQ 202/2025/QH15, not arbitrary name remapping.
 sources=[admins[x] for x in aliases];used.extend(f['id'] for f in sources);g=unary_union([make_valid(shape(f['geometry'])) for f in sources]);assert g.is_valid and not g.is_empty
 label=g.representative_point();simple=g.simplify(.0006,preserve_topology=True)
 if not simple.covers(label):label=simple.representative_point()
 candidates=[f for f in places if f['geometry']['type']=='Point' and any(match(f['properties'].get(k,''))==match(settlement) for k in ['name','name:vi','name:en']) and g.covers(shape(f['geometry']))]
 anchor=shape(candidates[0]['geometry']) if candidates else g.representative_point();lng,lat=anchor.x,anchor.y
 features.append({'type':'Feature','id':code,'properties':{'name':name,'label':[label.x,label.y]},'geometry':mapping(simple)})
 regions.append({'id':code+'-start','provinceId':code,'name':'Khu '+settlement,'anchor':[lng,lat],'anchorSource':candidates[0]['id'] if candidates else 'interior-point','aliases':aliases,'provinceName':name,'kind':kind,'boundaryIds':[f['id'] for f in sources]})
 checks.append({'id':code,'valid':g.is_valid,'anchorInside':g.covers(anchor),'labelInside':simple.covers(label),'partsBefore':len(g.geoms) if hasattr(g,'geoms') else 1,'partsAfter':len(simple.geoms) if hasattr(simple,'geoms') else 1})
assert len(set(used))==63 and len(features)==34
# An island option uses an actual source settlement point, keeping coordinates.
island=next((f for f in places if f['geometry']['type']=='Point' and norm(f['properties'].get('name','')) in ['Dương Đông','Phú Quốc']),None)
if island:
 g=unary_union([shape(admins[x]['geometry']) for x in ['An Giang','Kiên Giang']]);assert g.covers(shape(island['geometry']))
 regions.append({'id':'91-island','provinceId':'91','name':'Đảo Phú Quốc · khu phía tây','anchor':island['geometry']['coordinates'],'anchorSource':island['id'],'provinceName':'An Giang','kind':'province'})
estuary=next(f for f in places if f['geometry']['type']=='Point' and f['properties'].get('name')=='Cần Thạnh')
g=original_hcm=unary_union([shape(admins[x]['geometry']) for x in ['Hồ Chí Minh','Bình Dương','Bà Rịa - Vũng Tàu']]);assert g.covers(shape(estuary['geometry']))
regions.append({'id':'79-coast','provinceId':'79','name':'Cần Thạnh · cửa sông ven biển','anchor':estuary['geometry']['coordinates'],'anchorSource':estuary['id'],'provinceName':'Hồ Chí Minh','kind':'city'})
dump(out/'boundaries.geojson',{'type':'FeatureCollection','features':features})
# Shared boundary simplification may introduce small gaps: report, never certify legal topology.
original=[unary_union([shape(admins[x]['geometry']) for x in aliases]) for _,_,_,aliases,_ in catalog]
simplified=[shape(f['geometry']) for f in features]
overlaps=sum(original[i].intersection(original[j]).area for i in range(34) for j in range(i+1,34))
checks.append({'originalOverlapSquareDegrees':overlaps,'simplificationToleranceDegrees':.0006,'legalBoundaryCertified':False})
dump(out/'validation.json',checks)
# Get required z12 tiles for all projected windows; each HTTP request cached/checksummed.
z=12;scale=256*2**z
def pixel(lon,lat):return ((lon+180)/360*scale,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*scale)
plans=[];needed=set()
for r in regions:
 lon,lat=r['anchor'];epsg=32600+int((lon+180)//6)+1;fw=Transformer.from_crs(4326,epsg,always_xy=True);back=Transformer.from_crs(epsg,4326,always_xy=True);cx,cy=fw.transform(lon,lat)
 corners=[back.transform(cx+x,cy+y) for x in [-6400,6400] for y in [-6400,6400]];px=[pixel(*c) for c in corners]
 keys=[(x,y) for x in range(int(min(v[0] for v in px)//256),int(max(v[0] for v in px)//256)+1) for y in range(int(min(v[1] for v in px)//256),int(max(v[1] for v in px)//256)+1)];needed.update(keys);plans.append((r,epsg,fw,back,cx,cy,keys))
def fetch(key):
 x,y=key;path=cache/f'{z}-{x}-{y}.png';meta=path.with_suffix('.json');url=f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
 if not path.exists():
  rr=session().get(url,timeout=90);rr.raise_for_status();Image.open(__import__('io').BytesIO(rr.content)).verify();path.write_bytes(rr.content);dump(meta,{'url':url,'lastModified':rr.headers.get('Last-Modified'),'imagerySources':rr.headers.get('x-amz-meta-x-imagery-sources'),'versionId':rr.headers.get('x-amz-version-id'),'sha256':hashlib.sha256(rr.content).hexdigest()})
 return key
print('DEM tiles',len(needed),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(fetch,sorted(needed)))
for r,epsg,fw,back,cx,cy,keys in plans:
 # Raster assembled by decoded pixels; retain physical metres, no vertical exaggeration.
 tiles={k:np.asarray(Image.open(cache/f'{z}-{k[0]}-{k[1]}.png').convert('RGB'),dtype=float) for k in keys}
 def sample(xs,ys):
  lo,la=back.transform(xs,ys);px=(lo+180)/360*scale;py=(1-np.arcsinh(np.tan(np.radians(la)))/np.pi)/2*scale
  result=np.full(px.shape,np.nan)
  for (tx,ty),img in tiles.items():
   mask=(np.floor(px/256)==tx)&(np.floor(py/256)==ty);rgb=img[np.floor(py[mask]%256).astype(int),np.floor(px[mask]%256).astype(int)];result[mask]=rgb[:,0]*256+rgb[:,1]+rgb[:,2]/256-32768
  assert np.isfinite(result).all();return np.round(result,2)
 regionbox=box(cx-6400,cy-6400,cx+6400,cy+6400);ll=transform(back.transform,regionbox);localcoast=[transform(fw.transform,coastgeom[i]) for i in ct.query(ll.buffer(.3))];localtree=STRtree(localcoast) if localcoast else None
 candidates=wt.query(ll);polys=[];lines=[];hydro=[]
 for i in candidates:
  gg=transform(fw.transform,watergeom[i]).intersection(regionbox)
  if gg.is_empty:continue
  tags=waters[i]['properties'];hydro.append({'type':'Feature','geometry':mapping(gg.simplify(8,preserve_topology=True)),'properties':{'name':tags.get('name',''),'water':tags.get('water',tags.get('waterway','water')),'tidal':tags.get('tidal')}})
  if gg.geom_type in ['Polygon','MultiPolygon']:polys.append((gg,3 if tags.get('tidal')=='yes' else 2))
  else:lines.append(gg)
 def mask(xs,ys):
  ans=np.zeros(xs.shape,dtype=np.uint8)
  for geom,kind in polys:
   prepare(geom);ans[contains_xy(geom,xs,ys)]=kind
  # OSM coast ways have land on their left; classify from nearest directed way.
  if localtree:
   pts=points(xs.ravel(),ys.ravel());indices=localtree.nearest(pts);llines=np.asarray(localcoast,dtype=object)[indices];d=line_locate_point(llines,pts)
   q0=line_interpolate_point(llines,np.maximum(0,d-.2));q1=line_interpolate_point(llines,np.minimum(length(llines),d+.2))
   cross=(get_x(q1)-get_x(q0))*(ys.ravel()-get_y(q0))-(get_y(q1)-get_y(q0))*(xs.ravel()-get_x(q0))
   ans.reshape(-1)[cross<0]=1
  return ans
 n=80;xx,yy=np.meshgrid(np.linspace(cx-6400,cx+6400,n+1),np.linspace(cy+6400,cy-6400,n+1));hh=sample(xx,yy);mx,my=np.meshgrid(np.linspace(cx-6320,cx+6320,n),np.linspace(cy+6320,cy-6320,n));mm=mask(mx,my)
 sl=np.maximum.reduce([abs(hh[:-1,1:]-hh[:-1,:-1]),abs(hh[1:,:-1]-hh[:-1,:-1]),abs(hh[1:,1:]-hh[:-1,1:]),abs(hh[1:,1:]-hh[1:,:-1])])/160*100
 # The first playable patch is 64x64 at real 20m spacing, not a compressed 12.8km city.
 xx,yy=np.meshgrid(np.linspace(cx-640,cx+640,65),np.linspace(cy+640,cy-640,65));h=sample(xx,yy);xx,yy=np.meshgrid(np.linspace(cx-630,cx+630,64),np.linspace(cy+630,cy-630,64));m=mask(xx,yy)
 slope=np.maximum.reduce([abs(h[:-1,1:]-h[:-1,:-1]),abs(h[1:,:-1]-h[:-1,:-1]),abs(h[1:,1:]-h[:-1,1:]),abs(h[1:,1:]-h[1:,:-1])])/20*100
 # A legitimate starter connector needs land, below 15% grade, within province.
 pg=original[[c[0] for c in catalog].index(r['provinceId'])];prepare(pg);plon,plat=back.transform(xx,yy);owned=contains_xy(pg,plon,plat);allowed=(m==0)&(slope<=15)&owned&(h[:-1,:-1]>=0)&(h[1:,1:]>=0)
 entries=[(y,x) for y in range(64) for x in range(60) if allowed[y,x:x+4].all() and allowed[max(0,y-1):min(64,y+2),x:x+4].sum()>=8]
 if not entries:raise RuntimeError('No usable starter in '+r['id']+'; choose another source anchor, never flatten terrain')
 ey,ex=min(entries,key=lambda yx:abs(yx[0]-18)+abs(yx[1]-11));r['entryTile']=ey*64+ex;r['startable']=True
 stats={'landKm2':round(float((mm==0).sum()*160**2/1e6),2),'waterKm2':round(float((mm!=0).sum()*160**2/1e6),2),'seaKm2':round(float((mm==1).sum()*160**2/1e6),2),'minElevation':float(hh.min()),'maxElevation':float(hh.max()),'meanSlopePercent':round(float(sl.mean()),1),'buildablePercent':round(float(((mm==0)&(sl<=15)).mean()*100),1),'coastDistanceMeters':round(min((g.distance(Point(cx,cy)) for g in localcoast),default=float('inf'))) if localcoast else None,'riverDistanceMeters':round(min((g.distance(Point(cx,cy)) for g in lines),default=float('inf'))) if lines else None}
 pkg={'version':'vn-20261008','region':r,'crs':f'EPSG:{epsg}','utmCenter':[cx,cy],'widthMeters':12800,'context':{'cells':80,'cellMeters':160,'heights':hh.ravel().tolist(),'waterMask':mm.ravel().tolist()},'playable':{'cells':64,'cellMeters':20,'heights':h.ravel().tolist(),'waterMask':m.ravel().tolist(),'insideProvince':owned.astype(np.uint8).ravel().tolist()},'stats':stats,'hydro':hydro,'demTiles':[json.loads((cache/f'{z}-{x}-{y}.json').read_text()) for x,y in keys]}
 path=out/(r['id']+'.json');dump(path,pkg);r['sha256']=hashlib.sha256(path.read_bytes()).hexdigest();r['bytes']=path.stat().st_size;r['stats']=stats
 print(r['id'],r['name'],stats,'bytes',r['bytes'],flush=True)
# Metadata labels pin administrative effective dates separate from spatial capture date.
admin=[{'id':c,'name':name,'kind':kind,'aliases':aliases,'effectiveDate':{'75':'2026-04-30','22':'2026-09-01','24':'2026-09-20'}.get(c,'2025-07-01'),'regions':[r for r in regions if r['provinceId']==c]} for c,name,kind,aliases,_ in catalog]
manifest={'version':'vn-20261008','administrativeVerifiedAt':'2026-10-08','administrativeSource':'https://chinhphu.vn/thong-tin-tinh-thanh','codeSource':'https://vanban.chinhphu.vn/?classid=1&docid=214409&pageid=27160','boundarySource':'https://files.openstreetdata.org/extracts/VN.geo.jsonseq.bz2','osmDate':a.osm_date,'boundaryMethod':'union of 63 OSM polygons according to whole-province mergers in NQ 202/2025/QH15','spatialLegalCertification':False,'hydroDate':a.osm_date,'demSource':'https://registry.opendata.aws/terrain-tiles/','demEdition':'Mapzen terrain v1.1 / 2017; exact tile Last-Modified and imagery sources in each package','demResolution':'SRTM nominal 30m; z12 pixel ground resolution 35–38m in Vietnam, nearest-neighbour sampled to game grid; ETOPO1 ocean bathymetry substantially coarser','verticalDatum':'mixed published source datums; SRTM EGM96, ETOPO1 sea level; no surveyed VN datum conversion certified','nodata':'invalid/missing download aborts build; no procedural substitution','license':'ODbL-1.0 for OSM-derived boundary/hydro database; USGS/NOAA public-domain terrain, source attribution retained','attribution':'© OpenStreetMap contributors; extracts OpenStreetData. SRTM/GMTED USGS; ETOPO1 NOAA; terrain tiles Mapzen.','limitations':['Spatial OSM snapshot predates 2025 mergers; grouping checked, legal boundary vertices not certified.','Simplified outlines retain components; full shared topology validation pending.','Land cover, tidal heights, river directions/levels and estuary salinity not surveyed.','Preview 12.8km; playable patch currently 1.28km. Chunk purchase/12.8km detailed simulation pending.'],'files':{p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in out.glob('*') if p.is_file() and p.name not in ['manifest.json','catalog.json']}}
dump(out/'catalog.json',{'version':manifest['version'],'administrativeVerifiedAt':'2026-10-08','provinces':admin})
manifest.update({k:provenance[k] for k in ['inputSHA256','inputBytes']})
manifest['files']['catalog.json']={'bytes':(out/'catalog.json').stat().st_size,'sha256':hashlib.sha256((out/'catalog.json').read_bytes()).hexdigest()}
dump(out/'manifest.json',manifest)
