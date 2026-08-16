const ranges = [[1,15],[16,30],[31,45],[46,60],[61,75]];
const letters = ['B','I','N','G','O'];
let drawn = JSON.parse(localStorage.getItem('binggo-drawn') || '[]');
let soundOn = true;
let card = JSON.parse(localStorage.getItem('binggo-card') || 'null');
let marked = new Set(JSON.parse(localStorage.getItem('binggo-marked') || '[]'));
let peer = null;
let hostConnection = null;
let role = null;
let activeRoom = '';
let myName = localStorage.getItem('binggo-name') || '';
let thaiVoice = null;
const clientConnections = new Map();
const roomPlayers = new Map();

const $ = (selector) => document.querySelector(selector);
const board = $('#numberBoard');
const toast = $('#toast');

function bingoName(number) { return `${letters[Math.floor((number - 1) / 15)]} ${number}`; }
function spokenBingoName(number) { return `${['บี','ไอ','เอ็น','จี','โอ'][Math.floor((number-1)/15)]} หมายเลข ${number}`; }
function save() { localStorage.setItem('binggo-drawn', JSON.stringify(drawn)); localStorage.setItem('binggo-card', JSON.stringify(card)); localStorage.setItem('binggo-marked', JSON.stringify([...marked])); }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400); }
function loadThaiVoice() { if(!('speechSynthesis' in window)) return; const voices=speechSynthesis.getVoices(); thaiVoice=voices.find(v=>v.lang.toLowerCase()==='th-th')||voices.find(v=>v.lang.toLowerCase().startsWith('th'))||null; }
function speak(text) { if (!soundOn || !('speechSynthesis' in window)) return; speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'th-TH'; if(thaiVoice) utterance.voice=thaiVoice; utterance.rate = .78; utterance.pitch=1.05; utterance.volume=1; speechSynthesis.speak(utterance); }

function roomId(code) { return `binggo-${code.toLowerCase()}`; }
function makeRoomCode() { const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join(''); }
function setLobbyMessage(message) { $('#connectionNote').textContent=message; }
function enterRoom(kind, code) {
  role=kind; activeRoom=code; document.body.classList.toggle('guest',kind==='player');
  $('#lobby').classList.add('hidden'); $('#roomBar').classList.remove('hidden'); document.querySelector('.hero').classList.remove('hidden');
  $('#roomCode').textContent=code; $('#connectionStatus').textContent='เชื่อมต่อแล้ว';
  $('#callerPanel').classList.toggle('hidden',kind!=='host'); $('#playerPanel').classList.toggle('hidden',kind!=='player');
  if(kind==='player') document.querySelectorAll('.mode').forEach((b,i)=>b.classList.toggle('active',i===1));
}
function renderPlayers(winner='') {
  if(role!=='host') return;
  const names=[myName,...roomPlayers.values()];
  $('#playersList').innerHTML=names.map(name=>`<span class="player-chip${name===winner?' winner':''}">● ${escapeHtml(name)}</span>`).join('');
  $('#playerCount').textContent=`${names.length} คน`;
}
function escapeHtml(value) { const el=document.createElement('span'); el.textContent=value; return el.innerHTML; }
function broadcast(payload) { clientConnections.forEach(conn=>{if(conn.open) conn.send(payload);}); }
function broadcastState() { broadcast({type:'state',drawn,players:[myName,...roomPlayers.values()]}); }
function handleHostConnection(conn) {
  clientConnections.set(conn.peer,conn);
  conn.on('open',()=>{ const name=String(conn.metadata?.name||'ผู้เล่น').slice(0,20); roomPlayers.set(conn.peer,name); renderPlayers(); conn.send({type:'welcome',drawn,players:[myName,...roomPlayers.values()]}); broadcastState(); });
  conn.on('data',data=>{ if(data?.type==='join'){roomPlayers.set(conn.peer,String(data.name||'ผู้เล่น').slice(0,20));renderPlayers();broadcastState();} if(data?.type==='bingo'){const name=roomPlayers.get(conn.peer)||'ผู้เล่น';renderPlayers(name);showToast(`🎉 ${name} ตะโกน BINGO!`);speak(`${name} บิงโก`);} });
  conn.on('close',()=>{clientConnections.delete(conn.peer);roomPlayers.delete(conn.peer);renderPlayers();broadcastState();});
}
function handleGuestData(data) {
  if(data?.type==='welcome'||data?.type==='state'){ drawn=Array.isArray(data.drawn)?data.drawn:[]; save(); renderBoard(); $('#connectionStatus').textContent=`ออนไลน์ • ${data.players?.length||1} คน`; }
  if(data?.type==='new-game'){drawn=[];marked=new Set();save();renderBoard();renderCard();showToast('เจ้าบ้านเริ่มเกมใหม่แล้ว');}
}
function requireName() { const name=$('#playerName').value.trim(); if(!name){setLobbyMessage('กรุณาใส่ชื่อก่อน');$('#playerName').focus();return null;} myName=name.slice(0,20);localStorage.setItem('binggo-name',myName);return myName; }
function createRoom() {
  if(!requireName()) return; if(typeof Peer==='undefined') return setLobbyMessage('โหลดระบบห้องไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ต');
  const code=makeRoomCode(); setLobbyMessage('กำลังสร้างห้อง…'); drawn=[]; marked=new Set(); save();
  peer=new Peer(roomId(code)); peer.on('open',()=>{history.replaceState({},'',`?room=${code}`);enterRoom('host',code);renderPlayers();renderBoard();renderCard();}); peer.on('connection',handleHostConnection); peer.on('error',error=>{setLobbyMessage(error.type==='unavailable-id'?'รหัสห้องซ้ำ กดลองสร้างใหม่':'สร้างห้องไม่สำเร็จ กรุณาลองอีกครั้ง');});
}
function joinRoom() {
  const name=requireName(); if(!name) return; if(typeof Peer==='undefined') return setLobbyMessage('โหลดระบบห้องไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ต');
  const code=$('#roomInput').value.trim().toUpperCase(); if(!/^[A-Z2-9]{6}$/.test(code)) return setLobbyMessage('กรุณาใส่รหัสห้อง 6 ตัว');
  setLobbyMessage('กำลังเข้าห้อง…'); peer=new Peer();
  peer.on('open',()=>{hostConnection=peer.connect(roomId(code),{reliable:true,metadata:{name}});hostConnection.on('open',()=>{history.replaceState({},'',`?room=${code}`);enterRoom('player',code);hostConnection.send({type:'join',name});renderCard();});hostConnection.on('data',handleGuestData);hostConnection.on('close',()=>{$('#connectionStatus').textContent='หลุดจากห้อง';showToast('การเชื่อมต่อกับเจ้าบ้านสิ้นสุดแล้ว');});hostConnection.on('error',()=>setLobbyMessage('เชื่อมต่อห้องไม่สำเร็จ'));});
  peer.on('error',error=>{if(error.type==='peer-unavailable')setLobbyMessage('ไม่พบห้องนี้ หรือเจ้าบ้านปิดหน้าเว็บแล้ว');else setLobbyMessage('เข้าห้องไม่สำเร็จ กรุณาลองอีกครั้ง');});
}

