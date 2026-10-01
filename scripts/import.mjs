// Entrada: exportação JSON autorizada da hospedagem: {clientes:[],respostas:[]}.
import {readFile} from 'node:fs/promises';import {services} from '../lib/firebase.mjs';import {validToken} from '../lib/validation.mjs';
const file=process.argv[2];if(!file)throw Error('Informe o arquivo JSON de exportação. Use --apply para gravar.');
const data=JSON.parse(await readFile(file,'utf8'));const ids=new Map();
if(!Array.isArray(data.clientes)||!Array.isArray(data.respostas))throw Error('Exportação inválida');
for(const client of data.clientes){if(!validToken(client.token)||!client.nome||ids.has(String(client.id)))throw Error('Cliente inválido ou duplicado');ids.set(String(client.id),client.token);}
for(const response of data.respostas){if(!ids.has(String(response.cliente_id)))throw Error('Resposta sem cliente');JSON.parse(response.respostas_json);}
console.log(`${data.clientes.length} clientes e ${data.respostas.length} respostas validados.`);
if(!process.argv.includes('--apply')){console.log('Simulação concluída. Nenhuma gravação realizada.');process.exit(0);}
const db=services().db;
for(const c of data.clientes){const ref=db.collection('clientes').doc(c.token);await db.runTransaction(async tx=>{if((await tx.get(ref)).exists)return;tx.create(ref,{legacyId:String(c.id),nome:c.nome,email:c.email||'',telefone:c.telefone||'',status:c.status,criado_em:c.criado_em,concluido_em:c.concluido_em||null});});}
for(const r of data.respostas){const ref=db.collection('clientes').doc(ids.get(String(r.cliente_id))).collection('respostas').doc('legacy-'+r.id);await db.runTransaction(async tx=>{if((await tx.get(ref)).exists)return;tx.create(ref,{respostas:JSON.parse(r.respostas_json),enviado_em:r.enviado_em});});}
console.log('Importação concluída sem substituir documentos existentes.');
