(() => {
  const forms = document.querySelectorAll('form.signup');
  const params = new URLSearchParams(location.search);
  const utm = {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
  };
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function markAllDone(email) {
    forms.forEach((f) => {
      f.classList.add('done');
      const s = f.querySelector('.status');
      s.classList.remove('error');
      s.textContent = f.dataset.source === 'hero'
        ? `You're on the list. We'll email ${email} when early access opens.`
        : "You're on the list. We'll be in touch.";
    });
  }

  forms.forEach((form) => {
    const input = form.querySelector('input[type=email]');
    const button = form.querySelector('button');
    const status = form.querySelector('.status');

    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      if (status.classList.contains('error')) status.textContent = '';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!EMAIL.test(email)) {
        input.setAttribute('aria-invalid', 'true');
        status.classList.add('error');
        status.textContent = 'Enter an email address like you@company.com.';
        input.focus();
        return;
      }
      button.disabled = true;
      button.textContent = 'Joining…';
      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            company: form.querySelector('.hp').value,
            source: form.dataset.source,
            referrer: document.referrer,
            ...utm,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Something went wrong on our side. Try again in a minute.');
        markAllDone(email);
      } catch (err) {
        status.classList.add('error');
        status.textContent = err.message === 'Failed to fetch'
          ? "Couldn't reach the server. Check your connection and try again."
          : err.message;
      } finally {
        button.disabled = false;
        button.textContent = 'Join the waitlist';
      }
    });
  });
})();
