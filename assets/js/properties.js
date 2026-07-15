if (!window.supabase || typeof window.supabase.createClient !== "function") {
  const grid = document.getElementById("all-properties-grid");
  if (grid) {
    grid.innerHTML = "<p>Supabase failed to load. Please refresh the page.</p>";
  }
  throw new Error("Supabase JS not loaded");
}

const supabase = window.supabase.createClient(
  "https://fbkbwshaytjxyaswomxo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2J3c2hheXRqeHlhc3dvbXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzU1MzQsImV4cCI6MjA3Mjc1MTUzNH0.X9H_hL3F6x2zhl0A5frOM-SLrBPnyvy-yKnvE9JmM7E"
);

function getPropertyImage(property) {
  if (Array.isArray(property.image_urls) && property.image_urls.length) {
    return property.image_urls[0];
  }
  if (Array.isArray(property.images) && property.images.length) {
    return property.images[0];
  }
  if (property.image_url) {
    return property.image_url;
  }
  return "/assets/img/placeholder.png";
}

function getPropertySize(property) {
  return property.size ?? property.size_sqft ?? 0;
}

function getPropertyStatus(property) {
  return (
    property.status_client ||
    property.status_admin ||
    property.status ||
    "available"
  );
}

function formatStatusBadge(status) {
  if (!status) return "";

  const normalized = String(status).toLowerCase().replace(/\s+/g, "_");
  const labels = {
    available: "For Sale",
    sold: "Sold",
    reserved: "Reserved",
    under_review: "Coming Soon",
    for_sale: "For Sale",
    for_rent: "For Rent",
    for_lease: "For Lease",
  };

  return `<span class="badge badge-${normalized}">${labels[normalized] || status}</span>`;
}

function getViewCount(property) {
  return Number(
    property.view_count ??
    property.views ??
    property.clicks ??
    property.popularity ??
    0
  );
}

function sortProperties(properties, sortValue) {
  const items = [...properties];

  if (sortValue === "price-asc") {
    return items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }

  if (sortValue === "price-desc") {
    return items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  }

  if (sortValue === "most-viewed") {
    return items.sort((a, b) => getViewCount(b) - getViewCount(a));
  }

  return items.sort((a, b) => {
    const aDate = new Date(a.listed_date || a.created_at || 0).getTime();
    const bDate = new Date(b.listed_date || b.created_at || 0).getTime();
    return bDate - aDate;
  });
}

