import {sendVerification} from './verification.js';
const $=id=>document.getElementById(id);let idToken='',clients=[],workspace=null,loadedFrame=false;
const message=s=>$('message').textContent=s;
async function api(action,body){const response=await fetch('/api/app?action='+action,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+idToken},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok)throw Error(data.error||'Falha ao salvar');return data;}
function text(tag,s){const el=document.createElement(tag);el.textContent=s;return el;}
$('loginForm').onsubmit=async e=>{e.preventDefault();try{message('Entrando…');const cfg=await api('config');if(!cfg.apiKey)throw Error('Configure o aplicativo web do Firebase na Vercel.');const form=new FormData(e.target);const response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+encodeURIComponent(cfg.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.get('email'),password:form.get('password'),returnSecureToken:true})});const data=await response.json();if(!response.ok)throw Error('Não foi possível entrar. Confira o e-mail e a senha.');idToken=data.idToken;await loadClients();e.target.reset();$('login').hidden=true;$('panel').hidden=false;$('logout').hidden=false;message('');}catch(err){idToken='';message(err.message);}};
const originalLogin=$('loginForm').onsubmit;
const verificationButton=document.createElement('button');
verificationButton.type='submit';verificationButton.textContent='Enviar e-mail de verificação';
$('loginForm').append(verificationButton);
const verificationHint=document.createElement('p');
verificationHint.textContent='Primeiro acesso? Preencha seu e-mail e senha e clique em Enviar e-mail de verificação. Confirme o link recebido (confira também o spam), volte aqui e clique em Entrar.';
verificationHint.className='verification-hint';
document.querySelector('.access-panel').append(verificationHint);
let verifying=false;
$('loginForm').onsubmit=async e=>{
  if(verifying){e.preventDefault();return;}
  if(e.submitter!==verificationButton)return originalLogin(e);
  e.preventDefault();verifying=true;verificationButton.disabled=true;
  try{
    message('Enviando verificação…');
    const cfg=await api('config');
    if(!cfg.apiKey)throw Error('Configure o aplicativo web do Firebase na Vercel.');
    const form=new FormData(e.target);
    const response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+encodeURIComponent(cfg.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.get('email'),password:form.get('password'),returnSecureToken:true})});
    const data=await response.json();
    if(!response.ok)throw Error('Não foi possível entrar. Confira o e-mail e a senha.');
    await sendVerification(cfg.apiKey,data.idToken);
    e.target.elements.password.value='';
    message('E-mail de verificação enviado. Confira sua caixa de entrada e o spam. Após confirmar o link, digite sua senha e clique em Entrar.');
  }catch(err){message(err.message);}
  finally{verifying=false;verificationButton.disabled=false;}
};
$('logout').onclick=()=>location.reload();
let googleAuth,googleSdk;
async function prepareGoogle(){
  const cfg=await api('config');
  if(!cfg.apiKey)throw Error('Login Google indisponível. Use e-mail e senha.');
  const [appSdk,authSdk]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js')]);
  googleSdk=authSdk;
  googleAuth=authSdk.getAuth(appSdk.initializeApp({apiKey:cfg.apiKey,projectId:cfg.projectId,authDomain:cfg.projectId+'.firebaseapp.com'}));
  googleAuth.languageCode='pt-BR';
  await authSdk.setPersistence(googleAuth,authSdk.inMemoryPersistence);
  $('googleLogin').disabled=false;
}
prepareGoogle().catch(()=>{$('googleLogin').disabled=false;$('googleLogin').title='Se não carregar, use e-mail e senha.';});
$('googleLogin').onclick=async()=>{
  if(!googleAuth){message('Não foi possível carregar o login Google. Atualize a página ou use e-mail e senha.');return;}
  if(verifying)return;
  verifying=true;$('googleLogin').disabled=true;
  try{
    const provider=new googleSdk.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
    const result=await googleSdk.signInWithPopup(googleAuth,provider);
    idToken=await result.user.getIdToken();
    await loadClients();
    $('loginForm').reset();$('login').hidden=true;$('panel').hidden=false;$('logout').hidden=false;message('');
  }catch(error){
    idToken='';
    message(error.code==='auth/popup-closed-by-user'?'Login cancelado. Você pode tentar novamente.':error.code==='auth/popup-blocked'?'Permita pop-ups para este site e tente novamente.':error.code==='auth/account-exists-with-different-credential'?'Esta conta já usa outro método. Entre com e-mail e senha.':error.message==='Acesso não autorizado.'?'Esta conta não tem acesso ao painel. Use a conta autorizada da S3 Mídia.':'Não foi possível entrar com Google. Tente novamente ou use e-mail e senha.');
  }finally{
    if(googleAuth)await googleSdk.signOut(googleAuth).catch(()=>{});
    verifying=false;$('googleLogin').disabled=false;
  }
};
async function loadClients(){clients=await api('clients');$('clients').replaceChildren(text('h2','Todos os clientes'));for(const client of clients){const row=document.createElement('article');row.append(text('strong',client.nome),text('p',client.status==='concluido'?'Concluído':'Pendente'));const link=document.createElement('a');link.href='/?c='+client.id;link.textContent='Abrir formulário';link.target='_blank';link.rel='noopener';row.append(link);const copy=text('button','Copiar link');copy.onclick=()=>navigator.clipboard.writeText(location.origin+'/?c='+client.id).then(()=>message('Link copiado')).catch(()=>message(location.origin+'/?c='+client.id));row.append(copy);const view=text('button','Ver respostas');view.onclick=async()=>{try{const responses=await api('responses&id='+client.id);$('responses').hidden=false;$('responses').replaceChildren(text('h2',client.nome));for(const response of responses){$('responses').append(text('h3',response.enviado_em));const dl=document.createElement('dl');for(const [q,a]of Object.entries(response.respostas))dl.append(text('dt',q),text('dd',Array.isArray(a)?a.join(', '):a));$('responses').append(dl);}if(!responses.length)$('responses').append(text('p','Ainda não há respostas.'));}catch(err){message(err.message);}};row.append(view);if(client.status==='concluido'){const reopen=text('button','Reabrir formulário');reopen.onclick=async()=>{try{await api('reopen',{id:client.id});await loadClients();}catch(err){message(err.message);}};row.append(reopen);}$('clients').append(row);}}
$('clientForm').onsubmit=async e=>{e.preventDefault();try{const {token}=await api('clients',Object.fromEntries(new FormData(e.target)));e.target.reset();await loadClients();message('Link criado: '+location.origin+'/?c='+token);}catch(err){message(err.message);}};
function area(proposals){$('briefingsView').hidden=proposals;$('proposalsView').hidden=!proposals;$('briefings').setAttribute('aria-pressed',String(!proposals));$('proposals').setAttribute('aria-pressed',String(proposals));}
$('briefings').onclick=()=>area(false);
$('proposals').onclick=async()=>{area(true);if(loadedFrame)return;try{workspace=await api('workspace');const html=await (await fetch('/proposals.html')).text();const frame=$('proposalFrame');frame.onload=()=>{$('sync').textContent='Carregado do Firebase. Clique em salvar após editar.';loadedFrame=true;};const seed=JSON.stringify(workspace.values).replaceAll('<','\\u003c');frame.srcdoc=html.replace('/* CLOUD_VALUES */ {}',seed);}catch(err){message(err.message);}};
$('saveCloud').onclick=async()=>{if(!loadedFrame)return;$('saveCloud').disabled=true;try{const values=$('proposalFrame').contentWindow.s3CloudValues();const result=await api('workspace',{values,revision:workspace.revision});workspace={values,revision:result.revision};$('sync').textContent='Propostas, catálogo e rascunho salvos no Firebase.';}catch(err){$('sync').textContent=err.message+' Suas alterações continuam nesta aba; baixe uma cópia antes de sair.';}finally{$('saveCloud').disabled=false;}};
$('downloadBackup').onclick=()=>{if(!loadedFrame)return;const blob=new Blob([JSON.stringify($('proposalFrame').contentWindow.s3CloudValues(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='s3-propostas-backup.json';a.click();URL.revokeObjectURL(url);};
