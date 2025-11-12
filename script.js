/* v5.4 - OCR auto-assign vertically, merge_append behavior, expand handlers */
const $ = id => document.getElementById(id);
let leaders = [], officers = [], managers = [], ncos = [], units = [];
let startTime = '', endTime = '';

function toast(msg, time=2000){
  const w=$('toastWrap'); if(!w) return;
  const el=document.createElement('div'); el.className='toast'; el.innerText=msg; w.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(),300); }, time);
}

function saveState(){ try{
  localStorage.setItem('police_v5_4', JSON.stringify({leaders,officers,managers,ncos,units,startTime,endTime,
    opsName:$('opsName').value, opsCode:$('opsCode').value, opsDeputy:$('opsDeputy').value, opsDeputyCode:$('opsDeputyCode').value}));
}catch(e){console.warn(e);} }
function loadState(){ try{
  const s=localStorage.getItem('police_v5_4'); if(!s) return;
  const st=JSON.parse(s);
  leaders=st.leaders||[]; officers=st.officers||[]; managers=st.managers||[]; ncos=st.ncos||[]; units=st.units||[];
  startTime=st.startTime||''; endTime=st.endTime||'';
  if(st.opsName) $('opsName').value=st.opsName;
  if(st.opsCode) $('opsCode').value=st.opsCode;
  if(st.opsDeputy) $('opsDeputy').value=st.opsDeputy;
  if(st.opsDeputyCode) $('opsDeputyCode').value=st.opsDeputyCode;
}catch(e){console.warn(e);} }

function init(){
  setTimeout(()=>{ const intro=$('intro'); if(intro){ intro.style.opacity='0'; setTimeout(()=>{ intro.style.display='none'; $('topbar').style.display='block'; $('main').style.display='block'; setTimeout(()=> $('main').style.opacity='1',20); },350); } },700);
  bindControls();
  loadState();
  if(units.length===0) addUnitRow();
  renderAll();
  wireModalButtons();
}

function bindControls(){
  $('addLeaderBtn').addEventListener('click', ()=>{ const v=$('leaderInput').value.trim(); if(!v) return; leaders.push(v); $('leaderInput').value=''; renderAll(); saveState(); toast('تم إضافة قيادة'); });
  $('addOfficerBtn').addEventListener('click', ()=>{ const v=$('officerInput').value.trim(); if(!v) return; officers.push(v); $('officerInput').value=''; renderAll(); saveState(); toast('تم إضافة ضابط'); });
  $('addManagerBtn').addEventListener('click', ()=>{ const n=$('managerName').value.trim(), c=$('managerCode').value.trim(); if(!n && !c) return; managers.push({name:n,code:c}); $('managerName').value=''; $('managerCode').value=''; renderAll(); saveState(); toast('تم إضافة مسؤول الفترة'); });
  $('addNcoBtn').addEventListener('click', ()=>{ const n=$('ncoName').value.trim(), c=$('ncoCode').value.trim(); if(!n && !c) return; ncos.push({name:n,code:c}); $('ncoName').value=''; $('ncoCode').value=''; renderAll(); saveState(); toast('تم إضافة ضابط صف'); });

  $('addUnitRow').addEventListener('click', ()=>{ addUnitRow(); saveState(); toast('تم إضافة وحدة'); });
  $('clearUnits').addEventListener('click', ()=>{ if(confirm('مسح كل الوحدات؟')){ units=[]; renderUnits(); updateResult(); saveState(); toast('تم مسح الوحدات'); } });
  $('resetAll').addEventListener('click', ()=>{ if(confirm('مسح كل البيانات؟')){ leaders=[];officers=[];managers=[];ncos=[];units=[];startTime='';endTime=''; $('startTimeText').innerText=''; $('endTimeText').innerText=''; renderAll(); updateResult(); saveState(); toast('تم إعادة التهيئة'); } });

  $('setStartBtn').addEventListener('click', ()=>{ startTime = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}); $('startTimeText').innerText='وقت الاستلام: '+startTime; updateResult(); saveState(); toast('تم تسجيل وقت الاستلام'); });
  $('setEndBtn').addEventListener('click', ()=>{ endTime = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}); $('endTimeText').innerText='وقت التسليم: '+endTime; updateResult(); saveState(); toast('تم تسجيل وقت التسليم'); });

  $('copyBtn').addEventListener('click', ()=>{ copyResult(); toast('تم النسخ'); });

  $('uploadBtn').addEventListener('click', ()=> $('fileInput').click());
  $('fileInput').addEventListener('change', async (e)=>{ if(e.target.files && e.target.files[0]) await handleAutoFile(e.target.files[0]); e.target.value=''; });
  document.addEventListener('paste', async (e)=>{ if(e.clipboardData){ for(const it of e.clipboardData.items){ if(it.type.indexOf('image')!==-1){ const b=it.getAsFile(); if(b) await handleAutoFile(b); } } } });

  ['opsName','opsCode','opsDeputy','opsDeputyCode'].forEach(id=>{ const el=$(id); if(el) el.addEventListener('input', ()=>{ updateResult(); saveState(); }); });
}

