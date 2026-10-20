import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,createEmptyCity,index} from '../src/game/core.js';
import {formatMoney} from '../src/config/money.js';
import {CATALOG} from '../src/config/catalog.js';
import {operationsMarkup,facilityOperationsMarkup,serviceActors} from '../src/ui/operations-panel.js';
import {reconcileEducation,schoolSnapshot} from '../src/game/systems/education.js';
import {healthcareFacilitySnapshot} from '../src/game/systems/healthcare.js';
import {reconcileMunicipal} from '../src/game/systems/municipal-jobs.js';
import {initializeLogistics,reconcileLogistics,logisticsSnapshot} from '../src/game/systems/logistics.js';
import {leisureSnapshot} from '../src/game/systems/leisure.js';

test('all five live operations tabs are usable for a new city; money stays in BC conversion',()=>{
 const s=createEmptyCity();
 for(const mode of ['education','health','municipal','logistics','leisure']){
  const html=operationsMarkup(s,mode);assert.ok(html.includes(`data-operations-panel="${mode}"`));assert.equal((html.match(/data-operations-mode=/g)||[]).length,5);assert.ok(!html.includes('undefined'));assert.ok(!html.includes('NaN'));
 }
 assert.ok(operationsMarkup(s,'education').includes(formatMoney(CATALOG.school.cost)));
 assert.ok(operationsMarkup(s,'unsupported').includes('data-operations-panel="education"'));
 assert.match(operationsMarkup(s,'logistics'),/Chưa có mẫu/);assert.match(operationsMarkup(s,'education'),/Chưa có cơ sở/);
 assert.equal(facilityOperationsMarkup(s,0),'');assert.deepEqual(serviceActors(s),[]);
});

test('education and healthcare show actual staff presence, attendance, beds and queue',()=>{
 const s=createCity(),school=index(10,14),clinic=index(10,20),ctx=reconcileEducation(s),r=ctx.byTile.get(school);assert.ok(r);
 for(const c of s.citizens)if(r.staff.includes(c.id)){c.state='at-work';c.goal=school;c.journey=null;}
 const student=s.citizens.find(c=>r.pupils.includes(c.id));assert.ok(student);student.state='at-school';student.goal=school;student.journey=null;student.study.lastAttendanceDay=0;
 const schoolNow=schoolSnapshot(s,school),html=facilityOperationsMarkup(s,school);
 assert.ok(html.includes(`${schoolNow.present} / ${schoolNow.staff.length}`));assert.ok(html.includes(`${schoolNow.pupils.length} / ${schoolNow.inClass}`));assert.ok(html.includes(`data-operations-person="${student.id}"`));assert.ok(html.includes('Hoàn thành buổi học hôm nay'));
 const patient=s.citizens.find(c=>c.age>=18&&!r.staff.includes(c.id));healthcareFacilitySnapshot(s,clinic);Object.assign(patient.care,{phase:'waiting',tile:clinic,assetId:s.tiles[clinic].assetId});patient.state='at-clinic';patient.goal=clinic;patient.journey=null;
 const health=healthcareFacilitySnapshot(s,clinic),careHtml=facilityOperationsMarkup(s,clinic);assert.equal(health.waiting,1);assert.ok(careHtml.includes(`${health.freeBeds} / 1`));assert.ok(careHtml.includes(`data-operations-person="${patient.id}"`));assert.ok(careHtml.includes('Nhân viên chưa tới cơ sở'));
});

test('user text and actor IDs cannot escape operations attributes and lists are bounded',()=>{
 const s=createCity();operationsMarkup(s,'health');
 for(let i=0;i<100;i++)s.citizens.push({...structuredClone(s.citizens[0]),id:`people-${i}"><script>attack</script>`,nameVi:'<img src=x onerror=attack>',care:{phase:'requesting'}});
 const html=operationsMarkup(s,'health');assert.equal((html.match(/data-operations-person=/g)||[]).length,30);assert.ok(html.includes('Hiển thị 30/'));assert.ok(!html.includes('<script>attack'));assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img src=x onerror=attack&gt;'));assert.ok(html.includes('&quot;&gt;&lt;script&gt;'));
});

