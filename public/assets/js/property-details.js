// public/assets/js/property-details.js
// -----------------------------------
// Robust property-details loader (Supabase)
// Uses same supabase URL/key as properties.js

const SUPABASE_URL = 'https://fbkbwshaytjxyaswomxo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2J3c2hheXRqeHlhc3dvbXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzU1MzQsImV4cCI6MjA3Mjc1MTUzNH0.X9H_hL3F6x2zhl0A5frOM-SLrBPnyvy-yKnvE9JmM7E';

function formatStatusBadge(status) {
  if (!status) return '';
  const map = {
    available: 'Available',
    sold: 'Sold',
    reserved: 'Reserved',
    under_review: 'Under Review',
    'for sale': 'For Sale',
    'for-rent': 'For Rent',
    rent: 'For Rent'
  };
  const label = map[status.toLowerCase()] || status;
  // return HTML string (keeps styling consistent with properties page)
  return `<span class="badge status-badge ${status.toLowerCase().replace(/\s+/g,'-')}">${label}</span>`;
}

function showError(message) {
  console.warn('[property-details] ' + message);
  const desc = document.getElementById('property-description');
  if (desc) desc.innerHTML = `<p class="text-danger">${message}</p>`;
}

// wait for DOM
document.addEventListener('DOMContentLoaded', async () => {
  // ensure supabase library is present
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase JS not found. Add <script src="https://unpkg.com/@supabase/supabase-js@2"></script> before this file.');
    showError('Internal error: missing Supabase library.');
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  // read id from url
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id');
  if (!idParam) {
    showError('No property id provided in URL (expected ?id=...).');
    console.log("Example: property-details.html?id=3");
    return;
  }

  // coerce numeric ids, leave uuid/text ids intact
  const propertyId = /^\d+$/.test(idParam) ? Number(idParam) : idParam;
  console.log('[property-details] loading id=', propertyId);

  // elements (defensive retrieval)
  const el = {
    title: document.getElementById('property-title'),
    location: document.getElementById('property-location'),
    price: document.getElementById('property-price'),
    status: document.getElementById('property-status'),
    bedrooms: document.getElementById('bedrooms'),
    bathrooms: document.getElementById('bathrooms'),
    size: document.getElementById('size'),
    description: document.getElementById('property-description'),
    mainImageContainer: document.getElementById('property-main-image'),
    galleryList: document.getElementById('property-gallery'),
    interiorAmenities: document.getElementById('interior-amenities'),
    exteriorAmenities: document.getElementById('exterior-amenities'),
    map: document.getElementById('property-map'),
    locationDetails: document.getElementById('property-location-details')
  };

  // If some elements are not found by id, try sensible fallbacks:
  if (!el.galleryList) el.galleryList = document.querySelector('.property-gallery') || document.querySelector('.thumbnail-gallery');
  if (!el.mainImageContainer) el.mainImageContainer = document.querySelector('.main-image-container') || el.galleryList;
  if (!el.interiorAmenities) el.interiorAmenities = document.querySelector('.property-amenities .col-md-6:first-child ul');
  if (!el.exteriorAmenities) el.exteriorAmenities = document.querySelector('.property-amenities .col-md-6:last-child ul');

  // show a tiny loading state
  if (el.title) el.title.textContent = 'Loading...';

  // Fetch property row
  let resp;
  try {
    resp = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();
  } catch (err) {
    console.error('[property-details] Query failed:', err);
    showError('Query failed (see console).');
    return;
  }

  const { data: property, error } = resp;
  if (error) {
    console.error('[property-details] Supabase error:', error);
    // common cause: Row Level Security (RLS) or wrong table name/col
    if (error.message && /permission|forbidden|rbac/i.test(error.message)) {
      showError('Permission error: check Supabase RLS / policies. (See console.)');
    } else {
      showError(`Error loading property: ${error.message || JSON.stringify(error)}`);
    }
    return;
  }

  if (!property) {
    showError('No property found for id=' + propertyId);
    return;
  }

  console.log('[property-details] property row:', property);

  // Fill overview
  if (el.title) el.title.textContent = property.title || '';
  if (el.location) el.location.textContent = property.location || '';
  if (el.price) {
    const priceNumber = property.price ? Number(property.price) : NaN;
    el.price.textContent = isFinite(priceNumber) ? `₦${priceNumber.toLocaleString()}` : (property.price || '₦0');
  }
  if (el.status) el.status.innerHTML = formatStatusBadge(property.status);

  if (el.bedrooms) el.bedrooms.textContent = property.bedrooms ?? 0;
  if (el.bathrooms) el.bathrooms.textContent = property.bathrooms ?? 0;
  if (el.size) el.size.textContent = property.size ?? property.area_sqft ?? 0;

  // Description (replace contents)
  if (el.description) {
    el.description.innerHTML = property.description ? `<p>${property.description}</p>` : '<p>No description provided.</p>';
  }

  // Gallery handling: supports `images` (text[]), or single `image_url`
  function buildGallery(imagesArray, mainContainer, thumbnailsContainer) {
    if (!mainContainer && !thumbnailsContainer) return;
    // default containers
    const mainEl = mainContainer || document.createElement('div');
    const thumbsEl = thumbnailsContainer || document.createElement('div');

    // main image element
    mainEl.innerHTML = `<img id="main-product-image" src="${imagesArray[0]}" alt="${property.title || 'Property image'}" class="img-fluid main-property-image">`;

    // thumbnails
    thumbsEl.innerHTML = imagesArray.map((src, idx) => `
      <div class="thumbnail-item ${idx === 0 ? 'active' : ''}" data-image="${src}">
        <img src="${src}" class="img-fluid" alt="thumb-${idx}">
      </div>
    `).join('');

    // hook thumbnail clicks
    thumbsEl.querySelectorAll('.thumbnail-item').forEach(t => {
      t.addEventListener('click', (e) => {
        const src = t.dataset.image;
        const mainImg = document.getElementById('main-product-image');
        if (mainImg && src) mainImg.src = src;
        // update active class
        thumbsEl.querySelectorAll('.thumbnail-item').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
      });
    });

    // replace/append into DOM if thumbnails container is actually the .property-gallery parent
    if (el.galleryList && el.mainImageContainer) {
      el.mainImageContainer.innerHTML = mainEl.innerHTML;
      el.galleryList.innerHTML = thumbsEl.innerHTML;
      // re-attach click listeners after injecting (because new nodes are different)
      el.galleryList.querySelectorAll('.thumbnail-item').forEach(t => {
        t.addEventListener('click', () => {
          const src = t.dataset.image;
          const mainImg = document.getElementById('main-product-image');
          if (mainImg && src) mainImg.src = src;
          el.galleryList.querySelectorAll('.thumbnail-item').forEach(x => x.classList.remove('active'));
          t.classList.add('active');
        });
      });
    } else {
      if (mainContainer) mainContainer.innerHTML = mainEl.innerHTML;
      if (thumbnailsContainer) thumbnailsContainer.innerHTML = thumbsEl.innerHTML;
    }
  }

 // Insert images
if (property.image_urls && Array.isArray(property.image_urls) && property.image_urls.length) {
  buildGallery(property.image_urls, el.mainImageContainer, el.galleryList);
} else if (property.image_url) {
  const img = property.image_url;
  if (el.mainImageContainer) {
    el.mainImageContainer.innerHTML = `
      <img id="main-product-image" src="${img}" alt="${property.title || ''}" class="img-fluid main-property-image">
    `;
  }
  if (el.galleryList) {
    el.galleryList.innerHTML = `
      <div class="thumbnail-item active" data-image="${img}">
        <img src="${img}" class="img-fluid">
      </div>
    `;
  }
} else {
  // no images
  if (el.mainImageContainer) {
    el.mainImageContainer.innerHTML = `<img src="/assets/img/placeholder.png" class="img-fluid">`;
  }
}


  // Amenities - accept arrays or comma-separated strings
  function fillAmenities(targetEl, value) {
    if (!targetEl) return;
    if (!value) {
      targetEl.innerHTML = '<li><em>None listed</em></li>';
      return;
    }
    let items = [];
    if (Array.isArray(value)) items = value;
    else if (typeof value === 'string') items = value.split(',').map(s => s.trim()).filter(Boolean);
    targetEl.innerHTML = items.length ? items.map(i => `<li><i class="bi bi-check-circle"></i>${i}</li>`).join('') : '<li><em>None listed</em></li>';
  }

  fillAmenities(el.interiorAmenities, property.interior_amenities || property.amenities_interior || property.amenities);
  fillAmenities(el.exteriorAmenities, property.exterior_amenities || property.amenities_exterior);

  // Map embed: use map_embed column if present, else use lat/lng if present
  if (el.map) {
    if (property.map_embed) {
      el.map.innerHTML = property.map_embed;
    } else if (property.latitude && property.longitude) {
      const lat = encodeURIComponent(property.latitude);
      const lng = encodeURIComponent(property.longitude);
      el.map.innerHTML = `<iframe width="100%" height="350" frameborder="0" style="border:0"
        src="https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed" allowfullscreen loading="lazy"></iframe>`;
    } else if (property.location) {
      // fallback to search by text location
      const q = encodeURIComponent(property.location);
      el.map.innerHTML = `<iframe width="100%" height="350" frameborder="0" style="border:0"
        src="https://www.google.com/maps?q=${q}&z=13&output=embed" allowfullscreen loading="lazy"></iframe>`;
    } else {
      el.map.innerHTML = '<p>No map available</p>';
    }
  }

  // optional property-location-details
  if (el.locationDetails) {
    el.locationDetails.innerHTML = property.neighborhood || property.location_description || '';
  }

  // final tweaks: scroll to top
  window.scrollTo(0, 0);
  console.log('[property-details] render complete');
});
