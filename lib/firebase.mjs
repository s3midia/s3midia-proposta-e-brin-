import {initializeApp, getApps, cert} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
export function services() {
  const projectId=process.env.FIREBASE_PROJECT_ID;
  if(projectId!=='s3midia-proposta-e-brin') throw new Error('Projeto Firebase incorreto ou ausente');
  if(!getApps().length) initializeApp({credential:cert({projectId,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,'\n')})});
  return {db:getFirestore(),auth:getAuth()};
}
export async function authorize(req) {
  const token=(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!token) throw Object.assign(new Error('Entre no painel.'),{status:401});
  let user;
  try { user=await services().auth.verifyIdToken(token,true); } catch { throw Object.assign(new Error('Sessão inválida.'),{status:401}); }
  const emails=(process.env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase());
  if(!user.email_verified||!emails.includes(user.email?.toLowerCase())) throw Object.assign(new Error('Acesso não autorizado.'),{status:403});
  return user;
}
