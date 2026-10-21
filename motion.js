/* Guest guide motion: petals in the hero, reveal on scroll, the section menu, the booth carousel. */
(function () {
  "use strict";
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------------------ reveal on scroll
  const reveals = document.querySelectorAll(".reveal, .allday");
  document.querySelectorAll(".chips li").forEach((li, i) => li.style.setProperty("--c", i));
  if ("IntersectionObserver" in window && !calm) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }
  // steps inside a chapter appear one after another
  document.querySelectorAll(".steps").forEach((list) => {
    [...list.children].forEach((li, i) => li.style.setProperty("--d", `${0.08 * i}s`));
  });

  // ------------------------------------------------------------ the section menu follows the page
  const links = [...document.querySelectorAll("#toc a")];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href")));
  const totop = document.getElementById("totop");
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = -1;
    sections.forEach((s, i) => { if (s && s.offsetTop <= y) current = i; });
    links.forEach((a, i) => a.classList.toggle("is-on", i === current));
    totop.classList.toggle("is-on", window.scrollY > window.innerHeight * 0.8);
  }
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  // ------------------------------------------------------------ the countdown to the day
  const countdown = document.querySelector("[data-countdown]");
  if (countdown) {
    const day = new Date(countdown.dataset.countdown).getTime(); // local midnight, May 12, 2027
    const cells = {};
    countdown.querySelectorAll("[data-unit]").forEach((b) => (cells[b.dataset.unit] = b));
    const set = (unit, value) => {
      const text = String(value).padStart(unit === "days" ? 1 : 2, "0");
      const el = cells[unit];
      if (!el || el.textContent === text) return;
      el.textContent = text;
      if (!calm) {
        el.classList.remove("tick");
        void el.offsetWidth; // restart the little drop-in
        el.classList.add("tick");
      }
    };
    const update = () => {
      const left = day - Date.now();
      if (left <= 0) { // the day itself: "It's today!"; after it, the countdown goes away
        if (left > -86400000) countdown.classList.add("is-today");
        else countdown.hidden = true;
        return false;
      }
      const s = Math.floor(left / 1000);
      set("days", Math.floor(s / 86400));
      set("hours", Math.floor((s % 86400) / 3600));
      set("minutes", Math.floor((s % 3600) / 60));
      set("seconds", s % 60);
      return true;
    };
    if (update()) {
      const timer = setInterval(() => update() || clearInterval(timer), 1000);
    }
  }

  // ------------------------------------------------------------ the photo booth carousel
  const shots = document.getElementById("boothShots");
  if (shots) {
    const phones = [...shots.querySelectorAll(".phone")];
    const dots = [...shots.querySelectorAll(".carousel__dots button")];
    let at = 0;
    let timer = null;
    const show = (k) => {
      phones.forEach((p, i) => {
        p.classList.toggle("is-on", i === k);
        p.classList.toggle("is-out", i === at && i !== k);
      });
      dots.forEach((d, i) => d.setAttribute("aria-selected", String(i === k)));
      at = k;
    };
    const play = () => {
      clearInterval(timer);
      if (!calm) timer = setInterval(() => show((at + 1) % phones.length), 3200);
    };
    dots.forEach((d, i) => d.addEventListener("click", () => {
      show(i);
      play();
    }));
    let x0 = null; // swipe on phones
    shots.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    shots.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) {
        show((at + (dx < 0 ? 1 : phones.length - 1)) % phones.length);
        play();
      }
      x0 = null;
    });
    play();
  }

  // ------------------------------------------------------------ petals drifting through the hero
  const canvas = document.getElementById("petals");
  if (!canvas || calm) return;
  const ctx = canvas.getContext("2d");
  const hero = canvas.parentElement;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let visible = true;
  const petals = [];
  const colors = ["#f3d9cf", "#ecd09a", "#f7e6c8", "#e8b9b0"];

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = hero.clientWidth;
    H = hero.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function spawn(initial) {
    return {
      x: Math.random() * W,
      y: initial ? Math.random() * H : -20,
      s: 6 + Math.random() * 9,
      vy: 18 + Math.random() * 30,
      vx: -10 + Math.random() * 20,
      rot: Math.random() * Math.PI * 2,
      vr: -1 + Math.random() * 2,
      sway: Math.random() * Math.PI * 2,
      c: colors[(Math.random() * colors.length) | 0],
      glint: Math.random() < 0.25,
    };
  }
  function petal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(p.sway)));
    if (p.glint) { // a little golden sparkle
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(p.sway * 2);
      ctx.fillStyle = "#fff6dc";
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const r = k % 2 ? p.s * 0.18 : p.s * 0.6;
        const a = (k * Math.PI) / 4;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.moveTo(0, -p.s);
      ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.4, p.s * 0.6, p.s * 0.8, 0, p.s);
      ctx.bezierCurveTo(-p.s * 0.6, p.s * 0.8, -p.s * 0.9, -p.s * 0.4, 0, -p.s);
      ctx.fill();
    }
    ctx.restore();
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (visible) {
      ctx.clearRect(0, 0, W, H);
      const want = Math.round(Math.min(46, W / 22));
      while (petals.length < want) petals.push(spawn(petals.length < want * 0.8 && now < 2000));
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.sway += dt * 1.6;
        p.x += (p.vx + Math.sin(p.sway) * 22) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > H + 30 || p.x < -40 || p.x > W + 40) petals[i] = spawn(false);
        else petal(p);
      }
    }
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);
  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
})();
