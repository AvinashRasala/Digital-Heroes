// app.js — landing page form logic
const form = document.getElementById('leadForm');
const note = document.getElementById('formNote');
const ticketNumber = document.getElementById('ticketNumber');
const submitBtn = form.querySelector('.ticket__submit');

// A little theatre: shows a provisional ticket number before the real one comes back from the server.
ticketNumber.textContent = '#' + Math.floor(1000 + Math.random() * 8999);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clearErrors() {
  form.querySelectorAll('.field__error').forEach(el => el.textContent = '');
  note.textContent = '';
  note.className = 'ticket__note';
}

function validateClientSide(data) {
  const errors = {};
  if (!data.name || data.name.trim().length < 2) errors.name = 'Enter your name (2+ characters).';
  if (!EMAIL_RE.test(data.email || '')) errors.email = 'Enter a valid email address.';
  if (!data.budget_range) errors.budget_range = 'Pick a budget range.';
  if ((data.message || '').length > 2000) errors.message = 'Keep it under 2000 characters.';
  return errors;
}

function showErrors(errors) {
  Object.entries(errors).forEach(([field, msg]) => {
    const el = form.querySelector(`.field__error[data-for="${field}"]`);
    if (el) el.textContent = msg;
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const data = Object.fromEntries(new FormData(form).entries());
  const clientErrors = validateClientSide(data);

  if (Object.keys(clientErrors).length > 0) {
    showErrors(clientErrors);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'Filing...';

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (!res.ok) {
      if (result.errors) showErrors(result.errors);
      note.textContent = 'Please fix the highlighted fields.';
      note.classList.add('error');
      return;
    }

    ticketNumber.textContent = '#' + String(result.id).padStart(4, '0');
    note.textContent = 'Ticket filed. We\u2019ll be in touch shortly.';
    note.classList.add('success');
    form.reset();
  } catch (err) {
    note.textContent = 'Network error — please try again.';
    note.classList.add('error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = 'File this ticket';
  }
});
