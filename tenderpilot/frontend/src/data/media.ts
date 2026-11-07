// Background photos and videos used by the landing and login pages.
// Free stock media (Unsplash / Pexels). To use your own, drop files into
// `public/media/` and point these at e.g. '/media/hero.mp4'.
const unsplash = (id: string, w = 1920) => `https://images.unsplash.com/${id}?w=${w}&q=80`;

export const MEDIA = {
  heroVideo: 'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4',
  heroPoster: unsplash('photo-1497366216548-37526070297c'),

  ctaVideo: 'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4',
  ctaPoster: unsplash('photo-1454165804606-c3d57bc86b40', 1600),

  loginVideo: 'https://videos.pexels.com/video-files/3255275/3255275-uhd_2560_1440_25fps.mp4',
  loginImage: unsplash('photo-1600880292203-757bb62b4baf', 1600),

  parallax: unsplash('photo-1522071820081-009f0129c71c'),

  slides: [
    { src: unsplash('photo-1551434678-e076c223a692', 1400), alt: 'Team reviewing work on laptops' },
    { src: unsplash('photo-1454165804606-c3d57bc86b40', 1400), alt: 'Analysing documents and charts' },
    { src: unsplash('photo-1600880292203-757bb62b4baf', 1400), alt: 'Colleagues collaborating on a proposal' },
    { src: unsplash('photo-1521737604893-d14cc237f11d', 1400), alt: 'Team celebrating a win' },
  ],
} as const;