function renderFeaturedProperties(container, properties) {
  if (!container) return;

  if (!properties.length) {
    container.innerHTML = "<p>No featured properties available.</p>";
    return;
  }

  container.innerHTML = properties
    .map((property) => {
      const image = getPropertyImage(property);
      const statusBadge = formatStatusBadge(getPropertyStatus(property));

      return `
        <div class="col-lg-4 col-md-6">
          <div class="property-card">
            <div class="property-image">
              <img src="${image}" alt="${property.title || "Property"}" class="img-fluid">
              <div class="property-badges">
                ${property.featured ? '<span class="badge badge-featured">Featured</span>' : ""}
                ${property.badge ? `<span class="badge badge-hot">${property.badge}</span>` : ""}
                ${statusBadge}
              </div>
            </div>
            <div class="property-content">
              <div class="property-price">₦${Number(property.price || 0).toLocaleString("en-NG")}</div>
              <h4 class="property-title">${property.title || "Untitled Property"}</h4>
              <p class="property-location"><i class="bi bi-geo-alt"></i> ${property.location || "Location not provided"}</p>
              <div class="property-features">
                <span><i class="bi bi-house"></i> ${property.bedrooms || 0} Bed</span>
                <span><i class="bi bi-droplet"></i> ${property.bathrooms || 0} Bath</span>
                <span><i class="bi bi-aspect-ratio"></i> ${getPropertySize(property)} Sqft</span>
              </div>
              <a href="property-details.html?id=${property.id}" class="btn btn-primary w-100">View Details</a>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadFeaturedProperties() {
  const container = document.getElementById("featured-properties-grid");
  if (!container) return;

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Failed to load featured properties:", error);
    container.innerHTML = "<p>No featured properties available.</p>";
    return;
  }

  renderFeaturedProperties(container, data || []);
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("featured-properties-grid")) {
    loadFeaturedProperties();
  }

  const gridContainer = document.getElementById("all-properties-grid");
  if (!gridContainer) return;

  const propertiesList = document.querySelector(".properties-list");
  const pagination = document.querySelector(".pagination");
  const sortSelect = document.getElementById("sortSelect");
  const propertyType = document.getElementById("propertyType");
  const minPrice = document.getElementById("minPrice");
  const maxPrice = document.getElementById("maxPrice");
  const locationInput = document.getElementById("location");
  const filterBtn = document.getElementById("applyFiltersBtn");
  const viewButtons = document.querySelectorAll(".view-btn");
  const bedroomButtons = document.querySelectorAll(".bedroom-filter .filter-btn");
  const bathroomButtons = document.querySelectorAll(".bathroom-filter .filter-btn");

  let selectedBedrooms = "any";
  let selectedBathrooms = "any";
  let currentView = "grid";
  let currentPage = 1;
  const pageSize = 6;
  let allProperties = [];
  let filteredProperties = [];

  function renderProperties() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = filteredProperties.slice(start, end);

    if (!pageItems.length) {
      gridContainer.innerHTML = "<p>No properties match your filters.</p>";
      return;
    }

    gridContainer.innerHTML = pageItems
      .map((property) => {
        const image = getPropertyImage(property);
        const statusBadge = formatStatusBadge(getPropertyStatus(property));
        const wrapperClass = currentView === "list" ? "col-12" : "col-lg-6 col-md-6";
        const cardClass = currentView === "list" ? "property-card d-lg-flex align-items-stretch" : "property-card";
        const imageClass = currentView === "list" ? "property-image col-lg-5" : "property-image";
        const contentClass = currentView === "list" ? "property-content col-lg-7" : "property-content";

        return `
          <div class="${wrapperClass}">
            <div class="${cardClass}">
              <div class="${imageClass}">
                <img src="${image}" alt="${property.title || "Property"}" class="img-fluid">
                <div class="property-badges">
                  ${property.featured ? '<span class="badge badge-featured">Featured</span>' : ""}
                  ${property.badge ? `<span class="badge badge-hot">${property.badge}</span>` : ""}
                  ${statusBadge}
                </div>
              </div>
              <div class="${contentClass}">
                <div class="property-price">₦${Number(property.price || 0).toLocaleString("en-NG")}</div>
                <h4 class="property-title">${property.title || "Untitled Property"}</h4>
                <p class="property-location"><i class="bi bi-geo-alt"></i> ${property.location || "Location not provided"}</p>
                <div class="property-features">
                  <span><i class="bi bi-house"></i> ${property.bedrooms || 0} Bed</span>
                  <span><i class="bi bi-water"></i> ${property.bathrooms || 0} Bath</span>
                  <span><i class="bi bi-arrows-angle-expand"></i> ${getPropertySize(property)} Sqft</span>
                </div>
                <a href="property-details.html?id=${property.id}" class="btn btn-primary w-100">View Details</a>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderPagination() {
    if (!pagination) return;

    const totalPages = Math.max(1, Math.ceil(filteredProperties.length / pageSize));

    pagination.innerHTML = `
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
      </li>
      ${Array.from({ length: totalPages }, (_, index) => `
        <li class="page-item ${currentPage === index + 1 ? "active" : ""}">
          <a class="page-link" href="#" data-page="${index + 1}">${index + 1}</a>
        </li>
      `).join("")}
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
      </li>
    `;

    pagination.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const page = Number(link.dataset.page);
        if (!Number.isNaN(page) && page > 0 && page <= totalPages) {
          currentPage = page;
          renderProperties();
          renderPagination();
        }
      });
    });
  }

  function applyFilters() {
    const typeValue = propertyType?.value?.toLowerCase() || "all";
    const locationValue = locationInput?.value?.trim().toLowerCase() || "";
    const minValue = Number(minPrice?.value || 0);
    const maxValue = Number(maxPrice?.value || 0);
    const sortValue = sortSelect?.value || "newest";

    filteredProperties = allProperties.filter((property) => {
      const propertyTypeValue = String(
        property.property_type ||
        property.type ||
        property.category ||
        ""
      ).toLowerCase();
      const propertyText = `${property.title || ""} ${property.description || ""} ${propertyTypeValue}`.toLowerCase();
      const propertyLocation = String(property.location || "").toLowerCase();
      const propertyPrice = Number(property.price || 0);
      const propertyBedrooms = Number(property.bedrooms || 0);
      const propertyBathrooms = Number(property.bathrooms || 0);

      const matchesType =
        typeValue === "all" ||
        propertyTypeValue === typeValue ||
        propertyText.includes(typeValue);
      const matchesMin = !minValue || propertyPrice >= minValue;
      const matchesMax = !maxValue || propertyPrice <= maxValue;
      const matchesLocation = !locationValue || propertyLocation.includes(locationValue);
      const matchesBedrooms = selectedBedrooms === "any" || propertyBedrooms >= Number(selectedBedrooms);
      const matchesBathrooms = selectedBathrooms === "any" || propertyBathrooms >= Number(selectedBathrooms);

      return (
        matchesType &&
        matchesMin &&
        matchesMax &&
        matchesLocation &&
        matchesBedrooms &&
        matchesBathrooms
      );
    });

    filteredProperties = sortProperties(filteredProperties, sortValue);
    currentPage = 1;
    renderProperties();
    renderPagination();
  }

  async function loadProperties() {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load properties:", error);
      gridContainer.innerHTML = "<p>Unable to load properties. Please try again later.</p>";
      return;
    }

    allProperties = data || [];
    filteredProperties = [...allProperties];
    applyFilters();
  }

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      viewButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      currentView = button.dataset.view || "grid";
      propertiesList?.classList.remove("view-grid", "view-list");
      propertiesList?.classList.add(`view-${currentView}`);
      renderProperties();
    });
  });

  bedroomButtons.forEach((button) => {
    button.addEventListener("click", () => {
      bedroomButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      selectedBedrooms = button.textContent.includes("Any")
        ? "any"
        : button.textContent.replace("+", "").trim();
      applyFilters();
    });
  });

  bathroomButtons.forEach((button) => {
    button.addEventListener("click", () => {
      bathroomButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      selectedBathrooms = button.textContent.includes("Any")
        ? "any"
        : button.textContent.replace("+", "").trim();
      applyFilters();
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener("change", applyFilters);
  }

  if (propertyType) {
    propertyType.addEventListener("change", applyFilters);
  }

  if (minPrice) {
    minPrice.addEventListener("input", applyFilters);
  }

  if (maxPrice) {
    maxPrice.addEventListener("input", applyFilters);
  }

  if (locationInput) {
    locationInput.addEventListener("input", applyFilters);
  }

  if (filterBtn) {
    filterBtn.addEventListener("click", (event) => {
      event.preventDefault();
      applyFilters();
    });
  }

  loadProperties();
});
