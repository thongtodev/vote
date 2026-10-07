function labelDay(day){return day.split('-').reverse().join('/');}
function render(){
 const head=$('headers');head.replaceChildren();
 for(const label of ['#','Tài khoản mail','Pass','Người nhận','Số giờ chờ']){const th=document.createElement('th');th.textContent=label;head.append(th);}
 for(const day of days){const th=document.createElement('th');th.textContent='Vote '+labelDay(day);if(day===activeDay){th.className='today-cell';const caption=document.createElement('span');caption.className='day-caption';caption.textContent='HÔM NAY';th.append(caption);}head.append(th);}
 for(const label of ['Đếm ngược','']){const th=document.createElement('th');th.textContent=label;head.append(th);}
 const body=$('rows');body.replaceChildren();const query=$('search').value.toLowerCase().trim();let shown=0;
 groupAccounts(rows).forEach(group=>{
  const matching=group.items.filter(({row})=>!query||`${row.mail} ${row.recipient}`.toLowerCase().includes(query));if(!matching.length)return;
  const collapsed=!query&&collapsedGroups.has(group.key);
  const groupRow=document.createElement('tr');groupRow.className='group-row';groupRow.dataset.group=group.key;
  const groupCell=document.createElement('td');groupCell.colSpan=head.children.length;
  const bar=document.createElement('div');bar.className='group-bar';
  const toggle=button((collapsed?'▸ ':'▾ ')+group.name, (collapsed?'Mở rộng nhóm ':'Thu gọn nhóm ')+group.name,'group-toggle',()=>{if(collapsedGroups.has(group.key))collapsedGroups.delete(group.key);else collapsedGroups.add(group.key);saveGroups();render();});toggle.setAttribute('aria-expanded',String(!collapsed));
  const status=document.createElement('span');status.className='group-status';
  const groupAdd=button('＋ Thêm mail','Thêm mail cho '+group.name,'group-add',()=>addToGroup(group.key?group.items[0].row.recipient:''));
  bar.append(toggle,status,groupAdd);groupCell.append(bar);groupRow.append(groupCell);body.append(groupRow);
  matching.forEach(({row,index})=>{shown++;
  const tr=document.createElement('tr');tr.dataset.id=row.id;tr.hidden=collapsed;
  const cell=()=>{const td=document.createElement('td');tr.append(td);return td;};
  const number=cell();number.className='number';number.textContent=String(index+1).padStart(2,'0');
  cell().append(field(row,'mail','Nhập email'));
  const pw=document.createElement('div');pw.className='password';const pass=field(row,'pass','Nhập mật khẩu','password');
  const toggle=button('Hiện','Hiện mật khẩu','icon',()=>{const hidden=pass.type==='password';pass.type=hidden?'text':'password';toggle.textContent=hidden?'Ẩn':'Hiện';toggle.setAttribute('aria-label',hidden?'Ẩn mật khẩu':'Hiện mật khẩu');});pw.append(pass,toggle);cell().append(pw);
  const recipient=field(row,'recipient','Tên người nhận');
  recipient.addEventListener('change',()=>{collapsedGroups.delete(recipientKey(row.recipient));saveGroups();setTimeout(render,0);});
  cell().append(recipient);
  const hoursCell=cell();const hours=document.createElement('input');hours.type='number';hours.className='cell time';hours.min='0.01';hours.max='8760';hours.step='any';hours.value=row.cooldownHours;hours.setAttribute('aria-label','Số giờ chờ của tài khoản');
  const hoursHint=document.createElement('small');hoursHint.className='due';hoursHint.textContent='giờ · ví dụ: 12, 15, 24';
  hours.addEventListener('input',()=>{const value=hours.valueAsNumber;if(!validHours(value)){hours.setCustomValidity('Nhập số giờ lớn hơn 0 và không quá 8760.');hoursHint.textContent='Nhập số > 0, tối đa 8760 giờ';hoursHint.style.color='#a36725';return;}hours.setCustomValidity('');hoursHint.textContent='giờ · tính từ lần vote mới nhất';hoursHint.style.color='';row.cooldownHours=value;save();tick();});
  hours.addEventListener('blur',()=>{if(!validHours(hours.valueAsNumber)){hours.value=row.cooldownHours;hours.setCustomValidity('');hoursHint.textContent='Đã giữ mức '+row.cooldownHours+' giờ';hoursHint.style.color='';}});
  hoursCell.append(hours,hoursHint);
  for(const day of days){
   const td=cell();if(day===activeDay)td.className='today-cell';
   const input=document.createElement('input');input.type='time';input.className='cell time';input.setAttribute('aria-label','Giờ vote ngày '+labelDay(day));input.value=Number.isFinite(row.votes[day])?timeValue(row.votes[day]):'';
   input.addEventListener('change',()=>{const stamp=voteTimestamp(day,input.value);if(stamp===null)delete row.votes[day];else row.votes[day]=stamp;save();tick();});td.append(input);
   const actions=document.createElement('div');actions.className='time-tools';
   if(day===activeDay)actions.append(button('Vừa vote','Ghi giờ vote hiện tại','textbtn',()=>{
    if(remaining(latestVote(row),Date.now(),row.cooldownHours)>0&&!confirm('Đang còn thời gian chờ. Ghi lần vote mới và bắt đầu lại '+row.cooldownHours+' giờ?'))return;
    const now=Date.now();row.votes[dayKey(now)]=now;input.value=timeValue(now);save();tick();
   }));
   actions.append(button('Xóa giờ','Xóa giờ vote ngày '+labelDay(day),'textbtn',()=>{delete row.votes[day];input.value='';save();tick();}));td.append(actions);
  }
  const counter=cell();const count=document.createElement('div');count.className='countdown';const due=document.createElement('small');due.className='due';const track=document.createElement('div');track.className='track';const fill=document.createElement('div');fill.className='fill';track.append(fill);counter.append(count,due,track);
  cell().append(button('×','Xóa dòng '+(index+1),'icon',()=>{if((row.mail||row.pass||row.recipient||latestVote(row)!==null)&&!confirm('Xóa tài khoản và toàn bộ lịch sử vote của tài khoản này?'))return;rows=rows.filter(r=>r!==row);save();render();}));body.append(tr);
 });
 });$('empty').hidden=shown!==0;tick();
}
function tick(){
 const now=Date.now(),today=dayKey(now);
 if(today!==activeDay){activeDay=today;days=fillDays(days,today);save();render();return;}
 let waiting=0,ready=0;for(const row of rows){const left=remaining(latestVote(row),now,row.cooldownHours);if(left>0)waiting++;if(left===0)ready++;}
 const byId=new Map(rows.map(r=>[r.id,r]));
 for(const tr of $('rows').children){const row=byId.get(tr.dataset.id);if(!row)continue;const stamp=latestVote(row),left=remaining(stamp,now,row.cooldownHours);const count=tr.querySelector('.countdown'),due=tr.querySelector('.due'),track=tr.querySelector('.track');count.className='countdown'+(left===null?' empty':left===0?' ready':'');count.textContent=left===null?'Chưa nhập giờ':left===0?'✓ Có thể vote lại':formatLeft(left);due.textContent=left===null?'Bộ đếm sẽ hiện ở đây':'Vote lại: '+new Date(stamp+waitMs(row)).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'});track.hidden=left===null||left===0;tr.querySelector('.fill').style.width=(left===null?0:Math.max(0,Math.min(100,(1-left/(row.cooldownHours*3600))*100)))+'%';}
 const grouped=new Map(groupAccounts(rows).map(g=>[g.key,g]));
 for(const tr of $('rows').children){if(!tr.classList.contains('group-row'))continue;const group=grouped.get(tr.dataset.group);if(!group)continue;const available=group.items.filter(({row})=>remaining(latestVote(row),now,row.cooldownHours)===0).length;tr.querySelector('.group-status').textContent=group.items.length+' tài khoản'+(available?' · '+available+' có thể vote':'');}
 $('total').textContent=rows.filter(r=>r.mail||r.pass||r.recipient||latestVote(r)!==null).length;$('waiting').textContent=waiting;$('ready').textContent=ready;$('clock').textContent='Giờ máy: '+new Date(now).toLocaleString('vi-VN');
}
function add(){addToGroup();}
$('add').onclick=$('addBottom').onclick=()=>{$('search').value='';add();};$('search').addEventListener('input',render);document.addEventListener('visibilitychange',tick);
$('collapseAll').onclick=()=>{collapsedGroups=new Set(groupAccounts(rows).map(g=>g.key));$('search').value='';saveGroups();render();};
$('expandAll').onclick=()=>{collapsedGroups.clear();saveGroups();render();};
save();render();setInterval(tick,1000);
