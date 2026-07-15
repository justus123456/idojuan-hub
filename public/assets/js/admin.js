// public/assets/js/admin.js
// Uses global Supabase client from CDN in admin.html
const SUPABASE_URL = "https://fbkbwshaytjxyaswomxo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2J3c2hheXRqeHlhc3dvbXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzU1MzQsImV4cCI6MjA3Mjc1MTUzNH0.X9H_hL3F6x2zhl0A5frOM-SLrBPnyvy-yKnvE9JmM7E";
const supabaseLib = window.supabase;
const supabase = supabaseLib?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY);
if (!supabase) {
  alert("Supabase failed to load. Please refresh the page.");
}

// DOM Elements
const EL = {
  sidebar: document.getElementById('sidebar'),
  sidebarToggle: document.getElementById('sidebarToggle'),
  navProps: document.getElementById('nav-properties'),
  navOrders: document.getElementById('nav-orders'),
  navMaterials: document.getElementById('nav-materials'),

  sectionProperties: document.getElementById('section-properties'),
  sectionOrders: document.getElementById('section-orders'),
  sectionMaterials: document.getElementById('section-materials'),

  propertyForm: document.getElementById('property-form'),
  propertiesList: document.getElementById('properties-list'),
  previewGrid: document.getElementById('preview-grid'),
  imageFiles: document.getElementById('imageFiles'),

  materialForm: document.getElementById('material-form'),
  materialName: document.getElementById('material-name'),
  materialPrice: document.getElementById('material-price'),
  materialQuality: document.getElementById('material-quality'),
  materialsList: document.getElementById('materials-list'),

  ordersList: document.getElementById('orders-list'),
  btnExport: document.getElementById('btn-export'),
  btnImport: document.getElementById('btn-import'),
  fileImport: document.getElementById('file-import'),
  btnReset: document.getElementById('btn-reset'),
  btnPreview: document.getElementById('btn-preview')
};

// Message box
const messageBox = document.createElement('div');
messageBox.id = 'adminMessageBox';
messageBox.style.marginTop = '0.75rem';
if (EL.propertyForm && !EL.propertyForm.querySelector('#adminMessageBox')) {
  EL.propertyForm.appendChild(messageBox);
}

// --- UTILITY FUNCTIONS ---
const escapeHtml = s => String(s || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]);
function showMessage(text='', isError=false, timeout=5000) {
  if (messageBox) {
    messageBox.textContent = text;
    messageBox.style.color = isError ? '#991b1b' : '#065f46';
    messageBox.style.background = isError ? '#fee2e2' : '#ecfeff';
    messageBox.style.padding = '0.6rem 0.8rem';
    messageBox.style.borderRadius = '6px';
    messageBox.style.fontSize = '0.95rem';
    if (timeout) setTimeout(() => { messageBox.textContent = ''; }, timeout);
  } else {
    if (isError) alert(`Error: ${text}`); else console.info(text);
  }
}

// --- AUTH ---
async function requireAuth() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session ?? null;
  if (!session) { window.location.href = 'login.html'; throw new Error('Not authenticated'); }
  return session;
}

// --- SIDEBAR NAVIGATION ---
function showSection(name) {
  const sections = {
    properties: EL.sectionProperties,
    orders: EL.sectionOrders,
    materials: EL.sectionMaterials
  };
  Object.values(sections).forEach(sec => sec && (sec.style.display = 'none'));
  if (sections[name]) sections[name].style.display = 'block';

  if (name === 'properties') loadProperties().catch(()=>{});
  if (name === 'orders') loadOrders().catch(()=>{});
  if (name === 'materials') loadMaterials().catch(()=>{});
}
EL.sidebarToggle?.addEventListener('click', () => EL.sidebar.classList.toggle('collapsed'));
EL.navProps?.addEventListener('click', e => { e.preventDefault(); showSection('properties'); });
EL.navOrders?.addEventListener('click', e => { e.preventDefault(); showSection('orders'); });
EL.navMaterials?.addEventListener('click', e => { e.preventDefault(); showSection('materials'); });

// --- PROPERTIES CRUD ---
let editingPropertyId = null;

function mapClientStatus(adminStatus) {
  return adminStatus === 'for_sale' ? 'for_sale' :
         adminStatus === 'for_rent' ? 'for_rent' : 'not_available';
}

