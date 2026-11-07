/**
 * CareerMatch AI: Weekly Study Planner & Milestone Streaks
 * Converts Roadmap topics into structured weekly deliverables.
 * Strictly zero fake data, honest completion streaks, and .ICS calendar export.
 */

import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";

export class StudyPlanner {
  constructor() {
    this.tasks = store.get("plannerTasks") || [];
    this.streak = store.get("streak") || { current: 0, lastCompletedDate: null };
    this.builderOpen = false;
  }

  init() {
    this.render();
    this._bindControls();

    store.subscribe("plannerTasks", (newTasks) => {
      this.tasks = newTasks || [];
      this.render();
    });

    store.subscribe("activeResume", () => {
      this._syncTargetRoleFromStore();
    });
  }

  _syncTargetRoleFromStore() {
    const analysis = store.get("analysis");
    const roleInput = document.getElementById("plannerTargetRole");
    if (roleInput && analysis?.targetRole) {
      roleInput.value = analysis.targetRole;
    }
  }

  _bindControls() {
    const buildBtn = document.getElementById("plannerBuildPlanBtn");
    const builderBox = document.getElementById("plannerBuilderBox");
    const closeBtn = document.getElementById("plannerCloseBuilderBtn");
    const cancelBtn = document.getElementById("plannerCancelBuilderBtn");
    const genBtn = document.getElementById("plannerGenerateScheduleBtn");
    const exportBtn = document.getElementById("plannerExportIcsBtn");

    buildBtn?.addEventListener("click", () => {
      this._syncTargetRoleFromStore();
      builderBox?.classList.remove("hidden");
    });

    const hideBuilder = () => builderBox?.classList.add("hidden");
    closeBtn?.addEventListener("click", hideBuilder);
    cancelBtn?.addEventListener("click", hideBuilder);

    genBtn?.addEventListener("click", () => {
      const role = document.getElementById("plannerTargetRole")?.value || "Software Engineer";
      const intensity = document.getElementById("plannerIntensity")?.value || "standard";
      this.generatePlan(role, intensity);
      hideBuilder();
    });

    exportBtn?.addEventListener("click", () => this.exportIcs());
  }

  generatePlan(targetRole, intensity = "standard") {
    const analysis = store.get("analysis");
    const missingSkills = analysis?.missingSkills || [];
    const skillsToCover = missingSkills.length > 0 ? missingSkills : ["System Architecture", "API Design", "Database Indexing", "Concurrency", "Unit Testing", "Cloud Deployment"];

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const generated = [];

    const tasksPerDay = intensity === "sprint" ? 3 : (intensity === "light" ? 1 : 2);

    let skillIdx = 0;
    days.forEach((day, dIdx) => {
      for (let i = 0; i < tasksPerDay; i++) {
        const skill = skillsToCover[skillIdx % skillsToCover.length];
        skillIdx++;

        let taskTitle = "";
        if (i === 0) {
          taskTitle = `Deep Dive: ${skill} core architectural principles & documentation`;
        } else if (i === 1) {
          taskTitle = `Hands-on: Implement ${skill} production patterns & edge-case unit tests`;
        } else {
          taskTitle = `Timed Assessment: Solve 5 scenario questions on ${skill}`;
        }

        generated.push({
          id: Date.now() + dIdx * 10 + i,
          day,
          title: taskTitle,
          skill,
          completed: false,
          completedAt: null,
        });
      }
    });

    // Sunday is dedicated revision
    generated.push({
      id: Date.now() + 99,
      day: "Sunday",
      title: "Weekly Review: Consolidate study notes, push Git commits, and schedule mock interview",
      skill: "System Synthesis",
      completed: false,
      completedAt: null,
    });

    this.tasks = generated;
    store.set("plannerTasks", this.tasks);
    if (window.showToast) window.showToast(`Generated ${generated.length} personalized study milestones!`);
  }

  toggleTask(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    store.set("plannerTasks", [...this.tasks]);

    if (task.completed) {
      this._updateStreakOnCompletion();
    }
  }

  _updateStreakOnCompletion() {
    const today = new Date().toISOString().split("T")[0];
    const lastDate = this.streak.lastCompletedDate;

    if (!lastDate) {
      this.streak = { current: 1, lastCompletedDate: today };
    } else if (lastDate === today) {
      // Already credited for today
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if (lastDate === yesterday) {
        this.streak.current += 1;
        this.streak.lastCompletedDate = today;
      } else {
        // Gap in streak: restart at 1
        this.streak.current = 1;
        this.streak.lastCompletedDate = today;
      }
    }

    store.set("streak", this.streak);
    const streakDisplay = document.getElementById("plannerStreakDisplay");
    if (streakDisplay) {
      streakDisplay.textContent = `${this.streak.current} Days`;
    }
  }

  addTask(day, title, skill = "Core Tech") {
    const newTask = {
      id: Date.now(),
      day,
      title: title.trim(),
      skill: skill.trim(),
      completed: false,
      completedAt: null,
    };
    this.tasks.push(newTask);
    store.set("plannerTasks", [...this.tasks]);
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    store.set("plannerTasks", [...this.tasks]);
  }

