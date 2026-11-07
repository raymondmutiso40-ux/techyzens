// Landing page interactions
(() => {
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  document.getElementById("navToggle").addEventListener("click", () => nav.classList.toggle("open"));
  nav.querySelectorAll(".nav-links a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));

  // Hero video play/pause
  const video = document.getElementById("heroVideo");
  const toggle = document.getElementById("videoToggle");
  toggle.addEventListener("click", () => {
    if (video.paused) { video.play(); toggle.textContent = "❚❚"; toggle.setAttribute("aria-label", "Pause background video"); }
    else { video.pause(); toggle.textContent = "▶"; toggle.setAttribute("aria-label", "Play background video"); }
  });
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll("video[autoplay]").forEach((v) => v.pause());
    toggle.textContent = "▶";
  }

  // Image slideshow
  const slides = [...document.querySelectorAll("#slideshow img")];
  const dotsEl = document.getElementById("dots");
  let current = 0;
  const show = (i) => {
    slides[current].classList.remove("active");
    dotsEl.children[current].classList.remove("active");
    current = (i + slides.length) % slides.length;
    slides[current].classList.add("active");
    dotsEl.children[current].classList.add("active");
  };
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", `Show image ${i + 1}`);
    if (i === 0) b.classList.add("active");
    b.addEventListener("click", () => { show(i); restart(); });
    dotsEl.appendChild(b);
  });
  let timer;
  const restart = () => { clearInterval(timer); timer = setInterval(() => show(current + 1), 4500); };
  restart();

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 5) * 80}ms`;
    io.observe(el);
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
