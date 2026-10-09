import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createCity} from '../src/game/core.js';
import {createVietnamCity} from '../src/game/geography/city.js';
import {GEO_VERSION,validateRegion} from '../src/game/geography/data.js';

// Read only bundled, checksummed public geography. No URL or snapshot from
// the client is accepted by the account server.
export async function createRegistrationCity(regionId=null){
  if(!regionId)return createCity();
  if(!/^\d{2}-(start|island|coast)$/.test(regionId))throw Object.assign(new Error('Địa phương khởi đầu không hợp lệ.'),{status:400});
  const directory=resolve(process.cwd(),'public','geodata',GEO_VERSION);
  const manifest=JSON.parse(await readFile(resolve(directory,'manifest.json'),'utf8'));
  const catalogBytes=await readFile(resolve(directory,'catalog.json'));
  if(createHash('sha256').update(catalogBytes).digest('hex')!==manifest.files['catalog.json'].sha256)throw new Error('Invalid geography catalog');
  const catalog=JSON.parse(catalogBytes),region=catalog.provinces.flatMap(p=>p.regions).find(r=>r.id===regionId&&r.startable);
  if(!region)throw Object.assign(new Error('Địa phương này chưa có khu xây dựng.'),{status:400});
  const bytes=await readFile(resolve(directory,region.id+'.json'));
  if(bytes.length!==region.bytes||bytes.length>1000000||createHash('sha256').update(bytes).digest('hex')!==region.sha256)throw new Error('Invalid geography package');
  const data=validateRegion(JSON.parse(bytes));
  if(data.region.id!==regionId)throw new Error('Invalid geography identity');
  return createVietnamCity(data,manifest);
}
