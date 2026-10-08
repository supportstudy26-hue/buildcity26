// User override on 08/10/2026: show Vietnamese đồng. Internal BC stays stable
// across saves and formulas. These are game amounts, not construction quotes.
export const DISPLAY_DONG_PER_BC = 1000;
export function formatMoney(bc) {
  const dong=bc*DISPLAY_DONG_PER_BC,amount=Math.abs(dong);
  const divisor=amount>=1e9?1e9:amount>=1e6?1e6:1;
  return (dong/divisor).toLocaleString('vi-VN',{maximumFractionDigits:divisor===1?0:2})+(divisor===1e9?' tỷ':divisor===1e6?' triệu':'')+' ₫';
}
