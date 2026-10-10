const GEAR_URL = 'gear.json';
const DEFAULT_SOCKETS = { weapon: 2 };   // everything else defaults to 1

const dialog    = document.getElementById('picker');
const titleEl   = document.getElementById('picker-title');
const searchEl  = document.getElementById('picker-search');
const listEl    = document.getElementById('picker-list');

let gear = null;
let loadError = false;
let activeSlot = null;
const selected = {};

/* ---------- Data ---------- */
async function loadGear() {
  try {
    const res = await fetch(GEAR_URL);
    if (!res.ok) throw new Error(res.status);
    gear = await res.json();
  } catch (err) {
    console.error('Could not load gear data:', err);
    loadError = true;
  }
}

function itemsFor(slot) {
  if (!gear) return [];
  return slot === 'weapon' ? gear.weapons || [] : (gear.armor && gear.armor[slot]) || [];
}

/* ---------- Helpers ---------- */
const slotEl = (slot) => document.querySelector(`.slot[data-slot="${slot}"]`);

function makeIcon(item) {
  const icon = document.createElement('div');
  icon.className = 'gear-icon';
  icon.setAttribute('aria-hidden', 'true');
  if (item.image) {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = '';
    icon.appendChild(img);
  } else {
    icon.textContent = item.name.charAt(0);
  }
  return icon;
}

/* ---------- Modal ---------- */
function openPicker(slot) {
  activeSlot = slot;
  titleEl.textContent = `Choose ${slotEl(slot).dataset.label.toLowerCase()}`;
  searchEl.value = '';
  renderList();
  dialog.showModal();
  searchEl.focus();
}

function renderList() {
  listEl.replaceChildren();

  if (loadError) return showMessage('Could not load items.');

  const query = searchEl.value.trim().toLowerCase();
  const items = itemsFor(activeSlot).filter((i) =>
    `${i.name} ${i.detail || ''}`.toLowerCase().includes(query)
  );
  if (!items.length) return showMessage(query ? 'No items match your search.' : 'No items available yet.');

  const current = selected[activeSlot];
  for (const item of items) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'picker-item';
    if (current && current.id === item.id) btn.setAttribute('aria-current', 'true');

    const text = document.createElement('span');
    text.textContent = item.name;
    if (item.detail) {
      const small = document.createElement('small');
      small.textContent = item.detail;
      text.appendChild(small);
    }
    btn.append(makeIcon(item), text);
    btn.addEventListener('click', () => { applyPick(activeSlot, item); dialog.close(); });
    li.appendChild(btn);
    listEl.appendChild(li);
  }
}

function showMessage(msg) {
  const li = document.createElement('li');
  li.className = 'picker-msg';
  li.textContent = msg;
  listEl.appendChild(li);
}

/* ---------- Slots ---------- */
function renderSockets(slot, item) {
  const el = slotEl(slot).querySelector('.sockets');
  const cells = (item && item.cells) || Array(DEFAULT_SOCKETS[slot] || 1).fill(null);
  el.replaceChildren();
  cells.forEach((type, i) => {
    const s = document.createElement('button');
    s.className = 'socket';
    s.setAttribute('aria-label', `${slotEl(slot).dataset.label} cell slot ${i + 1}${type ? ` (${type})` : ''}`);
    if (type) { s.classList.add('typed'); s.style.setProperty('--c', `var(--${type})`); }
    el.appendChild(s);
  });
}

function applyPick(slot, item) {
  const el = slotEl(slot);
  const pick = el.querySelector('.gear-pick');
  const name = el.querySelector('.name');
  const type = el.querySelector('.type');

  selected[slot] = item;
  pick.replaceChild(makeIcon(item), pick.querySelector('.gear-icon'));
  name.textContent = item.name;
  name.classList.remove('empty');
  type.textContent = slot === 'weapon' && item.detail ? item.detail : el.dataset.label;
  renderSockets(slot, item);
}

function clearSlot(slot) {
  const el = slotEl(slot);
  const pick = el.querySelector('.gear-pick');
  const icon = document.createElement('div');
  icon.className = 'gear-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '+';

  delete selected[slot];
  pick.replaceChild(icon, pick.querySelector('.gear-icon'));
  const name = el.querySelector('.name');
  name.textContent = slot === 'weapon' ? 'Choose a weapon' : slot === 'lantern' ? 'Choose lantern' : 'Choose armor';
  name.classList.add('empty');
  el.querySelector('.type').textContent = el.dataset.label;
  renderSockets(slot, null);
}

/* ---------- Events ---------- */
document.querySelectorAll('.slot .gear-pick').forEach((btn) =>
  btn.addEventListener('click', () => openPicker(btn.closest('.slot').dataset.slot))
);
searchEl.addEventListener('input', renderList);
document.getElementById('picker-close').addEventListener('click', () => dialog.close());
document.getElementById('picker-clear').addEventListener('click', () => { clearSlot(activeSlot); dialog.close(); });
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); }); // click on backdrop
document.getElementById('reset').addEventListener('click', () => Object.keys(selected).forEach(clearSlot));

loadGear();