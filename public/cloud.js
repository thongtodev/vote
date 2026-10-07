import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, doc, collection, setDoc, getDoc, onSnapshot, writeBatch, deleteField } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { clone, diffRows, applyChanges, mergeChanges } from './sync-core.js';
const ui=window.VoteApp;
let db,boardId,boardDay,remote=[],baseline=[],pending=new Map(),inflight=new Map(),timer=null,busy=false,failed=false,ready=false;
function status(text){ui.status(text);}
function editing(){const el=document.activeElement;return el&&el.matches('input')&&document.getElementById('rows').contains(el);}
function applyVisible(){if(!ready||editing())return;const merged=applyChanges(applyChanges(remote,inflight),pending).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)||a.id.localeCompare(b.id));ui.replaceState({rows:merged,days:[boardDay]});baseline=clone(merged);}
document.addEventListener('focusout',()=>setTimeout(applyVisible,0));
function errorText(error){const code=error?.code||'';if(code.includes('operation-not-allowed')||code.includes('configuration-not-found'))return 'Hãy bật Authentication → Anonymous trong Firebase.';if(code.includes('permission-denied'))return 'Chưa có quyền truy cập. Kiểm tra link chia sẻ và Firestore Rules trong README.';if(code.includes('not-found'))return 'Không tìm thấy bảng/dòng. Hãy tải lại trang sau khi giữ lại nội dung đang sửa.';if(code.includes('unauthorized-domain'))return 'Thêm tên miền Vercel vào Firebase Authentication → Authorized domains.';return 'Chưa kết nối/lưu được ('+(code||'network')+'). Kiểm tra mạng và cấu hình Firebase.';}
function hasChanges(){return busy||pending.size>0;}
async function flush(){
 clearTimeout(timer);if(busy||failed||!pending.size)return;
 busy=true;inflight=pending;pending=new Map();status('Đang đồng bộ…');
 try{
  // Each row is independent; updates contain only edited fields.
  const batch=writeBatch(db);
  for(const [id,c] of inflight){const ref=doc(db,'voteBoards',boardId,'rows',id);if(c.deleted)batch.delete(ref);else if(c.put)batch.set(ref,c.put);else{const changes={...c.set};for(const key of c.remove)changes[key]=deleteField();batch.update(ref,changes);}}
  await batch.commit();inflight=new Map();failed=false;document.getElementById('retryCloud').hidden=true;
 }catch(error){pending=mergeChanges(inflight,pending);inflight=new Map();failed=true;document.getElementById('retryCloud').hidden=false;status(errorText(error)+' Nội dung chưa lưu vẫn ở tab này.');}
 finally{busy=false;if(!failed){applyVisible();status(pending.size?'Đang chờ đồng bộ…':'Đã đồng bộ Firebase');if(pending.size)timer=setTimeout(flush,100);}}
}
window.addEventListener('beforeunload',event=>{if(hasChanges()){event.preventDefault();event.returnValue='';}});
window.addEventListener('offline',()=>status('Mất mạng. Giữ tab mở đến khi dữ liệu được đồng bộ.'));
window.addEventListener('online',()=>{if(ready){failed=false;flush();}});
document.getElementById('retryCloud').onclick=()=>{failed=false;flush();};
window.cloudSave=state=>{if(!ready)return;const changes=diffRows(baseline,state.rows);baseline=clone(state.rows);if(!changes.size)return;pending=mergeChanges(pending,changes);status('Chưa đồng bộ…');clearTimeout(timer);if(!failed)timer=setTimeout(flush,500);};
const hex=()=>[...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');
async function start(){
 try{
  const app=initializeApp(firebaseConfig);const auth=getAuth(app);await auth.authStateReady();if(!auth.currentUser)await signInAnonymously(auth);db=getFirestore(app);const uid=auth.currentUser.uid;
  const params=new URLSearchParams(location.hash.slice(1));let key=params.get('key');boardId=params.get('board');let creating=false;
  if(!boardId&&!key){const remembered=localStorage.getItem('vote-clock-shared-link');if(remembered){location.hash=remembered;location.reload();return;}boardId=crypto.randomUUID();key=hex();creating=true;}
  if(!/^[a-zA-Z0-9-]{20,80}$/.test(boardId||'')||! /^[a-f0-9]{64}$/.test(key||''))throw {code:'invalid-share-link'};
  const ref=doc(db,'voteBoards',boardId);
  if(creating){const now=new Date();const startDay=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');await setDoc(ref,{ownerUid:uid,inviteKey:key,startedDay:startDay});}
  const member=doc(db,'voteBoards',boardId,'members',uid);
  if(!(await getDoc(member)).exists())await setDoc(member,{uid,inviteKey:key});
  const board=await getDoc(ref);if(!board.exists())throw {code:'not-found'};boardDay=board.data().startedDay;
  const hash=new URLSearchParams({board:boardId,key}).toString();history.replaceState(null,'','#'+hash);try{localStorage.setItem('vote-clock-shared-link',hash);}catch(e){}
  document.getElementById('copyLink').disabled=false;document.getElementById('newBoard').disabled=false;
  onSnapshot(collection(db,'voteBoards',boardId,'rows'),snapshot=>{
   remote=snapshot.docs.map(d=>({...d.data(),id:d.id}));
   if(!ready){ready=true;ui.ready(true);}applyVisible();if(!hasChanges()&&!failed)status('Đã đồng bộ Firebase');
  },error=>{status(errorText(error));ui.ready(false);ready=false;});
 }catch(error){status(errorText(error));ui.ready(false);}
}
document.getElementById('copyLink').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);status('Đã sao chép link. Người có link được xem và sửa bảng.');}catch(e){prompt('Sao chép link này:',location.href);}};
document.getElementById('newBoard').onclick=()=>{if(hasChanges()){status('Hãy chờ đồng bộ xong trước khi tạo bảng khác.');return;}if(!confirm('Tạo bảng trống riêng? Hãy lưu link bảng hiện tại để quay lại.'))return;localStorage.removeItem('vote-clock-shared-link');location.href=location.pathname+location.search;};
window.addEventListener('hashchange',()=>{if(hasChanges()){status('Có thay đổi chưa lưu. Chờ đồng bộ xong rồi tải lại để đổi bảng.');return;}location.reload();});
start();
