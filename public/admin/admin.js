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

const statsBar = document.getElementById('statsBar');
if (statsBar) {
  const searchInput = document.getElementById('searchInput');
  const whoami = document.getElementById('whoami');
  const logoutBtn = document.getElementById('logoutBtn');
  const exportBtn = document.getElementById('exportBtn');
  const STATUSES = ['New', 'Contacted', 'Closed'];
  const NEXT_STATUS = { New: 'Contacted', Contacted: 'Closed', Closed: null };
  const PREV_STATUS = { New: null, Contacted: 'New', Closed: 'Contacted' };

  let currentLeads = [];
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
    currentLeads = await res.json();
    renderStats(currentLeads);
    renderBoard(currentLeads);
  }

  function renderStats(leads) {
    const counts = { New: 0, Contacted: 0, Closed: 0 };
    leads.forEach(l => counts[l.status] = (counts[l.status] || 0) + 1);
    const highPriority = leads.filter(l => l.budget_range === '$20k+').length;

    statsBar.innerHTML = `
      <div class="stat-chip"><div class="stat-chip__value">${leads.length}</div><div class="stat-chip__label">Total leads</div></div>
      <div class="stat-chip"><div class="stat-chip__value">${counts.New}</div><div class="stat-chip__label">New</div></div>
      <div class="stat-chip"><div class="stat-chip__value">${counts.Contacted}</div><div class="stat-chip__label">Contacted</div></div>
      <div class="stat-chip"><div class="stat-chip__value">${counts.Closed}</div><div class="stat-chip__label">Closed</div></div>
      <div class="stat-chip"><div class="stat-chip__value">${highPriority}</div><div class="stat-chip__label">High priority</div></div>
    `;
  }

  function renderBoard(leads) {
    STATUSES.forEach(status => {
      const columnLeads = leads.filter(l => l.status === status);
      document.getElementById(`count-${status}`).textContent = columnLeads.length;
      const container = document.getElementById(`cards-${status}`);

      if (columnLeads.length === 0) {
        container.innerHTML = `<div class="column__empty">${leads.length ? 'Nothing matches that search.' : 'Quiet in here for now.'}</div>`;
        return;
      }

      container.innerHTML = columnLeads.map(lead => renderCard(lead)).join('');
    });

    // wire up buttons after render
    document.querySelectorAll('.move-btn').forEach(btn => {
      btn.addEventListener('click', () => updateStatus(btn.dataset.id, btn.dataset.target));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteLead(btn.dataset.id));
    });
  }

  function renderCard(lead) {
    const isPriority = lead.budget_range === '$20k+';
    const next = NEXT_STATUS[lead.status];
    const prev = PREV_STATUS[lead.status];

    return `
      <div class="lead-card" data-id="${lead.id}">
        <div class="lead-card__top">
          <span class="lead-card__name">${escapeHtml(lead.name)}</span>
          ${isPriority ? '<span class="priority-badge">HIGH PRIORITY</span>' : ''}
        </div>
        <div class="lead-card__email">${escapeHtml(lead.email)}</div>
        <div class="lead-card__msg" title="${escapeHtml(lead.message || '')}">${escapeHtml(lead.message || 'No message provided.')}</div>
        <div class="lead-card__meta">
          <span>${escapeHtml(lead.budget_range)}</span>
          <span>${formatDate(lead.created_at)}</span>
        </div>
        <div class="lead-card__actions">
          ${prev ? `<button class="move-btn" data-id="${lead.id}" data-target="${prev}">← ${prev}</button>` : ''}
          ${next ? `<button class="move-btn" data-id="${lead.id}" data-target="${next}">${next} →</button>` : ''}
          <button class="delete-btn" data-id="${lead.id}">Delete</button>
        </div>
      </div>
    `;
  }

  async function updateStatus(id, status) {
    await fetch(`/api/admin/leads/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadLeads(searchInput.value.trim());
  }

  async function deleteLead(id) {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' });
    loadLeads(searchInput.value.trim());
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

  function exportCsv() {
    if (currentLeads.length === 0) {
      alert('No leads to export yet.');
      return;
    }
    const headers = ['id', 'name', 'email', 'budget_range', 'message', 'status', 'created_at'];
    const rows = currentLeads.map(l =>
      headers.map(h => `"${String(l[h] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaddesk-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => loadLeads(searchInput.value.trim()), 250);
  });

  exportBtn.addEventListener('click', exportCsv);

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
  });

  loadSession();
  loadLeads();
}