function renderPills(id,arr){
  const wrap = $(id); if(!wrap) return; wrap.innerHTML='';
  arr.forEach((v,i)=>{
    const pill = document.createElement('div'); pill.className='pill';
    pill.textContent = typeof v === 'string' ? v : (v.name? `${v.name} | ${v.code}` : v.code||'');
    const btn = document.createElement('button'); btn.textContent='حذف';
    btn.addEventListener('click',(ev)=>{ ev.stopPropagation(); arr.splice(i,1); renderAll(); saveState(); toast('تم الحذف'); });
    pill.appendChild(btn); wrap.appendChild(pill);
  });
}

function addUnitRow(u){
  const unit = u || {code:'', status:'في الخدمة', loc:'لا شي', type:'لا شي', partners:[], speedOpt:'', selected:false};
  units.push(unit);
  renderUnits();
  updateResult();
  saveState();
}

function renderUnits(){
  const wrap = $('unitsList'); wrap.innerHTML='';
  units.forEach((u,i)=>{
    const row = document.createElement('div'); row.className='unit-row'+(u.selected?' selected':''); row.dataset.index = i;
    row.addEventListener('click', function(e){ if(e.target.closest('input,select,button')) return; units[i].selected = !units[i].selected; renderUnits(); });

    const codeIn = document.createElement('input'); codeIn.className='input'; codeIn.placeholder='الكود'; codeIn.value = u.code||'';
    codeIn.addEventListener('input', e=>{ units[i].code = e.target.value; updateResult(); saveState(); });

    const selS = document.createElement('select'); selS.className='input';
    ['في الخدمة','مشغول','مشغول - اختبار','مشغول - تدريب','مشغول حالة موجه 10'].forEach(opt=>{ const o=document.createElement('option'); o.value=o.textContent=opt; if(u.status===opt) o.selected=true; selS.appendChild(o); });
    selS.addEventListener('change', e=>{ units[i].status = e.target.value; updateResult(); saveState(); });

    const selL = document.createElement('select'); selL.className='input';
    ['لا شي','الشمال','الوسط','الشرق','الجنوب','ساندي','بوليتو'].forEach(opt=>{ const o=document.createElement('option'); o.value=o.textContent=opt; if(u.loc===opt) o.selected=true; selL.appendChild(o); });
    selL.addEventListener('change', e=>{ units[i].loc = e.target.value; updateResult(); saveState(); });

    const selT = document.createElement('select'); selT.className='input';
    ['لا شي','سبيد يونت','دباب','الهلي'].forEach(opt=>{ const o=document.createElement('option'); o.value=o.textContent=opt; if(u.type===opt) o.selected=true; selT.appendChild(o); });
    selT.addEventListener('change', e=>{ units[i].type = e.target.value; renderUnits(); updateResult(); saveState(); });

    const speedSel = document.createElement('select'); speedSel.className='input'; speedSel.style.display = (u.type==='سبيد يونت')?'block':'none';
    ['','فايبكس','موتركس'].forEach(opt=>{ const o=document.createElement('option'); o.value=o.textContent=opt; if(u.speedOpt===opt) o.selected=true; speedSel.appendChild(o); });
    speedSel.addEventListener('change', e=>{ units[i].speedOpt = e.target.value; updateResult(); saveState(); });

    const pdiv = document.createElement('div'); pdiv.className='col'; pdiv.textContent = u.partners && u.partners.length ? u.partners.join(' + ') : '-';
    const actions = document.createElement('div'); actions.className='actions';
    const editBtn = document.createElement('button'); editBtn.className='btn muted'; editBtn.textContent='تعديل'; editBtn.addEventListener('click', ev=>{ ev.stopPropagation(); openModal(i); });
    const addP = document.createElement('button'); addP.className='btn primary'; addP.textContent='أضف شريك'; addP.addEventListener('click', ev=>{ ev.stopPropagation(); const p=prompt('أدخل كود الشريك'); if(p){ units[i].partners.push(p); renderUnits(); updateResult(); saveState(); toast('تم إضافة شريك'); } });
    const delBtn = document.createElement('button'); delBtn.className='btn muted'; delBtn.textContent='حذف'; delBtn.addEventListener('click', ev=>{ ev.stopPropagation(); if(confirm('هل تريد حذف هذه الوحدة؟')){ units.splice(i,1); renderUnits(); updateResult(); saveState(); toast('تم حذف الوحدة'); } });
    actions.appendChild(editBtn); actions.appendChild(addP); actions.appendChild(delBtn);

    const cols = document.createElement('div'); cols.style.display='flex'; cols.style.gap='8px'; cols.style.flex='1'; cols.style.minWidth='0';
    cols.appendChild(codeIn); cols.appendChild(selS); cols.appendChild(selL); cols.appendChild(selT); cols.appendChild(speedSel);

    row.appendChild(cols); row.appendChild(pdiv); row.appendChild(actions);
    wrap.appendChild(row);
  });
}

