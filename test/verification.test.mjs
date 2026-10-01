import test from 'node:test';
import assert from 'node:assert/strict';
import {sendVerification} from '../static/verification.js';
test('envia verificação para o titular autenticado sem transmitir senha',async()=>{
  await sendVerification('public-key','user-token',async(url,options)=>{
    assert.match(url,/accounts:sendOobCode/);
    assert.deepEqual(JSON.parse(options.body),{requestType:'VERIFY_EMAIL',idToken:'user-token'});
    assert.equal(options.headers['X-Firebase-Locale'],'pt-BR');return {ok:true};
  });
});
test('não informa envio bem-sucedido quando Firebase recusa',async()=>{
  await assert.rejects(sendVerification('key','token',async()=>({ok:false,status:400})),/Não foi possível/);
});
test('orienta aguardar quando envio é limitado',async()=>{
  await assert.rejects(sendVerification('key','token',async()=>({ok:false,status:429})),/Aguarde/);
});
