'use strict';

/* =====================================================================
   DevRakhman Portfolio — script.js
   Kontent Decap CMS orqali boshqariladigan content/*.json fayllaridan
   o'qiladi. Fayllar topilmasa (masalan, file:// orqali ochilganda)
   quyidagi DEFAULTS ishlatiladi.
   ===================================================================== */

const CONTENT_PATHS = {
  hero: 'content/hero.json',
  about: 'content/about.json',
  skills: 'content/skills.json',
  projects: 'content/projects.json',
  contact: 'content/contact.json'
};

const DEFAULTS = {
  hero: {
    greeting: 'Assalomu alaykum, men',
    name: 'DevRakhman',
    title: 'Full-Stack Dasturchi',
    typing: ['Full-Stack Dasturchi', 'Web Dizayner', 'Telegram Bot Yaratuvchi', 'Cloudflare Mutaxassisi'],
    bio: 'Zamonaviy veb-saytlar, Telegram botlar va Cloudflare asosidagi tez, xavfsiz yechimlarni yarataman.',
    cta_primary: 'Loyihalarni ko\'rish',
    cta_secondary: 'Bog\'lanish'
  },
  about: {
    heading: 'Kod yozish — mening ishim ham, sevimli mashg\'ulotim ham.',
    text: 'Men veb-dasturlash bilan shug\'ullanaman va sodda g\'oyalarni tez, chiroyli hamda qulay mahsulotlarga aylantirishni yaxshi ko\'raman.\n\nHar bir loyihada asosiy e\'tiborim tezlik, moslashuvchan dizayn va foydalanuvchi qulayligiga qaratiladi.',
    location: 'O\'zbekiston',
    languages: 'O\'zbek, Rus, Ingliz',
    stats: [
      { value: 20, label: 'Tugallangan loyiha' },
      { value: 3, label: 'Yillik tajriba' },
      { value: 15, label: 'Telegram bot' }
    ]
  },
  skills: {
    skills: [
      { name: 'HTML5', level: 95, icon: 'fa-brands fa-html5' },
      { name: 'CSS3', level: 92, icon: 'fa-brands fa-css3-alt' },
      { name: 'JavaScript', level: 88, icon: 'fa-brands fa-js' },
      { name: 'Git & GitHub', level: 85, icon: 'fa-brands fa-git-alt' },
      { name: 'Cloudflare', level: 82, icon: 'fa-brands fa-cloudflare' },
      { name: 'Telegram Bot', level: 90, icon: 'fa-brands fa-telegram' }
    ]
  },
  projects: {
    projects: [
      {
        title: 'Shaxsiy Portfolio',
        description: 'Glassmorphism uslubidagi, to\'liq responsive portfolio sayt.',
        category: 'web',
        tech: ['HTML', 'CSS', 'JavaScript'],
        demo: '#',
        github: 'https://github.com/devrakhman',
        image: ''
      },
      {
        title: 'Kutubxona Boti',
        description: 'Kitoblarni qidirish va yuklab olish imkonini beruvchi Telegram bot.',
        category: 'bot',
        tech: ['Telegram API', 'Cloudflare Workers'],
        demo: 'https://t.me/devrakhman',
        github: 'https://github.com/devrakhman',
        image: ''
      }
    ]
  },
  contact: {
    telegram: 'https://t.me/devrakhman',
    github: 'https://github.com/devrakhman',
    email: 'devrakhman@gmail.com'
  }
};

/* ---------------------------------------------------------------------
   Yordamchi funksiyalar (CMS'dan kelgan ma'lumotlar xavfsiz yoziladi)
   --------------------------------------------------------------------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
};

const safeUrl = (value) => {
  if (!value || typeof value !== 'string') return '#';
  const v = value.trim();
  if (v === '#' || v.startsWith('#')) return v;
  try {
    const url = new URL(v, window.location.href);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? (/^[a-z][a-z0-9+.-]*:/i.test(v) ? url.href : v) : '#';
  } catch (e) {
    return '#';
  }
};

const safeIcon = (value, fallback = 'fa-solid fa-code') =>
  typeof value === 'string' && /^[\w\s-]{1,60}$/.test(value.trim()) ? value.trim() : fallback;

const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));
const asArray = (v) => (Array.isArray(v) ? v : []);
const asString = (v, fallback = '') => (typeof v === 'string' ? v : fallback);
const isExternal = (url) => /^https?:\/\//i.test(url);

const prettyUrl = (url) => url.replace(/^mailto:/i, '').replace(/^https?:\/\//i, '').replace(/\/$/, '');

const initialsOf = (name) =>
  name.split(/\s+|(?=[A-Z])/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'DR';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Matnni abzaslarga bo'lib, <p> elementlari sifatida qo'shadi */