let modalIndex = null;
function wireModalButtons(){ const close=$('modalClose'), cancel=$('modalCancel'), saveBtn=$('modalSave'), addP=$('addModalPartner'); if(close) close.addEventListener('click', ()=>closeModal()); if(cancel) cancel.addEventListener('click', ()=>closeModal()); if(saveBtn) saveBtn.addEventListener('click', ()=>{ saveModal(); saveState(); toast('تم الحفظ'); }); if(addP) addP.addEventListener('click', ()=>addModalPartner()); }
function openModal(i){ modalIndex=i; const u=units[i]; $('modalCode').value=u.code||''; $('modalStatus').value=u.status||'في الخدمة'; $('modalLocation').value=u.loc||'لا شي'; $('modalType').value=u.type||'لا شي'; $('modalSpeed').value=u.speedOpt||''; const wrap=$('modalPartnersList'); wrap.innerHTML=''; (u.partners||[]).forEach((p,idx)=>{ const d=document.createElement('div'); d.textContent=p; const b=document.createElement('button'); b.textContent='حذف'; b.addEventListener('click', ()=>{ units[modalIndex].partners.splice(idx,1); openModal(modalIndex); saveState(); }); d.appendChild(b); wrap.appendChild(d); }); $('modalPartnersWrap').style.display=(u.partners&&u.partners.length)?'block':'none'; $('modalSpeedWrap').style.display=(u.type==='سبيد يونت')?'block':'none'; $('modal').setAttribute('aria-hidden','false'); }
function closeModal(){ $('modal').setAttribute('aria-hidden','true'); modalIndex=null; }
function addModalPartner(){ const v=$('modalPartnerInput').value.trim(); if(!v) return; units[modalIndex].partners.push(v); $('modalPartnerInput').value=''; openModal(modalIndex); updateResult(); saveState(); toast('تم إضافة شريك'); }
function saveModal(){ if(modalIndex===null) return; units[modalIndex].code=$('modalCode').value.trim(); units[modalIndex].status=$('modalStatus').value; units[modalIndex].loc=$('modalLocation').value; units[modalIndex].type=$('modalType').value; units[modalIndex].speedOpt=$('modalSpeed').value; $('modal').setAttribute('aria-hidden','true'); renderUnits(); updateResult(); saveState(); }

function formatManager(m){ return m.name? `${m.name} ${m.code? '| '+m.code : ''}` : (m.code||'-'); }
function formatNco(n){ return n.name? `${n.name} ${n.code? '| '+n.code : ''}` : (n.code||'-'); }

