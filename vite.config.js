import {defineConfig,loadEnv} from 'vite';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
function localAccounts(){return {name:'bc26-local-server-api',configureServer(server){
  server.middlewares.use('/api/missions',async(req,res)=>{const env={...loadEnv('development',process.cwd(),''),...process.env,NODE_ENV:'development'};res.status=n=>{res.statusCode=n;return res;};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};try{let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>2048){res.status(413).json({error:'Yêu cầu quá lớn.'});return;}chunks.push(chunk);}req.body=Buffer.concat(chunks).toString('utf8');const {missionHandler}=await import('./server/missions.js');await missionHandler({env})(req,res);}catch{res.status(503).json({error:'Máy chủ nhiệm vụ tạm thời không đáp ứng.'});}});
  server.middlewares.use('/api/account',async(req,res)=>{
    const env={...loadEnv('development',process.cwd(),''),...process.env,NODE_ENV:'development'};
    res.status=n=>{res.statusCode=n;return res;};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
    let size=0,chunks=[];try{for await(const chunk of req){size+=chunk.length;if(size>8192){res.status(413).json({error:'Yêu cầu quá lớn.'});return;}chunks.push(chunk);}req.body=Buffer.concat(chunks).toString('utf8');const {accountHandler}=await import('./server/accounts.js');await accountHandler({env})(req,res);}catch{res.status(503).json({error:'Máy chủ tài khoản tạm thời không đáp ứng.'});}
  });
}};}
function offlineBuild(){return {name:'bc26-public-offline-shell',generateBundle(_,bundle){
  // Vite emits HTML after user generateBundle hooks; list both shell entries explicitly.
  const assets=[...new Set(['/index.html','/benchmark.html',...Object.keys(bundle).filter(p=>/\.(html|js|css)$/.test(p)).map(p=>'/'+p)])];
  const template=readFileSync(resolve('scripts/offline-worker.template.js'),'utf8');
  const build=createHash('sha256').update(JSON.stringify(assets)+template+readFileSync(resolve('index.html'),'utf8')+readFileSync(resolve('benchmark.html'),'utf8')).digest('hex').slice(0,16);
  const source=template.replace('__BUILD_ID__',JSON.stringify(build)).replace('__ASSET_PATHS__',JSON.stringify(assets));
  this.emitFile({type:'asset',fileName:'service-worker.js',source});
}};}
export default defineConfig({plugins:[offlineBuild(),localAccounts()],build:{rollupOptions:{input:{game:resolve('index.html'),benchmark:resolve('benchmark.html')}}}});
