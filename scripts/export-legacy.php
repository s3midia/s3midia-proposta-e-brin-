<?php
// Executar somente por terminal na hospedagem; não publicar como página web.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
if ($argc !== 2) { fwrite(STDERR, "Informe o caminho absoluto de briefing-config.php\n"); exit(1); }
$config = require $argv[1];
$db = $config['db'];
$pdo = new PDO('mysql:host='.$db['host'].';dbname='.$db['name'].';charset=utf8mb4', $db['user'], $db['pass'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$pdo->beginTransaction();
$clients = $pdo->query('SELECT id,nome,email,telefone,token,status,criado_em,concluido_em FROM clientes')->fetchAll();
$responses = $pdo->query('SELECT id,cliente_id,respostas_json,enviado_em FROM respostas')->fetchAll();
$pdo->commit();
echo json_encode(['clientes'=>$clients,'respostas'=>$responses], JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR);
