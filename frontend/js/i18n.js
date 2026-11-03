/**
 * CareerMatch AI: i18n Scaffolding (English & Hindi)
 * Clean string dictionary with live language switching
 */

import { store } from "./store.js";

const STRINGS = {
  en: {
    // Brand & Taglines
    brand_name: "CareerMatch AI",
    brand_edition: "Field Guide Edition",
    brand_tagline: "Explainable career-readiness platform for Indian students and engineers.",

    // Navigation Groups
    nav_group_diagnose: "Diagnose",
    nav_group_prepare: "Prepare",
    nav_group_prove: "Prove",
    nav_group_decide: "Decide",

    // Views
    nav_landing: "Home & Guide",
    nav_dashboard: "Overview Dashboard",
    nav_analyzer: "Resume & JD Match",
    nav_report: "Explainable Report",
    nav_ats: "ATS Simulator",
    nav_roadmap: "Adaptive Roadmap",
    nav_planner: "Study Planner",
    nav_interview: "Mock Interview",
    nav_skills: "Skill Assessment",
    nav_github: "GitHub Proof",
    nav_market: "Job Market Intel",
    nav_tracker: "Application Tracker",
    nav_compare: "Role Benchmark",
    nav_readiness: "Placement Index (PRI)",
    nav_profile: "Student Profile",

    // Common Actions
    action_analyze: "Analyze Resume",
    action_analyzing: "Analyzing...",
    action_upload: "Upload Resume (PDF, DOCX, TXT)",
    action_paste: "Or Paste Resume Text",
    action_demo: "Try with Sample Profile (Aarav)",
    action_save_profile: "Save Profile Changes",
    action_start_interview: "Start Mock Interview",
    action_take_assessment: "Take Skill Test",
    action_export_pdf: "Print / Export PDF",
    action_cmd_palette: "Command Palette",
    action_track_job: "Track Application",

    // Status Signals
    status_matched: "Matched Requirement",
    status_partial: "Adjacent / Partial",
    status_missing: "Skill Gap / Missing",
    status_verified: "GitHub Verified",

    // Transparency
    scoring_transparency: "How Scoring Works",
    scoring_formula: "Semantic Match + Mandatory Weights + Evidence Proof",
    privacy_promise: "Privacy Promise",
    dont_save_resume: "Do not save my resume on the server (guest session)",

    // Placeholders & Empty States
    empty_resume_title: "No Resume Analyzed Yet",
    empty_resume_desc: "Upload your resume or click 'Try with Sample Profile' to view an explainable career breakdown.",
    search_placeholder: "Type a command or search views (Ctrl+K)...",
  },
  hi: {
    // Brand & Taglines
    brand_name: "करियरमैच एआई",
    brand_edition: "फील्ड गाइड संस्करण",
    brand_tagline: "भारतीय छात्रों और शुरुआती करियर इंजीनियरों के लिए पारदर्शी करियर-तैयारी मंच।",

    // Navigation Groups
    nav_group_diagnose: "निदान (Diagnose)",
    nav_group_prepare: "तैयारी (Prepare)",
    nav_group_prove: "प्रमाण (Prove)",
    nav_group_decide: "निर्णय (Decide)",

    // Views
    nav_landing: "होम व गाइड",
    nav_dashboard: "डैशबोर्ड अवलोकन",
    nav_analyzer: "रेज़्युमे व जॉब मिलान",
    nav_report: "पारदर्शी करियर रिपोर्ट",
    nav_ats: "एटीएस सिम्युलेटर",
    nav_roadmap: "अनुकूली रोडमैप",
    nav_planner: "अध्ययन योजनाकार",
    nav_interview: "मॉक इंटरव्यू",
    nav_skills: "कौशल मूल्यांकन लैब",
    nav_github: "गिटहब प्रमाणन",
    nav_market: "जॉब मार्केट इंटेलिजेंस",
    nav_tracker: "आवेदन ट्रैकर",
    nav_compare: "करियर तुलना व वेतन",
    nav_readiness: "प्लेसमेंट रेडीनेस इंडेक्स (PRI)",
    nav_profile: "छात्र प्रोफाइल",

    // Common Actions
    action_analyze: "रेज़्युमे का विश्लेषण करें",
    action_analyzing: "विश्लेषण जारी है...",
    action_upload: "रेज़्युमे अपलोड करें (PDF, DOCX, TXT)",
    action_paste: "या रेज़्युमे टेक्स्ट पेस्ट करें",
    action_demo: "नमूना प्रोफ़ाइल (आरव) आज़माएं",
    action_save_profile: "प्रोफ़ाइल सहेजें",
    action_start_interview: "मॉक इंटरव्यू शुरू करें",
    action_take_assessment: "कौशल टेस्ट लें",
    action_export_pdf: "पीडीएफ प्रिंट / निर्यात करें",
    action_cmd_palette: "कमांड पैलेट",
    action_track_job: "आवेदन ट्रैक करें",

    // Status Signals
    status_matched: "सत्यापित मिलान",
    status_partial: "आंशिक / निकटवर्ती कौशल",
    status_missing: "कौशल अंतर (गैप)",
    status_verified: "गिटहब सत्यापित",

    // Transparency
    scoring_transparency: "स्कोरिंग कैसे काम करती है",
    scoring_formula: "अर्थपूर्ण मिलान + अनिवार्य भार + साक्ष्य उद्धरण",
    privacy_promise: "गोपनीयता वादा",
    dont_save_resume: "सर्वर पर मेरा रेज़्युमे न सहेजें (अतिथि सत्र)",

    // Placeholders & Empty States
    empty_resume_title: "अभी तक कोई रेज़्युमे विश्लेषित नहीं",
    empty_resume_desc: "अपना रेज़्युमे अपलोड करें या पारदर्शी करियर विवरण देखने के लिए नमूना प्रोफ़ाइल चुनें।",
    search_placeholder: "कमांड टाइप करें या खोजें (Ctrl+K)...",
  },
};

export function t(key, fallback = "") {
  const currentLang = store.get("lang") || "en";
  const dict = STRINGS[currentLang] || STRINGS.en;
  return dict[key] || fallback || key;
}

export function setLanguage(lang) {
  if (lang !== "en" && lang !== "hi") lang = "en";
  store.set("lang", lang);
  applyTranslations();
}

export function applyTranslations() {
  const currentLang = store.get("lang") || "en";
  const dict = STRINGS[currentLang] || STRINGS.en;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) {
      el.setAttribute("placeholder", dict[key]);
    }
  });

  // Update language toggle button indicator
  const langToggleBtn = document.getElementById("langToggleBtn");
  if (langToggleBtn) {
    langToggleBtn.textContent = currentLang === "en" ? "HI" : "EN";
    langToggleBtn.setAttribute("title", currentLang === "en" ? "हिंदी में बदलें" : "Switch to English");
  }
}
