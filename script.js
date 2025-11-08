let leaders = [], officers = [], ncos = [], units = [];

function addLeader() {
  const code = document.getElementById('leaderCode').value.trim();
  if (!code) return;
  leaders.push(code);
  renderList('leadersList', leaders);
  document.getElementById('leaderCode').value = '';
  updateResult();
}

function addOfficer() {
  const code = document.getElementById('officerCode').value.trim();
  if (!code) return;
  officers.push(code);
  renderList('officersList', officers);
  document.getElementById('officerCode').value = '';
  updateResult();
}

function addNco() {
  const code = document.getElementById('ncoCode').value.trim();
  if (!code) return;
  ncos.push(code);
  renderList('ncoList', ncos);
  document.getElementById('ncoCode').value = '';
  updateResult();
}

function renderList(id, arr) {
  const ul = document.getElementById(id);
  ul.innerHTML = '';
  arr.forEach((item, i) => {
    ul.innerHTML += `<li>${item} <button onclick="removeItem('${id}',${i})">🗑️</button></li>`;
  });
}

function removeItem(listId, index) {
  if (listId === 'leadersList') leaders.splice(index, 1);
  if (listId === 'officersList') officers.splice(index, 1);
  if (listId === 'ncoList') ncos.splice(index, 1);
  renderList(listId, eval(listId.replace('List', '')));
  updateResult();
}

function addUnit() {
  const container = document.getElementById('unitsContainer');
  const index = units.length;
  units.push({});
  container.innerHTML += `
  <div class="row unit-row" id="unit${index}">
    <input placeholder="الكود" onchange="updateUnit(${index},'code',this.value)">
    <select onchange="updateUnit(${index},'status',this.value)">
      <option value="في الخدمة">في الخدمة</option>
      <option value="مشغول">مشغول</option>
      <option value="مشغول - اختبار">مشغول - اختبار</option>
      <option value="مشغول - تدريب">مشغول - تدريب</option>
      <option value="مشغول حالة موجه 10">مشغول حالة موجه 10</option>
    </select>
    <select onchange="updateUnit(${index},'location',this.value)">
      <option value="">لا شي</option>
      <option>الشمال</option><option>الشرق</option><option>الجنوب</option>
      <option>الوسط</option><option>ساندي</option><option>بوليتو</option>
    </select>
    <select onchange="updateUnit(${index},'type',this.value)">
      <option value="">توزيع وحدات</option>
      <option>سبيد يونت</option>
      <option>دباب</option>
      <option>هلي</option>
    </select>
    <button onclick="removeUnit(${index})">🗑️</button>
  </div>`;
}

function removeUnit(index) {
  document.getElementById(`unit${index}`).remove();
  units[index] = null;
  updateResult();
}

function updateUnit(index, key, value) {
  if (!units[index]) units[index] = {};
  units[index][key] = value;
  updateResult();
}

function updateResult() {
  const opsName = document.getElementById('opsName').value;
  const opsCode = document.getElementById('opsCode').value;
  const depName = document.getElementById('deputyName').value;
  const depCode = document.getElementById('deputyCode').value;
  const manName = document.getElementById('managerName').value;
  const manCode = document.getElementById('managerCode').value;
  const start = document.getElementById('startTime').value;
  const end = document.getElementById('endTime').value;
  const hand = document.getElementById('handoverName').value;

  const res = `
📌 استلام العمليات
اسم العمليات : ${opsName} ${opsCode}
النائب مركز العمليات : ${depName} ${depCode}

القيادات
${leaders.join(' - ') || '-'}

الضباط
${officers.join(' - ') || '-'}

مسؤول فترة
${manName} ${manCode || '-'}

ضباط الصف
${ncos.join(' - ') || '-'}

توزيع الوحدات
${units.filter(u=>u && !u.type).map(u=>`${u.code || '-'} | ${u.location || ''}`).join('\n')}

وحدات سبيد يونت
${units.filter(u=>u && u.type==='سبيد يونت').map(u=>`${u.code || '-'} | ${u.location || ''}`).join('\n')}

وحدات دباب
${units.filter(u=>u && u.type==='دباب').map(u=>u.code || '-').join('\n')}

وحدات الهلي
${units.filter(u=>u && u.type==='هلي').map(u=>`${u.code || '-'} | ${u.location || ''}`).join('\n')}

وقت الاستلام: ${start || '-'}
وقت التسليم: ${end || '-'}
تم التسليم إلى : ${hand || '-'}
`;
  document.getElementById('finalResult').textContent = res.trim();
}
