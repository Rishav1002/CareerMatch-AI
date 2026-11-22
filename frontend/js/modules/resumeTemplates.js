/**
 * CareerMatch AI — Resume Template Engine (10 Bespoke Publication-Grade Templates)
 *
 * One source of truth for every resume look:
 *   - gallery thumbnails   (renderResume + CSS scale)
 *   - live A4 preview      (renderResume)
 *   - PDF export           (same HTML + CSS printed through browser vector engine)
 *
 * All 10 templates use dedicated layout renderers and dedicated CSS namespaces (.rt-<id>).
 * Styling lives in /css/resume-templates.css.
 */

import { escapeHtml as esc } from "../formatters.js";

/* ------------------------------------------------------------------ */
/* 1. Catalog & Metadata                                              */
/* ------------------------------------------------------------------ */

export const RESUME_TEMPLATES = [
  {
    id: "editorial_serif",
    cls: "editorial_serif",
    name: "Editorial Serif",
    category: "ATS & Classic",
    tag: "Classic academic & engineering rail · Dates on left",
    accent: "#111827",
    photo: false,
    ats: "Highest (99%)",
    supportsTheme: false,
    supportsPhoto: false,
    swatches: ["#111827"],
    description: "Classic academic and engineering serif layout with left rail for dates and section labels.",
    isDefault: true,
  },
  {
    id: "classic_executive",
    cls: "classic_executive",
    name: "Classic Executive",
    category: "ATS & Classic",
    tag: "Shaded banners · Dotted leaders · Double rules",
    accent: "#1F2937",
    photo: false,
    ats: "High (95%)",
    supportsTheme: false,
    supportsPhoto: false,
    swatches: ["#1F2937"],
    description: "Traditional formal serif layout with centered shaded section banners, decorative florets, and dotted leaders.",
    isDefault: false,
  },
  {
    id: "corporate_accent",
    cls: "corporate_accent",
    name: "Corporate Accent",
    category: "Modern",
    tag: "Double-ruled headers · 4-col skills · Optional photo",
    accent: "#2563A6",
    photo: true,
    ats: "High (96%)",
    supportsTheme: true,
    supportsPhoto: true,
    swatches: ["#2563A6", "#0F766E", "#1E3A8A", "#7C2D12", "#4338CA", "#334155"],
    description: "Structured modern sans-serif with double-ruled accent section headers, 4-column skill grid, and optional top-right photo.",
    isDefault: false,
  },
  {
    id: "clean_minimalist",
    cls: "clean_minimalist",
    name: "Clean Minimalist",
    category: "ATS & Classic",
    tag: "Sans headers & serif body · Diamond bullets",
    accent: "#111827",
    photo: false,
    ats: "Highest (99%)",
    supportsTheme: false,
    supportsPhoto: false,
    swatches: ["#111827"],
    description: "High-craft editorial pairing of crisp sans-serif headings with classic serif body, bold section underlines, and diamond bullets.",
    isDefault: false,
  },
  {
    id: "swiss_modern",
    cls: "swiss_modern",
    name: "Swiss Modern",
    category: "Modern",
    isTwoColumn: true,
    tag: "All-caps display · Hairline split · Skill progress bars",
    accent: "#111827",
    photo: false,
    ats: "Moderate",
    supportsTheme: true,
    supportsPhoto: false,
    swatches: ["#111827", "#1D4ED8", "#0F766E", "#B45309", "#9F1239", "#374151"],
    description: "Architectural geometric sans-serif with oversized stacked all-caps name, vertical hairline column split, short thick accent underlines, and horizontal skill bars.",
    isDefault: false,
  },
  {
    id: "executive_slate",
    cls: "executive_slate",
    name: "Executive Slate",
    category: "Modern",
    tag: "Airy C-suite styling · 3-col expertise · No heavy rules",
    accent: "#4A7BB7",
    photo: false,
    ats: "High (95%)",
    supportsTheme: true,
    supportsPhoto: false,
    swatches: ["#4A7BB7", "#2563EB", "#0D9488", "#4F46E5", "#334155", "#0369A1"],
    description: "Airy, modern C-suite/tech leadership sans-serif with monochrome-accent typography, zero heavy lines, and a 3-column expertise grid.",
    isDefault: false,
  },
  {
    id: "editorial_warmth",
    cls: "editorial_warmth",
    name: "Editorial Warmth",
    category: "Modern",
    tag: "Terracotta serif headers · Delicate hairline dividers",
    accent: "#B5653B",
    photo: false,
    ats: "High (94%)",
    supportsTheme: true,
    supportsPhoto: false,
    swatches: ["#B5653B", "#9A3412", "#1E40AF", "#166534", "#6D28D9", "#374151"],
    description: "Refined warm-accent serif headings paired with clean sans-serif body and delicate hairline separators between roles and proficiencies.",
    isDefault: false,
  },
  {
    id: "timeline_studio",
    cls: "timeline_studio",
    name: "Timeline Studio",
    category: "Two-Column",
    isTwoColumn: true,
    tag: "Continuous vertical timeline rail · Circular nodes · Avatar",
    accent: "#1F2937",
    photo: true,
    ats: "Moderate",
    supportsTheme: true,
    supportsPhoto: true,
    swatches: ["#1F2937", "#0F766E", "#1E3A8A", "#7E22CE", "#9F1239", "#B45309"],
    description: "Editorial 2-column layout with centered avatar, condensed uppercase headings, hollow circles on sidebar headers, and a continuous vertical timeline with circular nodes.",
    isDefault: false,
  },
  {
    id: "emerald_sidebar",
    cls: "emerald_sidebar",
    name: "Emerald Sidebar",
    category: "Two-Column",
    isTwoColumn: true,
    tag: "Full-bleed colored sidebar · White skill bars · Circular avatar",
    accent: "#0D4A3E",
    photo: true,
    ats: "Moderate",
    supportsTheme: true,
    supportsPhoto: true,
    swatches: ["#0D4A3E", "#1E293B", "#581C37", "#1F2937", "#0F4C5C", "#2E1065"],
    description: "High-impact full-bleed colored left sidebar with circular avatar, white serif name, and white skill bars paired with a crisp white serif/sans right main column.",
    isDefault: false,
  },
  {
    id: "ats_compact_pro",
    cls: "ats_compact_pro",
    name: "ATS Compact Pro",
    category: "ATS & Classic",
    tag: "High density recruiter standard · 4-col expertise grid",
    accent: "#111827",
    photo: false,
    ats: "Highest (100%)",
    supportsTheme: false,
    supportsPhoto: false,
    swatches: ["#111827"],
    description: "Maximum-density, recruiter-favorite single-column corporate, legal, and engineering ATS layout with 4-column skill grid.",
    isDefault: false,
  },
];

export const ACCENT_SWATCHES = [
  "#2563A6", "#0F766E", "#1E3A8A", "#7C2D12", "#4338CA", "#334155",
  "#111827", "#1D4ED8", "#B45309", "#9F1239", "#4A7BB7", "#B5653B",
  "#0D4A3E", "#1F2937",
];

export const LEGACY_TEMPLATE_MAP = {
  // 8 backend legacy IDs
  modern_ats: "editorial_serif",
  software_engineer: "corporate_accent",
  data_science: "clean_minimalist",
  graduate_fresher: "swiss_modern",
  minimal_single: "ats_compact_pro",
  professional_two_col: "emerald_sidebar",
  executive_pro: "executive_slate",
  academic_research: "editorial_serif",
  // 12 frontend legacy IDs
  banner: "corporate_accent",
  essential: "corporate_accent",
  polished: "clean_minimalist",
  vivid: "swiss_modern",
  serif: "editorial_serif",
  harmony: "editorial_warmth",
  defined: "classic_executive",
  executive: "emerald_sidebar",
  minimal: "ats_compact_pro",
  compact: "ats_compact_pro",
  timeline: "timeline_studio",
  academic: "editorial_serif",
};

export function getTemplate(id) {
  const resolved = LEGACY_TEMPLATE_MAP[id] || id;
  return RESUME_TEMPLATES.find((t) => t.id === resolved) || RESUME_TEMPLATES[0];
}

/* ------------------------------------------------------------------ */
/* 2. Sample Data for Galleries & Empty States                        */
/* ------------------------------------------------------------------ */

