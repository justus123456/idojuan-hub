// Initialize Supabase
const supabase = window.supabase.createClient(
  'https://fbkbwshaytjxyaswomxo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2J3c2hheXRqeHlhc3dvbXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzU1MzQsImV4cCI6MjA3Mjc1MTUzNH0.X9H_hL3F6x2zhl0A5frOM-SLrBPnyvy-yKnvE9JmM7E'
);

function formatStatusBadge(status) {
  const map = {
    available: 'Available',
    sold: 'Sold',
    reserved: 'Reserved',
    under_review: 'Under Review'
  };
  return map[status] ? `<span class="badge ${status}">${map[status]}</span>` : '';
}

// Featured loader (unchanged)
async function loadFeaturedProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error loading featured properties:', error);
    return;
  }

  const container = document.getElementById('featured-properties-grid');
  if (!container) return;

  container.innerHTML = data.map(p => `
    <div class="col-lg-4 col-md-6">
      <div class="property-card">
        <div class="property-image">
          <img src="${p.image_url || '/assets/img/placeholder.png'}" alt="${p.title}" class="img-fluid">
          <div class="property-badges">
            ${p.badge ? `<span class="badge featured">${p.badge}</span>` : ''}
            ${formatStatusBadge(p.status)}
          </div>
        </div>
        <div class="property-content">
          <div class="property-price">₦${Number(p.price).toLocaleString()}</div>
          <h4 class="property-title">${p.title}</h4>
          <p class="property-location"><i class="bi bi-geo-alt"></i> ${p.location}</p>
          <div class="property-features">
            <span><i class="bi bi-house"></i> ${p.bedrooms || 0} Bed</span>
            <span><i class="bi bi-droplet"></i> ${p.bathrooms || 0} Bath</span>
            <span><i class="bi bi-aspect-ratio"></i> ${p.size || 0} Sqft</span>
          </div>
          <a href="property-details.html?id=${p.id}" class="btn btn-primary w-100">View Details</a>
        </div>
      </div>
    </div>
  `).join('');
}

