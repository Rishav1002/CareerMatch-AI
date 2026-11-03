"""
Adzuna Job Market Provider.
Fetches verified openings across India & Global tech hubs via Adzuna API.
Requires ADZUNA_APP_ID and ADZUNA_APP_KEY env vars.
"""

import json
import os
import urllib.parse
import urllib.request
from typing import Any, Dict, List
from backend.jobs.providers.base import BaseJobProvider
from backend.jobs.providers.remotive import COMMON_SKILLS


class AdzunaJobProvider(BaseJobProvider):
    name = "Adzuna"

    def __init__(self):
        self.app_id = os.environ.get("ADZUNA_APP_ID", "").strip()
        self.app_key = os.environ.get("ADZUNA_APP_KEY", "").strip()
        self.country = os.environ.get("ADZUNA_COUNTRY", "in").strip().lower()

    def is_configured(self) -> bool:
        return bool(self.app_id and self.app_key)

    def fetch_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 15,
    ) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return []

        clean_q = urllib.parse.quote(query or "software engineer")
        loc_param = f"&where={urllib.parse.quote(location)}" if location else ""
        url = (
            f"https://api.adzuna.com/v1/api/jobs/{self.country}/search/1"
            f"?app_id={self.app_id}&app_key={self.app_key}"
            f"&results_per_page={limit}&what={clean_q}{loc_param}&content-type=application/json"
        )

        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "CareerMatchAI/1.0",
                "Accept": "application/json",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception:
            return []

        results = data.get("results", [])
        normalized = []

        for raw in results:
            job_id = f"adzuna-{raw.get('id', str(len(normalized)))}"
            title = raw.get("title", "")
            company = (raw.get("company") or {}).get("display_name", "Tech Company")
            loc_display = (raw.get("location") or {}).get("display_name", "India")
            salary_min = raw.get("salary_min")
            salary_max = raw.get("salary_max")

            if salary_min and salary_max:
                salary_str = f"₹{salary_min/100000:.1f}L - ₹{salary_max/100000:.1f}L PA"
            else:
                salary_str = "Competitive / Market Standard"

            desc = raw.get("description", "")
            text_corpus = (title + " " + desc).lower()

            matched_skills = []
            for sk in COMMON_SKILLS:
                if sk.lower() in text_corpus:
                    matched_skills.append(sk)

            if not matched_skills:
                matched_skills = ["Python", "SQL", "Git"]

            normalized.append({
                "id": job_id,
                "title": title,
                "companyName": company,
                "location": loc_display,
                "workMode": "Hybrid" if "hybrid" in text_corpus else ("Remote" if "remote" in text_corpus else "Onsite"),
                "experienceLevel": "Mid-Level" if "senior" not in title.lower() else "Senior",
                "salaryRange": salary_str,
                "roleCategory": "Software Engineering",
                "requiredSkills": matched_skills[:4],
                "preferredSkills": matched_skills[4:7] if len(matched_skills) > 4 else ["Docker", "AWS"],
                "descriptionSummary": desc[:160] + "..." if len(desc) > 160 else desc,
                "applyUrl": raw.get("redirect_url", "https://www.adzuna.in"),
                "dataSource": "Adzuna Live API",
                "postedAt": raw.get("created", "Recently"),
            })

        return normalized
