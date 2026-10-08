export function accountFields(mode,input){
  const username=typeof input.username==='string'?input.username.trim().toLowerCase():'';
  if(!/^[a-z0-9_]{3,24}$/.test(username))throw new Error('Tài khoản cần 3–24 ký tự: chữ a–z, số hoặc dấu gạch dưới.');
  const out={username};
  if(['register','login','codes','recover'].includes(mode)){
    if(typeof input.password!=='string'||input.password.length<(mode==='login'?1:8)||new TextEncoder().encode(input.password).length>128)throw new Error('Mật khẩu cần ít nhất 8 ký tự, tối đa 128 byte.');
    out.password=input.password; // Never trim or lowercase passwords.
  }
  if(mode==='register'){
    const cityName=typeof input.cityName==='string'?input.cityName.trim():'';
    if(!cityName||[...cityName].length>36||/[\u0000-\u001f\u007f]/.test(cityName))throw new Error('Tên thành phố cần 1–36 ký tự.');
    if(typeof input.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(input.requestId))throw new Error('Yêu cầu đăng ký không hợp lệ. Hãy tải lại trang.');
    Object.assign(out,{cityName,requestId:input.requestId});
  }
  if(mode==='recover'){
    const code=typeof input.code==='string'?input.code.toUpperCase().replace(/[\s-]/g,''):'';
    if(!/^[A-F0-9]{48}$/.test(code))throw new Error('Mã dự phòng gồm 48 ký tự; kiểm tra lại mã bạn đã giữ.');
    out.code=code;
  }
  return out;
}
