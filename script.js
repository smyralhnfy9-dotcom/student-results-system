"use strict";

/* ========== Student Class (OOP) ========== */
class Student {
  constructor(id, name, grade1, grade2, grade3, attendance) {
    this.id = String(id).trim();
    this.name = name.trim();
    this.grades = [Number(grade1), Number(grade2), Number(grade3)];
    this.attendance = Number(attendance);
  }
  getTotal() { return this.grades.reduce((sum, g) => sum + g, 0); }
  calculateAverage() { return this.getTotal() / this.grades.length; }
  getGrade() {
    const avg = this.calculateAverage();
    if (avg >= 90) return "A";
    else if (avg >= 80) return "B";
    else if (avg >= 70) return "C";
    else if (avg >= 60) return "D";
    else if (avg >= 50) return "E";
    else return "F";
  }
  isPassed() { return this.calculateAverage() >= 50 && this.attendance >= 75; }
  getResult() { return this.isPassed() ? "ناجح" : "يحتاج مراجعة"; }
  isStruggling() { return this.calculateAverage() < 50; }
}

/* ========== State & Storage ========== */
const STORAGE_KEY = "studentResults.v1";
const SEEDED_KEY = "studentResults.seeded";
let studentsList = [];
let editingId = null;
let currentFilter = "all";

const round = n => Math.round(n * 100) / 100;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(studentsList)); }

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    studentsList = raw.map(o => new Student(o.id, o.name, ...o.grades, o.attendance));
  } catch (e) { studentsList = []; }
  if (!localStorage.getItem(SEEDED_KEY)) {            // 4 demo students on first run only
    studentsList = [
      new Student("1001", "أحمد محمود", 95, 88, 92, 96),
      new Student("1002", "سارة علي", 72, 65, 70, 80),
      new Student("1003", "محمد حسن", 45, 42, 48, 85),
      new Student("1004", "منى خالد", 38, 44, 41, 60)
    ];
    localStorage.setItem(SEEDED_KEY, "1");
    save();
  }
}

/* ========== Mercy Committee ========== */
function getMercyData() {
  const eligible = studentsList.filter(s => { const a = s.calculateAverage(); return a >= 40 && a <= 49; });
  const rows = eligible.map(s => {              // originals are NOT modified
    const before = s.calculateAverage();
    return { id: s.id, name: s.name, before: round(before), after: round(Math.min(100, before + 5)) };
  });
  const totalAfter = rows.reduce((sum, r) => sum + r.after, 0);
  const avgAfter = rows.length === 0 ? 0 : round(totalAfter / rows.length);   // divide-by-zero guard
  return { rows, avgAfter };
}

/* ========== Dashboard ========== */
function renderStats() {
  const total = studentsList.length;
  const passed = studentsList.filter(s => s.isPassed()).length;
  const struggling = studentsList.filter(s => s.isStruggling()).length;
  const sumAvg = studentsList.reduce((sum, s) => sum + s.calculateAverage(), 0);
  $("stTotal").textContent = total;
  $("stPass").textContent = passed;
  $("stReview").textContent = total - passed;
  $("stFail").textContent = struggling;
  $("stAvg").textContent = total === 0 ? 0 : round(sumAvg / total);

  const letters = ["A", "B", "C", "D", "E", "F"];
  $("gradeBars").innerHTML = letters.map(l => {
    const n = studentsList.filter(s => s.getGrade() === l).length;
    const pct = total ? (n / total) * 100 : 0;
    return `<div class="bar"><span>تقدير ${l} (${n})</span><div class="bar-track"><i style="width:${pct}%"></i></div></div>`;
  }).join("");
}

/* ========== Table ========== */
function getVisible() {
  const q = $("search").value.trim().toLowerCase();
  return studentsList.filter(s => {
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    const matchF = currentFilter === "all" ||
      (currentFilter === "pass" && s.isPassed()) ||
      (currentFilter === "review" && !s.isPassed()) ||
      (currentFilter === "fail" && s.isStruggling());
    return matchQ && matchF;
  });
}