const fillParagraphs = (container, text) => {
  container.textContent = '';
  asString(text).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).forEach((p) => container.appendChild(el('p', '', p)));
};

/* ---------------------------------------------------------------------
   Kontentni yuklash
   --------------------------------------------------------------------- */
async function loadContent(key) {
  try {
    const response = await fetch(`${CONTENT_PATHS[key]}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Object.assign({}, DEFAULTS[key], data);
  } catch (error) {
    return DEFAULTS[key];
  }
}

/* ---------------------------------------------------------------------
   Holat va umumiy kuzatuvchilar
   --------------------------------------------------------------------- */
const state = { contactEmail: DEFAULTS.contact.email, typingToken: 0 };

let revealObserver = null;

const animateCounter = (node) => {
  const target = Number(node.dataset.count) || 0;
  if (prefersReducedMotion) { node.textContent = target; return; }
  const duration = 1600;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    node.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const createRevealObserver = () => {
  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const node = entry.target;
      node.classList.add('visible');
      $$('.progress__bar', node).forEach((bar) => { bar.style.width = `${bar.dataset.level}%`; });
      if (node.classList.contains('progress__host')) {
        const bar = $('.progress__bar', node);
        if (bar) bar.style.width = `${bar.dataset.level}%`;
      }
      $$('[data-count]', node).forEach(animateCounter);
      observer.unobserve(node);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
};

const observeReveals = (root = document) => {
  $$('.reveal', root).forEach((node) => revealObserver.observe(node));
};

const addReveal = (node, index = 0) => {
  node.classList.add('reveal');
  node.style.transitionDelay = `${(index % 4) * 90}ms`;
  revealObserver.observe(node);
};

/* ---------------------------------------------------------------------
   Render: Hero
   --------------------------------------------------------------------- */
function renderHero(data, skills) {
  const name = asString(data.name, 'DevRakhman');
  const title = asString(data.title);

  $('#hero-greeting').textContent = asString(data.greeting);
  $('#hero-name').textContent = name;
  $('#hero-title').textContent = title;
  $('#hero-bio').textContent = asString(data.bio);
  $('#hero-cta-1').textContent = asString(data.cta_primary, 'Loyihalarni ko\'rish');
  $('#hero-cta-2').textContent = asString(data.cta_secondary, 'Bog\'lanish');
  $('#code-name').textContent = JSON.stringify(name);
  $('#code-role').textContent = JSON.stringify(title);
  $('#code-stack').textContent = JSON.stringify(skills.slice(0, 3).map((s) => asString(s.name)));
  $('#footer-name').textContent = name;
  document.title = `${name} | Portfolio`;

  const phrases = asArray(data.typing).map((p) => asString(p)).filter(Boolean);
  startTyping(phrases.length ? phrases : [title || name]);
}

/* Typing animatsiyasi */
function startTyping(phrases) {
  const target = $('#typing-text');
  const token = ++state.typingToken;

  if (prefersReducedMotion) { target.textContent = phrases[0]; return; }

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const step = () => {
    if (token !== state.typingToken) return;
    const current = phrases[phraseIndex];
    target.textContent = current.substring(0, charIndex);

    let delay = deleting ? 45 : 95;

    if (!deleting && charIndex === current.length) {
      delay = 1800;
      deleting = true;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 400;
    }

    if (delay !== 1800 && delay !== 400) charIndex += deleting ? -1 : 1;
    else if (delay === 1800) charIndex = current.length;

    setTimeout(step, delay);
  };
  step();
}

/* ---------------------------------------------------------------------
   Render: About
   --------------------------------------------------------------------- */
function renderAbout(data, heroName, heroTitle) {
  $('#about-name').textContent = heroName;
  $('#about-role').textContent = heroTitle;
  $('#about-initials').textContent = initialsOf(heroName);
  $('#about-location').textContent = asString(data.location);
  $('#about-languages').textContent = asString(data.languages);
  $('#about-heading').textContent = asString(data.heading);
  fillParagraphs($('#about-text'), data.text);

  const statsBox = $('#about-stats');
  statsBox.textContent = '';
  asArray(data.stats).forEach((item, i) => {
    const card = el('div', 'stat glass');
    const number = el('strong', '', '0');
    number.dataset.count = clamp(item.value, 0, 1000000);
    card.append(number, el('span', 'stat__plus', '+'), el('p', '', asString(item.label)));
    addReveal(card, i);
    statsBox.appendChild(card);
  });
}

/* ---------------------------------------------------------------------
   Render: Skills
   --------------------------------------------------------------------- */
function renderSkills(list) {
  const grid = $('#skills-grid');
  grid.textContent = '';

  list.forEach((skill, i) => {
    const level = clamp(skill.level, 0, 100);
    const card = el('article', 'skill-card glass progress__host');

    const icon = el('div', 'skill-card__icon');
    icon.appendChild(el('i', safeIcon(skill.icon)));

    const bar = el('div', 'progress__bar');
    bar.dataset.level = level;
    const track = el('div', 'progress');
    track.appendChild(bar);

    card.append(icon, el('h3', '', asString(skill.name)), track, el('span', 'progress__value', `${level}%`));
    addReveal(card, i);
    grid.appendChild(card);
  });
}

/* ---------------------------------------------------------------------
   Render: Projects
   --------------------------------------------------------------------- */
function renderProjects(list) {
  const grid = $('#projects-grid');
  grid.textContent = '';

  list.forEach((project, i) => {
    const category = project.category === 'bot' ? 'bot' : 'web';
    const card = el('article', 'project-card glass');
    card.dataset.category = category;

    const thumb = el('div', `project-card__thumb project-card__thumb--${category}`);
    thumb.appendChild(el('i', category === 'bot' ? 'fa-solid fa-robot' : 'fa-solid fa-laptop-code'));

    const imageSrc = asString(project.image).trim();
    if (imageSrc) {
      const img = document.createElement('img');
      img.src = safeUrl(imageSrc);
      img.alt = asString(project.title);
      img.loading = 'lazy';
      img.addEventListener('error', () => img.remove());
      thumb.appendChild(img);
    }
    thumb.appendChild(el('span', 'badge', category === 'bot' ? 'Bot' : 'Web'));

    const body = el('div', 'project-card__body');
    body.append(el('h3', '', asString(project.title)), el('p', '', asString(project.description)));

    const tags = el('ul', 'tags');
    asArray(project.tech).forEach((t) => tags.appendChild(el('li', '', asString(t))));
    body.appendChild(tags);

    const links = el('div', 'project-card__links');
    const addLink = (href, className, iconClass, label) => {
      const url = safeUrl(href);
      if (!href || url === '#') return;
      const a = el('a', `btn btn--sm ${className}`);
      a.href = url;
      if (isExternal(url)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      a.append(el('i', iconClass), document.createTextNode(` ${label}`));
      links.appendChild(a);
    };
    addLink(project.demo, 'btn--primary', 'fa-solid fa-arrow-up-right-from-square', 'Demo');
    addLink(project.github, 'btn--outline', 'fa-brands fa-github', 'GitHub');
    if (links.children.length) body.appendChild(links);

    card.append(thumb, body);
    addReveal(card, i);
    grid.appendChild(card);
  });

  applyFilter('all');
  $$('.filter-btn').forEach((b) => {
    const active = b.dataset.filter === 'all';
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
}

/* Filtr */
function applyFilter(filter) {
  const cards = $$('.project-card');
  let visible = 0;

  cards.forEach((card) => {
    const match = filter === 'all' || card.dataset.category === filter;
    card.style.transitionDelay = '0ms';

    if (match) {
      visible++;
      card.classList.remove('removed');
      requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('hide')));
    } else {
      card.classList.add('hide');
      setTimeout(() => { if (card.classList.contains('hide')) card.classList.add('removed'); }, 350);
    }
  });

  $('#projects-empty').hidden = visible !== 0;
}

function initFilters() {
  $$('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.filter-btn').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });
      applyFilter(btn.dataset.filter);
    });
  });
}

/* ---------------------------------------------------------------------
   Render: Contact + social links
   --------------------------------------------------------------------- */
function renderContact(data) {
  const telegram = safeUrl(asString(data.telegram));
  const github = safeUrl(asString(data.github));
  const email = asString(data.email).trim();
  state.contactEmail = email || state.contactEmail;

  const items = [
    { title: 'Telegram', icon: 'fa-brands fa-telegram', href: telegram, label: prettyUrl(telegram) },
    { title: 'GitHub', icon: 'fa-brands fa-github', href: github, label: prettyUrl(github) },
    { title: 'Email', icon: 'fa-solid fa-envelope', href: email ? `mailto:${email}` : '#', label: email }
  ].filter((item) => item.href !== '#');

  const box = $('#contact-links');
  box.textContent = '';
  items.forEach((item, i) => {
    const a = el('a', 'contact-link glass');
    a.href = item.href;
    if (isExternal(item.href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }

    const iconWrap = el('span', 'contact-link__icon');
    iconWrap.appendChild(el('i', item.icon));
    const info = el('span');
    info.append(el('strong', '', item.title), el('small', '', item.label));

    a.append(iconWrap, info, el('i', 'fa-solid fa-arrow-right contact-link__arrow'));
    addReveal(a, i);
    box.appendChild(a);
  });

  const fillSocials = (container) => {
    container.textContent = '';
    items.forEach((item) => {
      const a = el('a');
      a.href = item.href;
      a.setAttribute('aria-label', item.title);
      if (isExternal(item.href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      a.appendChild(el('i', item.icon));
      container.appendChild(a);
    });
  };
  fillSocials($('#hero-socials'));
  fillSocials($('#footer-socials'));
}

/* ---------------------------------------------------------------------
   UI: Navigatsiya, scroll, hamburger
   --------------------------------------------------------------------- */
function initNavigation() {
  const header = $('#header');
  const navToggle = $('#nav-toggle');
  const navMenu = $('#nav-menu');
  const navLinks = $$('.nav__link');
  const toTop = $('#to-top');

  const setMenu = (open) => {
    navMenu.classList.toggle('open', open);
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Menyuni yopish' : 'Menyuni ochish');
    document.body.classList.toggle('menu-open', open);
  };

  navToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('open')));
  navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !navToggle.contains(e.target)) setMenu(false);
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 820) setMenu(false); });

  /* Smooth scroll */
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const id = anchor.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = id === '#home' ? 0 : target.getBoundingClientRect().top + window.scrollY - header.offsetHeight + 1;
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });

  /* Header va "tepaga" tugmasi */
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
    toTop.classList.toggle('show', window.scrollY > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));

  /* Faol bo'lim */
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  $$('main section[id]').forEach((section) => sectionObserver.observe(section));
}

/* ---------------------------------------------------------------------
   Aloqa formasi
   --------------------------------------------------------------------- */
function initContactForm() {
  const form = $('#contact-form');
  const submitBtn = $('#submit-btn');
  const statusEl = $('#form-status');
  const toast = $('#toast');
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  };

  const validators = {
    name: (v) => (!v.trim() ? 'Iltimos, ismingizni kiriting.' : v.trim().length < 2 ? 'Ism kamida 2 ta belgidan iborat bo\'lsin.' : ''),
    email: (v) => (!v.trim() ? 'Iltimos, email manzilingizni kiriting.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'Email manzil noto\'g\'ri formatda.' : ''),
    message: (v) => (!v.trim() ? 'Iltimos, xabaringizni yozing.' : v.trim().length < 10 ? 'Xabar kamida 10 ta belgidan iborat bo\'lsin.' : '')
  };

  const validateField = (field) => {
    const message = validators[field.name](field.value);
    field.closest('.form-group').classList.toggle('invalid', Boolean(message));
    $(`#${field.name}-error`).textContent = message;
    field.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  };

  const fields = $$('input, textarea', form);
  fields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.closest('.form-group').classList.contains('invalid')) validateField(field);
      statusEl.textContent = '';
      statusEl.className = 'form-status';
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = fields.map(validateField);
    const firstInvalid = fields[results.indexOf(false)];

    if (firstInvalid) {
      firstInvalid.focus();
      statusEl.textContent = 'Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring.';
      statusEl.className = 'form-status fail';
      return;
    }

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Yuborilmoqda...';

    const subject = encodeURIComponent(`Portfolio saytidan xabar: ${name}`);
    const body = encodeURIComponent(`Ism: ${name}\nEmail: ${email}\n\nXabar:\n${message}`);

    setTimeout(() => {
      window.location.href = `mailto:${state.contactEmail}?subject=${subject}&body=${body}`;
      statusEl.textContent = 'Rahmat! Pochta ilovangiz ochiladi — xabarni shu yerdan yuboring.';
      statusEl.className = 'form-status success';
      showToast('Xabar tayyorlandi! Pochta ilovasini tekshiring.');

      form.reset();
      $$('.form-group', form).forEach((g) => g.classList.remove('invalid'));
      $$('.error', form).forEach((er) => { er.textContent = ''; });
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Xabar yuborish';
    }, 700);
  });
}

/* ---------------------------------------------------------------------
   Ishga tushirish
   --------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  createRevealObserver();
  initNavigation();
  initFilters();
  initContactForm();
  $('#year').textContent = new Date().getFullYear();

  const [hero, about, skills, projects, contact] = await Promise.all([
    loadContent('hero'),
    loadContent('about'),
    loadContent('skills'),
    loadContent('projects'),
    loadContent('contact')
  ]);

  const skillList = asArray(skills.skills);

  renderHero(hero, skillList);
  renderAbout(about, asString(hero.name, 'DevRakhman'), asString(hero.title));
  renderSkills(skillList);
  renderProjects(asArray(projects.projects));
  renderContact(contact);

  observeReveals();
});
