import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {services,authorize} from '../lib/firebase.mjs';
import {answers,validToken} from '../lib/validation.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  const url=new URL(req.url,'https://local.invalid');
  const action=url.searchParams.get('action');
  try {
    if(req.method==='POST'&&req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host) return res.status(403).json({error:'Origem inválida'});
    if(action==='config') return res.json({apiKey:process.env.FIREBASE_WEB_API_KEY||'',projectId:'s3midia-proposta-e-brin'});
    if(!action) {
      const token=url.searchParams.get('c');
      if(!token) return res.redirect('/admin/');
      if(!validToken(token)) return res.status(404).send('Link inválido');
      const snap=await services().db.collection('clientes').doc(token).get();
      if(!snap.exists) return res.status(404).send('Link inválido');
      if(snap.data().status==='concluido') return res.status(200).send('Briefing já recebido. Obrigado!');
      const html=await readFile(new URL('../templates/briefing.html',import.meta.url),'utf8');
      res.setHeader('Content-Type','text/html; charset=utf-8');
      return res.send(html.replaceAll('@@NAME@@',esc(snap.data().nome)).replaceAll('@@TOKEN@@',token));
    }
    if(action==='submit'&&req.method==='POST') {
      const body=req.body;
      if(!validToken(body?.token)) return res.status(400).json({error:'Link inválido'});
      let data; try {data=answers(body.answers);} catch(e) {return res.status(422).json({error:e.message});}
      const db=services().db, ref=db.collection('clientes').doc(body.token);
      await db.runTransaction(async tx=>{
        const snap=await tx.get(ref);
        if(!snap.exists) throw Object.assign(new Error('Link inválido'),{status:404});
        if(snap.data().status==='concluido') throw Object.assign(new Error('Briefing já recebido'),{status:409});
        const now=new Date().toISOString();
        tx.create(ref.collection('respostas').doc(),{respostas:data,enviado_em:now});
        tx.update(ref,{status:'concluido',concluido_em:now});
      });
      return res.json({ok:true});
    }
    const user=await authorize(req), db=services().db;
    if(action==='clients'&&req.method==='GET') {
      const clients=await db.collection('clientes').orderBy('criado_em','desc').get();
      return res.json(clients.docs.map(d=>({id:d.id,...d.data()})));
    }
    if(action==='clients'&&req.method==='POST') {
      const {nome,email='',telefone=''}=req.body||{};
      if(typeof nome!=='string'||!nome.trim()||nome.length>180||typeof email!=='string'||email.length>254||typeof telefone!=='string'||telefone.length>40) return res.status(422).json({error:'Dados inválidos'});
      const token=randomBytes(24).toString('hex');
      await db.collection('clientes').doc(token).create({nome:nome.trim(),email,telefone,status:'pendente',criado_em:new Date().toISOString()});
      return res.json({token});
    }
    if(action==='responses'&&req.method==='GET') {
      const token=url.searchParams.get('id'); if(!validToken(token)) return res.status(400).json({error:'Cliente inválido'});
      const result=await db.collection('clientes').doc(token).collection('respostas').orderBy('enviado_em','desc').get();
      return res.json(result.docs.map(d=>({id:d.id,...d.data()})));
    }
    if(action==='reopen'&&req.method==='POST') {
      if(!validToken(req.body?.id)) return res.status(400).json({error:'Cliente inválido'});
      await db.collection('clientes').doc(req.body.id).update({status:'pendente',concluido_em:null});
      return res.json({ok:true});
    }
    if(action==='workspace') {
      const ref=db.collection('propostas').doc(user.uid);
      if(req.method==='GET') {const snap=await ref.get();return res.json(snap.exists?snap.data():{revision:0,values:{}});}
      if(req.method==='POST') {
        const {values,revision}=req.body||{};
        const allowed=['s3-catalogo-v1','s3-proposta-rascunho-v2','s3-propostas-historico-v1'];
        if(!values||typeof values!=='object'||Array.isArray(values)||Object.keys(values).some(k=>!allowed.includes(k))||Object.values(values).some(v=>typeof v!=='string')||JSON.stringify(values).length>700000||!Number.isInteger(revision)) return res.status(422).json({error:'Propostas inválidas ou muito extensas'});
        await db.runTransaction(async tx=>{const snap=await tx.get(ref); if((snap.data()?.revision||0)!==revision) throw Object.assign(new Error('As propostas mudaram em outro dispositivo. Recarregue antes de salvar.'),{status:409});tx.set(ref,{values,revision:revision+1,updatedAt:new Date().toISOString()});});
        return res.json({revision:revision+1});
      }
    }
    return res.status(404).json({error:'Página não encontrada'});
  } catch(error) {const status=error.status||503; if(!error.status) console.error('Firebase request failed',error.code||'configuration');return res.status(status).json({error:error.status?error.message:'Configure a conexão segura com o Firebase para continuar.'});}
}
