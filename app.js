const KEY = "hegemony-tax-v2";
const clone = (o) => JSON.parse(JSON.stringify(o));
const cfg = window.DEFAULT_CONFIG;
const fk = (c, f) => c.id + "." + f.id;

let state = load();

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.values && s.laws) return s;
  } catch (e) {}
  return fresh();
}
function fresh() {
  return {
    laws: Object.fromEntries(cfg.laws.map((l) => [l.id, cfg.policies[0]])),
    values: Object.fromEntries(cfg.classes.flatMap((c) => c.fields.map((f) => [fk(c, f), 0]))),
  };
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

const $ = (id) => document.getElementById(id);
function multParts() {
  const m = cfg.multiplier;
  const lv = state.laws[m.baseLaw];
  const sum = m.sumLaws.reduce((a, id) => a + m.sumValue[state.laws[id]], 0);
  return { base: m.base[lv], factor: m.factor[lv], sum };
}
// Operación del multiplicador con cada número en el color de la ley de la que sale
function opHtml() {
  const m = cfg.multiplier;
  const col = (id) => cfg.laws.find((l) => l.id === id).color;
  const num = (v, id) => `<b style="color:${col(id)}">${v}</b>`;
  const p = multParts();
  const baseN = num(p.base, m.baseLaw);
  if (!p.factor) return `${baseN} (solo base)`;
  const parts = m.sumLaws.map((id) => num(m.sumValue[state.laws[id]], id)).join(" + ");
  return `${baseN} + ${num(p.factor, m.baseLaw)} × (${parts})`;
}
const mod = () => { const p = multParts(); return p.base + p.factor * p.sum; };
// Devuelve {amount}: el impuesto de la clase
function calc(c) {
  if (c.table) {
    const t = c.table;
    const rate = t.values[state.laws[t.rowLaw]][state.laws[t.colLaw]];
    const units = state.values[c.id + "." + t.perField];
    const own = t.multField ? mod() * state.values[c.id + "." + t.multField] : 0;
    return { amount: rate * units + own };
  }
  {
    const k = c.corp;
    const firms = state.values[c.id + "." + k.firmsField];
    const revenue = state.values[c.id + "." + k.revenueField];
    const base = mod() * firms;                      // multiplicador × empresas
    const remaining = Math.max(0, revenue - base);   // ingresos que quedan tras pagar la base
    const row = k.brackets.filter((b) => remaining >= b.min).pop();
    const extra = row ? row[state.laws[k.colLaw]] : 0;
    return { amount: base + extra };
  }
}
const totalHtml = (c) => { const r = calc(c);
  return `<strong>${cfg.currency}${r.amount}</strong>`; };
function render() {
  $("laws").innerHTML = cfg.laws.map((l, n) => `
    <div class="law" style="--c:${l.color}">
      <span class="lname"><b class="num">${n + 1}</b>${l.name}</span>
      <div class="seg">${cfg.policies.map((p) =>
        `<button data-law="${l.id}" data-level="${p}" class="${p === state.laws[l.id] ? "on" : ""}">${p}</button>`).join("")}
      </div>
    </div>`).join("");

  $("modifier").innerHTML = `
    <div class="mod">
      <span>Multiplicador impositivo
        <small>${opHtml()}</small></span>
      <output>${mod()}</output>
    </div>`;

  $("cards").innerHTML = cfg.classes.map((c) => `
    <article style="--c:${c.color}">
      <header class="chead">
        <h2>${c.name}</h2>
        <div class="total">${totalHtml(c)}</div>
      </header>
      <div class="fields">
        ${c.fields.map((f) => `
          <label class="field"><span>${f.label}</span>
            <input type="number" min="0" inputmode="numeric" value="${state.values[fk(c, f)] || ""}"
                   placeholder="0" data-value="${fk(c, f)}">
          </label>`).join("")}
      </div>
      ${c.note ? `<p class="cnote">${c.note}</p>` : ""}
    </article>`).join("");

  renderState();
}

function renderState() {
  const sum = cfg.classes.reduce((a, c) => a + calc(c).amount, 0);
  $("state").innerHTML = `
    <article style="--c:#5b6b79">
      <header class="chead">
        <h2>Estado<small class="sub">Total de impuestos</small></h2>
        <div class="total"><strong>${cfg.currency}${sum}</strong></div>
      </header>
      <div class="state-list">
        ${cfg.classes.map((c) => `
          <div class="state-row" style="--c:${c.color}">
            <span>${c.name}</span>
            <b>${cfg.currency}${calc(c).amount}</b>
          </div>`).join("")}
      </div>
    </article>`;
}

function refreshTotals() {
  document.querySelectorAll("#cards .total").forEach((el, n) => (el.innerHTML = totalHtml(cfg.classes[n])));
  renderState();
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.law) {
    state.laws[t.dataset.law] = t.dataset.level; save(); render();
  } else if (t.id === "reset") {
    Object.keys(state.values).forEach((k) => (state.values[k] = 0)); save(); render();
  }
});

document.addEventListener("input", (e) => {
  const i = e.target;
  if (i.dataset.value) {
    state.values[i.dataset.value] = Math.max(0, Number(i.value) || 0);
    save(); refreshTotals();
  }
});

render();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
