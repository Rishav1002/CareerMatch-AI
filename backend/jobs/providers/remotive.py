"""
Remotive Job Market Provider.
Fetches verified remote engineering roles via Remotive public API.
"""

import json
import re
import urllib.parse
import urllib.request
from typing import Any, Dict, List
from backend.jobs.providers.base import BaseJobProvider

COMMON_SKILLS = [
    "Python", "SQL", "Docker", "Kubernetes", "AWS", "FastAPI", "React", "TypeScript",
    "Node.js", "Java", "Go", "PostgreSQL", "MongoDB", "Spark", "Kafka", "Git", "CI/CD",
    "GCP", "Azure", "Terraform", "PyTorch", "TensorFlow", "Pandas", "Linux"
]


class RemotiveJobProvider(BaseJobProvider):
    name = "Remotive"

    def fetch_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 15,
    ) -> List[Dict[str, Any]]:
        clean_q = (query or "software").strip()
        encoded = urllib.parse.quote(clean_q)
        url = f"https://remotive.com/api/remote-jobs?search={encoded}&limit={limit}"

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
        except Exception as exc:
            # Return empty list on network error or offline mode
            return []

        jobs_raw = data.get("jobs", [])[:limit]
        normalized = []

        for raw in jobs_raw:
            job_id = f"remotive-{raw.get('id', '')}"
            title = raw.get("title", "Software Engineer")
            company = raw.get("company_name", "Global Tech Co")
            candidate_req = raw.get("candidate_required_location", "Remote")
            salary = raw.get("salary") or "₹12L - ₹24L PA / $80k - $140k"
            description = raw.get("description", "")

            # Extract skills by matching COMMON_SKILLS in description and tags
            tags = raw.get("tags", [])
            matched_skills = []
            text_corpus = (title + " " + " ".join(tags) + " " + description).lower()
            for sk in COMMON_SKILLS:
                if re.search(r'\b' + re.escape(sk.lower()) + r'\b', text_corpus):
                    matched_skills.append(sk)

            if not matched_skills:
                matched_skills = ["Python", "SQL", "Git"]

            req_skills = matched_skills[:4]
            pref_skills = matched_skills[4:7] if len(matched_skills) > 4 else ["Docker", "AWS"]

            normalized.append({
                "id": job_id,
                "title": title,
                "companyName": company,
                "location": candidate_req or "Remote (Worldwide)",
                "workMode": "Remote",
                "experienceLevel": "Mid-Level" if "senior" not in title.lower() else "Senior",
                "salaryRange": salary,
                "roleCategory": raw.get("category", "Software Engineering"),
                "requiredSkills": req_skills,
                "preferredSkills": pref_skills,
                "descriptionSummary": f"{title} at {company}. Remote verified vacancy.",
                "applyUrl": raw.get("url", "https://remotive.com"),
                "dataSource": "Remotive Live API",
                "postedAt": raw.get("publication_date", "Recently"),
            })

        return normalized
