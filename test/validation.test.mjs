import test from 'node:test';import assert from 'node:assert/strict';import {answers,validToken} from '../lib/validation.mjs';
test('aceita respostas com consentimento e múltiplas opções',()=>{assert.deepEqual(answers({Consentimento:'Sim',Áreas:['Civil','Rural']}),{Consentimento:'Sim',Áreas:['Civil','Rural']});});
test('recusa consentimento ausente e valores estruturados',()=>{assert.throws(()=>answers({Nome:'Pedro'}));assert.throws(()=>answers({Consentimento:'Sim',Nome:{x:1}}));});
test('recusa respostas excessivas',()=>assert.throws(()=>answers({Consentimento:'Sim',Nome:'a'.repeat(5001)})));
test('valida links individuais',()=>{assert.ok(validToken('a'.repeat(48)));assert.ok(!validToken('../clientes'));assert.ok(!validToken('a'.repeat(47)));});
