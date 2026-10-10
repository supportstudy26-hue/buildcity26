import { calendar } from './clock.js';
export function recordCash(s, id, category, amount, reference=null) {
  if(s.ledger.receipts.includes(id))return false;
  s.money+=amount;s.ledger.receipts.push(id);
  s.ledger.entries.push({id,seconds:s.clock.seconds,category,amount,reference});
  // Detailed journal retained for 24 months; checkpoint retains reconciled opening cash.
  if(s.ledger.entries.length>3000){const e=s.ledger.entries.shift();s.ledger.openingCash+=e.amount;}
  return true;
}
export function dailyFinance(s) {
  const id=`daily-${s.day}`,m=s.metrics,d=calendar(s.clock.seconds-1);
  recordCash(s,`${id}-income`,'legacy-tax-estimate',(s.mobilityVersion===1?m.taxIncome:m.income)/d.daysInMonth);
  recordCash(s,`${id}-expense`,'maintenance-and-interest',-m.expenses/d.daysInMonth);
}
export function cashBalance(s) { return s.ledger.openingCash+s.ledger.entries.reduce((n,e)=>n+e.amount,0); }
