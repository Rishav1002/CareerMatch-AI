/**
 * CareerMatch AI: Weekly Study Planner & Milestone Streaks
 * Converts Roadmap topics into structured weekly deliverables
 */

import { store } from "../store.js";

const DEFAULT_PLANNER_TASKS = [
  { id: 1, day: "Monday", title: "Apache Spark RDD & DataFrames architecture", skill: "Apache Spark", completed: true },
  { id: 2, day: "Monday", title: "Complete 20 SQL Window Functions coding questions", skill: "SQL", completed: true },
  { id: 3, day: "Tuesday", title: "AWS Athena & S3 Parquet partitioning drill", skill: "AWS", completed: true },
  { id: 4, day: "Wednesday", title: "Data Warehousing dimensional modeling (Star Schema)", skill: "Data Warehousing", completed: false },
  { id: 5, day: "Thursday", title: "Mock Interview session on distributed data pipelines", skill: "System Design", completed: false },
  { id: 6, day: "Friday", title: "Git branch workflows & pull request peer review review", skill: "Git", completed: false },
  { id: 7, day: "Saturday", title: "Timed Python coding challenge (Array manipulation & Hashmaps)", skill: "Python", completed: false },
];

export class StudyPlanner {
  constructor() {
    this.tasks = store.get("plannerTasks");
    if (!this.tasks || this.tasks.length === 0) {
      this.tasks = DEFAULT_PLANNER_TASKS;
      store.set("plannerTasks", this.tasks);
    }
    this.streak = store.get("streak") || { current: 3, lastDate: new Date().toISOString().split("T")[0] };
  }

  init() {
    this.render();
    store.subscribe("plannerTasks", (newTasks) => {
      this.tasks = newTasks;
      this.render();
    });
  }

  toggleTask(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      store.set("plannerTasks", [...this.tasks]);
      this._checkStreakUpdate();
    }
  }

  addTask(day, title, skill = "Core Tech") {
    const newTask = {
      id: Date.now(),
      day,
      title: title.trim(),
      skill,
      completed: false,
    };
    this.tasks.push(newTask);
    store.set("plannerTasks", [...this.tasks]);
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    store.set("plannerTasks", [...this.tasks]);
  }

  _checkStreakUpdate() {
    const completedCount = this.tasks.filter((t) => t.completed).length;
    if (completedCount >= 4 && this.streak.current < 4) {
      this.streak.current = 4;
      store.set("streak", this.streak);
    }
  }

  render() {
    const grid = document.getElementById("plannerWeekGrid");
    const streakDisplay = document.getElementById("plannerStreakDisplay");
    if (streakDisplay) {
      streakDisplay.textContent = `${this.streak.current} Days`;
    }

    if (!grid) return;

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    grid.innerHTML = days
      .map((day) => {
        const dayTasks = this.tasks.filter((t) => t.day === day);
        const dayDone = dayTasks.length > 0 && dayTasks.every((t) => t.completed);

        return `
          <div class="planner-day-col" style="${dayDone ? "border-color: var(--score-high-border); background: var(--score-high-bg);" : ""}">
            <div class="planner-day-name" style="display: flex; justify-content: space-between; align-items: center;">
              <span>${day}</span>
              <span class="score-pill ${dayDone ? "high" : ""}" style="font-size: 0.68rem;">
                ${dayTasks.filter((t) => t.completed).length}/${dayTasks.length}
              </span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; margin-top: 6px;">
              ${dayTasks.length === 0 ? `
                <div style="font-size: 0.75rem; color: var(--text-tertiary); text-align: center; padding: 12px 0;">Rest / Prep Day</div>
              ` : dayTasks.map((t) => `
                <div style="display: flex; align-items: flex-start; gap: 6px; padding: 6px 8px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
                  <input type="checkbox" class="planner-task-chk" data-task-id="${t.id}" ${t.completed ? "checked" : ""} style="margin-top: 2px;" />
                  <div style="flex: 1; min-width: 0;">
                    <span style="font-size: 0.8125rem; line-height: 1.3; color: ${t.completed ? "var(--text-tertiary)" : "var(--text-primary)"}; ${t.completed ? "text-decoration: line-through;" : ""}">
                      ${t.title}
                    </span>
                    <div style="font-size: 0.7rem; font-family: var(--font-mono); color: var(--brand-accent); margin-top: 2px;">
                      ${t.skill}
                    </div>
                  </div>
                  <button class="btn btn-ghost btn-sm planner-del-btn" data-task-id="${t.id}" style="padding: 0 4px; font-size: 0.7rem; color: var(--text-tertiary);" title="Delete">✕</button>
                </div>
              `).join("")}
            </div>

            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid var(--border-subtle);">
              <button class="btn btn-ghost btn-sm planner-quick-add-btn" data-day="${day}" style="width: 100%; font-size: 0.75rem; justify-content: center;">
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
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.getAttribute("data-task-id"), 10);
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