function readPropertyForm() {
  const f = EL.propertyForm;
  return {
    title: f?.querySelector('#title')?.value?.trim() || '',
    location: f?.querySelector('#location')?.value?.trim() || '',
    price: Number(f?.querySelector('#price')?.value) || 0,
    status_admin: f?.querySelector('#status')?.value || 'under_review',
    status_client: mapClientStatus(f?.querySelector('#status')?.value),
    property_type: f?.querySelector('#property_type')?.value || '',
    bedrooms: parseInt(f?.querySelector('#bedrooms')?.value) || null,
    bathrooms: parseInt(f?.querySelector('#bathrooms')?.value) || null,
    size: f?.querySelector('#size')?.value || '',
    badge: f?.querySelector('#badge')?.value || null,
    description: f?.querySelector('#description')?.value || '',
    interior_amenities: f?.querySelector('#interior_amenities')?.value || '',
    exterior_amenities: f?.querySelector('#exterior_amenities')?.value || ''
  };
}

async function uploadFilesToStorage(files) {
  if (!files?.length) return [];
  const urls = [];
  for (const file of files) {
    const filePath = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('property-images').upload(filePath, file, { cacheControl:'3600', upsert:false });
    if (uploadError) throw uploadError;
    const { data: publicData } = supabase.storage.from('property-images').getPublicUrl(filePath);
    urls.push(publicData.publicUrl);
  }
  return urls;
}

async function saveProperty(payload) {
  if (editingPropertyId) {
    const { error } = await supabase.from('properties').update(payload).eq('id', editingPropertyId);
    if (error) throw error;
    editingPropertyId = null;
  } else {
    const { error } = await supabase.from('properties').insert([payload]);
    if (error) throw error;
  }
}

async function handlePropertySubmit(ev) {
  ev.preventDefault();
  try {
    showMessage('⏳ Saving property...', false, 0);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user ?? null;
    if (!user) { showMessage('You must be logged in to save properties', true); return; }

    const base = readPropertyForm();
    const files = EL.imageFiles?.files ?? [];
    const image_urls = files.length > 0 ? await uploadFilesToStorage(files) : ['https://via.placeholder.com/400x300?text=No+Image'];
    const payload = { ...base, image_urls, created_by: user.id, updated_at: new Date().toISOString() };
    await saveProperty(payload);
    showMessage('✅ Property saved successfully', false, 3000);
    EL.propertyForm.reset();
    await loadProperties();
    await renderPreviewGrid();
  } catch (err) {
    console.error(err);
    showMessage(`❌ Could not save property: ${err.message}`, true, 8000);
  }
}

async function loadProperties() {
  if (!EL.propertiesList) return;
  try {
    const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    renderPropertiesList(data || []);
  } catch(err) {
    console.error(err);
    showMessage('❌ Could not load properties', true);
  }
}

