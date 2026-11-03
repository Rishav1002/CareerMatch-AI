"""
Arbeitnow Job Market Provider.
Fetches verified European & global tech listings via Arbeitnow public API.
"""

import json
import re
import urllib.parse
import urllib.request
from typing import Any, Dict, List
from backend.jobs.providers.base import BaseJobProvider
from backend.jobs.providers.remotive import COMMON_SKILLS


class ArbeitnowJobProvider(BaseJobProvider):
    name = "Arbeitnow"

    def fetch_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 15,
    ) -> List[Dict[str, Any]]:
        url = "https://www.arbeitnow.com/api/job-board-api"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "CareerMatchAI/1.0 (Student Career Intelligence Engine)",
                "Accept": "application/json",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception:
            return []

        jobs_raw = data.get("data", [])
        normalized = []
        q_lower = query.lower() if query else ""

        for raw in jobs_raw:
            title = raw.get("title", "")
            tags = raw.get("tags", [])
            desc = raw.get("description", "")
            text_corpus = (title + " " + " ".join(tags) + " " + desc).lower()

            if q_lower and q_lower not in text_corpus:
                continue

            job_id = f"arbeitnow-{raw.get('slug', str(len(normalized)))}"
            company = raw.get("company_name", "Tech Company")
            is_remote = raw.get("remote", False)
            job_loc = raw.get("location", "Remote" if is_remote else "Global")

            matched_skills = []
            for sk in COMMON_SKILLS:
                if re.search(r'\b' + re.escape(sk.lower()) + r'\b', text_corpus):
                    matched_skills.append(sk)

            if not matched_skills:
                matched_skills = ["Python", "SQL", "Git"]

            normalized.append({
                "id": job_id,
                "title": title,
                "companyName": company,
                "location": job_loc,
                "workMode": "Remote" if is_remote else "Hybrid",
                "experienceLevel": "Mid-Level" if "senior" not in title.lower() else "Senior",
                "salaryRange": "€60,000 - €95,000 / ₹14L - ₹28L PA",
                "roleCategory": "Software Engineering",
                "requiredSkills": matched_skills[:4],
                "preferredSkills": matched_skills[4:7] if len(matched_skills) > 4 else ["Docker", "Kubernetes"],
                "descriptionSummary": f"{title} at {company}. Active tech vacancy.",
                "applyUrl": raw.get("url", "https://www.arbeitnow.com"),
                "dataSource": "Arbeitnow Live API",
                "postedAt": "Recently",
            })

            if len(normalized) >= limit:
                break

        return normalized
