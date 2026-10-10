// Rendering only. These limits never remove residents, vehicles or saved journeys.
export function actorBudget(_population,quality='medium',mobile=false){
 return quality==='low'||mobile?30:50;
}
// Bounded nearest selection: O(candidates × log(limit)); only keep limit references.
// A tracked actor wins over distance and remains selectable under the same cap.
export function nearestActors(candidates,limit,follow=null){
 if(limit<=0)return [];
 const heap=[],rank=a=>a.c.id===follow?-1:a.d;
 const swap=(i,j)=>{[heap[i],heap[j]]=[heap[j],heap[i]];};
 for(const actor of candidates){
  if(heap.length<limit){heap.push(actor);let i=heap.length-1;while(i){const parent=(i-1)>>1;if(rank(heap[parent])>=rank(heap[i]))break;swap(i,parent);i=parent;}}
  else if(rank(actor)<rank(heap[0])){heap[0]=actor;let i=0;while(true){const left=i*2+1,right=left+1;let largest=i;if(left<heap.length&&rank(heap[left])>rank(heap[largest]))largest=left;if(right<heap.length&&rank(heap[right])>rank(heap[largest]))largest=right;if(largest===i)break;swap(i,largest);i=largest;}}
 }
 return heap.sort((a,b)=>rank(a)-rank(b));
}
