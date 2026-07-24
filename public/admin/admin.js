// admin.js — handles both login.html and dashboard.html depending on what's on the page

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  const errEl = document.getElementById('loginError');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    const data = Object.fromEntries(new FormData(loginForm).entries());

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) {
        errEl.textContent = result.error || 'Login failed.';
        return;
      }
      window.location.href = '/admin';
    } catch (err) {
      errEl.textContent = 'Network error — please try again.';
    }
  });
}

const leadsBody = document.getElementById('leadsBody');
if (leadsBody) {
  const searchInput = document.getElementById('searchInput');
  const deskCount = document.getElementById('deskCount');
  const whoami = document.getElementById('whoami');
  const logoutBtn = document.getElementById('logoutBtn');

  let debounceTimer;

  async function loadSession() {
    const res = await fetch('/api/session');
    const s = await res.json();
    if (s.loggedIn) whoami.textContent = `Signed in as ${s.username}`;
  }

  async function loadLeads(query = '') {
    const url = query ? `/api/admin/leads?q=${encodeURIComponent(query)}` : '/api/admin/leads';
    const res = await fetch(url);
    if (res.status === 401) {
      window.location.href = '/admin/login.html';
      return;
    }
    const leads = await res.json();
    renderLeads(leads);
  }

  function renderLeads(leads) {
    deskCount.textContent = `${leads.length} ticket${leads.length === 1 ? '' : 's'}`;

    if (leads.length === 0) {
      leadsBody.innerHTML = `<tr><td colspan="7" class="desk__empty">No tickets match. Try a different search, or wait for the next one to come in.</td></tr>`;
      return;
    }

    leadsBody.innerHTML = leads.map(lead => `
      <tr data-id="${lead.id}">
        <td class="ticket-id">#${String(lead.id).padStart(4, '0')}</td>
        <td>${escapeHtml(lead.name)}</td>
        <td>${escapeHtml(lead.email)}</td>
        <td>${escapeHtml(lead.budget_range)}</td>
        <td class="msg-cell" title="${escapeHtml(lead.message || '')}">${escapeHtml(lead.message || '—')}</td>
        <td>${formatDate(lead.created_at)}</td>
        <td>
          <select class="status-select" data-status="${lead.status}" data-id="${lead.id}">
            <option value="New" ${lead.status === 'New' ? 'selected' : ''}>New</option>
            <option value="Contacted" ${lead.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
            <option value="Closed" ${lead.status === 'Closed' ? 'selected' : ''}>Closed</option>
          </select>
        </td>
      </tr>
    `).join('');

    leadsBody.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const status = e.target.value;
        e.target.dataset.status = status;
        await fetch(`/api/admin/leads/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(iso) {
    const d = new Date(iso + 'Z');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => loadLeads(searchInput.value.trim()), 250);
  });

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
  });

  loadSession();
  loadLeads();
}
