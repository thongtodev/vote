'use strict';
const KEY='vote-clock-v2';
function validHours(value){return Number.isFinite(value)&&value>0&&value<=8760;}
function waitMs(row){return row.cooldownHours*3600000;}
const $=id=>document.getElementById(id);
function dayKey(stamp=Date.now()){const d=new Date(stamp);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function validDay(day){if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;return dayKey(new Date(day+'T12:00:00').getTime())===day;}
function voteTimestamp(day,value){if(!validDay(day)||!/^\d{2}:\d{2}$/.test(value))return null;const [h,m]=value.split(':').map(Number);if(h>23||m>59)return null;return new Date(day+'T'+value+':00').getTime();}
function timeValue(stamp){const d=new Date(stamp);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
function latestVote(row){const values=Object.values(row.votes).filter(Number.isFinite);return values.length?Math.max(...values):null;}
function remaining(stamp,now=Date.now(),hours=15){return stamp===null?null:Math.max(0,Math.ceil((stamp+hours*3600000-now)/1000));}
function formatLeft(s){return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(x=>String(x).padStart(2,'0')).join(':');}
function fillDays(list,today){const dates=[...new Set([...list.filter(validDay),today])].sort();let day=dates[0];const set=new Set(dates);while(day<today){set.add(day);const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+1);day=dayKey(d.getTime());}return [...set].sort();}
function normalizeRow(r){const votes={};if(r.votes&&typeof r.votes==='object'){for(const [day,stamp] of Object.entries(r.votes)){if(validDay(day)&&Number.isFinite(stamp))votes[day]=stamp;}}else if(Number.isFinite(r.voteAt)){votes[dayKey(r.voteAt)]=r.voteAt;}return {id:r.id,mail:String(r.mail||''),pass:String(r.pass||''),recipient:String(r.recipient||''),cooldownHours:validHours(r.cooldownHours)?r.cooldownHours:15,createdAt:Number.isFinite(r.createdAt)?r.createdAt:0,votes};}
const blank=()=>({id:crypto.randomUUID(),mail:'',pass:'',recipient:'',cooldownHours:15,createdAt:Date.now(),votes:{}});
let rows=[],days=[dayKey()],activeDay=dayKey(),storageBlocked=false;
function save(){if(window.cloudSave)window.cloudSave({days:[...days],rows:JSON.parse(JSON.stringify(rows))});}
window.VoteApp={
 getState:()=>({days:[...days],rows:JSON.parse(JSON.stringify(rows))}),
 replaceState(state){rows=state.rows.map(normalizeRow);days=fillDays([...state.days,...rows.flatMap(r=>Object.keys(r.votes))],dayKey());activeDay=dayKey();render();},
 ready(value){document.querySelector('main').inert=!value;},
 status(message){$('saveState').textContent=message;$('cloudStatus').textContent=message;}
};