test('freight and service rows use the actual runtime positions, cargo, art names and ledger',()=>{
 const s=createCity();reconcileMunicipal(s);initializeLogistics(s);
 const depot=s.municipal.depots[0],v=depot.fleet[0];v.jobId='active-job';v.state='outbound';v.position={x:80,y:90,z:0};v.goal=index(12,17);v.speed=5;
 s.logistics.trucks.push({id:'freight-live',kind:'freight',orderId:'order-live',goods:'food',quantity:7,state:'travelling',position:{x:50,y:55,z:0},speed:3,travelled:80,heading:1,journey:{destination:index(19,17),path:[{x:50,y:55,z:0},{x:60,y:55,z:0}]},waitReason:'Đợi đèn xanh'});
 s.clock.seconds=1000;s.ledger.entries.push({id:'tax-current',seconds:900,category:'logistics-sales-tax',amount:10},{id:'cost-current',seconds:900,category:'logistics-production',amount:-3},{id:'tax-old',seconds:399,category:'logistics-sales-tax',amount:500});
 const actors=serviceActors(s);assert.equal(actors.find(a=>a.id===v.id),v);const freight=actors.find(a=>a.id==='freight-live');assert.equal(freight.artId,'pv-refrigerated-truck');assert.deepEqual(freight.position,{x:50,y:55,z:0});assert.equal(freight.journey,s.logistics.trucks[0].journey);assert.equal(freight.cargo.quantity,7);
 const html=operationsMarkup(s,'logistics'),stats=logisticsSnapshot(s);assert.ok(html.includes('data-operations-track="freight-live"'));assert.ok(html.includes(`data-operations-track="${v.id}"`));assert.ok(html.includes('7 / 24 thùng Thực phẩm'));assert.ok(html.includes('Đợi đèn xanh'));assert.ok(html.includes(formatMoney(10)));assert.ok(html.includes(formatMoney(3)));assert.ok(!html.includes(formatMoney(510)));assert.equal(stats.cargo.food,7);
});

test('park counters reflect real visits, health of planted trees and vacancy without fabricated attendance',()=>{
 const s=createCity(),x=leisureSnapshot(s);assert.equal(x.present,0);
 const row=x.rows[0],visitor=s.citizens[0];Object.assign(visitor.leisure,{phase:'visiting',tile:row.tile,assetId:row.assetId});visitor.state='at-park';visitor.goal=row.tile;visitor.journey=null;
 s.leisure.parks.find(p=>p.tile===row.tile).trees[0].health=20;
 const now=leisureSnapshot(s),html=facilityOperationsMarkup(s,row.tile);assert.equal(now.present,1);assert.equal(now.healthyTrees,x.healthyTrees-1);assert.ok(html.includes(`1 / ${row.capacity}`));assert.ok(html.includes(`data-operations-person="${visitor.id}"`));assert.ok(html.includes(`${row.trees.length-1} / ${row.trees.length}`));
});

test('each new logistics facility exposes inventory, production costs and actionable build/tile controls',()=>{
 const s=createEmptyCity(),tile=index(5,17);Object.assign(s.tiles[tile],{kind:'farm',assetId:'farm-runtime',active:false,connected:false,power:false,water:false,sewage:false});reconcileLogistics(s);
 const html=facilityOperationsMarkup(s,tile);assert.ok(html.includes('Chưa nối đường về cổng'));assert.ok(html.includes('Nông sản / nguyên liệu'));assert.ok(html.includes('Thu hoạch tại nông trại'));assert.ok(html.includes('0 / 30 giây game'));assert.ok(html.includes('data-operations-mode="logistics"'));assert.equal(html.includes(`data-operations-tile="${tile}"`),false); // Inspector is already at this building.
 const panel=operationsMarkup(s,'logistics');assert.ok(panel.includes(`data-operations-tile="${tile}"`));assert.ok(panel.includes('data-operations-build="farm"'));assert.ok(panel.includes('data-operations-build="freightWarehouse"'));assert.ok(panel.includes('data-operations-build="foodFactory"'));assert.match(panel,/Doanh số cửa hàng thuộc chủ cửa hàng/);
});

test('idle fleet links to its depot and active system cards do not repeat the current screen',()=>{
 const s=createCity(),html=operationsMarkup(s,'municipal');
 assert.ok(html.includes('Đến trạm'));assert.equal(html.includes('data-operations-track='),false);
 const depot=s.municipal.depots[0];assert.ok(depot);assert.ok(html.includes(`data-operations-tile="${depot.tile}"`));
 assert.equal(html.includes('>Xem hệ thống</button>'),false);
 const inspector=facilityOperationsMarkup(s,depot.tile);assert.ok(inspector.includes('>Xem hệ thống</button>'));
});