function updateResult(){
  const ops = $('opsName')? $('opsName').value.trim() : '';
  const opsCode = $('opsCode')? $('opsCode').value.trim() : '';
  const dep = $('opsDeputy')? $('opsDeputy').value.trim() : '';
  const depCode = $('opsDeputyCode')? $('opsDeputyCode').value.trim() : '';

  const lines = [];
  lines.push('استلام العمليات');
  lines.push(`اسم العمليات : ${ops || '-'}` + (opsCode? ' | '+opsCode : ''));
  lines.push(`نائب مركز العمليات : ${dep || '-'}${depCode? ' | '+depCode : ''}`);
  lines.push('');
  lines.push('القيادات'); lines.push(leaders.length? leaders.join(' - '): '-');
  lines.push(''); lines.push('الضباط'); lines.push(officers.length? officers.join(' - '): '-');
  lines.push(''); lines.push('مسؤول فترة'); lines.push(managers.length? managers.map(formatManager).join(' , ') : '-');
  lines.push(''); lines.push('ضباط الصف'); lines.push(ncos.length? ncos.map(formatNco).join(' , ') : '-');
  lines.push(''); lines.push('توزيع الوحدات');

  const general = units.filter(u=> u.type==='لا شي' || !u.type).map(u=>{
    const base = u.code || '-';
    const parts = [base];
    if(u.loc && u.loc!=='لا شي') parts.push(u.loc);
    if(u.status && u.status!=='في الخدمة') parts.push(u.status);
    if(u.partners && u.partners.length) parts.push(u.partners.join(' + '));
    return parts.join(' | ');
  });

  if(general.length) general.forEach(g=> lines.push(g)); else lines.push('-');

  lines.push(''); lines.push('وحدات سبيد يونت');
  const sp = units.filter(u=> u.type==='سبيد يونت');
  if(sp.length) sp.forEach(s=> lines.push(`${s.code}${s.loc && s.loc!=='لا شي'? ' | '+s.loc : ''}${s.speedOpt? ' | '+s.speedOpt : ''}${s.status && s.status!=='في الخدمة'? ' | '+s.status : ''}`)); else lines.push('-');

  lines.push(''); lines.push('وحدات دباب');
  const tk = units.filter(u=> u.type==='دباب');
  if(tk.length) tk.forEach(t=> lines.push(t.code)); else lines.push('-');

  lines.push(''); lines.push('وحدات الهلي');
  const helis = units.filter(u=> u.type==='الهلي' && ((u.loc && u.loc!=='لا شي') || (u.status && u.status!=='في الخدمة') || (u.code)));
  if(helis.length) helis.forEach(h=> lines.push(`${h.code}${h.loc && h.loc!=='لا شي'? ' | '+h.loc : ''}${h.status && h.status!=='في الخدمة'? ' | '+h.status : ''}`)); else lines.push('-');

  lines.push(''); lines.push('وقت الاستلام: '+(startTime||'—')); lines.push('وقت التسليم: '+(endTime||'—'));
  lines.push(''); lines.push('تم التسليم إلى :');

  const area = $('resultArea');
  if(area) area.innerText = lines.join('\n');
}

function copyResult(){ const a=$('resultArea'); if(!a) return; navigator.clipboard.writeText(a.innerText).then(()=>toast('تم النسخ'), ()=>toast('فشل النسخ')); }

/* OCR using tesseract.js */
async function runOCRBlob(blob, onProgress, lang='ara+eng'){
  if(!window.Tesseract) throw new Error('Tesseract not loaded');
  const { createWorker } = Tesseract;
  const worker = createWorker({ logger: m=>{ if(onProgress) onProgress(m); } });
  await worker.load();
  await worker.loadLanguage(lang);
  await worker.initialize(lang);
  await worker.setParameters({ tessedit_pageseg_mode: '6', tessedit_ocr_engine_mode: '3', tessedit_char_whitelist:'0123456789' });
  const { data: { text } } = await worker.recognize(blob);
  await worker.terminate();
  return text;
}

function preprocessImageToBlob(file, maxWidth=1800){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    img.onload = ()=>{
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img,0,0,w,h);
      try{
        let id = ctx.getImageData(0,0,w,h);
        let d = id.data;
        for(let i=0;i<d.length;i+=4){
          let lum = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
          d[i]=d[i+1]=d[i+2]=lum;
        }
        ctx.putImageData(id,0,0);
      }catch(e){ console.warn('preprocess failed', e); }
      canvas.toBlob((blob)=>{ if(blob) resolve(blob); else reject(new Error('conversion failed')); }, 'image/png', 0.92);
    };
    img.onerror = (e)=> reject(e);
    img.src = URL.createObjectURL(file);
  });
}

