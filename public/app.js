// app.js — landing page form logic
const form = document.getElementById('leadForm');
const note = document.getElementById('formNote');
const submitBtn = form.querySelector('.submit-btn');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clearErrors() {
  form.querySelectorAll('.field__error').forEach(el => el.textContent = '');
  note.textContent = '';
  note.className = 'form-note';
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
  submitBtn.querySelector('span').textContent = 'Sending...';

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

    note.textContent = "Got it — someone will reach out soon.";
    note.classList.add('success');
    form.reset();
  } catch (err) {
    note.textContent = 'Network error — please try again.';
    note.classList.add('error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = 'Send it over';
  }
});
