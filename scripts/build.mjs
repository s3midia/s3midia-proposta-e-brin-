import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
await mkdir('public',{recursive:true});await mkdir('templates',{recursive:true});
await cp('static','public',{recursive:true});await cp('source/brand','public/admin/brand',{recursive:true});
let form=await readFile('source/briefing.php','utf8');
form=form.slice(form.indexOf('<!DOCTYPE html>'));
form=form.replaceAll('<?= e($clientName) ?>','@@NAME@@').replaceAll('<?= e($clientToken) ?>','@@TOKEN@@');
form=form.replace(/<input[^>]*name="csrf_token"[^\n]*\n/g,'');
form=form.replace(/<\?= \$formError !== '' \? ' show' : '' \?>/g,'');
form=form.replace(/<\?= e\(\$formError[\s\S]*?\?>/g,'Preencha os campos obrigatórios desta etapa antes de continuar.');
form=form.replace(/const serverErrorField = .*;/,'const serverErrorField = null;').replace(/const storageKey = .*;/,"const storageKey = 's3-briefing-@@TOKEN@@-v3';");
form=form.replace("form.addEventListener('submit', (e) => {","form.addEventListener('submit', async (e) => {\n    e.preventDefault();");
form=form.replace("submitBtn.textContent = 'Enviando...';",`submitBtn.textContent = 'Enviando...';
    try {
      const answers={};
      for(const [key,value] of new FormData(form)) {
        if(['client_token','csrf_token','bot-field'].includes(key)) continue;
        const cleanKey=key.replace(/\\[\\]$/, '').replaceAll(' ','_').replaceAll('.','_');
        if(answers[cleanKey]!==undefined) answers[cleanKey]=[].concat(answers[cleanKey],value); else answers[cleanKey]=value;
      }
      const response=await fetch('/api/app?action=submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'@@TOKEN@@',answers})});
      const result=await response.json();if(!response.ok)throw Error(result.error);
      localStorage.removeItem(storageKey);document.body.replaceChildren(Object.assign(document.createElement('h1'),{textContent:'Briefing recebido. Obrigado!'}));
    } catch(error) { errorBox.textContent=error.message;errorBox.classList.add('show');submitBtn.disabled=false;submitBtn.textContent='Enviar briefing'; }
`);
if(form.includes('<?'))throw Error('PHP residual no formulário');
await writeFile('templates/briefing.html',form);
let proposals=await readFile('source/proposals.php','utf8');
proposals=proposals.replace(/<\?php[\s\S]*?\?>/g,'');
proposals=proposals.replace('<script>',`<script>
    const cloudValues=/* CLOUD_VALUES */ {};
    const localStorage={getItem:key=>cloudValues[key]??null,setItem:(key,value)=>{cloudValues[key]=String(value)},removeItem:key=>{delete cloudValues[key]}};
    window.s3CloudValues=()=>Object.fromEntries(Object.entries(cloudValues).filter(([key])=>['s3-catalogo-v1','s3-proposta-rascunho-v2','s3-propostas-historico-v1'].includes(key)));
`);
proposals=proposals.replace(/fetch\('\/admin\/ai-status.php'\)[^\n]+/,"$('aiStatus').textContent='A geração por IA abre o aplicativo publicado. Salve suas propostas no painel ao terminar.';");
proposals=proposals.replaceAll('Proposta salva no histórico deste navegador.','Proposta adicionada ao histórico. Clique em Salvar propostas no Firebase no painel.');
proposals=proposals.replaceAll('Padrão salvo neste navegador.','Padrão atualizado. Salve no Firebase pelo painel.');
await writeFile('public/proposals.html',proposals);
