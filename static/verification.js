export async function sendVerification(apiKey, idToken, request = fetch) {
  const response = await request('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=' + encodeURIComponent(apiKey), {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-Firebase-Locale': 'pt-BR'},
    body: JSON.stringify({requestType: 'VERIFY_EMAIL', idToken})
  });
  if (!response.ok) {
    if (response.status === 429) throw Error('Muitas tentativas. Aguarde alguns minutos antes de reenviar.');
    throw Error('Não foi possível enviar a verificação. Tente novamente em alguns minutos.');
  }
}