function renderBoard() {
  board.innerHTML = '';
  for (let n = 1; n <= 75; n++) { const el = document.createElement('span'); el.className = `board-number${drawn.includes(n) ? ' drawn' : ''}`; el.textContent = n; board.appendChild(el); }
  $('#drawCount').textContent = drawn.length;
  $('#remainingText').textContent = drawn.length === 75 ? 'ออกครบทุกลูกแล้ว' : `เหลืออีก ${75 - drawn.length} ลูก`;
  const latest = drawn.at(-1);
  if (latest) { $('.ball-letter').textContent = letters[Math.floor((latest - 1) / 15)]; $('.ball-number').textContent = latest; $('#callText').textContent = bingoName(latest); }
}

function drawNumber() {
  if (role !== 'host') return;
  if (drawn.length === 75) return showToast('เลขออกครบแล้ว เริ่มเกมใหม่ได้เลย');
  const available = Array.from({length:75},(_,i)=>i+1).filter(n => !drawn.includes(n));
  const number = available[Math.floor(Math.random() * available.length)];
  drawn.push(number); save(); renderBoard(); broadcastState();
  const ball = $('#currentBall'); ball.classList.remove('pop'); void ball.offsetWidth; ball.classList.add('pop');
  speak(spokenBingoName(number));
}

function makeCard() {
  const columns = ranges.map(([min,max]) => Array.from({length:max-min+1},(_,i)=>i+min).sort(()=>Math.random()-.5).slice(0,5));
  return Array.from({length:25}, (_, index) => columns[index % 5][Math.floor(index / 5)]);
}
function renderCard() {
  if (!card) card = makeCard();
  const el = $('#bingoCard'); el.innerHTML = letters.map(l => `<div class="card-head">${l}</div>`).join('');
  card.forEach((number, i) => { const cell = document.createElement('button'); cell.type = 'button'; const isFree = i === 12; cell.className = `card-cell${isFree || marked.has(i) ? ' marked' : ''}${isFree ? ' free' : ''}`; cell.innerHTML = isFree ? 'FREE<br>ฟรี' : number; cell.addEventListener('click', () => { if (isFree) return; marked.has(i) ? marked.delete(i) : marked.add(i); save(); renderCard(); }); el.appendChild(cell); });
  save();
}
function hasBingo() {
  // A square only counts when the player marked it AND the caller actually drew it.
  const hit = i => i === 12 || (marked.has(i) && drawn.includes(card[i]));
  const lines = [];
  for (let r=0;r<5;r++) lines.push([0,1,2,3,4].map(c=>r*5+c));
  for (let c=0;c<5;c++) lines.push([0,1,2,3,4].map(r=>r*5+c));
  lines.push([0,6,12,18,24],[4,8,12,16,20]);
  return lines.some(line => line.every(hit));
}

