export function answers(input) {
  if(!input||Array.isArray(input)||typeof input!=='object'||Object.keys(input).length>120) throw new Error('Respostas inválidas');
  const result={}; let total=0;
  for(const [key,value] of Object.entries(input)) {
    if(!key.trim()||key.length>180||['__proto__','constructor','prototype'].includes(key)) throw new Error('Campo inválido');
    const values=Array.isArray(value)?value:[value];
    if(values.length>30||values.some(x=>typeof x!=='string'||x.length>5000)) throw new Error('Resposta muito extensa');
    total+=values.join('').length;
    result[key]=Array.isArray(value)?values.map(x=>x.trim()):value.trim();
  }
  if(total>120000||result.Consentimento!=='Sim') throw new Error('Revise as respostas e autorize o envio.');
  return result;
}
export const validToken=t=>typeof t==='string'&&/^[a-f0-9]{48}$/.test(t);
