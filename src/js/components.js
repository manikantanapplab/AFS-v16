// ============================================================
// ALPINE.JS COMPONENTS — Agency Frontend System (AFS)
// Must load BEFORE alpine CDN script
// ============================================================

document.addEventListener('alpine:init', () => {

  // ── Navbar ────────────────────────────────────────────────
  Alpine.data('navbar', () => ({
    open: false,
    scrolled: false,
    init() {
      window.addEventListener('scroll', () => {
        this.scrolled = window.scrollY > 50;
      });
    },
    toggle() { this.open = !this.open; },
    close()  { this.open = false; }
  }));

  // ── Modal ─────────────────────────────────────────────────
  Alpine.data('modal', () => ({
    open: false,
    show() { this.open = true;  document.body.style.overflow = 'hidden'; },
    hide() { this.open = false; document.body.style.overflow = ''; }
  }));

  // ── Tabs ──────────────────────────────────────────────────
  Alpine.data('tabs', (defaultTab = 0) => ({
    active: defaultTab,
    setTab(index)   { this.active = index; },
    isActive(index) { return this.active === index; }
  }));

  // ── Accordion ─────────────────────────────────────────────
  Alpine.data('accordion', () => ({
    active: null,
    toggle(index) { this.active = this.active === index ? null : index; },
    isOpen(index) { return this.active === index; }
  }));

  // ── Counter — animates number on scroll into view ─────────
  Alpine.data('counter', (target = 0, duration = 2000) => ({
    value: 0,
    init() {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          this.animateTo(target, duration);
          observer.disconnect();
        }
      });
      observer.observe(this.$el);
    },
    animateTo(target, duration) {
      const start = performance.now();
      const update = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        this.value     = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    }
  }));

  // ── Dark mode toggle ──────────────────────────────────────
  Alpine.data('themeToggle', () => ({
    dark: localStorage.getItem('theme') === 'dark',
    init() {
      document.documentElement.dataset.theme = this.dark ? 'dark' : 'light';
    },
    toggle() {
      this.dark = !this.dark;
      document.documentElement.dataset.theme = this.dark ? 'dark' : 'light';
      localStorage.setItem('theme', this.dark ? 'dark' : 'light');
    }
  }));

  // ── Form ──────────────────────────────────────────────────
  Alpine.data('form', () => ({
    loading: false,
    success: false,
    error: null,
    async submit(url, data) {
      this.loading = true;
      this.error   = null;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Submission failed');
        this.success = true;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    }
  }));

  // ── Carousel ──────────────────────────────────────────────
  // _loop stored as data property so template can access it
  Alpine.data('carousel', ({
    count    = 0,
    autoplay = false,
    interval = 4000,
    loop     = true,
  } = {}) => ({
    active: 0,
    timer:  null,
    _loop:  loop,

    init() {
      if (autoplay && count > 1) this.startAutoplay();
      this.$el.addEventListener('mouseenter', () => this.stopAutoplay());
      this.$el.addEventListener('mouseleave', () => { if (autoplay) this.startAutoplay(); });
      this.$el.addEventListener('focusin',    () => this.stopAutoplay());
      this.$el.addEventListener('focusout',   () => { if (autoplay) this.startAutoplay(); });
      this.$el.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft')  this.prev();
        if (e.key === 'ArrowRight') this.next();
      });
    },

    destroy() { this.stopAutoplay(); },

    next() {
      this.active = this._loop
        ? (this.active + 1) % count
        : Math.min(this.active + 1, count - 1);
    },

    prev() {
      this.active = this._loop
        ? (this.active - 1 + count) % count
        : Math.max(this.active - 1, 0);
    },

    goTo(index) { this.active = index; },
    isFirst()   { return this.active === 0; },
    isLast()    { return this.active === count - 1; },

    startAutoplay() {
      this.stopAutoplay();
      this.timer = setInterval(() => this.next(), interval);
    },

    stopAutoplay() {
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
    },
  }));

});