  exportIcs() {
    if (!this.tasks.length) {
      if (window.showToast) window.showToast("No study tasks found to export.", "warning");
      return;
    }

    const dayOffsets = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };

    const now = new Date();
    const currDay = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currDay + 1);

    const pad = (n) => String(n).padStart(2, "0");
    const formatIcsDate = (d) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T090000Z`;
    const formatIcsEndDate = (d) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T100000Z`;

    let icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CareerMatch AI//Study Planner 4.0//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    this.tasks.forEach((task) => {
      const offset = (dayOffsets[task.day] || 1) - 1;
      const taskDate = new Date(startOfWeek);
      taskDate.setDate(startOfWeek.getDate() + offset);

      icsLines.push(
        "BEGIN:VEVENT",
        `UID:careermatch-task-${task.id}@careermatch.ai`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        `DTSTART:${formatIcsDate(taskDate)}`,
        `DTEND:${formatIcsEndDate(taskDate)}`,
        `SUMMARY:Study: ${task.skill} - ${task.title.slice(0, 50)}`,
        `DESCRIPTION:${task.title.replace(/\n/g, " ")} (Skill: ${task.skill})`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    });

    icsLines.push("END:VCALENDAR");

    const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `careermatch_study_schedule_${new Date().toISOString().slice(0, 10)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.showToast) window.showToast("Exported study schedule to .ICS calendar");
  }

  render() {
    const grid = document.getElementById("plannerWeekGrid");
    const streakDisplay = document.getElementById("plannerStreakDisplay");
    if (streakDisplay) {
      streakDisplay.textContent = `${this.streak.current || 0} Days`;
    }

    if (!grid) return;

    if (!this.tasks.length) {
      grid.innerHTML = `
        <div class="card p-4 text-center bg-sunken border-subtle grid-full-width">
          <h3 class="font-serif text-lg text-primary mb-1">No Active Study Plan</h3>
          <p class="text-sm text-secondary mb-3 max-w-prose mx-auto">
            Build a targeted weekly roadmap tailored to your missing skills and target role. Steady daily milestones help you stay disciplined.
          </p>
          <button type="button" class="btn btn-primary" id="plannerEmptyStateBuildBtn">Build My Study Plan</button>
        </div>
      `;
      document.getElementById("plannerEmptyStateBuildBtn")?.addEventListener("click", () => {
        document.getElementById("plannerBuilderBox")?.classList.remove("hidden");
      });
      return;
    }

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    grid.innerHTML = days
      .map((day) => {
        const dayTasks = this.tasks.filter((t) => t.day === day);
        const dayDone = dayTasks.length > 0 && dayTasks.every((t) => t.completed);

        return `
          <div class="planner-day-col card p-2 bg-sunken border-subtle d-flex flex-col flex-between ${dayDone ? "border-high" : ""}">
            <div>
              <div class="d-flex flex-between align-center mb-2 pb-1 border-bottom">
                <span class="font-semibold text-xs text-primary">${day}</span>
                <span class="badge-tag text-xxs ${dayDone ? "tag-match" : ""}">
                  ${dayTasks.filter((t) => t.completed).length}/${dayTasks.length}
                </span>
              </div>

              <div class="d-flex flex-col gap-xs">
                ${dayTasks.length === 0 ? `
                  <div class="text-xs text-tertiary text-center py-3">Rest / Buffer Day</div>
                ` : dayTasks.map((t) => `
                  <div class="card p-2 bg-card border-subtle d-flex align-start gap-xs">
                    <input type="checkbox" class="planner-task-chk mt-1 cursor-pointer" data-task-id="${t.id}" ${t.completed ? "checked" : ""} aria-label="Mark task complete" />
                    <div class="flex-1 min-w-0">
                      <span class="text-xs d-block lh-tight ${t.completed ? "text-tertiary text-line-through" : "text-primary"}">
                        ${escapeHtml(t.title)}
                      </span>
                      <span class="text-xxs font-mono text-accent d-block mt-05">
                        ${escapeHtml(t.skill)}
                      </span>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm planner-del-btn p-0 text-tertiary" data-task-id="${t.id}" title="Delete task">✕</button>
                  </div>
                `).join("")}
              </div>
            </div>

            <div class="pt-2 border-top mt-2">
              <button type="button" class="btn btn-ghost btn-sm w-full text-xs justify-center planner-quick-add-btn" data-day="${day}">
                + Add Goal
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    this._bindEvents(grid);
  }

  _bindEvents(container) {
    container.querySelectorAll(".planner-task-chk").forEach((chk) => {
      chk.addEventListener("change", (e) => {
        const id = parseInt(e.target.getAttribute("data-task-id"), 10);
        this.toggleTask(id);
      });
    });

    container.querySelectorAll(".planner-del-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-task-id"), 10);
        this.deleteTask(id);
      });
    });

    container.querySelectorAll(".planner-quick-add-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const day = btn.getAttribute("data-day");
        const goal = prompt(`Enter study task for ${day}:`);
        if (goal && goal.trim()) {
          this.addTask(day, goal.trim());
        }
      });
    });
  }
}

export const planner = new StudyPlanner();
