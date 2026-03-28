// AFS Preview Data — swiper
export default {
  id: 'preview-swiper',
  perView: 1,
  perViewMd: 2,
  perViewLg: 3,
  gap: 24,
  loop: true,
  arrows: true,
  dots: true,
  slides: [
    {
      image: 'https://picsum.photos/seed/swiper1/600/350',
      tag: 'Featured',
      title: 'Slide One',
      text: 'Supporting description for this slide.',
      btn: { label: 'Learn More', link: '#' }
    },
    {
      image: 'https://picsum.photos/seed/swiper2/600/350',
      tag: 'Latest',
      title: 'Slide Two',
      text: 'Another supporting description here.',
      btn: { label: 'Explore', link: '#' }
    },
    {
      image: 'https://picsum.photos/seed/swiper3/600/350',
      tag: 'Popular',
      title: 'Slide Three',
      text: 'A third slide with some description text.',
      btn: { label: 'Read More', link: '#' }
    }
  ]
};