/* assign codes vertically; behavior: replace | merge | merge_append */
function assignCodesVertically(codes, behavior){
  if(!Array.isArray(codes) || codes.length === 0) return;
  if(behavior === 'replace'){
    units = codes.map(c => ({ code: c, status:'في الخدمة', loc:'لا شي', type:'لا شي', partners:[], speedOpt:'', selected:false }));
  } else if(behavior === 'merge_append'){
    while(codes.length > 0){
      units.push({ code: codes.shift(), status:'في الخدمة', loc:'لا شي', type:'لا شي', partners:[], speedOpt:'', selected:false });
    }
  } else {
    for(let u of units){
      if(codes.length === 0) break;
      if(!u.code || u.code.trim() === '') u.code = codes.shift();
    }
    while(codes.length > 0){
      units.push({ code: codes.shift(), status:'في الخدمة', loc:'لا شي', type:'لا شي', partners:[], speedOpt:'', selected:false });
    }
  }
  renderUnits(); updateResult(); saveState();
}

/* auto-handle file: OCR -> extract numeric codes -> assign vertically */
async function handleAutoFile(file){
  if(!file) return;
  const oerr=$('ocrError'), pWrap=$('progressWrap'), pFill=$('progressFill'), pText=$('progressText');
  if(oerr) oerr.style.display='none';
  if(pWrap){ pWrap.style.display='block'; if(pFill) pFill.style.width='0%'; if(pText) pText.innerText='0%'; }
  try{
    let preBlob = file;
    try{ preBlob = await preprocessImageToBlob(file, 1800); }catch(e){ preBlob = file; }
    const onProgress = (m)=>{ if(m && typeof m.progress === 'number'){ const p = Math.round(m.progress*100); if(pFill) pFill.style.width = p + '%'; if(pText) pText.innerText = p + '% — ' + (m.status||''); } };
    let text = null;
    try{ text = await runOCRBlob(preBlob, onProgress, 'ara+eng'); }catch(e1){ try{ text = await runOCRBlob(preBlob, onProgress, 'eng'); }catch(e2){ throw e2; } }
    if(pFill) pFill.style.width='100%'; if(pText) pText.innerText='100%';
    if(!text || text.trim().length < 2){ if(oerr){ oerr.innerText='فشل في قراءة النص. جرّب صورة أوضح.'; oerr.style.display='block'; } toast('فشل تحليل الصورة'); return; }
    // extract codes in order (2-6 digit numbers)
    const codes = (text.match(/\d{2,6}/g) || []).map(s => s.trim());
    if(codes.length === 0){ if(oerr){ oerr.innerText='لم يتم العثور على أكواد رقمية.'; oerr.style.display='block'; } toast('لم يتم العثور على أكواد'); return; }
    // confirm: OK = replace, Cancel = merge_append (append new rows)
    const replace = confirm('اضغط موافق لاستبدال الأكواد القديمة بالكامل. إلغاء لاضافة الأكواد كسطر جديد (دمج).');
    assignCodesVertically(codes, replace ? 'replace' : 'merge_append');
    toast('تم استخراج الأكواد وتوزيعها عمودياً');
  }catch(err){
    console.error(err);
    if($('ocrError')){ $('ocrError').innerText='حصل خطأ أثناء التحليل'; $('ocrError').style.display='block'; }
    toast('حصل خطأ أثناء تحليل الصورة');
  }finally{
    setTimeout(()=>{ const pWrap=$('progressWrap'), pFill=$('progressFill'), pText=$('progressText'); if(pWrap) pWrap.style.display='none'; if(pFill) pFill.style.width='0%'; if(pText) pText.innerText=''; }, 900);
  }
}

/* expand helper for mobile/desktop: when clicking a pill or section header */
function expandUnitsList(){
  const ul = $('unitsList'); if(!ul) return;
  ul.classList.add('expanded');
  setTimeout(()=>{ ul.scrollIntoView({behavior:'smooth', block:'start'}); }, 60);
}

function attachExpandHandlers(){
  ['leaders','officers','managers','ncos'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.querySelectorAll('.pill').forEach(p => p.addEventListener('click', (e) => { e.stopPropagation(); expandUnitsList(); }));
    const parent = el.parentElement;
    if(parent){
      const h = parent.querySelector('h4');
      if(h) h.addEventListener('click', ()=> expandUnitsList());
    }
  });
}

function renderAll(){ renderPills('leaders', leaders); renderPills('officers', officers); renderPills('managers', managers); renderPills('ncos', ncos); renderUnits(); updateResult(); attachExpandHandlers(); }

document.addEventListener('DOMContentLoaded', init);