// Main properties logic
document.addEventListener('DOMContentLoaded', () => {
  // Auto-run featured when present
  if (document.getElementById('featured-properties-grid')) loadFeaturedProperties();

  const gridContainer = document.getElementById('all-properties-grid');
  if (!gridContainer) {
    // We're not on the properties page; stop
    return;
  }

  // Elements (defensive fallbacks)
  const viewButtons = document.querySelectorAll('.view-btn');
  const sortSelectEl = document.querySelector('.sort-dropdown select');
  const sortSelect = sortSelectEl || { value: 'newest', addEventListener: () => {} };

  // Prefer explicit id for apply button, fallback to the first .properties-sidebar .btn-primary
  const filterBtn = document.getElementById('applyFiltersBtn') || document.querySelector('.properties-sidebar .btn-primary');

  const propertyTypeEl = document.getElementById('propertyType');
  const minPriceEl = document.getElementById('minPrice');
  const maxPriceEl = document.getElementById('maxPrice');
  const locationEl = document.getElementById('location');

  const bedroomButtons = document.querySelectorAll('.bedroom-filter .filter-btn');
  const bathroomButtons = document.querySelectorAll('.bathroom-filter .filter-btn');

  let selectedBedrooms = 'any';
  let selectedBathrooms = 'any';

  // Pagination
  const pageSize = 6;
  let currentPage = 1;
  let totalCount = 0;

  async function loadProperties(page = 1) {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Sorting map
      const sortMap = {
        'price-asc': ['price', true],
        'price-desc': ['price', false],
        'most-viewed': ['views', false],
        'newest': ['created_at', false]
      };
      const [orderBy, ascending] = sortMap[sortSelect.value] || ['created_at', false];

      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .order(orderBy, { ascending })
        .range(from, to);

      // Apply filters safely (use element values only if elements exist)
      const propertyType = propertyTypeEl ? propertyTypeEl.value : 'all';
      const minPrice = minPriceEl && minPriceEl.value ? Number(minPriceEl.value) : null;
      const maxPrice = maxPriceEl && maxPriceEl.value ? Number(maxPriceEl.value) : null;
      const location = locationEl && locationEl.value.trim() ? locationEl.value.trim() : null;

      if (propertyType !== 'all') query = query.eq('type', propertyType);
      if (minPrice !== null) query = query.gte('price', minPrice);
      if (maxPrice !== null) query = query.lte('price', maxPrice);
      if (selectedBedrooms !== 'any') query = query.gte('bedrooms', Number(selectedBedrooms));
      if (selectedBathrooms !== 'any') query = query.gte('bathrooms', Number(selectedBathrooms));
      if (location) query = query.ilike('location', `%${location}%`);

      const { data, count, error } = await query;
      if (error) {
        console.error('Error loading properties:', error);
        return;
      }

      totalCount = typeof count === 'number' ? count : (data ? data.length : 0);
      renderProperties(data || []);
      renderPagination();
    } catch (err) {
      console.error('loadProperties error:', err);
    }
  }

  function renderProperties(properties) {
    gridContainer.innerHTML = properties.map(p => {
  // Prefer first image from image_urls array if available
  const firstImage = (Array.isArray(p.image_urls) && p.image_urls.length > 0)
    ? p.image_urls[0]
    : (p.image_url || '/assets/img/placeholder.png');

  return `
    <div class="${gridContainer.classList.contains('property-list') ? 'col-12' : 'col-lg-6 col-md-6'}">
      <div class="property-card">
        <div class="property-image">
          <img src="${firstImage}" alt="${p.title}" class="img-fluid">
          <div class="property-badges">
            ${p.featured ? '<span class="badge featured">Featured</span>' : ''}
            ${formatStatusBadge(p.status)}
          </div>
        </div>
        <div class="property-content">
          <div class="property-price">₦${Number(p.price).toLocaleString()}</div>
          <h4 class="property-title">${p.title}</h4>
          <p class="property-location"><i class="bi bi-geo-alt"></i> ${p.location}</p>
          <div class="property-features">
            <span><i class="bi bi-house"></i> ${p.bedrooms || 0} Bed</span>
            <span><i class="bi bi-water"></i> ${p.bathrooms || 0} Bath</span>
            <span><i class="bi bi-arrows-angle-expand"></i> ${p.size || p.area_sqft || 0} Sqft</span>
          </div>
          <a href="property-details.html?id=${p.id}" class="btn btn-primary w-100">View Details</a>
        </div>
      </div>
    </div>
  `;
}).join('');
  }

  function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    pagination.innerHTML = `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
      </li>
      ${Array.from({ length: totalPages }, (_, i) => `
        <li class="page-item ${currentPage === i + 1 ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i + 1}">${i + 1}</a>
        </li>
      `).join('')}
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
      </li>
    `;

    pagination.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = Number(link.dataset.page);
        if (!isNaN(page) && page > 0 && page <= totalPages) {
          currentPage = page;
          loadProperties(currentPage);
        }
      });
    });
  }

  // bedroom/bath toggles (if present)
  if (bedroomButtons && bedroomButtons.length) {
    bedroomButtons.forEach(btn =>
      btn.addEventListener('click', () => {
        bedroomButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedBedrooms = btn.textContent.toLowerCase().includes('any') ? 'any' : btn.textContent.replace('+', '').trim();
      })
    );
  }

  if (bathroomButtons && bathroomButtons.length) {
    bathroomButtons.forEach(btn =>
      btn.addEventListener('click', () => {
        bathroomButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedBathrooms = btn.textContent.toLowerCase().includes('any') ? 'any' : btn.textContent.replace('+', '').trim();
      })
    );
  }

  // view buttons
  if (viewButtons && viewButtons.length) {
    viewButtons.forEach(btn =>
      btn.addEventListener('click', () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gridContainer.classList.toggle('property-list', btn.dataset.view === 'list');
        loadProperties(currentPage);
      })
    );
  }

  // sort
  if (sortSelectEl) {
    sortSelectEl.addEventListener('change', () => {
      currentPage = 1;
      loadProperties(currentPage);
    });
  }

  // Apply filters button (defensive)
  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      currentPage = 1;
      loadProperties(currentPage);
    });
  } else {
    console.warn('Apply Filters button not found. Add id="applyFiltersBtn" or ensure .properties-sidebar .btn-primary exists.');
  }

  // initial load
  loadProperties(currentPage);
});