function renderPropertiesList(items = []) {
  if (!EL.propertiesList) return;
  EL.propertiesList.innerHTML = '';
  if (!items.length) { EL.propertiesList.innerHTML = '<p>No properties yet.</p>'; return; }

  items.forEach(p => {
    const card = document.createElement('div');
    card.className = 'property-card';
    const priceStr = p.price ? `₦${Number(p.price).toLocaleString()}` : '';
    const adminStatus = p.status_admin || 'under_review';
    const clientStatus = p.status_client || mapClientStatus(adminStatus);

    card.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${escapeHtml((p.image_urls && p.image_urls[0]) || 'https://via.placeholder.com/150')}" alt="${escapeHtml(p.title||'')}" style="width:120px;height:80px;object-fit:cover;border-radius:6px">
        <div style="flex:1">
          <h4 style="margin:0">${escapeHtml(p.title||'Untitled')}</h4>
          <p style="margin:4px 0;color:#6b7280">${escapeHtml(p.location||'')} • ${escapeHtml(p.property_type||'')}</p>
          <p style="margin:4px 0;font-weight:700">${priceStr}</p>
          <div style="margin-top:6px">
            <small style="color:#6b7280">Admin:</small>
            <span style="margin-left:6px;padding:4px 8px;border-radius:6px;background:#eef2ff;color:#1e3a8a">${escapeHtml(adminStatus)}</span>
            <small style="margin-left:12px;color:#6b7280">Client:</small>
            <span style="margin-left:6px;padding:4px 8px;border-radius:6px;background:#ecfeff;color:#065f46">${escapeHtml(clientStatus)}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="btn btn-edit btn-success" data-id="${p.id}">Edit</button>
          <button class="btn btn-delete btn-danger" data-id="${p.id}">Delete</button>
        </div>
      </div>
    `;
    EL.propertiesList.appendChild(card);
  });

  EL.propertiesList.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => startEditProperty(b.dataset.id)));
  EL.propertiesList.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => deleteProperty(b.dataset.id)));
}

async function startEditProperty(id) {
  try {
    const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
    if (error) throw error;

    editingPropertyId = data.id;
    const f = EL.propertyForm;
    if (!f) return;

    ['title','location','price','status','property_type','bedrooms','bathrooms','size','badge','description','interior_amenities','exterior_amenities'].forEach(k => {
      const el = f.querySelector(`#${k}`);
      if (el) el.value = data[k] || '';
    });

    showMessage('✏️ Editing property — update and Save', false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch(err) { console.error(err); showMessage('❌ Could not load property for edit', true); }
}

async function deleteProperty(id) {
  if (!confirm('Delete this property?')) return;
  try {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw error;
    showMessage('✅ Property deleted');
    await loadProperties();
    await renderPreviewGrid();
  } catch(err) { console.error(err); showMessage('❌ Could not delete property', true); }
}

async function renderPreviewGrid() {
  if (!EL.previewGrid) return;
  try {
    const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false }).limit(6);
    EL.previewGrid.innerHTML = '';
    (data || []).forEach(p => {
      const el = document.createElement('div');
      el.className = 'card small-card';
      el.style.width='200px';
      el.style.border='1px solid #e6eef7';
      el.style.borderRadius='8px';
      el.style.overflow='hidden';
      el.style.margin='8px';
      el.innerHTML = `
        <img src="${escapeHtml((p.image_urls && p.image_urls[0]) || 'https://via.placeholder.com/400x300')}" style="width:100%;height:120px;object-fit:cover">
        <div style="padding:8px">
          <h5 style="margin:0;font-size:14px">${escapeHtml(p.title||'')}</h5>
          <p style="margin:4px 0;color:#6b7280;font-size:12px">${escapeHtml(p.location||'')}</p>
          <p style="margin:0;font-weight:700;font-size:13px">₦${(p.price||0).toLocaleString()}</p>
        </div>
      `;
      EL.previewGrid.appendChild(el);
    });
  } catch(err) { console.error(err); }
}

// --- MATERIALS CRUD ---
async function loadMaterials() {
  if (!EL.materialsList) return;
  try {
    const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    renderMaterials(data || []);
  } catch(err) { console.error(err); showMessage('❌ Could not load materials', true); }
}

function renderMaterials(items = []) {
  if (!EL.materialsList) return;
  EL.materialsList.innerHTML = '';
  if (!items.length) { EL.materialsList.innerHTML = '<p>No materials yet.</p>'; return; }

  items.forEach(m => {
    const div = document.createElement('div');
    div.className = 'material-row';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.style.padding = '8px';
    div.style.border = '1px solid #e6eef7';
    div.style.borderRadius = '8px';
    div.style.marginBottom = '8px';

    div.innerHTML = `
      <div class='text-capitalize'>
        <strong class="font-weight-bold text-primary">${escapeHtml(m.name||'')}</strong>
        <div style="color:#303236">Price ₦${(m.unit_price||0).toLocaleString()}   Quality • ${escapeHtml(m.description||'')}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn-edit-material btn btn-success" data-id="${m.id}">Edit</button>
        <button class="btn-delete-material btn btn-danger" data-id="${m.id}">Delete</button>
      </div>
    `;

    EL.materialsList.appendChild(div);
  });

  EL.materialsList.querySelectorAll('.btn-edit-material').forEach(b => b.addEventListener('click', () => startEditMaterial(b.dataset.id)));
  EL.materialsList.querySelectorAll('.btn-delete-material').forEach(b => b.addEventListener('click', () => deleteMaterial(b.dataset.id)));
}

async function startEditMaterial(id) {
  try {
    const { data, error } = await supabase.from('materials').select('*').eq('id', id).single();
    if (error) throw error;

    EL.materialName.value = data.name;
    EL.materialPrice.value = data.unit_price;
    EL.materialQuality.value = data.description;
    EL.materialForm.setAttribute('data-edit-id', id);

    showMessage('✏️ Editing material — change values and submit', false);
  } catch(err) { console.error(err); showMessage('❌ Could not load material', true); }
}

