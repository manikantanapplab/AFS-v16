# AFS — BE Team Integration Guide

This guide is for backend developers receiving the `dist/` folder from the frontend team.
You do not need Node.js, npm, or any build tools. Everything is pre-compiled.

---

## What You Receive

The `dist/` folder — fully compiled, ready to integrate.

```
dist/
  index.html          ← reference HTML — shows correct structure and asset paths
  about.html
  services.html
  contact.html
  assets/
    css/
      app.css               ← SINGLE mode: one file for all pages
      base.css              ← PER-COMPONENT mode: load on every page
      pages/
        index.css           ← PER-PAGE or PER-COMPONENT: page-specific CSS
        about.css
      components/
        hero.css            ← PER-COMPONENT: load only when component is rendered
        card.css
        button.css
        section.css
        testimonial.css
        breadcrumb.css
        swiper.css
        carousel.css
        apicard.css
        app-head.css
        page-aside.css
    js/
      components.js         ← Alpine.js component registrations — load on every page
      swiper-init.js        ← Swiper initializer — load only on pages with sliders
    images/
      ...
```

Open the `.html` files in a browser to see the correct structure and verify assets load.

---

## Always Load on Every Page (All Modes)

These go in every page, regardless of CSS mode:

```html
<!-- In <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&display=swap">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css">

<!-- Before </body> -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js"></script>
<script src="/assets/js/components.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>
```

> **Important:** Alpine.js must have `defer` and must load **after** `components.js`.
> Bootstrap's JS must load **before** Alpine.

---

## SINGLE Mode

One CSS file for the entire site. Add it once to your global layout.

```html
<link rel="stylesheet" href="/assets/css/app.css">
```

**Drupal** — `[theme].libraries.yml`:
```yaml
global:
  css:
    theme:
      dist/assets/css/app.css: {}
```

**WordPress** — `functions.php`:
```php
wp_enqueue_style('afs-theme', get_template_directory_uri() . '/dist/assets/css/app.css');
```

**Laravel** — `layouts/app.blade.php`:
```blade
<link rel="stylesheet" href="{{ asset('dist/assets/css/app.css') }}">
```

**.NET Razor** — `_Layout.cshtml`:
```cshtml
<link rel="stylesheet" href="~/dist/assets/css/app.css">
```

---

## PER-PAGE Mode

Each page template links its own CSS file. Do not use `app.css` in this mode.

**Drupal** — `page--front.html.twig` (home page):
```twig
<link rel="stylesheet" href="/themes/custom/mytheme/dist/assets/css/pages/index.css">
```

**WordPress** — `functions.php`:
```php
function afs_enqueue_page_styles() {
    $page = is_front_page() ? 'index' : sanitize_title(get_post_field('post_name', get_the_ID()));
    $file_path = get_template_directory() . '/dist/assets/css/pages/' . $page . '.css';
    $file_uri  = get_template_directory_uri() . '/dist/assets/css/pages/' . $page . '.css';
    if (file_exists($file_path)) {
        wp_enqueue_style('afs-page', $file_uri);
    }
}
add_action('wp_enqueue_scripts', 'afs_enqueue_page_styles');
```

**Laravel** — each Blade view:
```blade
@push('styles')
  <link rel="stylesheet" href="{{ asset('dist/assets/css/pages/about.css') }}">
@endpush
```

**.NET Razor** — each page:
```cshtml
@section Styles {
    <link rel="stylesheet" href="~/dist/assets/css/pages/about.css">
}
```

---

## PER-COMPONENT Mode

`base.css` loads on every page. Each component also has its own CSS file —
load it only when that component is rendered on the page.

### Step 1 — Load base.css on every page

```html
<link rel="stylesheet" href="/assets/css/base.css">
```

### Step 2 — Load component CSS when the component renders

Only load a component's CSS on pages where that component actually appears.

**Component → CSS file mapping:**

| Component | CSS file |
|---|---|
| Hero | `components/hero.css` |
| Card | `components/card.css` |
| Section | `components/section.css` |
| Button | `components/button.css` |
| Testimonial | `components/testimonial.css` |
| Breadcrumb | `components/breadcrumb.css` |
| Swiper | `components/swiper.css` |
| Carousel | `components/carousel.css` |
| API Card | `components/apicard.css` |
| App Head | `components/app-head.css` |
| Page Aside | `components/page-aside.css` |

---

### Drupal — `[theme].libraries.yml`

```yaml
base:
  css:
    theme:
      dist/assets/css/base.css: {}

hero:
  css:
    component:
      dist/assets/css/components/hero.css: {}
  dependencies:
    - mytheme/base

card:
  css:
    component:
      dist/assets/css/components/card.css: {}
  dependencies:
    - mytheme/base
```

In a template: `{{ attach_library('mytheme/hero') }}`

### WordPress

```php
// functions.php
function afs_enqueue_component($component) {
    $path = get_template_directory_uri() . '/dist/assets/css/components/' . $component . '.css';
    wp_enqueue_style('afs-' . $component, $path);
}

// Call wherever you render a component:
afs_enqueue_component('hero');
afs_enqueue_component('card');
```

Or in a template file:
```php
<?php afs_enqueue_component('testimonial'); ?>
<section class="testimonial"> ... </section>
```

### Laravel — Blade components

```blade
{{-- resources/views/components/afs-hero.blade.php --}}
@once
  @push('styles')
    <link rel="stylesheet" href="{{ asset('dist/assets/css/components/hero.css') }}">
  @endpush
@endonce

<section class="hero">
  {{ $slot }}
</section>
```

Usage:
```blade
<x-afs-hero>
  <h1>Page Title</h1>
</x-afs-hero>
```

### .NET Razor — partial views

```cshtml
@* Views/Shared/Components/_Hero.cshtml *@
@section Styles {
    <link rel="stylesheet" href="~/dist/assets/css/components/hero.css">
}

<section class="hero">
  @RenderBody()
</section>
```

---

## Swiper-specific setup

Pages with Swiper sliders need `swiper-init.js` in addition to `components.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js"></script>
<script src="/assets/js/swiper-init.js"></script>
```

Swiper initializes automatically from `data-swiper` attributes on the HTML.
No manual JavaScript configuration needed.

---

## Dark Mode

Toggle by adding or removing `data-theme="dark"` on the `<html>` tag.

```html
<!-- Light -->
<html lang="en" data-theme="light">

<!-- Dark -->
<html lang="en" data-theme="dark">
```

All color tokens switch automatically. No extra CSS or JS needed.

**Server-side persistence example (Laravel):**
```blade
<html lang="en" data-theme="{{ auth()->user()->theme_preference ?? 'light' }}">
```

---

## RTL (Right-to-Left)

Change `dir` attribute on `<html>`:

```html
<html lang="ar" dir="rtl" data-theme="light">
```

All Bootstrap layout, margins, paddings, and component directions flip automatically.

---

## Asset Paths

All asset references in the compiled HTML use relative paths (`assets/css/...`).
When integrating, adjust to match your server structure.

If assets are served from a subdirectory:
```html
<!-- Instead of: -->
<link rel="stylesheet" href="assets/css/app.css">

<!-- Use: -->
<link rel="stylesheet" href="/your-subdir/assets/css/app.css">
```

---

## Getting Component HTML

The frontend team can run `npm run showcase` to generate `dist/showcase.html` —
a page showing every component with its rendered HTML that you can copy directly
into your templates.

If you need the raw HTML for a specific component, ask the FE team to send the
relevant `src/components/name/name.preview.html` file.