function renderTable() {
  const list = getVisible();
  $("tbody").innerHTML = list.length ? list.map(s => `
    <tr class="${s.isStruggling() ? "row-fail" : ""}">
      <td>${esc(s.id)}</td><td>${esc(s.name)}</td>
      <td>${s.grades[0]}</td><td>${s.grades[1]}</td><td>${s.grades[2]}</td>
      <td>${round(s.calculateAverage())}</td><td><b>${s.getGrade()}</b></td><td>${s.attendance}%</td>
      <td><span class="badge ${s.isPassed() ? "pass" : "review"}">${s.getResult()}</span></td>
      <td>
        <button class="ic" data-act="view" data-id="${esc(s.id)}" title="التفاصيل">👁️</button>
        <button class="ic" data-act="edit" data-id="${esc(s.id)}" title="تعديل">✏️</button>
        <button class="ic" data-act="del" data-id="${esc(s.id)}" title="حذف">🗑️</button>
      </td></tr>`).join("") : `<tr><td colspan="10" class="empty">لا توجد بيانات مطابقة</td></tr>`;
}

function renderMercy() {
  const { rows, avgAfter } = getMercyData();
  $("mercyBox").innerHTML = mercyHTML(rows, avgAfter);
}

function mercyHTML(rows, avgAfter) {
  if (!rows.length) return `<div class="panel empty">لا يوجد طلاب متوسطهم بين 40 و49 حالياً — لا توجد حالات رأفة.</div>`;
  return `<div class="panel"><div class="table-wrap"><table>
    <thead><tr><th>رقم الجلوس</th><th>الاسم</th><th>المتوسط قبل الرأفة</th><th>المتوسط بعد الرأفة</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td>${esc(r.id)}</td><td>${esc(r.name)}</td><td>${r.before}</td><td><b>${r.after}</b></td></tr>`).join("")}</tbody></table></div>
    <p style="margin-top:12px"><b>الطلاب المستفيدون:</b> ${rows.map(r => esc(r.name)).join("، ")}</p>
    <p><b>متوسط الطلاب بعد الرأفة:</b> ${avgAfter}</p></div>`;
}

function renderPicker() {
  const cur = $("studentPick").value;
  $("studentPick").innerHTML = `<option value="">— اختر طالباً —</option>` +
    studentsList.map(s => `<option value="${esc(s.id)}">${esc(s.id)} - ${esc(s.name)}</option>`).join("");
  $("studentPick").value = studentsList.some(s => s.id === cur) ? cur : "";
  $("studentReport").innerHTML = $("studentPick").value ? studentReportHTML(findStudent($("studentPick").value)) : "";
}

function refreshAll() {
  save(); renderStats(); renderTable(); renderMercy(); renderPicker(); consoleReport();
}

/* ========== Form (add / edit) ========== */
function toast(msg, type = "success") {
  const t = $("toast"); t.textContent = msg; t.className = `toast ${type} show`;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove("show"), 2800);
}
const findStudent = id => studentsList.find(s => s.id === id);

function validate(vals) {
  const [id, name, g1, g2, g3, att] = vals;
  if (!id || !name) return "رقم الجلوس والاسم مطلوبان";
  if ([g1, g2, g3, att].some(v => v === "" || isNaN(Number(v)))) return "يرجى إدخال جميع الدرجات ونسبة الحضور كأرقام";
  if ([g1, g2, g3].some(v => Number(v) < 0 || Number(v) > 100)) return "الدرجات يجب أن تكون بين 0 و100";
  if (Number(att) < 0 || Number(att) > 100) return "نسبة الحضور يجب أن تكون بين 0 و100";
  if (editingId === null && findStudent(id.trim())) return "رقم الجلوس مستخدم من قبل";
  return null;
}

function resetForm() {
  $("studentForm").reset(); editingId = null;
  $("fId").disabled = false; $("submitBtn").textContent = "إضافة الطالب";
  $("formTitle").textContent = "إضافة طالب جديد"; $("cancelEdit").hidden = true;
}

$("studentForm").addEventListener("submit", e => {
  e.preventDefault();
  const vals = ["fId", "fName", "fG1", "fG2", "fG3", "fAtt"].map(i => $(i).value);
  const err = validate(vals);
  if (err) return toast(err, "error");
  const st = new Student(vals[0], vals[1], vals[2], vals[3], vals[4], vals[5]);
  if (editingId !== null) {
    st.id = editingId;
    studentsList = studentsList.map(s => (s.id === editingId ? st : s));
    toast("تم تعديل بيانات الطالب بنجاح");
  } else {
    studentsList.push(st);
    toast("تمت إضافة الطالب بنجاح");
  }
  resetForm(); refreshAll();
});
$("cancelEdit").addEventListener("click", resetForm);

function startEdit(id) {
  const s = findStudent(id); if (!s) return;
  editingId = id;
  $("fId").value = s.id; $("fId").disabled = true; $("fName").value = s.name;
  $("fG1").value = s.grades[0]; $("fG2").value = s.grades[1]; $("fG3").value = s.grades[2];
  $("fAtt").value = s.attendance;
  $("submitBtn").textContent = "حفظ التعديل"; $("formTitle").textContent = "تعديل بيانات الطالب";
  $("cancelEdit").hidden = false; showView("students"); window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteStudent(id) {
  const s = findStudent(id);
  if (!s || !confirm(`هل تريد حذف الطالب "${s.name}"؟`)) return;
  studentsList = studentsList.filter(x => x.id !== id);
  if (editingId === id) resetForm();
  refreshAll(); toast("تم حذف الطالب");
}

$("tbody").addEventListener("click", e => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const { act, id } = b.dataset;
  if (act === "view") openModal(id);
  else if (act === "edit") startEdit(id);
  else deleteStudent(id);
});

/* ========== Search & filters ========== */
$("search").addEventListener("input", renderTable);
document.querySelectorAll(".filter").forEach(b => b.addEventListener("click", () => {
  currentFilter = b.dataset.filter;
  document.querySelectorAll(".filter").forEach(x => x.classList.toggle("active", x === b));
  renderTable();
}));

/* ========== Reports ========== */
function studentReportHTML(s) {
  if (!s) return "";
  return `<div class="report"><h3>تقرير الطالب: ${esc(s.name)}</h3><dl>
    <dt>رقم الجلوس</dt><dd>${esc(s.id)}</dd>
    <dt>المادة 1</dt><dd>${s.grades[0]}</dd><dt>المادة 2</dt><dd>${s.grades[1]}</dd><dt>المادة 3</dt><dd>${s.grades[2]}</dd>
    <dt>المجموع</dt><dd>${s.getTotal()}</dd><dt>المتوسط</dt><dd>${round(s.calculateAverage())}</dd>
    <dt>التقدير</dt><dd>${s.getGrade()}</dd><dt>الحضور</dt><dd>${s.attendance}%</dd>
    <dt>النتيجة</dt><dd><b>${s.getResult()}</b></dd></dl></div>`;
}

function openModal(id) { $("modalBody").innerHTML = studentReportHTML(findStudent(id)); $("modal").hidden = false; }
$("closeModal").addEventListener("click", () => ($("modal").hidden = true));
$("modal").addEventListener("click", e => { if (e.target === $("modal")) $("modal").hidden = true; });

function printHTML(html) { $("printArea").innerHTML = html; window.print(); }
$("printModal").addEventListener("click", () => printHTML($("modalBody").innerHTML));
$("studentPick").addEventListener("change", () => ($("studentReport").innerHTML = studentReportHTML(findStudent($("studentPick").value))));

$("printAll").addEventListener("click", () => {
  const rows = studentsList.map(s => `<tr><td>${esc(s.id)}</td><td>${esc(s.name)}</td><td>${s.grades.join("</td><td>")}</td><td>${round(s.calculateAverage())}</td><td>${s.getGrade()}</td><td>${s.attendance}%</td><td>${s.getResult()}</td></tr>`).join("");
  printHTML(`<h2>تقرير نتائج الطلاب</h2><p>إجمالي الطلاب: ${studentsList.length} — المتوسط العام: ${$("stAvg").textContent}</p>
    <table border="1" cellspacing="0"><thead><tr><th>الجلوس</th><th>الاسم</th><th>م1</th><th>م2</th><th>م3</th><th>المتوسط</th><th>التقدير</th><th>الحضور</th><th>النتيجة</th></tr></thead><tbody>${rows}</tbody></table>`);
});
$("printMercy").addEventListener("click", () => { const m = getMercyData(); printHTML(`<h2>تقرير لجنة الرأفة</h2>${mercyHTML(m.rows, m.avgAfter)}`); });

$("exportCsv").addEventListener("click", () => {
  if (!studentsList.length) return toast("لا توجد بيانات للتصدير", "error");
  const cell = v => `"${String(v).replace(/"/g, '""')}"`;
  const head = ["رقم الجلوس", "الاسم", "المادة 1", "المادة 2", "المادة 3", "المتوسط", "التقدير", "الحضور", "النتيجة"];
  const lines = studentsList.map(s => [s.id, s.name, ...s.grades, round(s.calculateAverage()), s.getGrade(), s.attendance, s.getResult()].map(cell).join(","));
  const blob = new Blob(["\uFEFF" + [head.map(cell).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "students.csv"; a.click();
  URL.revokeObjectURL(a.href); toast("تم تصدير الملف");
});

/* ========== Report: same data shown in Console + Browser ========== */
function buildReport() {
  const total = studentsList.length;
  const avg = total === 0 ? 0 : round(studentsList.reduce((sum, s) => sum + s.calculateAverage(), 0) / total);
  const passed = studentsList.filter(s => s.isPassed());
  const struggling = studentsList.filter(s => s.isStruggling());
  return {
    summary: { "إجمالي الطلاب": total, "الناجحون": passed.length, "يحتاجون مراجعة": total - passed.length, "المتعثرون": struggling.length, "المتوسط العام": avg },
    students: studentsList.map(s => ({ "رقم الجلوس": s.id, "الاسم": s.name, "م1": s.grades[0], "م2": s.grades[1], "م3": s.grades[2], "المتوسط": round(s.calculateAverage()), "التقدير": s.getGrade(), "الحضور %": s.attendance, "النتيجة": s.getResult() })),
    struggling: struggling.map(s => s.name),
    mercy: getMercyData()
  };
}

function consoleReport() {
  const r = buildReport();
  const head = "background:#4f46e5;color:#fff;padding:4px 12px;border-radius:6px;font-size:14px;font-weight:bold";
  console.clear();
  console.log("%c🎓 Student Results Management — تقرير النتائج", head);
  console.group("%c📊 الإحصائيات", "color:#4f46e5;font-weight:bold");
  console.table(r.summary);
  console.groupEnd();
  console.group("%c👨‍🎓 جدول الطلاب", "color:#16a34a;font-weight:bold");
  console.table(r.students);
  console.groupEnd();
  console.group("%c⚠️ الطلاب المتعثرون", "color:#dc2626;font-weight:bold");
  console.log(r.struggling.join("، ") || "لا يوجد");
  console.groupEnd();
  console.group("%c🤝 لجنة الرأفة", "color:#d97706;font-weight:bold");
  if (r.mercy.rows.length) {
    console.table(r.mercy.rows.map(x => ({ "رقم الجلوس": x.id, "الاسم": x.name, "قبل الرأفة": x.before, "بعد الرأفة": x.after })));
    console.log("متوسط الطلاب بعد الرأفة:", r.mercy.avgAfter);
  } else console.log("لا توجد حالات رأفة");
  console.groupEnd();
  renderReportPanel(r);
}

function renderReportPanel(r) {
  const sum = Object.entries(r.summary).map(([k, v]) => `<div class="mini"><span>${k}</span><b>${v}</b></div>`).join("");
  const rows = r.students.map(x => `<tr><td>${esc(x["رقم الجلوس"])}</td><td>${esc(x["الاسم"])}</td><td>${x["المتوسط"]}</td><td>${x["التقدير"]}</td><td>${x["النتيجة"]}</td></tr>`).join("");
  $("reportPanel").innerHTML = `<div class="minis">${sum}</div>
    <div class="table-wrap"><table><thead><tr><th>الجلوس</th><th>الاسم</th><th>المتوسط</th><th>التقدير</th><th>النتيجة</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="empty">لا يوجد طلاب</td></tr>'}</tbody></table></div>
    <p><b>المتعثرون:</b> ${r.struggling.map(esc).join("، ") || "لا يوجد"}</p>
    <p><b>لجنة الرأفة:</b> ${r.mercy.rows.length ? r.mercy.rows.map(x => `${esc(x.name)} (${x.before} ← ${x.after})`).join("، ") + ` — المتوسط بعد الرأفة: ${r.mercy.avgAfter}` : "لا توجد حالات"}</p>`;
}
$("logConsole").addEventListener("click", () => { consoleReport(); toast("تمت الطباعة في Console (F12)"); });

/* ========== Navigation ========== */
function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === `view-${name}`));
  document.querySelectorAll(".nav").forEach(n => n.classList.toggle("active", n.dataset.view === name));
  $("sidebar").classList.remove("open");
}
document.querySelectorAll(".nav").forEach(n => n.addEventListener("click", () => showView(n.dataset.view)));
$("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));

/* ========== Init ========== */
load(); renderStats(); renderTable(); renderMercy(); renderPicker(); consoleReport();
