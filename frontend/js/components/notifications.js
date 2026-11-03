/**
 * CareerMatch AI: Notifications & Alerts Drawer
 */

import { store } from "../store.js";

export class NotificationsDrawer {
  constructor() {
    this.isOpen = false;
    this.drawerEl = null;
  }

  init() {
    this._injectDOM();
    this._attachListeners();
    this._updateBadge();
    store.subscribe("notifications", () => this._updateBadge());
  }

  _injectDOM() {
    if (document.getElementById("notifDrawerBackdrop")) return;

    const el = document.createElement("div");
    el.id = "notifDrawerBackdrop";
    el.className = "drawer-backdrop";
    el.style.display = "none";
    el.innerHTML = `
      <aside class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="notifTitle">
        <header class="drawer-header">
          <div style="display: flex; align-items: center; gap: var(--space-1);">
            <h3 id="notifTitle" style="font-size: 1.15rem;">Field Updates & Alerts</h3>
            <span class="score-pill" id="notifUnreadPill">2 new</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <button class="btn btn-ghost btn-sm" id="markAllReadBtn" style="font-size: 0.75rem;">
              Mark Read
            </button>
            <button class="btn btn-ghost btn-sm" id="closeNotifBtn" aria-label="Close Alerts">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </header>

        <div class="drawer-content" id="notifListContainer" style="display: flex; flex-direction: column; gap: var(--space-15);">
          <!-- Populated dynamically -->
        </div>
      </aside>
    `;
    document.body.appendChild(el);
    this.drawerEl = el;
  }

  _attachListeners() {
    this.drawerEl.addEventListener("click", (e) => {
      if (e.target === this.drawerEl) this.close();
    });

    const closeBtn = document.getElementById("closeNotifBtn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());

    const markReadBtn = document.getElementById("markAllReadBtn");
    if (markReadBtn) {
      markReadBtn.addEventListener("click", () => {
        const notifs = store.get("notifications") || [];
        notifs.forEach((n) => (n.unread = false));
        store.set("notifications", [...notifs]);
        this.renderList();
      });
    }

    const bellBtn = document.getElementById("notifTriggerBtn");
    if (bellBtn) {
      bellBtn.addEventListener("click", () => this.toggle());
    }
  }

  open() {
    this.isOpen = true;
    this.drawerEl.style.display = "flex";
    this.renderList();
  }

  close() {
    this.isOpen = false;
    this.drawerEl.style.display = "none";
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  _updateBadge() {
    const notifs = store.get("notifications") || [];
    const unread = notifs.filter((n) => n.unread).length;
    const badge = document.getElementById("notifBadgeCount");
    if (badge) {
      if (unread > 0) {
        badge.textContent = unread;
        badge.style.display = "inline-flex";
      } else {
        badge.style.display = "none";
      }
    }
  }

  renderList() {
    const list = document.getElementById("notifListContainer");
    const unreadPill = document.getElementById("notifUnreadPill");
    if (!list) return;

    const notifs = store.get("notifications") || [];
    const unreadCount = notifs.filter((n) => n.unread).length;
    if (unreadPill) {
      unreadPill.textContent = `${unreadCount} new`;
    }

    if (notifs.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: var(--space-4); color: var(--text-tertiary); font-size: 0.875rem;">
          No notifications yet.
        </div>
      `;
      return;
    }

    list.innerHTML = notifs
      .map(
        (n) => `
        <div class="card" style="padding: var(--space-15); ${n.unread ? "border-left: 3px solid var(--brand-accent);" : ""}">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
            <strong style="font-size: 0.9rem; color: var(--text-primary);">${n.title}</strong>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-tertiary);">${n.time}</span>
          </div>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin: 0;">${n.desc}</p>
        </div>
      `
      )
      .join("");
  }
}

export const notifications = new NotificationsDrawer();
