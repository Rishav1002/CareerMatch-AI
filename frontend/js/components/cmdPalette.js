/**
 * CareerMatch AI: Command Palette (Ctrl/Cmd+K)
 * Fast navigation and action launcher with keyboard navigation
 */

import { router } from "../router.js";
import { store } from "../store.js";

const COMMAND_ITEMS = [
  // Navigation
  { id: "nav-dashboard", label: "Go to Overview Dashboard", tag: "View", action: () => router.navigate("dashboard") },
  { id: "nav-analyzer", label: "Go to Resume & JD Match Analyzer", tag: "View", action: () => router.navigate("analyzer") },
  { id: "nav-report", label: "Go to Career Report & Evidence Ledger", tag: "View", action: () => router.navigate("report") },
  { id: "nav-ats", label: "Go to ATS Resume Simulator", tag: "View", action: () => router.navigate("ats") },
  { id: "nav-roadmap", label: "Go to Adaptive Learning Roadmap", tag: "View", action: () => router.navigate("roadmap") },
  { id: "nav-planner", label: "Go to Weekly Study Planner", tag: "View", action: () => router.navigate("planner") },
  { id: "nav-interview", label: "Go to AI Mock Interview Simulator", tag: "View", action: () => router.navigate("interview") },
  { id: "nav-skills", label: "Go to AI Skill Assessment Lab", tag: "View", action: () => router.navigate("skills") },
  { id: "nav-github", label: "Go to GitHub Proof & Portfolio", tag: "View", action: () => router.navigate("github") },
  { id: "nav-market", label: "Go to Live Job Market Intelligence", tag: "View", action: () => router.navigate("market") },
  { id: "nav-tracker", label: "Go to Application Kanban Tracker", tag: "View", action: () => router.navigate("tracker") },
  { id: "nav-compare", label: "Go to Career Path & Salary Benchmark", tag: "View", action: () => router.navigate("compare") },
  { id: "nav-readiness", label: "Go to Placement Readiness Index (PRI)", tag: "View", action: () => router.navigate("readiness") },
  { id: "nav-profile", label: "Go to Student Career Profile", tag: "View", action: () => router.navigate("profile") },
  { id: "nav-landing", label: "Go to Public Landing Page & Field Guide", tag: "View", action: () => router.navigate("landing") },

  // Quick Actions
  {
    id: "act-new-analysis",
    label: "Start New Resume Analysis",
    tag: "Action",
    action: () => {
      router.navigate("analyzer");
      const dropzone = document.getElementById("uploadDropZone");
      if (dropzone) dropzone.focus();
    },
  },
  {
    id: "act-theme",
    label: "Toggle Color Theme (Warm Paper / Deep Mineral Ink)",
    tag: "Action",
    action: () => {
      const current = store.get("theme");
      const next = current === "dark" ? "light" : "dark";
      store.set("theme", next);
      document.documentElement.setAttribute("data-theme", next);
    },
  },
  {
    id: "act-print",
    label: "Print / Export Ledger PDF Report",
    tag: "Action",
    action: () => {
      router.navigate("report");
      setTimeout(() => window.print(), 300);
    },
  },
  {
    id: "act-interview",
    label: "Start New Technical Mock Interview",
    tag: "Action",
    action: () => {
      router.navigate("interview");
      const startBtn = document.getElementById("startInterviewBtn");
      if (startBtn) startBtn.click();
    },
  },
];

export class CommandPalette {
  constructor() {
    this.isOpen = false;
    this.selectedIndex = 0;
    this.filteredItems = [...COMMAND_ITEMS];
    this.backdrop = null;
    this.input = null;
    this.resultsList = null;
  }

  init() {
    this._injectDOM();
    this._attachListeners();
  }

  _injectDOM() {
    if (document.getElementById("cmdPaletteBackdrop")) return;

    const backdrop = document.createElement("div");
    backdrop.id = "cmdPaletteBackdrop";
    backdrop.className = "cmd-palette-backdrop";
    backdrop.style.display = "none";
    backdrop.innerHTML = `
      <div class="cmd-palette-dialog" role="dialog" aria-modal="true" aria-label="Command Palette">
        <div class="cmd-input-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="cmdPaletteInput" class="cmd-input" placeholder="Type a command or jump to view..." autocomplete="off" />
          <kbd class="cmd-shortcut-badge">ESC</kbd>
        </div>
        <ul id="cmdPaletteResults" class="cmd-results-list" role="listbox"></ul>
        <div class="cmd-footer">
          <span>Navigate with <strong>↑</strong> <strong>↓</strong></span>
          <span>Select with <strong>↵ Enter</strong></span>
          <span>Close with <strong>ESC</strong></span>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    this.backdrop = backdrop;
    this.input = document.getElementById("cmdPaletteInput");
    this.resultsList = document.getElementById("cmdPaletteResults");
  }

  _attachListeners() {
    // Global keyboard shortcut: Ctrl+K or Cmd+K
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        this.toggle();
      } else if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });

    // Close on backdrop click outside dialog
    this.backdrop.addEventListener("click", (e) => {
      if (e.target === this.backdrop) this.close();
    });

    // Filter results on input
    this.input.addEventListener("input", (e) => {
      this.filter(e.target.value);
    });

    // Key navigation inside input
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.selectNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.selectPrev();
      } else if (e.key === "Enter") {
        e.preventDefault();
        this.executeSelected();
      }
    });

    // Topbar trigger button
    const triggerBtn = document.getElementById("cmdPaletteTrigger");
    if (triggerBtn) {
      triggerBtn.addEventListener("click", () => this.open());
    }
  }

  open() {
    this.isOpen = true;
    this.backdrop.style.display = "flex";
    this.input.value = "";
    this.filter("");
    this.input.focus();
  }

  close() {
    this.isOpen = false;
    this.backdrop.style.display = "none";
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  filter(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      this.filteredItems = [...COMMAND_ITEMS];
    } else {
      this.filteredItems = COMMAND_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(q) || item.tag.toLowerCase().includes(q)
      );
    }
    this.selectedIndex = 0;
    this.renderResults();
  }

  renderResults() {
    if (this.filteredItems.length === 0) {
      this.resultsList.innerHTML = `
        <li style="padding: 16px; text-align: center; color: var(--text-tertiary); font-size: 0.875rem;">
          No matching commands found.
        </li>
      `;
      return;
    }

    this.resultsList.innerHTML = this.filteredItems
      .map((item, idx) => `
        <li class="cmd-item ${idx === this.selectedIndex ? "selected" : ""}" data-idx="${idx}" role="option" aria-selected="${idx === this.selectedIndex}">
          <div class="cmd-item-label">
            <span>${item.label}</span>
          </div>
          <span class="cmd-item-tag">${item.tag}</span>
        </li>
      `)
      .join("");

    // Click handler on items
    this.resultsList.querySelectorAll(".cmd-item").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.getAttribute("data-idx"), 10);
        this.selectedIndex = idx;
        this.executeSelected();
      });
    });
  }

  selectNext() {
    if (this.filteredItems.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.filteredItems.length;
    this.renderResults();
    this._scrollSelectedIntoView();
  }

  selectPrev() {
    if (this.filteredItems.length === 0) return;
    this.selectedIndex = (this.selectedIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
    this.renderResults();
    this._scrollSelectedIntoView();
  }

  executeSelected() {
    const item = this.filteredItems[this.selectedIndex];
    if (item && typeof item.action === "function") {
      this.close();
      item.action();
    }
  }

  _scrollSelectedIntoView() {
    const selectedEl = this.resultsList.querySelector(".cmd-item.selected");
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }
}

export const commandPalette = new CommandPalette();
