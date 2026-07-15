/**
* Template Name: TheProperty
* Template URL: https://bootstrapmade.com/theproperty-bootstrap-real-estate-template/
* Updated: Aug 05 2025 with Bootstrap v5.3.7
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";
  const AUTH_FLAG = "user_logged_in";
  const SUPABASE_URL = "https://fbkbwshaytjxyaswomxo.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2J3c2hheXRqeHlhc3dvbXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzU1MzQsImV4cCI6MjA3Mjc1MTUzNH0.X9H_hL3F6x2zhl0A5frOM-SLrBPnyvy-yKnvE9JmM7E";
  let authClient = null;

  function getSupabase() {
    if (!window.supabase || !window.supabase.createClient) return null;
    if (!authClient) {
      authClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return authClient;
  }

  async function updateAuthNav() {
    const loginEl = document.getElementById("nav-login");
    const profileEl = document.getElementById("nav-profile");
    let loggedIn = localStorage.getItem(AUTH_FLAG) === "true";
    const supabase = getSupabase();
    if (supabase?.auth?.getSession) {
      try {
        const { data } = await supabase.auth.getSession();
        loggedIn = !!data?.session;
        localStorage.setItem(AUTH_FLAG, loggedIn ? "true" : "false");
      } catch {}
    }

    if (loginEl) {
      const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      loginEl.href = `/user-login.html?next=${encodeURIComponent(next)}`;
      loginEl.style.display = loggedIn ? "none" : "inline-block";
    }
    if (profileEl) {
      profileEl.style.display = loggedIn ? "inline-block" : "none";
    }
  }

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);
  window.addEventListener('load', () => { updateAuthNav(); });
  window.addEventListener('storage', (e) => {
    if (e.key === AUTH_FLAG) updateAuthNav();
  });

  const headerEl = document.getElementById("header");
  if (headerEl && "MutationObserver" in window) {
    const observer = new MutationObserver(() => updateAuthNav());
    observer.observe(headerEl, { childList: true, subtree: true });
  } else {
    setTimeout(updateAuthNav, 500);
    setTimeout(updateAuthNav, 1500);
  }

  /**
   * Mobile nav toggle (delegated for dynamically injected header)
   */
  function mobileNavToggle(toggleEl) {
    document.body.classList.toggle('mobile-nav-active');
    if (toggleEl) {
      toggleEl.classList.toggle('bi-list');
      toggleEl.classList.toggle('bi-x');
    }
  }

  document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.mobile-nav-toggle');
    if (toggleBtn) {
      mobileNavToggle(toggleBtn);
      return;
    }

    const navLink = e.target.closest('#navmenu a');
    if (navLink && document.body.classList.contains('mobile-nav-active')) {
      const activeToggle = document.querySelector('.mobile-nav-toggle');
      mobileNavToggle(activeToggle);
      return;
    }

    const dropdownToggle = e.target.closest('.navmenu .toggle-dropdown');
    if (dropdownToggle) {
      e.preventDefault();
      dropdownToggle.parentNode.classList.toggle('active');
      dropdownToggle.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    }
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate Pure Counter
   */
  new PureCounter();

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Product Image Zoom and Thumbnail Functionality
   */

  function productDetailFeatures() {
    // Initialize Drift for image zoom
    function initDriftZoom() {
      // Check if Drift is available
      if (typeof Drift === 'undefined') {
        console.error('Drift library is not loaded');
        return;
      }

      const driftOptions = {
        paneContainer: document.querySelector('.image-zoom-container'),
        inlinePane: window.innerWidth < 768 ? true : false,
        inlineOffsetY: -85,
        containInline: true,
        hoverBoundingBox: false,
        zoomFactor: 3,
        handleTouch: false
      };

      // Initialize Drift on the main product image
      const mainImage = document.getElementById('main-product-image');
      if (mainImage) {
        new Drift(mainImage, driftOptions);
      }
    }

    // Thumbnail click functionality
    function initThumbnailClick() {
      const thumbnails = document.querySelectorAll('.thumbnail-item');
      const mainImage = document.getElementById('main-product-image');

      if (!thumbnails.length || !mainImage) return;

      thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
          // Get image path from data attribute
          const imageSrc = this.getAttribute('data-image');

          // Update main image src and zoom attribute
          mainImage.src = imageSrc;
          mainImage.setAttribute('data-zoom', imageSrc);

          // Update active state
          thumbnails.forEach(item => item.classList.remove('active'));
          this.classList.add('active');

          // Reinitialize Drift for the new image
          initDriftZoom();
        });
      });
    }

    // Image navigation functionality (prev/next buttons)
    function initImageNavigation() {
      const prevButton = document.querySelector('.image-nav-btn.prev-image');
      const nextButton = document.querySelector('.image-nav-btn.next-image');

      if (!prevButton || !nextButton) return;

      const thumbnails = Array.from(document.querySelectorAll('.thumbnail-item'));
      if (!thumbnails.length) return;

      // Function to navigate to previous or next image
      function navigateImage(direction) {
        // Find the currently active thumbnail
        const activeIndex = thumbnails.findIndex(thumb => thumb.classList.contains('active'));
        if (activeIndex === -1) return;

        let newIndex;
        if (direction === 'prev') {
          // Go to previous image or loop to the last one
          newIndex = activeIndex === 0 ? thumbnails.length - 1 : activeIndex - 1;
        } else {
          // Go to next image or loop to the first one
          newIndex = activeIndex === thumbnails.length - 1 ? 0 : activeIndex + 1;
        }

        // Simulate click on the new thumbnail
        thumbnails[newIndex].click();
      }

      // Add event listeners to navigation buttons
      prevButton.addEventListener('click', () => navigateImage('prev'));
      nextButton.addEventListener('click', () => navigateImage('next'));
    }

    // Initialize all features
    initDriftZoom();
    initThumbnailClick();
    initImageNavigation();
  }

  productDetailFeatures();

})();
