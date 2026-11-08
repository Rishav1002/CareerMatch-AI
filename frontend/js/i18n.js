/**
 * CareerMatch AI: i18n Dictionary (English & Hindi)
 * Complete string parity with live language switching and Devanagari font binding.
 */

import { store } from "./store.js";

export const STRINGS = {
  en: {
    // Brand & Header
    brand_name: "CareerMatch AI",
    brand_edition: "Field Guide Edition",
    brand_tagline: "Explainable career-readiness for Indian engineers.",

    // Navigation Groups
    nav_group_diagnose: "Diagnose",
    nav_group_prepare: "Prepare",
    nav_group_prove: "Prove",
    nav_group_decide: "Decide",

    // Navigation Links
    nav_landing: "Home",
    nav_dashboard: "Overview",
    nav_analyzer: "Resume Match",
    nav_report: "Evidence Report",
    nav_ats: "ATS Simulator",
    nav_roadmap: "Adaptive Roadmap",
    nav_planner: "Study Planner",
    nav_interview: "Mock Interview",
    nav_skills: "Skill Lab",
    nav_github: "GitHub Proof",
    nav_market: "Live Jobs",
    nav_tracker: "App Tracker",
    nav_compare: "Career Paths",
    nav_readiness: "Readiness (PRI)",
    nav_profile: "Candidate Profile",
    nav_settings: "Settings",

    // Actions & Buttons
    action_analyze: "Analyze Resume",
    action_analyzing: "Analyzing...",
    action_upload: "Drop resume or browse",
    action_paste: "Or paste text",
    action_parse_text: "Parse Text",
    action_save_profile: "Save Profile",
    action_start_interview: "Start Mock Interview",
    action_submit_answer: "Submit Answer",
    action_start_assessment: "Start Test",
    action_submit_assessment: "Submit Test",
    action_export_pdf: "Print / Export PDF",
    action_export_json: "Export JSON",
    action_cmd_palette: "Command Palette",
    action_track_job: "Track Application",
    action_recalc_pri: "Recalculate Index",
    action_apply_weights: "Apply Weights",
    action_reset: "Reset Defaults",
    action_toggle_theme: "Toggle Theme",
    action_refresh: "Refresh",
    action_sign_in: "Sign In",
    action_continue_guest: "Continue as Guest",

    // Status Signals & Badges
    status_matched: "Matched",
    status_partial: "Partial",
    status_missing: "Skill Gap",
    status_verified: "Verified",
    status_ready: "Industry Ready",
    status_developing: "Developing",
    status_high: "High Readiness",

    // Headings
    heading_landing: "Career Intelligence for Indian Engineers",
    heading_landing_sub: "Evaluate your resume against live industry benchmarks with verifiable proof and step-by-step roadmaps.",
    heading_login: "Sign In",
    heading_dashboard: "Candidate Overview",
    heading_analyzer: "Resume & Target Role",
    heading_report: "Evidence Ledger & Gaps",
    heading_ats: "ATS Resume Audit",
    heading_roadmap: "Adaptive Roadmap",
    heading_planner: "Weekly Study Planner",
    heading_interview: "Mock Interview",
    heading_assessment: "Skill Assessment Lab",
    heading_github: "GitHub Proof & Portfolio",
    heading_jobs: "Live Job Market",
    heading_tracker: "Application Pipeline Tracker",
    heading_career: "Career Path & Salary Benchmark",
    heading_pri: "Placement Readiness Index",
    heading_profile: "Career Profile",
    heading_settings: "Settings & Storage",
    heading_privacy: "Privacy Policy",
    heading_terms: "Terms of Service",
    heading_cookies: "Cookie Policy",
    heading_not_found: "View Not Found",

    // Empty States & Notices
    empty_history: "No past analyses recorded.",
    empty_interview: "No prior interview answers recorded.",
    empty_assessment: "No test sessions completed yet.",
    empty_jobs: "No active openings matching current filters.",
    empty_resume_title: "No Resume Analyzed Yet",
    empty_resume_desc: "Drop your resume or enter your details to view an explainable match report.",
    transient_notice: "Transient session (no server save)",
    guest_storage_notice: "Guest sessions save locally in private browser storage.",
    disclaimer_pri: "PRI evaluates verified evidence across 6 pillars.",

    // Placeholders
    placeholder_search: "Search tools, views, or roles (Ctrl+K)...",
    placeholder_resume_text: "Paste resume text...",
    placeholder_jd_text: "Paste custom job description...",
    placeholder_filter_skills: "Filter skills...",
    placeholder_role: "Select target role...",
  },
  hi: {
    // Brand & Header
    brand_name: "करियरमैच एआई",
    brand_edition: "फील्ड गाइड संस्करण",
    brand_tagline: "भारतीय छात्रों और इंजीनियरों के लिए पारदर्शी करियर-तैयारी।",

    // Navigation Groups
    nav_group_diagnose: "निदान",
    nav_group_prepare: "तैयारी",
    nav_group_prove: "प्रमाण",
    nav_group_decide: "निर्णय",

    // Navigation Links
    nav_landing: "होम",
    nav_dashboard: "अवलोकन",
    nav_analyzer: "रेज़्युमे मिलान",
    nav_report: "साक्ष्य रिपोर्ट",
    nav_ats: "एटीएस सिम्युलेटर",
    nav_roadmap: "अनुकूली रोडमैप",
    nav_planner: "अध्ययन योजना",
    nav_interview: "मॉक इंटरव्यू",
    nav_skills: "स्किल लैब",
    nav_github: "गिटहब प्रमाण",
    nav_market: "लाइव नौकरियां",
    nav_tracker: "आवेदन ट्रैकर",
    nav_compare: "करियर पथ",
    nav_readiness: "रेडीनेस (PRI)",
    nav_profile: "उम्मीदवार प्रोफाइल",
    nav_settings: "सेटिंग्स",

    // Actions & Buttons
    action_analyze: "रेज़्युमे जांचें",
    action_analyzing: "विश्लेषण जारी है...",
    action_upload: "रेज़्युमे चुनें या ड्रॉप करें",
    action_paste: "या टेक्स्ट पेस्ट करें",
    action_parse_text: "टेक्स्ट जांचें",
    action_save_profile: "प्रोफाइल सहेजें",
    action_start_interview: "इंटरव्यू शुरू करें",
    action_submit_answer: "उत्तर जमा करें",
    action_start_assessment: "टेस्ट शुरू करें",
    action_submit_assessment: "टेस्ट जमा करें",
    action_export_pdf: "पीडीएफ निर्यात करें",
    action_export_json: "JSON निर्यात करें",
    action_cmd_palette: "कमांड पैलेट",
    action_track_job: "आवेदन ट्रैक करें",
    action_recalc_pri: "इंडेक्स पुनः गणना",
    action_apply_weights: "वेटेज लागू करें",
    action_reset: "डिफ़ॉल्ट रीसेट करें",
    action_toggle_theme: "थीम बदलें",
    action_refresh: "रिफ्रेश करें",
    action_sign_in: "साइन इन करें",
    action_continue_guest: "अतिथि के रूप में जारी रखें",

    // Status Signals & Badges
    status_matched: "सत्यापित मिलान",
    status_partial: "आंशिक मिलान",
    status_missing: "कौशल अंतराल (गैप)",
    status_verified: "गिटहब सत्यापित",
    status_ready: "उद्योग तैयार",
    status_developing: "विकासशील",
    status_high: "उच्च तैयारी",

    // Headings
    heading_landing: "भारतीय इंजीनियरों के लिए करियर इंटेलिजेंस",
    heading_landing_sub: "उद्योग मानकों के आधार पर अपने रेज़्युमे का पारदर्शी साक्ष्य-आधारित विश्लेषण और रोडमैप प्राप्त करें।",
    heading_login: "साइन इन करें",
    heading_dashboard: "उम्मीदवार अवलोकन",
    heading_analyzer: "रेज़्युमे व लक्षित भूमिका",
    heading_report: "साक्ष्य विवरण व कौशल अंतराल",
    heading_ats: "एटीएस रेज़्युमे ऑडिट",
    heading_roadmap: "अनुकूली शिक्षण रोडमैप",
    heading_planner: "साप्ताहिक अध्ययन योजना",
    heading_interview: "एआई मॉक इंटरव्यू",
    heading_assessment: "कौशल मूल्यांकन लैब",
    heading_github: "गिटहब साक्ष्य विश्लेषण",
    heading_jobs: "लाइव टेक नौकरियां",
    heading_tracker: "आवेदन पाइपलाइन ट्रैकर",
    heading_career: "करियर पथ व वेतन मानक",
    heading_pri: "प्लेसमेंट रेडीनेस इंडेक्स",
    heading_profile: "करियर प्रोफाइल",
    heading_settings: "सेटिंग्स व डेटा प्रबंधन",
    heading_privacy: "गोपनीयता नीति",
    heading_terms: "सेवा की शर्तें",
    heading_cookies: "कुकी नीति",
    heading_not_found: "पृष्ठ नहीं मिला",

    // Empty States & Notices
    empty_history: "कोई पिछला विश्लेषण दर्ज नहीं है।",
    empty_interview: "कोई पूर्व इंटरव्यू सत्र दर्ज नहीं है।",
    empty_assessment: "कोई टेस्ट सत्र पूरा नहीं हुआ है।",
    empty_jobs: "वर्तमान फ़िल्टर से मेल खाती कोई नौकरी नहीं मिली।",
    empty_resume_title: "कोई रेज़्युमे विश्लेषित नहीं",
    empty_resume_desc: "पारदर्शी करियर रिपोर्ट देखने के लिए रेज़्युमे अपलोड करें या विवरण दर्ज करें।",
    transient_notice: "अस्थायी सत्र (सर्वर पर डेटा सहेजा नहीं जाता)",
    guest_storage_notice: "अतिथि सत्र सुरक्षित रूप से ब्राउज़र स्टोरेज में सहेजे जाते हैं।",
    disclaimer_pri: "पीआरआई 6 सत्यापित स्तंभों के आधार पर तैयारी मापता है।",

    // Placeholders
    placeholder_search: "टूल या भूमिका खोजें (Ctrl+K)...",
    placeholder_resume_text: "रेज़्युमे टेक्स्ट पेस्ट करें...",
    placeholder_jd_text: "जॉब विवरण पेस्ट करें...",
    placeholder_filter_skills: "कौशल फ़िल्टर करें...",
    placeholder_role: "लक्षित भूमिका चुनें...",
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
  document.documentElement.setAttribute("lang", lang);
  applyTranslations();
}

export function applyTranslations() {
  const currentLang = store.get("lang") || "en";
  document.documentElement.setAttribute("lang", currentLang);
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
    langToggleBtn.setAttribute("title", currentLang === "en" ? "हिंदी में देखें (Switch to Hindi)" : "Switch to English");
  }
}
