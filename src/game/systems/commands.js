import { emit } from './events.js';
// Queue is derived runtime state. submit drains synchronously before returning;
// no accepted-but-uncommitted command can be included in a saved checkpoint.
const queues=new WeakMap();
export function submitCommand(s,command,apply) {
  if(!command||typeof command.id!=='string'||command.id.length>120||!Number.isSafeInteger(command.sequence)||!command.payload||typeof command.payload!=='object')return {ok:false,message:'Command không hợp lệ.'};
  const signature=JSON.stringify({type:command.type,payload:command.payload}),prior=s.commandReceipts.find(r=>r.id===command.id);
  if(prior)return prior.signature===signature&&prior.sequence===command.sequence?structuredClone(prior.result):{ok:false,message:'ID đã dùng cho command khác.'};
  const queue=queues.get(s)||[];queues.set(s,queue);
  if(command.sequence!==s.commandSequence+queue.length+1)return {ok:false,message:'Thứ tự command không hợp lệ.'};
  const entry={command:structuredClone(command),signature,result:null};queue.push(entry);
  while(queue.length){
    const current=queue.shift(),c=current.command;
    current.result=apply(c);s.commandSequence=c.sequence;
    s.commandReceipts.push({id:c.id,sequence:c.sequence,seconds:s.clock.seconds,signature:current.signature,result:structuredClone(current.result)});
    emit(s,'command',c.id,{typeName:c.type,ok:current.result.ok});
  }
  return entry.result;
}
