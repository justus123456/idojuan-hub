// ======================
// Initialize Supabase
// ======================
const supabase = window.supabase.createClient(
  "https://fbkbwshaytjxyaswomxo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2J3c2hheXRqeHlhc3dvbXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzU1MzQsImV4cCI6MjA3Mjc1MTUzNH0.X9H_hL3F6x2zhl0A5frOM-SLrBPnyvy-yKnvE9JmM7E"
);

// ======================
// Status Badge Mapper
// ======================
function formatStatusBadge(status, role = "client") {
  if (!status) return "";

  const maps = {
    admin: {
      available: "Available",
      sold: "Sold",
      reserved: "Reserved",
      under_review: "Under Review",
    },
    client: {
      available: "For Sale",
      sold: "Sold",
      reserved: "Reserved",
      under_review: "Coming Soon",
      for_rent: "For Rent",
      for_lease: "For Lease",
    },
  };

  const dict = maps[role] || {};
  const label = dict[status.toLowerCase()] || status;

  return `<span class="badge badge-${status.toLowerCase()}">${label}</span>`;
}

// ======================
// Featured Properties (Homepage)
// ======================
async function loadFeaturedProperties() {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .in("status_admin", ["for_sale", "for_rent"]) // show only active properties
    .order("created_at", { ascending: false })
    .limit(3);

  const container = document.getElementById("featured-properties-grid");
  if (!container) return;

  if (error || !data.length) {
    container.innerHTML = "<p>No featured properties available.</p>";
    return;
  }

  container.innerHTML = data
    .map((p) => {
      const img =
        Array.isArray(p.image_urls) && p.image_urls.length > 0
          ? p.image_urls[0]
          : "/assets/img/placeholder.png";

      return `
      <div class="col-lg-4 col-md-6">
        <div class="property-card">
          <div class="property-image">
            <img src="${img}" alt="${p.title}" class="img-fluid">
            <div class="property-badges">
              ${p.featured ? '<span class="badge badge-featured">Featured</span>' : ""}
              ${p.badge ? `<span class="badge badge-hot">${p.badge}</span>` : ""}
              ${formatStatusBadge(p.status_client, "client")}
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
      `;
    })
    .join("");
}

// ======================
// Properties Page (properties.html)
// ======================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("featured-properties-grid")) {
    loadFeaturedProperties();
  }

  const gridContainer = document.getElementById("all-properties-grid");
  if (!gridContainer) return;

  const sortSelectEl = document.querySelector(".sort-dropdown select");
  const filterBtn = document.getElementById("applyFiltersBtn");
  const propertyTypeEl = document.getElementById("propertyType");
  const minPriceEl = document.getElementById("minPrice");
  const maxPriceEl = document.getElementById("maxPrice");
  const locationEl = document.getElementById("location");
  const bedroomButtons = document.querySelectorAll(".bedroom-filter .filter-btn");
  const bathroomButtons = document.querySelectorAll(".bathroom-filter .filter-btn");

  let selectedBedrooms = "any";
  let selectedBathrooms = "any";
  let currentPage = 1;
  const pageSize = 6;
  let totalCount = 0;

  async function loadProperties(page = 1) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const sortMap = {
      "price-asc": ["price", true],
      "price-desc": ["price", false],
      newest: ["created_at", false],
    };
    const [orderBy, ascending] = sortMap[sortSelectEl?.value] || ["created_at", false];

    let query = supabase
      .from("properties")
      .select("*", { count: "exact" })
      .in("status_admin", ["for_sale", "for_rent"]) // only active properties
      .order(orderBy, { ascending })
      .range(from, to);

    // Filters
    if (propertyTypeEl && propertyTypeEl.value !== "all")
      query = query.eq("property_type", propertyTypeEl.value);

    if (minPriceEl?.value) query = query.gte("price", Number(minPriceEl.value));
    if (maxPriceEl?.value) query = query.lte("price", Number(maxPriceEl.value));
    if (locationEl?.value.trim()) query = query.ilike("location", `%${locationEl.value.trim()}%`);
    if (selectedBedrooms !== "any") query = query.gte("bedrooms", Number(selectedBedrooms));
    if (selectedBathrooms !== "any") query = query.gte("bathrooms", Number(selectedBathrooms));

    const { data, count, error } = await query;
    if (error) {
      console.error("Error loading properties:", error);
      return;
    }

    totalCount = count || 0;
    renderProperties(data || []);
    renderPagination();
  }

  function renderProperties(properties) {
    if (!properties.length) {
      gridContainer.innerHTML = "<p>No properties match your filters.</p>";
      return;
    }

    gridContainer.innerHTML = properties
      .map((p) => {
        const img = Array.isArray(p.image_urls) && p.image_urls.length > 0
          ? p.image_urls[0]
          : "/assets/img/placeholder.png";

        return `
        <div class="col-lg-6 col-md-6">
          <div class="property-card">
            <div class="property-image">
              <img src="${img}" alt="${p.title}" class="img-fluid">
              <div class="property-badges">
                ${p.featured ? '<span class="badge badge-featured">Featured</span>' : ""}
                ${p.badge ? `<span class="badge badge-hot">${p.badge}</span>` : ""}
                ${formatStatusBadge(p.status_client, "client")}
              </div>
            </div>
            <div class="property-content">
              <div class="property-price">₦${Number(p.price).toLocaleString()}</div>
              <h4 class="property-title">${p.title}</h4>
              <p class="property-location"><i class="bi bi-geo-alt"></i> ${p.location}</p>
              <div class="property-features">
                <span><i class="bi bi-house"></i> ${p.bedrooms || 0} Bed</span>
                <span><i class="bi bi-water"></i> ${p.bathrooms || 0} Bath</span>
                <span><i class="bi bi-arrows-angle-expand"></i> ${p.size || 0} Sqft</span>
              </div>
              <a href="property-details.html?id=${p.id}" class="btn btn-primary w-100">View Details</a>
            </div>
          </div>
        </div>
        `;
      })
      .join("");
  }

  function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const pagination = document.querySelector(".pagination");
    if (!pagination) return;

    pagination.innerHTML = `
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
      </li>
      ${Array.from({ length: totalPages }, (_, i) => `
        <li class="page-item ${currentPage === i + 1 ? "active" : ""}">
          <a class="page-link" href="#" data-page="${i + 1}">${i + 1}</a>
        </li>`).join("")}
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
      </li>
    `;

    pagination.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        const page = Number(link.dataset.page);
        if (!isNaN(page) && page > 0 && page <= totalPages) {
          currentPage = page;
          loadProperties(currentPage);
        }
      });
    });
  }

  // Bedroom filter
  bedroomButtons.forEach(btn => btn.addEventListener("click", () => {
    bedroomButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedBedrooms = btn.textContent.includes("Any") ? "any" : btn.textContent.replace("+","").trim();
  }));

  // Bathroom filter
  bathroomButtons.forEach(btn => btn.addEventListener("click", () => {
    bathroomButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedBathrooms = btn.textContent.includes("Any") ? "any" : btn.textContent.replace("+","").trim();
  }));

  // Sort change
  if (sortSelectEl) sortSelectEl.addEventListener("change", () => { currentPage = 1; loadProperties(currentPage); });

  // Apply filters
  if (filterBtn) filterBtn.addEventListener("click", e => { e.preventDefault(); currentPage = 1; loadProperties(currentPage); });

  // Initial load
  loadProperties(currentPage);
});