async function submitMaterial(e) {
  e.preventDefault();
  const editId = EL.materialForm.getAttribute('data-edit-id');
  const name = (EL.materialName.value || '').trim();
  const unit_price = Number(EL.materialPrice.value) || 0;
  const description = (EL.materialQuality.value || '').trim();

  if (!name) return showMessage('Material name required', true);

  try {
    if (editId) {
      const { error } = await supabase.from('materials').update({ name, unit_price, description, updated_at: new Date().toISOString() }).eq('id', editId);
      if (error) throw error;
      EL.materialForm.removeAttribute('data-edit-id');
      showMessage('✅ Material updated', false);
    } else {
      const { error } = await supabase.from('materials').insert([{ name, unit_price, description, created_at: new Date().toISOString() }]);
      if (error) throw error;
      showMessage('✅ Material added', false);
    }
    EL.materialForm.reset();
    await loadMaterials();
  } catch(err) { console.error(err); showMessage('❌ Could not save material', true); }
}

async function deleteMaterial(id) {
  if (!confirm('Delete this material?')) return;
  try {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw error;
    showMessage('✅ Material removed');
    await loadMaterials();
  } catch(err) { console.error(err); showMessage('❌ Could not delete material', true); }
}

// --- ORDERS CRUD ---
async function loadOrders() {
  if (!EL.ordersList) return;
  try {
    const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    renderOrdersList(orders || []);
  } catch(err) { console.error(err); showMessage('❌ Could not load orders', true); }
}

function renderOrdersList(orders = []) {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!orders.length) { tbody.innerHTML = `<tr><td colspan="6">No orders yet.</td></tr>`; return; }

  orders.forEach(order => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(order.id)}</td>
      <td>${escapeHtml(order.customer_name || '')}</td>
      <td>${escapeHtml(order.material_name || '')}</td>
      <td>₦${(order.total_price || 0).toLocaleString()}</td>
      <td>${escapeHtml(order.status || '')}</td>
      <td>
        <button class="btn-approve btn btn-success" data-id="${order.id}">Approve</button>
        <button class="btn-reject btn btn-danger" data-id="${order.id}">Reject</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-approve').forEach(b => b.addEventListener('click', () => updateOrderStatus(b.dataset.id, 'approved')));
  tbody.querySelectorAll('.btn-reject').forEach(b => b.addEventListener('click', () => updateOrderStatus(b.dataset.id, 'rejected')));
}

async function updateOrderStatus(id, status) {
  if (!confirm(`Set order #${id} to "${status}"?`)) return;
  try {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) throw error;
    showMessage(`✅ Order #${id} marked as ${status}`);
    await loadOrders();
  } catch(err) { console.error(err); showMessage(`❌ Could not update order: ${err.message}`, true); }
}

// --- EXPORT / IMPORT ---
async function exportProperties() {
  try {
    const { data, error } = await supabase.from('properties').select('*');
    if (error) throw error;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'properties.json';
    a.click();

    showMessage('✅ Export started');
  } catch(err) { console.error(err); showMessage('❌ Export failed: ' + err.message, true); }
}

async function importProperties(file) {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    if (!Array.isArray(json)) throw new Error('Invalid import file');

    const { error } = await supabase.from('properties').insert(json);
    if (error) throw error;

    showMessage('✅ Import complete');
    await loadProperties();
    await renderPreviewGrid();
  } catch(err) { console.error(err); showMessage('❌ Import failed: ' + err.message, true); }
}

// --- UI WIRING ---
function wireUI() {
  EL.propertyForm?.addEventListener('submit', handlePropertySubmit);
  EL.btnReset?.addEventListener('click', () => { EL.propertyForm.reset(); editingPropertyId = null; messageBox.textContent = ''; });
  EL.btnPreview?.addEventListener('click', () => window.open('properties.html','_blank'));
  EL.materialForm?.addEventListener('submit', submitMaterial);
  EL.btnExport?.addEventListener('click', exportProperties);
  EL.btnImport?.addEventListener('click', () => EL.fileImport.click());
  EL.fileImport?.addEventListener('change', e => { const f = e.target.files?.[0]; if(f) importProperties(f); });
}

// --- BOOTSTRAP ADMIN APP ---
async function boot() {
  try { await requireAuth(); } catch(e) { return; }
  wireUI();
  showSection('properties');
  await loadProperties();
  await renderPreviewGrid();
  await loadOrders();
  await loadMaterials();
}

boot();
