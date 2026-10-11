import {packArchive,unpackArchive} from './archive-codec.js';
// Persist before deleting anything remotely. Retry the exact state/IDs after a
// lost response, including after reload; never award starting capital twice.
export class CityReplacement {
  constructor({storage=globalThis.localStorage,send,uuid=()=>crypto.randomUUID()}) {Object.assign(this,{storage,send,uuid});this.busy=false;}
  key(owner){return `bc26:replacement:${owner}`;}
  pending(owner){const raw=this.storage.getItem(this.key(owner));return raw?JSON.parse(unpackArchive(raw)):null;}
  async replace(owner,{oldCities,state},apply){
    if(this.busy)throw new Error('Đang thay thành phố. Chờ một chút.');
    this.busy=true;
    try{
      let request=this.pending(owner);
      if(!request){request={oldCities:oldCities.map(({id,revision})=>({id,revision:Number(revision)})),id:this.uuid(),requestId:this.uuid(),name:state.name,state};this.storage.setItem(this.key(owner),packArchive(JSON.stringify(request)));}
      let row;
      try{row=await this.send(request);}
      catch(error){
        // A definite CAS rejection did not delete the old city. Start again
        // only after the player reviews its new revision and confirms anew.
        // Timeouts/network errors still keep the exact durable request.
        if(error.code==='PT409'&&/BC26_CONFLICT: old city list changed/.test(error.message||''))this.storage.removeItem(this.key(owner));
        throw error;
      }
      if(row.id!==request.id||!Number.isSafeInteger(Number(row.revision))||Number(row.revision)<1)throw new Error('Phản hồi thành phố mới không hợp lệ. Thử lại để đối soát.');
      await apply(row);
      this.storage.removeItem(this.key(owner));
      return row;
    }finally{this.busy=false;}
  }
}
