(() => {
  const config = window.NEXUS_CONFIG || {};
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const modal = document.getElementById('info-modal');
  const modalMessage = document.getElementById('modal-message');
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };
  const openModal = (message) => {
    modalMessage.textContent = message;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modal.querySelector('[data-close-modal]').focus();
  };

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('is-open', !expanded);
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  document.querySelectorAll('.booking-trigger').forEach(button => {
    button.addEventListener('click', event => {
      if (config.bookingUrl) {
        event.preventDefault();
        window.open(config.bookingUrl, '_blank', 'noopener,noreferrer');
      } else {
        event.preventDefault();
        openModal('El enlace público de Calenda todavía no está configurado. Cuando tengas la URL oficial, agregala en config.js y este botón llevará directamente a las reservas.');
      }
    });
  });
  modal.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', closeModal));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });

  const contactStatus = document.getElementById('contact-status');
  const locationStatus = document.getElementById('location-status');
  if (config.whatsappNumber) {
    contactStatus.innerHTML = `<a href="https://wa.me/${config.whatsappNumber}" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>`;
  }
  if (config.instagramUrl) {
    const instagram = document.createElement('a');
    instagram.href = config.instagramUrl;
    instagram.target = '_blank';
    instagram.rel = 'noopener noreferrer';
    instagram.textContent = 'Instagram oficial';
    contactStatus.append(' · ', instagram);
  }
  if (config.address) locationStatus.textContent = `Ubicación: ${config.address}`;
  if (config.openingHours) {
    const hours = document.createElement('span');
    hours.textContent = `Horarios: ${config.openingHours}`;
    locationStatus.after(hours);
  }
  document.getElementById('year').textContent = new Date().getFullYear();
})();
