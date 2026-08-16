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
let currentGame = 'bingo';
let partyState = { emoji:null, emojiAnswers:[], emojiUsed:[], scores:{}, tabooScore:0, tabooTurn:-1, spyName:'', spyWord:'', votes:{} };
const emojiDeck = [
  ['Titanic','🚢🧊💔'],['Jaws','🦈🌊'],['Jurassic Park','🦖🏝️'],['The Lion King','🦁👑'],['Finding Nemo','🐠🔍🌊'],['Frozen','❄️👸⛄'],['Toy Story','🧸🤠🚀'],['Home Alone','🏠👦🎄'],
  ["Harry Potter and the Sorcerer's Stone",'⚡👓🪄'],['The Lord of the Rings','💍🧙‍♂️🌋'],['Spider-Man','🕷️🧑'],['Batman','🦇🦸‍♂️'],['Superman','🦸‍♂️🔴🔵'],['Iron Man','🤖❤️'],['Captain America','🛡️🇺🇸'],['Thor','⚡🔨'],
  ['The Avengers','🦸‍♂️🦸‍♀️🌍'],['Black Panther','🐆👑'],['Doctor Strange','🧙‍♂️🌀'],['Guardians of the Galaxy','🌌🚀🦝'],['Ant-Man','🐜🦸‍♂️'],['Deadpool','🔴⚔️😂'],['Venom','👽🖤😈'],['Aquaman','🌊🔱👑'],
  ['Wonder Woman','👩‍🦸‍♀️⚔️'],['The Flash','⚡🏃‍♂️'],['Shazam!','⚡🧒🦸‍♂️'],['Joker','🤡🃏'],['Logan','🐺⚔️'],['Black Widow','🕷️👩‍🦰'],['Pirates of the Caribbean','🏴‍☠️🚢💀'],['King Kong','🦍🏙️'],
  ['Godzilla','🦖🔥🏙️'],['Transformers','🤖🚗'],['Fast & Furious','🚗💨🔥'],['Mission: Impossible','🕵️‍♂️💣'],['Top Gun','✈️🕶️🔥'],['Rocky','🥊🏆'],['Rambo','🔫🌴'],['Terminator','🤖🔫'],['The Matrix','💊🕶️💻'],
  ['Back to the Future','🚗⚡🕰️'],['E.T.','👽🚲🌕'],['Men in Black','👽🕴️🕶️'],['Independence Day','👽🛸🇺🇸'],['Armageddon','☄️🚀🌍'],['Gravity','👩‍🚀🌍🛰️'],['Interstellar','🚀🌌⏳'],['The Martian','👨‍🚀🔴🌱'],
  ['Apollo 13','🚀🌕1️⃣3️⃣'],['Avatar','🔵👽🌳'],['Avatar: The Way of Water','🔵🌊🐋'],['Planet of the Apes','🦍🌍'],['The Mummy','🧟‍♂️🏜️'],['Indiana Jones','🤠🏺🐍'],['Night at the Museum','🌙🏛️🦖'],['The Jungle Book','🌴🐻🐯'],
  ['Life of Pi','🐯🚣🌊'],['Cast Away','🏝️🏐'],['The Revenant','🐻❄️🩸'],['Ghostbusters','👻🚫'],['The Exorcist','😈👧✝️'],['IT','🤡🎈'],['The Conjuring','👻🏠'],['Annabelle','👧🪆😈'],['A Nightmare on Elm Street','😴🔥🔪'],
  ['Friday the 13th','🏕️🔪1️⃣3️⃣'],['Scream','😱🔪☎️'],['Saw','🪚😈'],['The Ring','📼📺👻'],['The Hangover','🍺🍻🤕'],['Ted','🧸🍺😂'],['Dumb and Dumber','🤪🤪'],['The Mask','🎭💚'],['Mr. Bean','🧸🚗😂'],
  ['Charlie and the Chocolate Factory','🍫🏭🎩'],['The Devil Wears Prada','😈👠👗'],['Mean Girls','👧💅🔥'],['Legally Blonde','👱‍♀️⚖️💗'],['Pretty Woman','👠❤️🏨'],['Up','🎈🏠👴'],['WALL-E','🤖🌍❤️'],['Cars','🚗🏁'],
  ['Ratatouille','🐀👨‍🍳🍲'],['Monsters, Inc.','👹🚪'],['Inside Out','🧠😊😡😭'],['Coco','💀🎸🌼'],['Moana','🌊⛵🌺'],['Encanto','🏠✨🦋'],['Zootopia','🐰🦊🏙️'],['Kung Fu Panda','🐼🥋'],
  ['Shrek','🟢👹👸'],['Madagascar','🦁🦓🦒🏝️'],['Ice Age','🧊🐿️🥜'],['Despicable Me','👨‍🦲🍌💛'],['The Super Mario Bros. Movie','🍄👨‍🔧⭐'],['Pokémon Detective Pikachu','⚡🐭🔍'],['Sonic the Hedgehog','🦔💨💙'],
  ['How to Train Your Dragon','🐉🔥👦'],['The Little Mermaid','🧜‍♀️🐚🌊']
].map(([answer,emoji])=>({answer,emoji}));
const tabooDeck = [
  {word:'โทรศัพท์',banned:['โทร','มือถือ','คุย','หน้าจอ']},{word:'ไอศกรีม',banned:['เย็น','หวาน','ละลาย','โคน']},{word:'ช้าง',banned:['ตัวใหญ่','งวง','งา','สัตว์']},
  {word:'โรงเรียน',banned:['ครู','นักเรียน','เรียน','ห้อง']},{word:'ฟุตบอล',banned:['ลูกบอล','เตะ','ประตู','สนาม']},{word:'กาแฟ',banned:['ดื่ม','ขม','แก้ว','คาเฟ่']},
  {word:'ทะเล',banned:['น้ำ','หาด','คลื่น','เค็ม']},{word:'ตู้เย็น',banned:['เย็น','อาหาร','ครัว','แช่']},{word:'วันเกิด',banned:['เค้ก','เทียน','ของขวัญ','อายุ']}
];
const spyWords = ['หมูกระทะ','ตลาดนัด','โรงพยาบาล','สนามบิน','สวนสัตว์','ร้านกาแฟ','โรงภาพยนตร์','ชายหาด','โรงเรียน','งานแต่งงาน'];