function makeSampleAvatar(bg, fg) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">` +
    `<rect width="120" height="120" fill="${bg}"/>` +
    `<circle cx="60" cy="46" r="21" fill="${fg}"/>` +
    `<path d="M16 120c0-26 20-42 44-42s44 16 44 42z" fill="${fg}"/></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

export const SAMPLE_PHOTO = makeSampleAvatar("#2563A6", "#FFFFFF");

export const SAMPLE_PROFILE = {
  personalInfo: {
    full_name: "Aarav Sharma",
    headline: "Senior Full-Stack & Systems Engineer",
    email: "aarav.sharma@example.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, Karnataka, India",
    address: "Koramangala, Bengaluru",
    linkedin: "https://linkedin.com/in/aarav-sharma",
    github: "https://github.com/aarav-sharma",
    portfolio: "https://aaravsharma.dev",
    dob: "15 Aug 1998",
    nationality: "Indian",
    photo_data_url: SAMPLE_PHOTO,
  },
  summary:
    "Versatile software architect and full-stack engineer with 5+ years of experience designing high-throughput distributed microservices, low-latency APIs, and scalable reactive frontends. Proven track record leading engineering squads, cutting cloud infrastructure costs by 34%, and delivering 99.99% system availability.",
  workExperience: [
    {
      role: "Lead Systems Engineer",
      company: "Razorpay",
      location: "Bengaluru, India",
      start_date: "Mar 2022",
      end_date: "Present",
      overview: "Spearheaded core settlement reconciliation pipelines and distributed event processing architecture.",
      bullets: [
        "Engineered distributed reconciliation engine handling ₹50Cr+ daily transaction volume with zero data discrepancy.",
        "Redesigned event-driven Kafka stream processing, reducing end-to-end settlement latency from 45 minutes to 90 seconds.",
        "Mentored 8 core engineers and instituted strict type-safety, contract testing, and observability standards.",
      ],
    },
    {
      role: "Software Engineer",
      company: "Zomato Labs",
      location: "Gurugram, India",
      start_date: "Aug 2019",
      end_date: "Feb 2022",
      overview: "Built hyper-local merchant dispatch routing and delivery prediction microservices.",
      bullets: [
        "Built geo-partitioned Redis cache clusters servicing 120k requests/min with sub-4ms response times.",
        "Architected real-time ETA prediction service in Go, cutting missed order dispatch windows by 18%.",
      ],
    },
  ],
  education: [
    {
      degree: "B.Tech in Computer Science & Engineering",
      institution: "Indian Institute of Technology Bombay",
      location: "Mumbai, India",
      start_date: "2015",
      end_date: "2019",
      gpa: "8.9 / 10.0 CGPA",
      bullets: [
        "Dean's Honor List for 4 consecutive semesters",
        "Coursework: Distributed Systems, Advanced Algorithms, Database Internals",
      ],
    },
  ],
  projects: [
    {
      name: "CareerMatch AI",
      tech_stack: "FastAPI, PostgreSQL, ES Modules, Python",
      dates: "2024",
      github_link: "https://github.com/aarav-sharma/careermatch",
      live_link: "https://careermatch.ai",
      bullets: [
        "Career intelligence platform providing automated skill-gap analysis, adaptive roadmaps, and resume generation.",
        "Engineered zero-build client-side A4 layout renderer generating crisp vector PDFs with 100% style fidelity.",
      ],
    },
    {
      name: "FluxKV: Distributed In-Memory Store",
      tech_stack: "Go, Raft Consensus, Docker",
      dates: "2023",
      github_link: "https://github.com/aarav-sharma/fluxkv",
      live_link: "",
      bullets: [
        "Implemented Raft distributed consensus algorithm with automated leader election, snapshotting, and log compaction.",
      ],
    },
  ],
  technicalSkills: [
    { name: "Python / FastAPI", level: 95, category: "Languages & Frameworks" },
    { name: "Go / Microservices", level: 90, category: "Languages & Frameworks" },
    { name: "TypeScript / React", level: 88, category: "Languages & Frameworks" },
    { name: "PostgreSQL & SQLite", level: 92, category: "Databases & Storage" },
    { name: "Redis & Apache Kafka", level: 88, category: "Databases & Storage" },
    { name: "Docker & Kubernetes", level: 85, category: "Cloud & Infrastructure" },
    { name: "AWS & Terraform", level: 82, category: "Cloud & Infrastructure" },
    { name: "CI/CD & Observability", level: 90, category: "Practices & Tooling" },
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services",
      date: "2023",
      link: "",
    },
    {
      name: "Certified Kubernetes Administrator (CKA)",
      issuer: "Cloud Native Computing Foundation",
      date: "2022",
      link: "",
    },
  ],
  achievements: [
    "Smart India Hackathon 1st Place (Grand Finale Winner out of 1,800 teams)",
    "Razorpay Tech Star Award for zero-loss payment failover architecture (2023)",
  ],
  languages: [
    { name: "English", proficiency: "Native / Fluent", level: 98 },
    { name: "Hindi", proficiency: "Fluent", level: 95 },
    { name: "German", proficiency: "Professional Working", level: 70 },
  ],
  references: [
    {
      name: "Dr. Vikram Sethi",
      role_company: "VP Engineering, Razorpay",
      email: "v.sethi@razorpay.com",
      phone: "+91 98000 11223",
    },
  ],
  hobbies: ["Open-Source Tooling", "Marathon Running", "Amateur Astronomy", "Chess"],
};

/* ------------------------------------------------------------------ */
/* 3. Skill & Category Helpers                                        */
/* ------------------------------------------------------------------ */

const SKILL_CAT_PATTERNS = [
  ["Languages", /^(python|java|javascript|typescript|c\+\+|c#|c|go|golang|rust|kotlin|swift|php|ruby|r|scala|sql|bash|html|css|matlab|dart)$/i],
  ["Backend & Infra", /(react|angular|vue|next|node|express|django|flask|fastapi|spring|microservices|graphql|rest|api|kafka|grpc)/i],
  ["Databases & Storage", /(sql|postgres|mysql|redis|mongo|oracle|sqlite|cassandra|dynamo|elastic|snowflake|bigquery)/i],
  ["Cloud & DevOps", /(aws|azure|gcp|docker|kubernetes|k8s|jenkins|terraform|linux|ci\/cd|github actions|airflow|nginx|git)/i],
  ["AI & Data Science", /(pytorch|tensorflow|scikit|pandas|numpy|keras|huggingface|llm|rag|deep learning|data|nlp)/i],
];

export function categorizeSkillSingle(name) {
  const clean = String(name || "").trim();
  for (const [cat, regex] of SKILL_CAT_PATTERNS) {
    if (regex.test(clean)) return cat;
  }
  return "Practices & Tooling";
}

/* ------------------------------------------------------------------ */
/* 4. Unified View-Model Normalizer                                   */
/* ------------------------------------------------------------------ */

const txt = (v) => (v == null ? "" : String(v)).trim();
const arr = (v) => (Array.isArray(v) ? v : []);

function toBulletsList(val) {
  if (Array.isArray(val)) return val.map(txt).filter(Boolean);
  return txt(val)
    .split(/\r?\n|\s*[•●▪◦♦❖]\s+/)
    .map((s) => s.replace(/^[\s\-*•·♦❖]+/, "").trim())
    .filter(Boolean);
}

const stripUrl = (u) => txt(u).replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
const fullUrl = (u) => (/^https?:\/\//i.test(txt(u)) ? txt(u) : `https://${txt(u)}`);

