function recipientKey(name){return name.trim().replace(/\s+/g,' ').normalize('NFC').toLocaleLowerCase('vi-VN');}
function groupAccounts(accounts){const groups=new Map();accounts.forEach((row,index)=>{const key=recipientKey(row.recipient);if(!groups.has(key))groups.set(key,{key,name:row.recipient.trim().replace(/\s+/g,' ')||'Chưa có người nhận',items:[]});groups.get(key).items.push({row,index});});return [...groups.values()];}
let collapsedGroups=new Set();
try{const saved=JSON.parse(localStorage.getItem('vote-clock-collapsed')||'[]');if(Array.isArray(saved))collapsedGroups=new Set(saved.filter(x=>typeof x==='string'));}catch(e){}
function saveGroups(){try{localStorage.setItem('vote-clock-collapsed',JSON.stringify([...collapsedGroups]));}catch(e){}}
function addToGroup(recipient=''){
 const row=blank();row.recipient=recipient;rows.push(row);collapsedGroups.delete(recipientKey(recipient));$('search').value='';saveGroups();save();render();
 const tr=[...$('rows').children].find(tr=>tr.dataset.id===row.id);if(tr){tr.scrollIntoView({behavior:'smooth',block:'nearest'});tr.querySelector('input').focus();}
}