const $ = (selector) => document.querySelector(selector);
const board = $('#numberBoard');
const toast = $('#toast');

function bingoName(number) { return `${letters[Math.floor((number - 1) / 15)]} ${number}`; }
function spokenBingoName(number) { return `${['บี','ไอ','เอ็น','จี','โอ'][Math.floor((number-1)/15)]} หมายเลข ${number}`; }
function save() { localStorage.setItem('binggo-drawn', JSON.stringify(drawn)); localStorage.setItem('binggo-card', JSON.stringify(card)); localStorage.setItem('binggo-marked', JSON.stringify([...marked])); }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400); }
function loadThaiVoice() {
  if(!('speechSynthesis' in window)) return;
  const voices=speechSynthesis.getVoices();
  const thaiVoices=voices.filter(v=>v.lang.toLowerCase().startsWith('th'));
  const femaleNames=/premwadee|kanya|narisa|pattara|female|ผู้หญิง/i;
  const preferredVoice=localStorage.getItem('binggo-voice')||'';
  thaiVoice=thaiVoices.find(v=>v.voiceURI===preferredVoice)||thaiVoices.find(v=>femaleNames.test(v.name))||thaiVoices[0]||null;
  const select=$('#voiceSelect'); const selected=localStorage.getItem('binggo-voice')||thaiVoice?.voiceURI||'';
  select.innerHTML='<option value="">เสียงผู้หญิง (อัตโนมัติ)</option>';
  thaiVoices.forEach(voice=>{const option=document.createElement('option');option.value=voice.voiceURI;option.textContent=voice.name;option.selected=voice.voiceURI===selected;select.appendChild(option);});
  if(!thaiVoices.length) select.options[0].textContent='เสียงไทยของระบบ';
}
function speak(text) { if (!soundOn || !('speechSynthesis' in window)) return; speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'th-TH'; if(thaiVoice) utterance.voice=thaiVoice; utterance.rate = .78; utterance.pitch=1.05; utterance.volume=1; speechSynthesis.speak(utterance); }