export function buildViewModel(profile, { sample = false } = {}) {
  const src = sample ? SAMPLE_PROFILE : profile || {};
  const p = src.personalInfo || src.contact || src.basics || {};
  const addn = src.additionalInfo || {};

  // Work experience
  const rawExp = arr(src.workExperience || src.experience);
  const exp = rawExp.map((e) => {
    const role = txt(e.role || e.designation || e.title);
    const company = txt(e.company || e.organization);
    const loc = txt(e.location || e.city || e.loc);
    const start = txt(e.start_date || e.startDate);
    const end = txt(e.end_date || e.endDate);
    const dur = txt(e.duration || (start ? `${start} – ${end || "Present"}` : end));
    const overview = txt(e.overview || e.summary);
    const rawExpBullets = toBulletsList(e.bullets).length
      ? toBulletsList(e.bullets)
      : (toBulletsList(e.highlights).length
          ? toBulletsList(e.highlights)
          : toBulletsList(e.description));
    const seenExpB = new Set();
    const bullets = rawExpBullets.filter((b) => {
      const k = b.toLowerCase().replace(/\s+/g, " ").trim();
      if (!k || seenExpB.has(k)) return false;
      seenExpB.add(k);
      return true;
    });
    return { role, company, loc, date: dur, start, end, overview, bullets };
  }).filter((e) => e.role || e.company || e.bullets.length);

  // Education
  const rawEdu = arr(src.education);
  const edu = rawEdu.map((e) => {
    const degree = txt(e.degree || e.course);
    const inst = txt(e.institution || e.college || e.university);
    const loc = txt(e.location || e.city);
    const start = txt(e.start_date || e.startDate);
    const end = txt(e.end_date || e.endDate);
    const year = txt(e.year || (start ? `${start} – ${end || "Present"}` : end));
    const gpa = txt(e.gpa || e.score || e.cgpa);
    const courses = txt(e.coursework || e.courses);
    const bullets = [
      ...toBulletsList(e.bullets),
      ...(courses ? [courses] : []),
    ];
    return { degree, inst, loc, date: year, start, end, gpa, score: gpa, bullets, courses };
  }).filter((e) => e.degree || e.inst);

  // Projects
  const rawProj = arr(src.projects);
  const proj = rawProj.map((pr) => {
    const name = txt(pr.name || pr.title);
    let techArr = [];
    if (Array.isArray(pr.tech_stack)) techArr = pr.tech_stack.map(txt).filter(Boolean);
    else if (Array.isArray(pr.techStack)) techArr = pr.techStack.map(txt).filter(Boolean);
    else if (txt(pr.tech_stack)) techArr = txt(pr.tech_stack).split(/[,·|•]/).map(txt).filter(Boolean);

    const rawProjBullets = toBulletsList(pr.bullets).length
      ? toBulletsList(pr.bullets)
      : toBulletsList(pr.description);
    const seenProjB = new Set();
    const bullets = rawProjBullets.filter((b) => {
      const k = b.toLowerCase().replace(/\s+/g, " ").trim();
      if (!k || seenProjB.has(k)) return false;
      seenProjB.add(k);
      return true;
    });
    const gh = txt(pr.github_link || pr.github);
    const live = txt(pr.live_link || pr.link);
    const dates = txt(pr.dates || pr.year || pr.date);
    return { name, title: name, tech: techArr, tech_stack: techArr.join(" · "), dates, gh, live, bullets };
  }).filter((pr) => pr.name || pr.bullets.length);

  // Technical Skills (accepts string arrays or objects { name, level, category })
  const rawSkills = arr(src.technicalSkills || src.skills?.technical || src.skills);
  const skills = rawSkills.map((s) => {
    if (typeof s === "object" && s !== null) {
      const name = txt(s.name || s.title);
      const level = Math.min(100, Math.max(0, Number(s.level) || 85));
      const category = txt(s.category) || categorizeSkillSingle(name);
      return { name, level, category };
    }
    const cleanName = txt(s);
    return {
      name: cleanName,
      level: 85,
      category: categorizeSkillSingle(cleanName),
    };
  }).filter((s) => s.name);

  // Group skills by category for templates that render categorized rails
  const skillCategories = new Map();
  skills.forEach((sk) => {
    const cat = sk.category || "Practices & Tooling";
    if (!skillCategories.has(cat)) skillCategories.set(cat, []);
    skillCategories.get(cat).push(sk);
  });
  const categorizedSkills = [...skillCategories.entries()].map(([category, items]) => ({
    category,
    items,
  }));

  // Certifications
  const rawCerts = arr(src.certifications);
  const certs = rawCerts.map((c) => {
    if (typeof c === "object" && c !== null) {
      return {
        name: txt(c.name || c.title),
        issuer: txt(c.issuer || c.organization),
        date: txt(c.date || c.issue_date),
        link: txt(c.link || c.credential_link),
      };
    }
    return { name: txt(c), issuer: "", date: "", link: "" };
  }).filter((c) => c.name);

  // Achievements
  const rawAch = arr(src.achievements || src.awards);
  const ach = rawAch.map((a) => {
    if (typeof a === "object" && a !== null) {
      return {
        title: txt(a.title || a.name),
        desc: txt(a.description || a.desc),
        date: txt(a.date || a.year),
      };
    }
    return { title: txt(a), desc: "", date: "" };
  }).filter((a) => a.title || a.desc);

  // Languages (accepts string arrays or objects { name, proficiency, level })
  const rawLangs = arr(src.languages || addn.languages_known);
  const langs = rawLangs.map((l) => {
    if (typeof l === "object" && l !== null) {
      return {
        name: txt(l.name || l.language),
        proficiency: txt(l.proficiency || "Fluent"),
        level: Math.min(100, Math.max(0, Number(l.level) || 90)),
      };
    }
    return {
      name: txt(l),
      proficiency: "Fluent",
      level: 90,
    };
  }).filter((l) => l.name);

  // References
  const rawRefs = arr(src.references);
  const refs = rawRefs.map((r) => ({
    name: txt(r.name),
    role_company: txt(r.role_company || r.role || r.company),
    email: txt(r.email),
    phone: txt(r.phone),
  })).filter((r) => r.name);

  // Hobbies
  const hobbies = [
    ...arr(src.hobbies).map(txt).filter(Boolean),
    ...arr(addn.extracurriculars).map(txt).filter(Boolean),
  ];

  // Personal Info Contacts
  const fullName = txt(p.full_name || p.name) || (sample ? "Aarav Sharma" : "Your Name");
  const headline = txt(p.headline || p.title) || (exp[0]?.role || "Software Engineer");
  const email = txt(p.email);
  const phone = txt(p.phone);
  const location = txt(p.location || p.city || p.address);
  const address = txt(p.address || location);
  const dob = txt(p.dob || p.date_of_birth);
  const nationality = txt(p.nationality);
  const linkedin = txt(p.linkedin);
  const github = txt(p.github);
  const portfolio = txt(p.portfolio);
  const photo = sample ? SAMPLE_PHOTO : txt(p.photo_data_url || p.photo);

  const initials = fullName
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "•";

  return {
    fullName,
    headline,
    email,
    phone,
    location,
    address,
    dob,
    nationality,
    linkedin,
    github,
    portfolio,
    photo,
    initials,
    summary: txt(src.summary || src.professionalSummary || src.careerObjective),
    exp,
    edu,
    proj,
    skills,
    categorizedSkills,
    certs,
    ach,
    langs,
    refs,
    hobbies,
  };
}

/* ------------------------------------------------------------------ */
/* 5. Shared Render Snippets                                          */
/* ------------------------------------------------------------------ */

const link = (href, label, cls = "") =>
  `<a href="${esc(fullUrl(href))}" target="_blank" rel="noopener" class="${cls}">${esc(label)}</a>`;

function renderLinkItem(href, label) {
  if (!href) return "";
  return `<span class="rt-link-item">${link(href, label || stripUrl(href))}</span>`;
}

/* ------------------------------------------------------------------ */
/* 6. The 10 Bespoke Layout Renderers                                 */
/* ------------------------------------------------------------------ */