document.querySelectorAll('.mode').forEach(button => button.addEventListener('click', () => { if(role!=='host')return; document.querySelectorAll('.mode').forEach(b=>b.classList.remove('active')); button.classList.add('active'); const caller = button.dataset.mode === 'caller'; $('#callerPanel').classList.toggle('hidden', !caller); $('#playerPanel').classList.toggle('hidden', caller); }));
$('#drawButton').addEventListener('click', drawNumber);
$('#newGameButton').addEventListener('click', () => { if (drawn.length && !confirm('ล้างเลขทั้งหมดและเริ่มเกมใหม่ใช่ไหม?')) return; drawn=[]; marked=new Set(); save(); renderBoard(); renderCard(); broadcast({type:'new-game'}); broadcastState(); $('.ball-letter').textContent='–'; $('.ball-number').textContent='?'; $('#callText').textContent='เริ่มเกมกันเลย'; });
$('#newCardButton').addEventListener('click', () => { if (marked.size && !confirm('สุ่มการ์ดใหม่และลบรอยที่แตะไว้ใช่ไหม?')) return; card=makeCard(); marked=new Set(); renderCard(); });
$('#checkButton').addEventListener('click', () => { const won=hasBingo(); const wrong=[...marked].filter(i=>i!==12&&!drawn.includes(card[i])).length; $('#bingoStatus').textContent=won?'🎉 BINGO! ทุกเลขถูกเรียกแล้ว':'ยังไม่บิงโก — ต้องครบแถวและเป็นเลขที่เรียกแล้ว'; showToast(won?'🎉 BINGO! ตรวจเลขผ่านแล้ว!':wrong?`มี ${wrong} ช่องที่ผู้สุ่มยังไม่ได้เรียก`:'ยังไม่บิงโก สู้ต่อไป!'); if(won){speak('บิงโก!');if(role==='player'&&hostConnection?.open)hostConnection.send({type:'bingo'});} });
$('#soundButton').addEventListener('click', (e) => { soundOn=!soundOn; e.currentTarget.textContent=soundOn?'🔊':'🔇'; showToast(soundOn?'เปิดเสียงแล้ว':'ปิดเสียงแล้ว'); });
function showQrDialog() {
  const url = location.href.split('#')[0];
  $('#shareUrl').textContent=url;
  $('#qrImage').src=`https://quickchart.io/qr?size=400&margin=1&text=${encodeURIComponent(url)}`;
  $('#shareDialog').showModal();
}
$('#shareButton').addEventListener('click', async () => {
  const url = location.href.split('#')[0];
  if (navigator.share) { try { await navigator.share({title:'Bing Go!',text:'มาเล่นบิงโกกัน!',url}); return; } catch (error) { if (error.name === 'AbortError') return; } }
  showQrDialog();
});
$('#roomShareButton').addEventListener('click',showQrDialog);
$('#createRoomButton').addEventListener('click',createRoom);
$('#joinRoomButton').addEventListener('click',joinRoom);
$('#roomInput').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom();});
$('#closeShareButton').addEventListener('click',()=>$('#shareDialog').close());
$('#shareDialog').addEventListener('click',e=>{if(e.target===$('#shareDialog'))$('#shareDialog').close();});
$('#copyLinkButton').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href.split('#')[0]);showToast('คัดลอกลิงก์แล้ว');}catch{showToast('เบราว์เซอร์ไม่อนุญาตให้คัดลอกอัตโนมัติ');}});
document.addEventListener('keydown', e => { if (e.code==='Space' && !$('#callerPanel').classList.contains('hidden')) { e.preventDefault(); drawNumber(); } });

$('#playerName').value=myName;
loadThaiVoice();
if('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged',loadThaiVoice);
const invitedRoom=new URLSearchParams(location.search).get('room');
if(invitedRoom){$('#roomInput').value=invitedRoom.toUpperCase();setLobbyMessage('ใส่ชื่อแล้วกดเข้าห้องได้เลย');}
renderBoard(); renderCard();