function roomId(code) { return `binggo-${code.toLowerCase()}`; }
function makeRoomCode() { const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join(''); }
function setLobbyMessage(message) { $('#connectionNote').textContent=message; }
function enterRoom(kind, code) {
  role=kind; activeRoom=code; document.body.classList.toggle('guest',kind==='player');
  $('#lobby').classList.add('hidden'); $('#gameMenu').classList.add('hidden'); $('#roomBar').classList.remove('hidden');
  $('#roomCode').textContent=code; $('#connectionStatus').textContent='เชื่อมต่อแล้ว';
  showCurrentGame();
}
function selectGame(game){currentGame=game;$('#gameMenu').classList.add('hidden');$('#lobby').classList.remove('hidden');const names={bingo:'BING GO! ONLINE',emoji:'ทายคำจาก EMOJI',taboo:'เกมคำต้องห้าม',spy:'สายลับคำลับ'};$('#selectedGameLabel').textContent=names[game];}
function showCurrentGame(){
  document.body.classList.toggle('bingo-game',currentGame==='bingo');
  ['#callerPanel','#playerPanel','#emojiPanel','#tabooPanel','#spyPanel'].forEach(id=>$(id).classList.add('hidden'));document.querySelector('.hero').classList.add('hidden');
  if(currentGame==='bingo'){document.querySelector('.hero').classList.remove('hidden');$('#callerPanel').classList.toggle('hidden',role!=='host');$('#playerPanel').classList.toggle('hidden',role!=='player');}
  else {const panel=$(`#${currentGame}Panel`);panel.classList.remove('hidden');$(`#${currentGame}HostControls`)?.classList.toggle('hidden',role!=='host');if(currentGame==='emoji')$('#emojiPlayerControls').classList.toggle('hidden',role==='host');}
  renderPartyGame();
}
function renderPlayers(winner='') {
  if(role!=='host') return;
  const names=[myName,...roomPlayers.values()];
  $('#playersList').innerHTML=names.map(name=>`<span class="player-chip${name===winner?' winner':''}">● ${escapeHtml(name)}</span>`).join('');
  $('#playerCount').textContent=`${names.length} คน`;
  $('#connectionStatus').textContent=`ออนไลน์ • ${names.length} คน`;
  if(currentGame==='spy')renderVoteButtons(names);
}
function escapeHtml(value) { const el=document.createElement('span'); el.textContent=value; return el.innerHTML; }
function broadcast(payload) { clientConnections.forEach(conn=>{if(conn.open) conn.send(payload);}); }
function publicPartyState(){return {...partyState,emoji:partyState.emoji?{emoji:partyState.emoji.emoji,answer:partyState.emojiRevealed?partyState.emoji.answer:''}:null,spyName:'',spyWord:'',spyActive:Boolean(partyState.spyWord)};}
function broadcastState() { broadcast({type:'state',game:currentGame,drawn,party:publicPartyState(),players:[myName,...roomPlayers.values()]}); }
function handleHostConnection(conn) {
  clientConnections.set(conn.peer,conn);
  conn.on('open',()=>{ const name=String(conn.metadata?.name||'ผู้เล่น').slice(0,20); roomPlayers.set(conn.peer,name); renderPlayers(); conn.send({type:'welcome',game:currentGame,drawn,party:publicPartyState(),players:[myName,...roomPlayers.values()]}); broadcastState(); });
  conn.on('data',data=>handlePlayerMessage(conn,data));
  conn.on('close',()=>{clientConnections.delete(conn.peer);roomPlayers.delete(conn.peer);renderPlayers();broadcastState();});
}
function handleGuestData(data) {
  if(data?.type==='welcome'||data?.type==='state'){ currentGame=data.game||'bingo';drawn=Array.isArray(data.drawn)?data.drawn:[];partyState=data.party||partyState;save();showCurrentGame();renderBoard();$('#connectionStatus').textContent=`ออนไลน์ • ${data.players?.length||1} คน`;renderVoteButtons(data.players||[]); }
  if(data?.type==='new-game'){drawn=[];marked=new Set();save();renderBoard();renderCard();showToast('เจ้าบ้านเริ่มเกมใหม่แล้ว');}
  if(data?.type==='taboo-round'){partyState.tabooTurnName=data.turn;$('#tabooWord').textContent=myName===data.turn?'กำลังรับคำ…':'🔒';$('#tabooBanned').innerHTML='';$('#tabooTurn').textContent=`คนใบ้รอบนี้: ${data.turn}`;}
  if(data?.type==='taboo-secret'){renderTabooCard(data.card,data.turn);}
  if(data?.type==='spy-round'){partyState.votes={};$('#spyRole').textContent='กำลังรับบทบาท…';$('#spyWord').textContent='ห้ามให้คนอื่นเห็นหน้าจอ';renderVoteButtons(data.players||[]);}
  if(data?.type==='spy-role'){renderSpyRole(data.spy,data.word);}
  if(data?.type==='spy-reveal'){showToast(`สายลับคือ ${data.name}`);$('#spyFeed').innerHTML=`<span class="answer-chip correct">🕵️ สายลับคือ ${escapeHtml(data.name)}</span>`;}
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

function normalizeAnswer(value){return String(value||'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');}
function handlePlayerMessage(conn,data){
  if(data?.type==='join'){roomPlayers.set(conn.peer,String(data.name||'ผู้เล่น').slice(0,20));renderPlayers();broadcastState();return;}
  const name=roomPlayers.get(conn.peer)||'ผู้เล่น';
  if(data?.type==='bingo'){renderPlayers(name);showToast(`🎉 ${name} ตะโกน BINGO!`);speak(`${name} บิงโก`);}
  if(data?.type==='emoji-answer'&&partyState.emoji){const answer=String(data.answer||'').slice(0,40);const correct=normalizeAnswer(answer)===normalizeAnswer(partyState.emoji.answer);partyState.emojiAnswers=partyState.emojiAnswers.filter(a=>a.name!==name);partyState.emojiAnswers.push({name,answer,correct});if(correct&&!partyState.scores[name])partyState.scores[name]=1;else if(correct)partyState.scores[name]++;broadcastState();renderPartyGame();}
  if(data?.type==='spy-vote'){partyState.votes[name]=String(data.name||'');broadcastState();renderPartyGame();}
}
function renderPartyGame(){
  if(currentGame==='emoji'){
    const q=partyState.emoji;$('#emojiPuzzle').textContent=q?.emoji||'🎬';$('#emojiRoundTitle').textContent=q?(partyState.emojiRevealed?`เฉลย: ${q.answer}`:'คำนี้คืออะไร?'):'รอเจ้าบ้านเริ่มเกม';$('#emojiScore').textContent=`${partyState.scores[myName]||0} คะแนน`;
    $('#emojiFeed').innerHTML=(partyState.emojiAnswers||[]).map(a=>`<span class="answer-chip${a.correct?' correct':''}">${escapeHtml(a.name)}: ${partyState.emojiRevealed||role==='host'?escapeHtml(a.answer):'ตอบแล้ว ✓'}</span>`).join('');
  }
  if(currentGame==='taboo'){$('#tabooScore').textContent=`${partyState.tabooScore||0} คะแนน`;if(partyState.tabooTurnName)$('#tabooTurn').textContent=`คนใบ้รอบนี้: ${partyState.tabooTurnName}`;}
  if(currentGame==='spy'){$('#spyTitle').textContent=partyState.spyWord||partyState.spyActive?'ทุกคนให้คำใบ้ทีละคน':'รอเจ้าบ้านแจกบทบาท';const counts={};Object.values(partyState.votes||{}).forEach(n=>counts[n]=(counts[n]||0)+1);$('#spyFeed').innerHTML=Object.entries(counts).map(([n,c])=>`<span class="answer-chip">${escapeHtml(n)} ${c} โหวต</span>`).join('');}
}
function renderTabooCard(cardData,turn){$('#tabooWord').textContent=cardData.word;$('#tabooBanned').innerHTML=cardData.banned.map(w=>`<span>${escapeHtml(w)}</span>`).join('');$('#tabooTurn').textContent=`คนใบ้รอบนี้: ${turn}`;}
function renderSpyRole(isSpy,word){$('#spyRoleCard').classList.toggle('spy',isSpy);$('#spyRole').textContent=isSpy?'คุณคือสายลับ!':'คุณเป็นชาวบ้าน';$('#spyWord').textContent=isSpy?'เนียนให้ดี แล้วเดาคำลับให้ได้':`คำลับ: ${word}`;}
function renderVoteButtons(players){const names=players.filter(n=>n!==myName);$('#spyVoteButtons').innerHTML=names.map(n=>`<button type="button" data-vote="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join('');document.querySelectorAll('[data-vote]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-vote]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');if(role==='player'&&hostConnection?.open)hostConnection.send({type:'spy-vote',name:b.dataset.vote});else{partyState.votes[myName]=b.dataset.vote;broadcastState();renderPartyGame();}}));}
function nextEmoji(){partyState.emojiUsed=partyState.emojiUsed||[];const available=emojiDeck.filter(q=>!partyState.emojiUsed.includes(q.answer));if(!available.length)return showToast(`เล่นครบทั้ง ${emojiDeck.length} เรื่องแล้ว!`);partyState.emoji=available[Math.floor(Math.random()*available.length)];partyState.emojiUsed.push(partyState.emoji.answer);partyState.emojiAnswers=[];partyState.emojiRevealed=false;broadcastState();renderPartyGame();}
function nextTaboo(){const entries=[{id:'host',name:myName},...Array.from(roomPlayers.entries()).map(([id,name])=>({id,name}))];partyState.tabooTurn=(partyState.tabooTurn+1)%entries.length;const turn=entries[partyState.tabooTurn];const cardData=tabooDeck[Math.floor(Math.random()*tabooDeck.length)];partyState.tabooTurnName=turn.name;broadcast({type:'taboo-round',turn:turn.name});if(turn.id==='host')renderTabooCard(cardData,turn.name);else clientConnections.get(turn.id)?.send({type:'taboo-secret',card:cardData,turn:turn.name});$('#tabooWord').textContent=turn.id==='host'?cardData.word:'🔒';if(turn.id!=='host')$('#tabooBanned').innerHTML='';broadcastState();}
function startSpy(){const entries=[{id:'host',name:myName},...Array.from(roomPlayers.entries()).map(([id,name])=>({id,name}))];if(entries.length<3)return showToast('เกมนี้ควรมีอย่างน้อย 3 คน');const spy=entries[Math.floor(Math.random()*entries.length)];const word=spyWords[Math.floor(Math.random()*spyWords.length)];partyState.spyName=spy.name;partyState.spyWord=word;partyState.votes={};broadcast({type:'spy-round',players:entries.map(x=>x.name)});entries.forEach(p=>{if(p.id==='host')renderSpyRole(p===spy,word);else clientConnections.get(p.id)?.send({type:'spy-role',spy:p===spy,word});});renderVoteButtons(entries.map(x=>x.name));broadcastState();renderPartyGame();}

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
$('#voiceSelect').addEventListener('change',e=>{const uri=e.target.value;localStorage.setItem('binggo-voice',uri);const voices=speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('th'));const femaleNames=/premwadee|kanya|narisa|pattara|female|ผู้หญิง/i;thaiVoice=voices.find(v=>v.voiceURI===uri)||voices.find(v=>femaleNames.test(v.name))||voices[0]||null;soundOn=true;$('#soundButton').textContent='🔊';speak('สวัสดีค่ะ พร้อมเล่นบิงโกแล้วค่ะ');});
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
$('#homeMenuButton').addEventListener('click',()=>{const message=role==='host'?'ออกจากห้องและปิดเกมสำหรับผู้เล่นทุกคนใช่ไหม?':'ออกจากห้องและกลับหน้าเมนูใช่ไหม?';if(!confirm(message))return;try{peer?.destroy();}catch{}location.href=`${location.pathname}?v=7`;});
document.querySelectorAll('[data-game]').forEach(button=>button.addEventListener('click',()=>selectGame(button.dataset.game)));
$('#backMenuButton').addEventListener('click',()=>{$('#lobby').classList.add('hidden');$('#gameMenu').classList.remove('hidden');history.replaceState({},'',location.pathname);});
$('#createRoomButton').addEventListener('click',createRoom);
$('#joinRoomButton').addEventListener('click',joinRoom);
$('#roomInput').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom();});
$('#closeShareButton').addEventListener('click',()=>$('#shareDialog').close());
$('#shareDialog').addEventListener('click',e=>{if(e.target===$('#shareDialog'))$('#shareDialog').close();});
$('#copyLinkButton').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href.split('#')[0]);showToast('คัดลอกลิงก์แล้ว');}catch{showToast('เบราว์เซอร์ไม่อนุญาตให้คัดลอกอัตโนมัติ');}});
$('#emojiNext').addEventListener('click',nextEmoji);
$('#emojiReveal').addEventListener('click',()=>{if(!partyState.emoji)return;partyState.emojiRevealed=true;broadcastState();renderPartyGame();});
function submitEmoji(){const answer=$('#emojiAnswer').value.trim();if(!answer)return;if(role==='player'&&hostConnection?.open)hostConnection.send({type:'emoji-answer',answer});$('#emojiAnswer').value='';showToast('ส่งคำตอบแล้ว');}
$('#emojiSubmit').addEventListener('click',submitEmoji);$('#emojiAnswer').addEventListener('keydown',e=>{if(e.key==='Enter')submitEmoji();});
$('#tabooNext').addEventListener('click',nextTaboo);$('#tabooSkip').addEventListener('click',nextTaboo);$('#tabooCorrect').addEventListener('click',()=>{partyState.tabooScore++;showToast('ได้ 1 คะแนน!');nextTaboo();});
$('#spyStart').addEventListener('click',startSpy);$('#spyReveal').addEventListener('click',()=>{if(!partyState.spyName)return;broadcast({type:'spy-reveal',name:partyState.spyName});showToast(`สายลับคือ ${partyState.spyName}`);$('#spyFeed').innerHTML+=`<span class="answer-chip correct">🕵️ สายลับคือ ${escapeHtml(partyState.spyName)}</span>`;});
document.addEventListener('keydown', e => { if (e.code==='Space' && !$('#callerPanel').classList.contains('hidden')) { e.preventDefault(); drawNumber(); } });

$('#playerName').value=myName;
loadThaiVoice();
if('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged',loadThaiVoice);
const invitedRoom=new URLSearchParams(location.search).get('room');
if(invitedRoom){$('#gameMenu').classList.add('hidden');$('#lobby').classList.remove('hidden');$('#backMenuButton').classList.add('hidden');$('#roomInput').value=invitedRoom.toUpperCase();setLobbyMessage('ใส่ชื่อแล้วกดเข้าห้องได้เลย');}
renderBoard(); renderCard();