const LAYOUTS = {
  /* ----------------------------------------------------------------
     1. EDITORIAL SERIF — Asymmetric date rail, Lora serif throughout
     ---------------------------------------------------------------- */
  editorial_serif: (vm) => {
    // Centered header with contact stack
    const contactParts1 = [vm.location, vm.phone, vm.email].filter(Boolean);
    const contactParts2 = [
      vm.linkedin && link(vm.linkedin, stripUrl(vm.linkedin)),
      vm.github && link(vm.github, stripUrl(vm.github)),
      vm.portfolio && link(vm.portfolio, stripUrl(vm.portfolio)),
    ].filter(Boolean);

    const hasMeta = Boolean(vm.dob || vm.nationality || (vm.address && vm.address !== vm.location));

    return `
      <header class="rt-ed-header">
        <h1 class="rt-ed-name">${esc(vm.fullName)}</h1>
        ${vm.headline ? `<div class="rt-ed-role">${esc(vm.headline)}</div>` : ""}
        <div class="rt-ed-contact-block">
          ${contactParts1.length ? `<div>${contactParts1.map(esc).join(" • ")}</div>` : ""}
          ${contactParts2.length ? `<div>${contactParts2.join(" • ")}</div>` : ""}
        </div>
        ${hasMeta ? `
          <div class="rt-ed-meta-strip">
            ${vm.address && vm.address !== vm.location ? `<span>Address: ${esc(vm.address)}</span>` : ""}
            ${vm.dob ? `<span>Date of Birth: ${esc(vm.dob)}</span>` : ""}
            ${vm.nationality ? `<span>Nationality: ${esc(vm.nationality)}</span>` : ""}
          </div>
        ` : ""}
      </header>

      ${vm.summary ? `
        <div class="rt-ed-sec-heading">PROFILE</div>
        <div class="rt-ed-row">
          <div class="rt-ed-rail"></div>
          <div class="rt-ed-content"><p class="rt-ed-p">${esc(vm.summary)}</p></div>
        </div>
      ` : ""}

      ${vm.exp.length ? `
        <div class="rt-ed-sec-heading">EXPERIENCE</div>
        ${vm.exp.map((e) => `
          <div class="rt-ed-row rt-ed-item">
            <div class="rt-ed-rail"><span class="rt-ed-date">${esc(e.date)}</span></div>
            <div class="rt-ed-content">
              <div class="rt-ed-entry-head">
                <span class="rt-ed-title">${esc(e.role)}${e.company ? ` — ${esc(e.company)}` : ""}</span>
                ${e.loc ? `<span class="rt-ed-loc">${esc(e.loc)}</span>` : ""}
              </div>
              ${e.overview ? `<p class="rt-ed-overview">${esc(e.overview)}</p>` : ""}
              ${e.bullets.length ? `<ul class="rt-ed-ul">${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
            </div>
          </div>
        `).join("")}
      ` : ""}

      ${vm.edu.length ? `
        <div class="rt-ed-sec-heading">EDUCATION</div>
        ${vm.edu.map((ed) => `
          <div class="rt-ed-row rt-ed-item">
            <div class="rt-ed-rail"><span class="rt-ed-date">${esc(ed.date)}</span></div>
            <div class="rt-ed-content">
              <div class="rt-ed-entry-head">
                <span class="rt-ed-title">${esc(ed.degree)}${ed.inst ? ` — ${esc(ed.inst)}` : ""}</span>
                ${ed.score ? `<span class="rt-ed-score">${esc(ed.score)}</span>` : ""}
              </div>
              ${ed.loc ? `<div class="rt-ed-loc">${esc(ed.loc)}</div>` : ""}
              ${ed.bullets.length ? `<ul class="rt-ed-ul">${ed.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
            </div>
          </div>
        `).join("")}
      ` : ""}

      ${vm.proj.length ? `
        <div class="rt-ed-sec-heading">PROJECTS</div>
        ${vm.proj.map((pr) => `
          <div class="rt-ed-row rt-ed-item">
            <div class="rt-ed-rail">
              <span class="rt-ed-date">${esc(pr.dates || "")}</span>
              ${pr.gh ? `<div>${link(pr.gh, "GitHub")}</div>` : ""}
              ${pr.live ? `<div>${link(pr.live, "Live Link")}</div>` : ""}
            </div>
            <div class="rt-ed-content">
              <div class="rt-ed-entry-head">
                <span class="rt-ed-title">${esc(pr.name)}</span>
                ${pr.tech_stack ? `<span class="rt-ed-tech">${esc(pr.tech_stack)}</span>` : ""}
              </div>
              ${pr.bullets.length ? `<ul class="rt-ed-ul">${pr.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
            </div>
          </div>
        `).join("")}
      ` : ""}

      ${vm.categorizedSkills.length ? `
        <div class="rt-ed-sec-heading">SKILLS &amp; PROFICIENCIES</div>
        ${vm.categorizedSkills.map((cat) => `
          <div class="rt-ed-row rt-ed-skill-row">
            <div class="rt-ed-rail"><span class="rt-ed-cat">${esc(cat.category.toUpperCase())}:</span></div>
            <div class="rt-ed-content">
              <span class="rt-ed-skills-list">${cat.items.map((i) => esc(i.name)).join(", ")}</span>
            </div>
          </div>
        `).join("")}
      ` : ""}

      ${vm.langs.length ? `
        <div class="rt-ed-sec-heading">LANGUAGES</div>
        <div class="rt-ed-row">
          <div class="rt-ed-rail"><span class="rt-ed-cat">LANGUAGES:</span></div>
          <div class="rt-ed-content rt-ed-lang-grid">
            ${vm.langs.map((l) => `<div class="rt-ed-lang-item"><b>${esc(l.name)}</b> <span class="rt-ed-muted">(${esc(l.proficiency)})</span></div>`).join("")}
          </div>
        </div>
      ` : ""}

      ${vm.certs.length ? `
        <div class="rt-ed-sec-heading">CERTIFICATIONS</div>
        <div class="rt-ed-row">
          <div class="rt-ed-rail"><span class="rt-ed-cat">CREDENTIALS:</span></div>
          <div class="rt-ed-content">
            <ul class="rt-ed-ul">${vm.certs.map((c) => `<li><b>${esc(c.name)}</b>${c.issuer ? ` — ${esc(c.issuer)}` : ""}${c.date ? ` (${esc(c.date)})` : ""}</li>`).join("")}</ul>
          </div>
        </div>
      ` : ""}
    `;
  },

  /* ----------------------------------------------------------------
     2. CLASSIC EXECUTIVE — Shaded banners, dotted leader lines, florets
     ---------------------------------------------------------------- */
  classic_executive: (vm) => {
    return `
      <header class="rt-ce-header">
        <h1 class="rt-ce-name">${esc(vm.fullName)}</h1>
        ${vm.headline ? `<div class="rt-ce-role">${esc(vm.headline)}</div>` : ""}
        ${vm.address || vm.location ? `<div class="rt-ce-address">${esc(vm.address || vm.location)}</div>` : ""}
        <div class="rt-ce-contact-row">
          <span class="rt-ce-contact-left">${vm.phone ? `Phone: <b>${esc(vm.phone)}</b>` : ""}</span>
          <span class="rt-ce-contact-right">${vm.email ? `Email: <b>${esc(vm.email)}</b>` : ""}</span>
        </div>
        <div class="rt-ce-double-rule"></div>
      </header>

      ${vm.summary ? `
        <div class="rt-ce-banner"><span>PROFILE</span></div>
        <p class="rt-ce-summary">${esc(vm.summary)}</p>
        <div class="rt-ce-double-rule mb-3"></div>
      ` : ""}

      ${vm.exp.length ? `
        <div class="rt-ce-banner"><span>EXPERIENCE</span></div>
        ${vm.exp.map((e) => `
          <div class="rt-ce-item">
            <div class="rt-ce-head-row">
              <span class="rt-ce-glyph">❖</span>
              <span class="rt-ce-role-title"><b>${esc(e.role)}</b>${e.company ? ` — ${esc(e.company)}` : ""}</span>
              <span class="rt-ce-dotted-leader"></span>
              <span class="rt-ce-date">${esc(e.date)}</span>
            </div>
            ${e.loc ? `<div class="rt-ce-loc">${esc(e.loc)}</div>` : ""}
            ${e.overview ? `<p class="rt-ce-overview">${esc(e.overview)}</p>` : ""}
            ${e.bullets.length ? `<ul class="rt-ce-ul">${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
          </div>
        `).join("")}
      ` : ""}

      ${vm.edu.length ? `
        <div class="rt-ce-banner"><span>EDUCATION</span></div>
        ${vm.edu.map((ed) => `
          <div class="rt-ce-item">
            <div class="rt-ce-head-row">
              <span class="rt-ce-glyph">❖</span>
              <span class="rt-ce-role-title"><b>${esc(ed.degree)}</b>${ed.inst ? ` — ${esc(ed.inst)}` : ""}</span>
              <span class="rt-ce-dotted-leader"></span>
              <span class="rt-ce-date">${esc(ed.date)}</span>
            </div>
            ${ed.gpa || ed.loc ? `<div class="rt-ce-loc">${[ed.loc, ed.gpa && `GPA: ${ed.gpa}`].filter(Boolean).map(esc).join(" · ")}</div>` : ""}
            ${ed.bullets.length ? `<ul class="rt-ce-ul">${ed.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
          </div>
        `).join("")}
      ` : ""}

      ${vm.proj.length ? `
        <div class="rt-ce-banner"><span>PROJECTS</span></div>
        ${vm.proj.map((pr) => `
          <div class="rt-ce-item">
            <div class="rt-ce-head-row">
              <span class="rt-ce-glyph">❖</span>
              <span class="rt-ce-role-title"><b>${esc(pr.name)}</b>${pr.tech_stack ? ` (${esc(pr.tech_stack)})` : ""}</span>
              <span class="rt-ce-dotted-leader"></span>
              <span class="rt-ce-date">${esc(pr.dates || "")}</span>
            </div>
            ${pr.bullets.length ? `<ul class="rt-ce-ul">${pr.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
          </div>
        `).join("")}
      ` : ""}

      ${vm.skills.length ? `
        <div class="rt-ce-banner"><span>SKILLS &amp; EXPERTISE</span></div>
        <div class="rt-ce-skills-grid">
          ${vm.skills.map((s) => `<div class="rt-ce-skill-item">• ${esc(s.name)}</div>`).join("")}
        </div>
      ` : ""}

      ${vm.certs.length ? `
        <div class="rt-ce-banner"><span>CERTIFICATIONS</span></div>
        <ul class="rt-ce-ul">${vm.certs.map((c) => `<li><b>${esc(c.name)}</b>${c.issuer ? ` — ${esc(c.issuer)}` : ""}${c.date ? ` (${esc(c.date)})` : ""}</li>`).join("")}</ul>
      ` : ""}
    `;
  },

  /* ----------------------------------------------------------------
     3. CORPORATE ACCENT — Double accent rules, 4-col skills, square photo
     ---------------------------------------------------------------- */
  corporate_accent: (vm) => {
    const contactLine = [
      vm.location,
      vm.phone,
      vm.email,
      vm.linkedin && link(vm.linkedin, "LinkedIn"),
      vm.github && link(vm.github, "GitHub"),
    ].filter(Boolean).join(" | ");

    return `
      <header class="rt-ca-header">
        <div class="rt-ca-left">
          <h1 class="rt-ca-name">${esc(vm.fullName.toUpperCase())}</h1>
          ${vm.headline ? `<div class="rt-ca-role">${esc(vm.headline.toUpperCase())}</div>` : ""}
          <div class="rt-ca-contact">${contactLine}</div>
        </div>
        ${vm.photo ? `
          <div class="rt-ca-photo-wrap">
            <img class="rt-ca-photo" src="${esc(vm.photo)}" alt="" />
          </div>
        ` : ""}
      </header>

      ${vm.summary ? `
        <div class="rt-ca-sec-heading"><span>PROFESSIONAL SUMMARY</span></div>
        <p class="rt-ca-p">${esc(vm.summary)}</p>
      ` : ""}

      ${vm.exp.length ? `
        <div class="rt-ca-sec-heading"><span>WORK EXPERIENCE</span></div>
        ${vm.exp.map((e) => `
          <div class="rt-ca-item">
            <div class="rt-ca-head-row">
              <span class="rt-ca-title"><b>${esc(e.role)}</b>${e.company ? `, ${esc(e.company)}` : ""}</span>
              <span class="rt-ca-date"><b>${esc(e.date)}</b></span>
            </div>
            ${e.loc ? `<div class="rt-ca-sub">${esc(e.loc)}</div>` : ""}
            ${e.bullets.length ? `<ul class="rt-ca-ul">${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
          </div>
        `).join("")}
      ` : ""}

      ${vm.edu.length ? `
        <div class="rt-ca-sec-heading"><span>EDUCATION</span></div>
        ${vm.edu.map((ed) => `
          <div class="rt-ca-item">
            <div class="rt-ca-head-row">
              <span class="rt-ca-title"><b>${esc(ed.degree)}</b>${ed.inst ? `, ${esc(ed.inst)}` : ""}</span>
              <span class="rt-ca-date"><b>${esc(ed.date)}</b></span>
            </div>
            ${ed.gpa || ed.loc ? `<div class="rt-ca-sub">${[ed.loc, ed.gpa && `GPA: ${ed.gpa}`].filter(Boolean).map(esc).join(" · ")}</div>` : ""}
            ${ed.bullets.length ? `<ul class="rt-ca-ul">${ed.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
          </div>
        `).join("")}
      ` : ""}

      ${vm.proj.length ? `
        <div class="rt-ca-sec-heading"><span>PROJECTS</span></div>
        ${vm.proj.map((pr) => `
          <div class="rt-ca-item">
            <div class="rt-ca-head-row">
              <span class="rt-ca-title"><b>${esc(pr.name)}</b>${pr.tech_stack ? ` — ${esc(pr.tech_stack)}` : ""}</span>
              <span class="rt-ca-date">${esc(pr.dates || "")}</span>
            </div>
            ${pr.bullets.length ? `<ul class="rt-ca-ul">${pr.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
          </div>
        `).join("")}
      ` : ""}

      ${vm.skills.length ? `
        <div class="rt-ca-sec-heading"><span>TECHNICAL SKILLS</span></div>
        <div class="rt-ca-skills-grid">
          ${vm.skills.map((s) => `<div class="rt-ca-skill-col">• ${esc(s.name)}</div>`).join("")}
        </div>
      ` : ""}

      ${(vm.langs.length || vm.certs.length || vm.ach.length) ? `
        <div class="rt-ca-sec-heading"><span>ADDITIONAL INFORMATION</span></div>
        <ul class="rt-ca-ul">
          ${vm.langs.length ? `<li><b>Languages:</b> ${vm.langs.map((l) => `${esc(l.name)} (${esc(l.proficiency)})`).join(", ")}</li>` : ""}
          ${vm.certs.length ? `<li><b>Certifications:</b> ${vm.certs.map((c) => esc(c.name)).join(" • ")}</li>` : ""}
          ${vm.ach.length ? `<li><b>Honors &amp; Awards:</b> ${vm.ach.map((a) => esc(typeof a === "object" ? a.title : a)).join(" • ")}</li>` : ""}
        </ul>
      ` : ""}
    `;
  },

  /* ----------------------------------------------------------------
     4. CLEAN MINIMALIST — Sans headers, serif body, 2px underline, diamond bullets
     ---------------------------------------------------------------- */
  clean_minimalist: (vm) => {
    return `
      <header class="rt-cm-header">
        <div class="rt-cm-title-block">
          <h1 class="rt-cm-name">${esc(vm.fullName)}</h1>
          ${vm.headline ? `<div class="rt-cm-role">${esc(vm.headline)}</div>` : ""}
        </div>
        <div class="rt-cm-contact-stack">
          <div>${[vm.location, vm.phone].filter(Boolean).map(esc).join(" • ")}</div>
          <div>${[vm.email, vm.linkedin && link(vm.linkedin, "LinkedIn")].filter(Boolean).join(" • ")}</div>
        </div>
      </header>

      ${vm.summary ? `
        <section class="rt-cm-sec">
          <h2 class="rt-cm-h">Professional Summary</h2>
          <p class="rt-cm-p">${esc(vm.summary)}</p>
        </section>
      ` : ""}

      ${vm.categorizedSkills.length ? `
        <section class="rt-cm-sec">
          <h2 class="rt-cm-h">Technical Proficiencies</h2>
          <div class="rt-cm-prof-grid">
            ${vm.categorizedSkills.map((c) => `
              <div class="rt-cm-prof-label"><b>${esc(c.category)}</b></div>
              <div class="rt-cm-prof-val">${c.items.map((i) => esc(i.name)).join(", ")}</div>
            `).join("")}
          </div>
        </section>
      ` : ""}

      ${vm.exp.length ? `
        <section class="rt-cm-sec">
          <h2 class="rt-cm-h">Professional Experience</h2>
          ${vm.exp.map((e) => `
            <div class="rt-cm-item">
              <div class="rt-cm-entry-head">
                <span class="rt-cm-company"><b>${esc(e.company || e.role)}</b>${e.loc ? `, ${esc(e.loc)}` : ""}</span>
                <span class="rt-cm-date">${esc(e.date)}</span>
              </div>
              <div class="rt-cm-role-sub"><b>${esc(e.role)}</b></div>
              ${e.overview ? `<p class="rt-cm-overview">${esc(e.overview)}</p>` : ""}
              ${e.bullets.length ? `<ul class="rt-cm-diamond-ul">${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
            </div>
          `).join("")}
        </section>
      ` : ""}

      ${vm.edu.length ? `
        <section class="rt-cm-sec">
          <h2 class="rt-cm-h">Education</h2>
          ${vm.edu.map((ed) => `
            <div class="rt-cm-item">
              <div class="rt-cm-entry-head">
                <span class="rt-cm-company"><b>${esc(ed.inst)}</b>${ed.loc ? `, ${esc(ed.loc)}` : ""}</span>
                <span class="rt-cm-date">${esc(ed.date)}</span>
              </div>
              <div class="rt-cm-role-sub">${esc(ed.degree)}${ed.gpa ? ` — ${esc(ed.gpa)}` : ""}</div>
              ${ed.bullets.length ? `<ul class="rt-cm-diamond-ul">${ed.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
            </div>
          `).join("")}
        </section>
      ` : ""}

      ${vm.proj.length ? `
        <section class="rt-cm-sec">
          <h2 class="rt-cm-h">Key Projects</h2>
          ${vm.proj.map((pr) => `
            <div class="rt-cm-item">
              <div class="rt-cm-entry-head">
                <span class="rt-cm-company"><b>${esc(pr.name)}</b>${pr.tech_stack ? ` — <i>${esc(pr.tech_stack)}</i>` : ""}</span>
                <span class="rt-cm-date">${esc(pr.dates || "")}</span>
              </div>
              ${pr.bullets.length ? `<ul class="rt-cm-diamond-ul">${pr.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
            </div>
          `).join("")}
        </section>
      ` : ""}

      <footer class="rt-cm-footer">1</footer>
    `;
  },

  /* ----------------------------------------------------------------
     5. SWISS MODERN — Oversized all-caps name, 31%/69% hairline split, skill progress bars
     ---------------------------------------------------------------- */
  swiss_modern: (vm) => {
    return `
      <header class="rt-sm-header">
        <h1 class="rt-sm-name">${esc(vm.fullName.toUpperCase())}</h1>
        ${vm.headline ? `<div class="rt-sm-role">${esc(vm.headline.toUpperCase())}</div>` : ""}
      </header>

      <div class="rt-sm-layout">
        <!-- Left Sidebar: 31% -->
        <aside class="rt-sm-sidebar">
          <section class="rt-sm-sec">
            <h2 class="rt-sm-h">INFO</h2>
            <div class="rt-sm-info-item">
              <label>ADDRESS</label>
              <span>${esc(vm.address || vm.location || "—")}</span>
            </div>
            <div class="rt-sm-info-item">
              <label>PHONE</label>
              <span>${esc(vm.phone || "—")}</span>
            </div>
            <div class="rt-sm-info-item">
              <label>EMAIL</label>
              <span>${esc(vm.email || "—")}</span>
            </div>
            ${vm.linkedin ? `
              <div class="rt-sm-info-item">
                <label>LINKEDIN</label>
                <span>${link(vm.linkedin, stripUrl(vm.linkedin))}</span>
              </div>
            ` : ""}
          </section>

          ${vm.skills.length ? `
            <section class="rt-sm-sec">
              <h2 class="rt-sm-h">SKILLS</h2>
              <div class="rt-sm-bars-list">
                ${vm.skills.map((s) => `
                  <div class="rt-sm-bar-item">
                    <div class="rt-sm-bar-label">${esc(s.name)}</div>
                    <div class="rt-sm-bar-track">
                      <div class="rt-sm-bar-fill" style="width: ${s.level}%;"></div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}

          ${vm.langs.length ? `
            <section class="rt-sm-sec">
              <h2 class="rt-sm-h">LANGUAGES</h2>
              <div class="rt-sm-bars-list">
                ${vm.langs.map((l) => `
                  <div class="rt-sm-bar-item">
                    <div class="rt-sm-bar-label">${esc(l.name)} <small class="text-tertiary">(${esc(l.proficiency)})</small></div>
                    <div class="rt-sm-bar-track">
                      <div class="rt-sm-bar-fill" style="width: ${l.level}%;"></div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}
        </aside>

        <!-- Right Main Column: 69% -->
        <main class="rt-sm-main">
          ${vm.summary ? `
            <section class="rt-sm-sec rt-sm-profile">
              <h2 class="rt-sm-h">PROFILE</h2>
              <p class="rt-sm-p">${esc(vm.summary)}</p>
            </section>
          ` : ""}

          ${vm.exp.length ? `
            <section class="rt-sm-sec">
              <h2 class="rt-sm-h">EMPLOYMENT HISTORY</h2>
              ${vm.exp.map((e) => `
                <div class="rt-sm-item">
                  <div class="rt-sm-entry-head">
                    <span class="rt-sm-item-title"><b>${esc(e.role)}</b>${e.company ? `, ${esc(e.company)}` : ""}</span>
                    ${e.loc ? `<span class="rt-sm-loc">${esc(e.loc)}</span>` : ""}
                  </div>
                  <div class="rt-sm-item-date">${esc(e.date)}</div>
                  ${e.bullets.length ? `<ul class="rt-sm-ul">${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
                </div>
              `).join("")}
            </section>
          ` : ""}

          ${vm.edu.length ? `
            <section class="rt-sm-sec">
              <h2 class="rt-sm-h">EDUCATION</h2>
              ${vm.edu.map((ed) => `
                <div class="rt-sm-item">
                  <div class="rt-sm-entry-head">
                    <span class="rt-sm-item-title"><b>${esc(ed.degree)}</b>${ed.inst ? `, ${esc(ed.inst)}` : ""}</span>
                    ${ed.loc ? `<span class="rt-sm-loc">${esc(ed.loc)}</span>` : ""}
                  </div>
                  <div class="rt-sm-item-date">${esc(ed.date)}${ed.gpa ? ` · ${esc(ed.gpa)}` : ""}</div>
                  ${ed.bullets.length ? `<ul class="rt-sm-ul">${ed.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
                </div>
              `).join("")}
            </section>
          ` : ""}

          ${vm.proj.length ? `
            <section class="rt-sm-sec">
              <h2 class="rt-sm-h">PROJECTS</h2>
              ${vm.proj.map((pr) => `
                <div class="rt-sm-item">
                  <div class="rt-sm-entry-head">
                    <span class="rt-sm-item-title"><b>${esc(pr.name)}</b>${pr.tech_stack ? ` — ${esc(pr.tech_stack)}` : ""}</span>
                  </div>
                  <div class="rt-sm-item-date">${esc(pr.dates || "")}</div>
                  ${pr.bullets.length ? `<ul class="rt-sm-ul">${pr.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
                </div>
              `).join("")}
            </section>
          ` : ""}
        </main>
      </div>
    `;
  },

  /* ----------------------------------------------------------------
     6. EXECUTIVE SLATE — Airy modern C-suite, 3-col expertise, accent colored dots
     ---------------------------------------------------------------- */
  executive_slate: (vm) => {
    return `
      <header class="rt-es-header">
        <div class="rt-es-left">
          <h1 class="rt-es-name">${esc(vm.fullName)}</h1>
          ${vm.headline ? `<div class="rt-es-role">${esc(vm.headline)}</div>` : ""}
        </div>
        <div class="rt-es-contact-stack">
          <div>${[vm.email, vm.phone].filter(Boolean).map(esc).join(" • ")}</div>
          <div>${[vm.location, vm.linkedin && link(vm.linkedin, "LinkedIn")].filter(Boolean).join(" • ")}</div>
        </div>
      </header>

      ${vm.summary ? `
        <div class="rt-es-summary">
          <p class="rt-es-p">${esc(vm.summary)}</p>
        </div>
      ` : ""}

      ${vm.skills.length ? `
        <section class="rt-es-sec">
          <h2 class="rt-es-h">Areas of Expertise</h2>
          <div class="rt-es-skills-3col">
            ${vm.skills.map((s) => `<div class="rt-es-skill-item"><span class="rt-es-dot">●</span> ${esc(s.name)}</div>`).join("")}
          </div>
        </section>
      ` : ""}

      ${vm.exp.length ? `
        <section class="rt-es-sec">
          <h2 class="rt-es-h">Professional Experience</h2>
          ${vm.exp.map((e) => `
            <div class="rt-es-item">
              <div class="rt-es-head-row">
                <span class="rt-es-company">${esc(e.company || "")}${e.loc ? `, ${esc(e.loc)}` : ""}</span>
                <span class="rt-es-date">${esc(e.date)}</span>
              </div>
              <div class="rt-es-role-title">${esc(e.role)}</div>
              ${e.overview ? `<p class="rt-es-overview">${esc(e.overview)}</p>` : ""}
              ${e.bullets.length ? `<ul class="rt-es-ul">${e.bullets.map((b) => `<li><span class="rt-es-dot">●</span><span>${esc(b)}</span></li>`).join("")}</ul>` : ""}
            </div>
          `).join("")}
        </section>
      ` : ""}

      ${vm.edu.length ? `
        <section class="rt-es-sec">
          <h2 class="rt-es-h">Education</h2>
          ${vm.edu.map((ed) => `
            <div class="rt-es-item">
              <div class="rt-es-head-row">
                <span class="rt-es-company">${esc(ed.inst)}${ed.loc ? `, ${esc(ed.loc)}` : ""}</span>
                <span class="rt-es-date">${esc(ed.date)}</span>
              </div>
              <div class="rt-es-role-title">${esc(ed.degree)}${ed.gpa ? ` — ${esc(ed.gpa)}` : ""}</div>
              ${ed.bullets.length ? `<ul class="rt-es-ul">${ed.bullets.map((b) => `<li><span class="rt-es-dot">●</span><span>${esc(b)}</span></li>`).join("")}</ul>` : ""}
            </div>
          `).join("")}
        </section>
      ` : ""}

      <footer class="rt-es-footer">Page 1 | 1</footer>
    `;
  },

  /* ----------------------------------------------------------------
     7. EDITORIAL WARMTH — Warm Terracotta serif headers, hairline separators
     ---------------------------------------------------------------- */
  editorial_warmth: (vm) => {
    return `
      <header class="rt-ew-header">
        <div class="rt-ew-title-block">
          <h1 class="rt-ew-name">${esc(vm.fullName)}</h1>
          ${vm.headline ? `<div class="rt-ew-role">${esc(vm.headline)}</div>` : ""}
        </div>
        <div class="rt-ew-contact-stack">
          <div>${[vm.location, vm.phone].filter(Boolean).map(esc).join(" • ")}</div>
          <div>${[vm.email, vm.linkedin && link(vm.linkedin, "LinkedIn")].filter(Boolean).join(" • ")}</div>
        </div>
      </header>

      ${vm.summary ? `
        <section class="rt-ew-sec">
          <h2 class="rt-ew-h">Professional Summary</h2>
          <p class="rt-ew-p">${esc(vm.summary)}</p>
        </section>
      ` : ""}

      ${vm.exp.length ? `
        <section class="rt-ew-sec">
          <h2 class="rt-ew-h">Professional Experience</h2>
          ${vm.exp.map((e) => `
            <div class="rt-ew-item">
              <div class="rt-ew-head-row">
                <span class="rt-ew-company">${esc(e.company || "")}${e.loc ? `, ${esc(e.loc)}` : ""}</span>
                <span class="rt-ew-date">${esc(e.date)}</span>
              </div>
              <div class="rt-ew-role-title">${esc(e.role)}</div>
              ${e.overview ? `<p class="rt-ew-overview">${esc(e.overview)}</p>` : ""}
              ${e.bullets.length ? `<ul class="rt-ew-ul">${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
            </div>
          `).join("")}
        </section>
      ` : ""}

      ${vm.edu.length ? `
        <section class="rt-ew-sec">
          <h2 class="rt-ew-h">Education</h2>
          ${vm.edu.map((ed) => `
            <div class="rt-ew-item">
              <div class="rt-ew-degree">${esc(ed.degree)}</div>
              <div class="rt-ew-edu-sub">${[ed.inst, ed.loc, ed.date, ed.gpa && `GPA: ${ed.gpa}`].filter(Boolean).map(esc).join(" · ")}</div>
              ${ed.bullets.length ? `<ul class="rt-ew-ul">${ed.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
            </div>
          `).join("")}
        </section>
      ` : ""}

      ${vm.categorizedSkills.length ? `
        <section class="rt-ew-sec">
          <h2 class="rt-ew-h">Technical Proficiencies</h2>
          <div class="rt-ew-skills-list">
            ${vm.categorizedSkills.map((c) => `
              <div class="rt-ew-skill-row">
                <span class="rt-ew-cat-label">${esc(c.category)}:</span>
                <span class="rt-ew-cat-items">${c.items.map((i) => esc(i.name)).join(", ")}</span>
              </div>
            `).join("")}
          </div>
        </section>
      ` : ""}

      <footer class="rt-ew-footer">Page 1 | 1</footer>
    `;
  },

  /* ----------------------------------------------------------------
     8. TIMELINE STUDIO — Continuous vertical timeline rail with hollow circular nodes
     ---------------------------------------------------------------- */
  timeline_studio: (vm) => {
    return `
      <header class="rt-ts-header">
        ${vm.photo ? `
          <div class="rt-ts-avatar-wrap">
            <img class="rt-ts-avatar" src="${esc(vm.photo)}" alt="" />
          </div>
        ` : ""}
        <h1 class="rt-ts-name">${esc(vm.fullName.toUpperCase())}</h1>
        <div class="rt-ts-meta-line">
          ${[vm.headline, vm.location, vm.phone].filter(Boolean).map(esc).join(" | ")}
        </div>
      </header>

      <div class="rt-ts-layout">
        <!-- Left Sidebar: 31% -->
        <aside class="rt-ts-sidebar">
          <section class="rt-ts-side-sec">
            <h2 class="rt-ts-side-h">○ DETAILS ○</h2>
            <div class="rt-ts-contact-list">
              ${vm.address || vm.location ? `<div>${esc(vm.address || vm.location)}</div>` : ""}
              ${vm.phone ? `<div>${esc(vm.phone)}</div>` : ""}
              ${vm.email ? `<div class="rt-ts-underline">${esc(vm.email)}</div>` : ""}
              ${vm.linkedin ? `<div>${link(vm.linkedin, stripUrl(vm.linkedin))}</div>` : ""}
            </div>
          </section>

          ${vm.skills.length ? `
            <section class="rt-ts-side-sec">
              <h2 class="rt-ts-side-h">○ SKILLS ○</h2>
              <div class="rt-ts-bars">
                ${vm.skills.map((s) => `
                  <div class="rt-ts-bar-item">
                    <div class="rt-ts-bar-label">${esc(s.name)}</div>
                    <div class="rt-ts-bar-track">
                      <div class="rt-ts-bar-fill" style="width:${s.level}%;"></div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}

          ${vm.langs.length ? `
            <section class="rt-ts-side-sec">
              <h2 class="rt-ts-side-h">○ LANGUAGES ○</h2>
              <div class="rt-ts-bars">
                ${vm.langs.map((l) => `
                  <div class="rt-ts-bar-item">
                    <div class="rt-ts-bar-label">${esc(l.name)} (${esc(l.proficiency)})</div>
                    <div class="rt-ts-bar-track">
                      <div class="rt-ts-bar-fill" style="width:${l.level}%;"></div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}

          ${vm.hobbies.length ? `
            <section class="rt-ts-side-sec">
              <h2 class="rt-ts-side-h">○ HOBBIES ○</h2>
              <div class="rt-ts-hobbies-list">
                ${vm.hobbies.map(esc).join(" • ")}
              </div>
            </section>
          ` : ""}
        </aside>

        <!-- Right Main Column (Timeline): 69% -->
        <main class="rt-ts-main">
          ${vm.summary ? `
            <section class="rt-ts-sec rt-ts-profile-sec">
              <h2 class="rt-ts-main-h">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2"/></svg>
                <span>PROFILE</span>
              </h2>
              <div class="rt-ts-profile-box">
                <p class="rt-ts-p">${esc(vm.summary)}</p>
              </div>
            </section>
          ` : ""}

          ${vm.exp.length ? `
            <section class="rt-ts-sec">
              <h2 class="rt-ts-main-h">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <span>WORK EXPERIENCE</span>
              </h2>
              <div class="rt-ts-timeline-rail">
                ${vm.exp.map((e) => `
                  <div class="rt-ts-timeline-item">
                    <div class="rt-ts-node"></div>
                    <div class="rt-ts-item-header">
                      <span class="rt-ts-item-title"><b>${esc(e.role)}</b>${e.company ? ` at ${esc(e.company)}` : ""}</span>
                      <span class="rt-ts-item-date">${esc(e.date)}</span>
                    </div>
                    ${e.loc ? `<div class="rt-ts-item-loc">${esc(e.loc)}</div>` : ""}
                    ${e.overview ? `<p class="rt-ts-overview">${esc(e.overview)}</p>` : ""}
                    ${e.bullets.length ? `<ul class="rt-ts-ul">${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}

          ${vm.edu.length ? `
            <section class="rt-ts-sec">
              <h2 class="rt-ts-main-h">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                <span>EDUCATION</span>
              </h2>
              <div class="rt-ts-timeline-rail">
                ${vm.edu.map((ed) => `
                  <div class="rt-ts-timeline-item">
                    <div class="rt-ts-node"></div>
                    <div class="rt-ts-item-header">
                      <span class="rt-ts-item-title"><b>${esc(ed.degree)}</b></span>
                      <span class="rt-ts-item-date">${esc(ed.date)}</span>
                    </div>
                    <div class="rt-ts-item-loc">${[ed.inst, ed.loc, ed.gpa && `GPA: ${ed.gpa}`].filter(Boolean).map(esc).join(" · ")}</div>
                    ${ed.bullets.length ? `<ul class="rt-ts-ul">${ed.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}

          ${vm.proj.length ? `
            <section class="rt-ts-sec">
              <h2 class="rt-ts-main-h">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                <span>PROJECTS</span>
              </h2>
              <div class="rt-ts-timeline-rail">
                ${vm.proj.map((pr) => `
                  <div class="rt-ts-timeline-item">
                    <div class="rt-ts-node"></div>
                    <div class="rt-ts-item-header">
                      <span class="rt-ts-item-title"><b>${esc(pr.name)}</b></span>
                      <span class="rt-ts-item-date">${esc(pr.dates || "")}</span>
                    </div>
                    ${pr.tech_stack ? `<div class="rt-ts-item-loc">${esc(pr.tech_stack)}</div>` : ""}
                    ${pr.bullets.length ? `<ul class="rt-ts-ul">${pr.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}
        </main>
      </div>
    `;
  },

  /* ----------------------------------------------------------------
     9. EMERALD SIDEBAR — High-impact full-bleed colored left sidebar
     ---------------------------------------------------------------- */
  emerald_sidebar: (vm) => {
    return `
      <div class="rt-esb-container">
        <!-- Full-Bleed Left Sidebar: 31% -->
        <aside class="rt-esb-sidebar">
          <div class="rt-esb-avatar-wrap">
            ${vm.photo ? `
              <img class="rt-esb-avatar" src="${esc(vm.photo)}" alt="" />
            ` : `
              <div class="rt-esb-monogram">${esc(vm.initials)}</div>
            `}
          </div>

          <h1 class="rt-esb-name">${esc(vm.fullName)}</h1>
          <div class="rt-esb-divider"></div>
          ${vm.headline ? `<div class="rt-esb-role">${esc(vm.headline.toUpperCase())}</div>` : ""}

          <section class="rt-esb-side-sec">
            <h2 class="rt-esb-side-h">Details</h2>
            <div class="rt-esb-side-contact">
              ${vm.address || vm.location ? `<div class="rt-esb-contact-item"><label>Address</label><span>${esc(vm.address || vm.location)}</span></div>` : ""}
              ${vm.phone ? `<div class="rt-esb-contact-item"><label>Phone</label><span>${esc(vm.phone)}</span></div>` : ""}
              ${vm.email ? `<div class="rt-esb-contact-item"><label>Email</label><span class="rt-esb-underline">${esc(vm.email)}</span></div>` : ""}
              ${vm.linkedin ? `<div class="rt-esb-contact-item"><label>LinkedIn</label><span>${link(vm.linkedin, stripUrl(vm.linkedin))}</span></div>` : ""}
            </div>
          </section>

          ${vm.skills.length ? `
            <section class="rt-esb-side-sec">
              <h2 class="rt-esb-side-h">Skills</h2>
              <div class="rt-esb-skills-list">
                ${vm.skills.map((s) => `
                  <div class="rt-esb-skill-item">
                    <div class="rt-esb-skill-label">${esc(s.name)}</div>
                    <div class="rt-esb-progress-track">
                      <div class="rt-esb-progress-fill" style="width: ${s.level}%;"></div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}

          ${vm.langs.length ? `
            <section class="rt-esb-side-sec">
              <h2 class="rt-esb-side-h">Languages</h2>
              <div class="rt-esb-skills-list">
                ${vm.langs.map((l) => `
                  <div class="rt-esb-skill-item">
                    <div class="rt-esb-skill-label">${esc(l.name)} <small>(${esc(l.proficiency)})</small></div>
                    <div class="rt-esb-progress-track">
                      <div class="rt-esb-progress-fill" style="width: ${l.level}%;"></div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}
        </aside>

        <!-- Right Main Column: 69% -->
        <main class="rt-esb-main">
          ${vm.summary ? `
            <section class="rt-esb-sec">
              <h2 class="rt-esb-main-h">Profile</h2>
              <p class="rt-esb-p">${esc(vm.summary)}</p>
            </section>
          ` : ""}

          ${vm.exp.length ? `
            <section class="rt-esb-sec">
              <h2 class="rt-esb-main-h">Employment History</h2>
              ${vm.exp.map((e) => `
                <div class="rt-esb-item">
                  <div class="rt-esb-item-title"><b>${esc(e.role)}</b>${e.company ? `, ${esc(e.company)}` : ""}${e.loc ? `, ${esc(e.loc)}` : ""}</div>
                  <div class="rt-esb-item-date">${esc(e.date.toUpperCase())}</div>
                  ${e.bullets.length ? `<ul class="rt-esb-ul">${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
                </div>
              `).join("")}
            </section>
          ` : ""}

          ${vm.edu.length ? `
            <section class="rt-esb-sec">
              <h2 class="rt-esb-main-h">Education</h2>
              ${vm.edu.map((ed) => `
                <div class="rt-esb-item">
                  <div class="rt-esb-item-title"><b>${esc(ed.degree)}</b>${ed.inst ? `, ${esc(ed.inst)}` : ""}</div>
                  <div class="rt-esb-item-date">${esc(ed.date.toUpperCase())}${ed.gpa ? ` · ${esc(ed.gpa)}` : ""}</div>
                  ${ed.bullets.length ? `<ul class="rt-esb-ul">${ed.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
                </div>
              `).join("")}
            </section>
          ` : ""}

          ${vm.proj.length ? `
            <section class="rt-esb-sec">
              <h2 class="rt-esb-main-h">Projects</h2>
              ${vm.proj.map((pr) => `
                <div class="rt-esb-item">
                  <div class="rt-esb-item-title"><b>${esc(pr.name)}</b>${pr.tech_stack ? ` — ${esc(pr.tech_stack)}` : ""}</div>
                  <div class="rt-esb-item-date">${esc(pr.dates || "").toUpperCase()}</div>
                  ${pr.bullets.length ? `<ul class="rt-esb-ul">${pr.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
                </div>
              `).join("")}
            </section>
          ` : ""}

          ${vm.refs.length ? `
            <section class="rt-esb-sec">
              <h2 class="rt-esb-main-h">References</h2>
              <div class="rt-esb-refs-grid">
                ${vm.refs.map((r) => `
                  <div class="rt-esb-ref-item">
                    <b>${esc(r.name)}</b>
                    <div>${esc(r.role_company)}</div>
                    ${r.email ? `<div>${esc(r.email)}</div>` : ""}
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}
        </main>
      </div>
    `;
  },

  /* ----------------------------------------------------------------
     10. ATS COMPACT PRO — High density recruiter favorite single-column
     ---------------------------------------------------------------- */
  ats_compact_pro: (vm) => {
    const contactRow = [
      vm.location && `<span>${esc(vm.location)}</span>`,
      vm.email && `<a href="mailto:${esc(vm.email)}" class="rt-ac-link">${esc(vm.email)}</a>`,
      vm.phone && `<span>${esc(vm.phone)}</span>`,
      vm.linkedin && link(vm.linkedin, "LinkedIn", "rt-ac-link"),
      vm.github && link(vm.github, "GitHub", "rt-ac-link"),
    ].filter(Boolean).join(" | ");

    return `
      <header class="rt-ac-header">
        <h1 class="rt-ac-name">${esc(vm.fullName)}</h1>
        <div class="rt-ac-contact">${contactRow}</div>
      </header>

      ${vm.summary ? `
        <section class="rt-ac-sec">
          <h2 class="rt-ac-h">Summary</h2>
          <div class="rt-ac-rule"></div>
          <p class="rt-ac-p">${esc(vm.summary)}</p>
        </section>
      ` : ""}

      ${vm.skills.length ? `
        <section class="rt-ac-sec">
          <h2 class="rt-ac-h">Areas of Expertise</h2>
          <div class="rt-ac-rule"></div>
          <div class="rt-ac-skills-grid">
            ${vm.skills.map((s) => `<div class="rt-ac-skill">• ${esc(s.name)}</div>`).join("")}
          </div>
        </section>
      ` : ""}

      ${vm.exp.length ? `
        <section class="rt-ac-sec">
          <h2 class="rt-ac-h">Experience</h2>
          <div class="rt-ac-rule"></div>
          ${vm.exp.map((e) => `
            <div class="rt-ac-item">
              <div class="rt-ac-row-1"><b>${esc(e.role)}</b>, ${esc(e.company || "")}${e.loc ? `, ${esc(e.loc)}` : ""}</div>
              <div class="rt-ac-row-2">${esc(e.date)}</div>
              ${e.bullets.length ? `<ul class="rt-ac-ul">${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
            </div>
          `).join("")}
        </section>
      ` : ""}

      ${vm.edu.length ? `
        <section class="rt-ac-sec">
          <h2 class="rt-ac-h">Education</h2>
          <div class="rt-ac-rule"></div>
          ${vm.edu.map((ed) => `
            <div class="rt-ac-item">
              <div class="rt-ac-row-1"><b>${esc(ed.inst)}</b>${ed.loc ? `, ${esc(ed.loc)}` : ""}</div>
              <div class="rt-ac-row-2">${esc(ed.degree)}${ed.gpa ? ` — ${esc(ed.gpa)}` : ""}${ed.date ? ` (${esc(ed.date)})` : ""}</div>
            </div>
          `).join("")}
        </section>
      ` : ""}

      ${vm.proj.length ? `
        <section class="rt-ac-sec">
          <h2 class="rt-ac-h">Projects</h2>
          <div class="rt-ac-rule"></div>
          ${vm.proj.map((pr) => `
            <div class="rt-ac-item">
              <div class="rt-ac-row-1"><b>${esc(pr.name)}</b>${pr.tech_stack ? ` — ${esc(pr.tech_stack)}` : ""}</div>
              ${pr.dates ? `<div class="rt-ac-row-2">${esc(pr.dates)}</div>` : ""}
              ${pr.bullets.length ? `<ul class="rt-ac-ul">${pr.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
            </div>
          `).join("")}
        </section>
      ` : ""}

      <footer class="rt-ac-footer">Page 1</footer>
    `;
  },
};

/* ------------------------------------------------------------------ */
/* 7. Public API                                                      */
/* ------------------------------------------------------------------ */

function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return 0;
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function accentStyle(hex) {
  const cleanHex = hex || "#111827";
  const onAccent = luminance(cleanHex) > 0.45 ? "#111827" : "#FFFFFF";
  return `--rt-accent:${cleanHex};--rt-on-accent:${onAccent};--accent:${cleanHex};--on-accent:${onAccent};`;
}

/**
 * Render a full A4 page (794×1123 CSS px) of the given template.
 * @param {object} profile  builder profile
 * @param {string} templateId
 * @param {{accent?:string, sample?:boolean}} opts
 */
export function renderResume(profile, templateId, opts = {}) {
  const tpl = getTemplate(templateId);
  const accent = tpl.supportsTheme ? (opts.accent || tpl.accent) : tpl.accent;
  const vm = buildViewModel(profile, { sample: Boolean(opts.sample) });
  const layoutRenderer = LAYOUTS[tpl.id] || LAYOUTS.editorial_serif;
  return `<div class="rt-page rt-${tpl.cls}" style="${accentStyle(accent)}">${layoutRenderer(vm)}</div>`;
}

export const PAGE_W = 794;
export const PAGE_H = 1123;
