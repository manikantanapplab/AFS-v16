// ============================================================
// SWIPER INIT — Agency Frontend System (AFS) v16
// ============================================================
// Auto-initializes all .swiper elements on the page.
// Reads config from data-* attributes set by _swiper.pug.
//
// LOAD ORDER in _base.pug (add BEFORE alpine script):
//   script(src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js")
//   script(src="assets/js/swiper-init.js")
// ============================================================

(function () {
  'use strict';

  // Wait for DOM
  document.addEventListener('DOMContentLoaded', initAllSwipers);

  function initAllSwipers() {
    // Init thumbs swipers first (main swipers may reference them)
    const thumbEls = document.querySelectorAll('.swiper-thumbs-strip');
    const thumbInstances = {};

    thumbEls.forEach((el) => {
      if (!el.id) return;
      thumbInstances[el.id] = new Swiper(el, {
        spaceBetween: 8,
        slidesPerView: 4,
        freeMode: true,
        watchSlidesProgress: true,
      });
    });

    // Init main swipers
    const swiperEls = document.querySelectorAll(
      '.swiper:not(.swiper-thumbs-strip):not([data-swiper-initialized])'
    );

    swiperEls.forEach((el) => {
      const d = el.dataset;

      // Read config from data-* attributes
      const effect    = d.effect    || 'slide';
      const perView   = parseFloat(d.perView)   || 1;
      const perViewMd = parseFloat(d.perViewMd) || perView;
      const perViewLg = parseFloat(d.perViewLg) || perViewMd;
      const gap       = parseInt(d.gap)         || 0;
      const loop      = d.loop      !== 'false';
      const autoplay  = d.autoplay  === 'true';
      const interval  = parseInt(d.interval)    || 4000;
      const centered  = d.centered  === 'true';
      const peek      = d.peek      === 'true';
      const thumbsId  = d.thumbsId  || '';

      // Find custom arrow buttons (siblings in .swiper-wrap)
      const wrap    = el.closest('.swiper-wrap');
      const btnPrev = wrap ? wrap.querySelector('.swiper-btn-prev') : null;
      const btnNext = wrap ? wrap.querySelector('.swiper-btn-next') : null;

      const config = {
        effect,
        loop,
        centeredSlides: centered,
        spaceBetween: gap,
        grabCursor: true,
        a11y: { enabled: true },
        keyboard: { enabled: true },

        // Responsive breakpoints
        slidesPerView: perView,
        breakpoints: {
          768:  { slidesPerView: perViewMd, spaceBetween: gap },
          1200: { slidesPerView: perViewLg, spaceBetween: gap },
        },

        // Peek adjacent slides
        ...(peek && {
          slidesPerView: perView === 1 ? 1.1 : perView,
          breakpoints: {
            768:  { slidesPerView: perViewMd === 1 ? 1.15 : perViewMd },
            1200: { slidesPerView: perViewLg === 1 ? 1.2  : perViewLg },
          },
        }),

        // Autoplay
        ...(autoplay && {
          autoplay: {
            delay: interval,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
        }),

        // Custom arrows
        ...(btnPrev && btnNext && {
          navigation: {
            prevEl: btnPrev,
            nextEl: btnNext,
          },
        }),

        // Pagination dots
        pagination: {
          el: wrap ? wrap.querySelector('.swiper-pagination') : null,
          clickable: true,
        },

        // Thumbs
        ...(thumbsId && thumbInstances[thumbsId] && {
          thumbs: { swiper: thumbInstances[thumbsId] },
        }),

        // Fade/flip/cards/cube effects need fadeEffect config
        ...(effect === 'fade' && {
          fadeEffect: { crossFade: true },
        }),
      };

      new Swiper(el, config);
      el.dataset.swiperInitialized = 'true';
    });
  }

})();
