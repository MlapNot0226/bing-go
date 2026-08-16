const ranges = [[1,15],[16,30],[31,45],[46,60],[61,75]];
const letters = ['B','I','N','G','O'];
let drawn = JSON.parse(localStorage.getItem('binggo-drawn') || '[]');
let soundOn = true;
let card = JSON.parse(localStorage.getItem('binggo-card') || 'null');
let marked = new Set(JSON.parse(localStorage.getItem('binggo-marked') || '[]'));

const $ = (selector) => document.querySelector(selector);
const board = $('#numberBoard');
const toast = $('#toast');

function bingoName(number) { return `${letters[Math.floor((number - 1) / 15)]} ${number}`; }
function save() { localStorage.setItem('binggo-drawn', JSON.stringify(drawn)); localStorage.setItem('binggo-card', JSON.stringify(card)); localStorage.setItem('binggo-marked', JSON.stringify([...marked])); }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400); }
function speak(text) { if (!soundOn || !('speechSynthesis' in window)) return; speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'th-TH'; utterance.rate = .85; speechSynthesis.speak(utterance); }

function renderBoard() {
  board.innerHTML = '';
  for (let n = 1; n <= 75; n++) { const el = document.createElement('span'); el.className = `board-number${drawn.includes(n) ? ' drawn' : ''}`; el.textContent = n; board.appendChild(el); }
  $('#drawCount').textContent = drawn.length;
  $('#remainingText').textContent = drawn.length === 75 ? 'ออกครบทุกลูกแล้ว' : `เหลืออีก ${75 - drawn.length} ลูก`;
  const latest = drawn.at(-1);
  if (latest) { $('.ball-letter').textContent = letters[Math.floor((latest - 1) / 15)]; $('.ball-number').textContent = latest; $('#callText').textContent = bingoName(latest); }
}

function drawNumber() {
  if (drawn.length === 75) return showToast('เลขออกครบแล้ว เริ่มเกมใหม่ได้เลย');
  const available = Array.from({length:75},(_,i)=>i+1).filter(n => !drawn.includes(n));
  const number = available[Math.floor(Math.random() * available.length)];
  drawn.push(number); save(); renderBoard();
  const ball = $('#currentBall'); ball.classList.remove('pop'); void ball.offsetWidth; ball.classList.add('pop');
  speak(bingoName(number));
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

document.querySelectorAll('.mode').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.mode').forEach(b=>b.classList.remove('active')); button.classList.add('active'); const caller = button.dataset.mode === 'caller'; $('#callerPanel').classList.toggle('hidden', !caller); $('#playerPanel').classList.toggle('hidden', caller); }));
$('#drawButton').addEventListener('click', drawNumber);
$('#newGameButton').addEventListener('click', () => { if (drawn.length && !confirm('ล้างเลขทั้งหมดและเริ่มเกมใหม่ใช่ไหม?')) return; drawn=[]; save(); renderBoard(); $('.ball-letter').textContent='–'; $('.ball-number').textContent='?'; $('#callText').textContent='เริ่มเกมกันเลย'; });
$('#newCardButton').addEventListener('click', () => { if (marked.size && !confirm('สุ่มการ์ดใหม่และลบรอยที่แตะไว้ใช่ไหม?')) return; card=makeCard(); marked=new Set(); renderCard(); });
$('#checkButton').addEventListener('click', () => { const won=hasBingo(); const wrong=[...marked].filter(i=>i!==12&&!drawn.includes(card[i])).length; $('#bingoStatus').textContent=won?'🎉 BINGO! ทุกเลขถูกเรียกแล้ว':'ยังไม่บิงโก — ต้องครบแถวและเป็นเลขที่เรียกแล้ว'; showToast(won?'🎉 BINGO! ตรวจเลขผ่านแล้ว!':wrong?`มี ${wrong} ช่องที่ผู้สุ่มยังไม่ได้เรียก`:'ยังไม่บิงโก สู้ต่อไป!'); if(won) speak('บิงโก!'); });
$('#soundButton').addEventListener('click', (e) => { soundOn=!soundOn; e.currentTarget.textContent=soundOn?'🔊':'🔇'; showToast(soundOn?'เปิดเสียงแล้ว':'ปิดเสียงแล้ว'); });
$('#shareButton').addEventListener('click', async () => {
  const url = location.href.split('#')[0];
  if (navigator.share) { try { await navigator.share({title:'Bing Go!',text:'มาเล่นบิงโกกัน!',url}); return; } catch (error) { if (error.name === 'AbortError') return; } }
  $('#shareUrl').textContent=url;
  $('#qrImage').src=`https://quickchart.io/qr?size=400&margin=1&text=${encodeURIComponent(url)}`;
  $('#shareDialog').showModal();
});
$('#closeShareButton').addEventListener('click',()=>$('#shareDialog').close());
$('#shareDialog').addEventListener('click',e=>{if(e.target===$('#shareDialog'))$('#shareDialog').close();});
$('#copyLinkButton').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href.split('#')[0]);showToast('คัดลอกลิงก์แล้ว');}catch{showToast('เบราว์เซอร์ไม่อนุญาตให้คัดลอกอัตโนมัติ');}});
document.addEventListener('keydown', e => { if (e.code==='Space' && !$('#callerPanel').classList.contains('hidden')) { e.preventDefault(); drawNumber(); } });

renderBoard(); renderCard();
