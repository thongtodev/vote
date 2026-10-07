import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {clone,diffRows,applyChanges,mergeChanges} from '../public/sync-core.js';
const row=()=>({id:'one',mail:'a@example.com',pass:'test-only',recipient:'An',cooldownHours:15,createdAt:1,votes:{'2026-10-07':100}});
test('a field update preserves simultaneous edits to other fields and vote days',()=>{const a=row(),b=clone(a);b.mail='new@example.com';const remote=clone(a);remote.recipient='Bình';remote.votes['2026-10-08']=200;const merged=applyChanges([remote],diffRows([a],[b]))[0];assert.equal(merged.mail,b.mail);assert.equal(merged.recipient,'Bình');assert.equal(merged.votes['2026-10-08'],200);});
test('new row, edits while saving, deleted vote and deleted row',()=>{const a=row(),b=clone(a);b.cooldownHours=1.5;delete b.votes['2026-10-07'];const merged=mergeChanges(diffRows([],[a]),diffRows([a],[b]));assert.deepEqual(applyChanges([],merged),[b]);assert.deepEqual(applyChanges([b],diffRows([b],[])),[]);});
test('failed older writes merge beneath newer unsaved edits',()=>{const a=row(),b=clone(a),c=clone(a);b.mail='first';c.mail='second';c.pass='different';const queued=mergeChanges(diffRows([a],[b]),diffRows([b],[c]));assert.deepEqual(applyChanges([a],queued),[c]);});
test('clearing a vote does not delete the other days',()=>{const a=row();a.votes['2026-10-08']=200;const b=clone(a);delete b.votes['2026-10-07'];assert.deepEqual(applyChanges([a],diffRows([a],[b]))[0].votes,{'2026-10-08':200});});
test('timer, migration, custom hours, midnight and grouping',()=>{const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8').split('const blank=')[0],ctx);vm.runInContext(fs.readFileSync(new URL('../public/groups.js',import.meta.url),'utf8').split('let collapsedGroups=')[0],ctx);vm.runInContext(`
 const stamp=voteTimestamp('2026-10-07','18:00');
 const r=normalizeRow({id:'a',recipient:'An',voteAt:stamp});
 if(r.cooldownHours!==15||remaining(latestVote(r),voteTimestamp('2026-10-08','00:00'),15)!==32400)throw Error('Midnight');
 if(remaining(stamp,stamp,1.5)!==5400)throw Error('Custom duration');
 if(fillDays(['2026-10-07'],'2026-10-09').length!==3)throw Error('Daily columns');
 if(groupAccounts([r,{...r,id:'b',recipient:' an '}]).length!==1)throw Error('Grouping');
 if(validHours(0)||validHours(-1)||validHours(NaN))throw Error('Invalid duration');
 `,ctx);});
