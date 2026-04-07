// public/js/notifications.js
// ============================================================
//  Reusable notification system — include this on EVERY page
//
//  What it does:
//   1. Injects a bell icon (🔔) with unread badge into the navbar
//   2. Opens a dropdown panel listing recent notifications
//   3. Connects Socket.IO and listens for real-time pushes
//   4. Shows a toast popup when a new notification arrives
// ============================================================

(function () {
  const TOKEN   = localStorage.getItem('token');
  const USER    = JSON.parse(localStorage.getItem('user') || 'null');
  if (!TOKEN || !USER) return;   // not logged in — do nothing

  // ── 1. INJECT BELL INTO NAVBAR ──────────────────────────────
  // Looks for a <div id="navRight"> or <nav> to append into.
  // Add id="navRight" to your navbar's right-side div.
  function injectBell() {
    const target = document.getElementById('navRight') || document.querySelector('nav');
    if (!target) return;

    const wrapper = document.createElement('div');
    wrapper.id    = 'notifWrapper';
    wrapper.style.cssText = 'position:relative;display:inline-block;margin-left:12px;';

    wrapper.innerHTML = `
      <button id="notifBell" title="Notifications" style="
        background:none;border:none;cursor:pointer;font-size:20px;
        position:relative;padding:4px 8px;color:inherit;
      ">
        🔔
        <span id="notifBadge" style="
          display:none;position:absolute;top:0;right:0;
          background:#e53e3e;color:#fff;border-radius:50%;
          width:18px;height:18px;font-size:11px;font-weight:bold;
          align-items:center;justify-content:center;
        ">0</span>
      </button>

      <!-- Dropdown panel -->
      <div id="notifDropdown" style="
        display:none;position:absolute;right:0;top:38px;
        width:320px;background:#fff;border-radius:10px;
        box-shadow:0 4px 24px rgba(0,0,0,0.15);z-index:9999;
        border:1px solid #eee;overflow:hidden;
      ">
        <div style="
          display:flex;justify-content:space-between;align-items:center;
          padding:12px 16px;border-bottom:1px solid #eee;
        ">
          <span style="font-weight:bold;font-size:14px;color:#1a1a2e;">Notifications</span>
          <div style="display:flex;gap:10px;">
            <button onclick="notifMarkAllRead()" style="
              font-size:12px;color:#555;background:none;border:none;
              cursor:pointer;text-decoration:underline;
            ">Mark all read</button>
            <a href="/notifications" style="font-size:12px;color:#1a1a2e;font-weight:bold;">See all</a>
          </div>
        </div>
        <div id="notifList" style="max-height:340px;overflow-y:auto;"></div>
      </div>`;

    target.appendChild(wrapper);

    // Toggle dropdown on bell click
    document.getElementById('notifBell').addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = document.getElementById('notifDropdown');
      const isOpen   = dropdown.style.display === 'block';
      dropdown.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) loadDropdownNotifications();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      const d = document.getElementById('notifDropdown');
      if (d) d.style.display = 'none';
    });
    document.getElementById('notifDropdown').addEventListener('click', e => e.stopPropagation());
  }

  // ── 2. LOAD UNREAD COUNT (badge) ─────────────────────────────
  async function loadUnreadCount() {
    try {
      const res  = await fetch('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      const data = await res.json();
      if (data.success) updateBadge(data.unread);
    } catch {}
  }

  function updateBadge(count) {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent    = count > 99 ? '99+' : count;
      badge.style.display  = 'flex';
    } else {
      badge.style.display  = 'none';
    }
  }

  // ── 3. LOAD DROPDOWN NOTIFICATION LIST ───────────────────────
  async function loadDropdownNotifications() {
    const list = document.getElementById('notifList');
    if (!list) return;
    list.innerHTML = '<p style="text-align:center;padding:20px;color:#999;font-size:13px;">Loading…</p>';

    try {
      const res  = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      const data = await res.json();

      updateBadge(data.unread);

      if (!data.data || data.data.length === 0) {
        list.innerHTML = '<p style="text-align:center;padding:24px;color:#999;font-size:13px;">No notifications yet 🔔</p>';
        return;
      }

      list.innerHTML = data.data.slice(0, 8).map(n => `
        <div onclick="notifItemClick(${n.notification_id}, '${n.link || ''}')"
             style="
               display:flex;gap:10px;padding:12px 16px;cursor:pointer;
               background:${n.is_read ? '#fff' : '#f0f4ff'};
               border-bottom:1px solid #f0f0f0;
               transition:background 0.15s;
             "
             onmouseover="this.style.background='#f5f7ff'"
             onmouseout="this.style.background='${n.is_read ? '#fff' : '#f0f4ff'}'">
          <div style="font-size:20px;flex-shrink:0;margin-top:2px;">${notifIcon(n.type)}</div>
          <div style="flex:1;min-width:0;">
            <p style="font-size:13px;font-weight:${n.is_read ? 'normal' : 'bold'};
                      color:#1a1a2e;margin:0 0 2px;">${n.title}</p>
            <p style="font-size:12px;color:#666;margin:0 0 4px;
                      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n.body}</p>
            <p style="font-size:11px;color:#aaa;margin:0;">${timeAgo(n.created_at)}</p>
          </div>
          ${!n.is_read ? '<div style="width:8px;height:8px;background:#3b82f6;border-radius:50%;margin-top:6px;flex-shrink:0;"></div>' : ''}
        </div>`).join('');

    } catch {
      list.innerHTML = '<p style="text-align:center;padding:20px;color:#c00;font-size:13px;">Failed to load.</p>';
    }
  }

  // Click a notification item: mark as read + navigate
  async function notifItemClick(notifId, link) {
    await fetch(`/api/notifications/${notifId}/read`, {
      method: 'PUT', headers: { Authorization: `Bearer ${TOKEN}` },
    }).catch(() => {});
    if (link) window.location.href = link;
    else      loadDropdownNotifications();
  }
  window.notifItemClick = notifItemClick;

  // Mark all as read
  async function notifMarkAllRead() {
    await fetch('/api/notifications/all/read', {
      method: 'PUT', headers: { Authorization: `Bearer ${TOKEN}` },
    }).catch(() => {});
    updateBadge(0);
    loadDropdownNotifications();
  }
  window.notifMarkAllRead = notifMarkAllRead;

  // ── 4. REAL-TIME via SOCKET.IO ────────────────────────────────
  function connectSocket() {
    // socket.io client script must be loaded before this file
    if (typeof io === 'undefined') return;

    const socket = io();

    socket.on('connect', () => {
      // Join personal room so server can push to this user
      socket.emit('join_user_room', { user_id: USER.user_id });
    });

    // Server pushes this event when something happens
    socket.on('notification', (notif) => {
      // Increment badge
      const badge   = document.getElementById('notifBadge');
      const current = parseInt(badge?.textContent) || 0;
      updateBadge(current + 1);

      // Show a toast popup
      showToast(notif);

      // Refresh dropdown if it's open
      const dropdown = document.getElementById('notifDropdown');
      if (dropdown && dropdown.style.display === 'block') {
        loadDropdownNotifications();
      }
    });
  }

  // ── 5. TOAST POPUP ────────────────────────────────────────────
  function showToast(notif) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:99999;
      background:#1a1a2e;color:#fff;border-radius:10px;
      padding:14px 18px;max-width:300px;
      box-shadow:0 4px 20px rgba(0,0,0,0.25);
      display:flex;gap:12px;align-items:flex-start;
      animation:slideUp 0.3s ease;
      cursor:pointer;
    `;
    toast.innerHTML = `
      <div style="font-size:22px;flex-shrink:0;">${notifIcon(notif.type)}</div>
      <div>
        <p style="font-weight:bold;font-size:13px;margin:0 0 3px;">${notif.title}</p>
        <p style="font-size:12px;opacity:0.85;margin:0;">${notif.body}</p>
      </div>
      <button onclick="this.parentElement.remove()" style="
        background:none;border:none;color:#fff;opacity:0.6;
        cursor:pointer;font-size:16px;margin-left:4px;flex-shrink:0;
      ">✕</button>`;

    if (notif.link) toast.addEventListener('click', () => window.location.href = notif.link);

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.style.opacity    = '0';
      toast.style.transition = 'opacity 0.4s';
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  }

  // ── HELPERS ───────────────────────────────────────────────────
  function notifIcon(type) {
    const map = {
      message: '💬', order: '🛒', payment: '💳',
      review:  '⭐', report: '🚩', system: '📢',
    };
    return map[type] || '🔔';
  }

  function timeAgo(dateStr) {
    const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (s < 60)     return 'just now';
    if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
    if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  // ── ADD TOAST ANIMATION ───────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }`;
  document.head.appendChild(style);

  // ── INIT ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    injectBell();
    loadUnreadCount();
    connectSocket();
  });

})();
