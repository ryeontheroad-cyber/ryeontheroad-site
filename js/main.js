// ── NAV: scroll state ──
const nav = document.getElementById('nav');
const scrollThreshold = 60;

// data-nav-static: always show the opaque scrolled state (used on inner pages)
if (nav.hasAttribute('data-nav-static')) {
  nav.classList.add('scrolled');
} else {
  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > scrollThreshold);
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();
}

// ── NAV: mobile toggle ──
const toggle = document.querySelector('.nav__toggle');
const navLinks = document.querySelector('.nav__links');

toggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
});

// Close menu when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });
});

// ── SCROLL ANIMATIONS ──
// Respect prefers-reduced-motion: skip animation setup entirely so elements
// are always visible without any JS-driven opacity/transform changes.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const fadeEls = document.querySelectorAll(
    '.hero__eyebrow, .hero__title, .hero__tagline, .hero__actions, ' +
    '.section__eyebrow, .section__title, .about__body, .about__stats, ' +
    '.service-card, .contact__body, .contact__details, .contact__form-wrap'
  );

  fadeEls.forEach(el => el.classList.add('fade-up'));

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.closest('.services__grid')
            ? Array.from(entry.target.parentElement.children).indexOf(entry.target) * 80
            : 0;
          setTimeout(() => entry.target.classList.add('visible'), delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  fadeEls.forEach(el => observer.observe(el));
}

// ── CONTACT PAGE FORM (Formspree) ──
const contactPageForm = document.getElementById('contact-page-form');
const cpStatus = document.getElementById('cp-form-status');

if (contactPageForm) {
  const cpValidators = {
    name: {
      el: document.getElementById('cp-name'),
      errorEl: document.getElementById('cp-name-error'),
      validate(val) {
        if (!val.trim()) return 'Please enter your name.';
        return '';
      },
    },
    email: {
      el: document.getElementById('cp-email'),
      errorEl: document.getElementById('cp-email-error'),
      validate(val) {
        if (!val.trim()) return 'Please enter your email address.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Please enter a valid email address.';
        return '';
      },
    },
    message: {
      el: document.getElementById('cp-message'),
      errorEl: document.getElementById('cp-message-error'),
      validate(val) {
        if (!val.trim()) return 'Please tell us a bit about your event.';
        return '';
      },
    },
  };

  function cpSetFieldError(key, message) {
    const { el, errorEl } = cpValidators[key];
    if (message) {
      el.setAttribute('aria-invalid', 'true');
      errorEl.textContent = message;
    } else {
      el.removeAttribute('aria-invalid');
      errorEl.textContent = '';
    }
  }

  Object.entries(cpValidators).forEach(([key, { el }]) => {
    el.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') === 'true') {
        cpSetFieldError(key, cpValidators[key].validate(el.value));
      }
    });
    el.addEventListener('blur', () => {
      cpSetFieldError(key, cpValidators[key].validate(el.value));
    });
  });

  // Validate on submit; if valid, allow the native POST to Formspree.
  // If invalid, prevent submission and surface errors.
  contactPageForm.addEventListener('submit', e => {
    let firstInvalid = null;
    let errorCount = 0;

    Object.entries(cpValidators).forEach(([key, { el, validate }]) => {
      const message = validate(el.value);
      cpSetFieldError(key, message);
      if (message) {
        errorCount++;
        if (!firstInvalid) firstInvalid = el;
      }
    });

    if (errorCount > 0) {
      e.preventDefault();
      cpStatus.textContent = `Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} before submitting.`;
      firstInvalid.focus();
    }
    // If no errors, the form submits naturally to Formspree via action/method POST.
  });
}

// ── CONTACT FORM VALIDATION ──
const form = document.querySelector('.contact__form');
const formStatus = document.getElementById('form-status');

if (form) {
  // Validation rules for required fields
  const validators = {
    name: {
      el: document.getElementById('name'),
      errorEl: document.getElementById('name-error'),
      validate(val) {
        if (!val.trim()) return 'Please enter your name.';
        return '';
      },
    },
    email: {
      el: document.getElementById('email'),
      errorEl: document.getElementById('email-error'),
      validate(val) {
        if (!val.trim()) return 'Please enter your email address.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Please enter a valid email address.';
        return '';
      },
    },
  };

  // Show or clear an individual field error
  function setFieldError(key, message) {
    const { el, errorEl } = validators[key];
    if (message) {
      el.setAttribute('aria-invalid', 'true');
      errorEl.textContent = message;
    } else {
      el.removeAttribute('aria-invalid');
      errorEl.textContent = '';
    }
  }

  // Clear errors as user corrects fields
  Object.entries(validators).forEach(([key, { el }]) => {
    el.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') === 'true') {
        setFieldError(key, validators[key].validate(el.value));
      }
    });

    el.addEventListener('blur', () => {
      setFieldError(key, validators[key].validate(el.value));
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Run all validators
    let firstInvalid = null;
    let errorCount = 0;

    Object.entries(validators).forEach(([key, { el, validate }]) => {
      const message = validate(el.value);
      setFieldError(key, message);
      if (message) {
        errorCount++;
        if (!firstInvalid) firstInvalid = el;
      }
    });

    if (errorCount > 0) {
      // Announce error count to screen readers, move focus to first invalid field
      formStatus.textContent = `Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} before submitting.`;
      firstInvalid.focus();
      return;
    }

    // ── Success state ──
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Sent! We\'ll be in touch.';
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-disabled', 'true');
    submitBtn.style.opacity = '0.7';
    submitBtn.style.cursor = 'default';

    // Announce success to screen readers
    formStatus.textContent = 'Your inquiry has been sent. We\'ll be in touch within 24 hours.';
  });
}
