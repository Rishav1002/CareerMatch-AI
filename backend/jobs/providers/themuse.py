"""
The Muse Public Job Provider.
Consumes legal public The Muse API with strict 6s timeout and graceful degradation.
"""

from typing import Any, Dict, List
import httpx
from backend.jobs.providers.base import BaseJobProvider


class TheMuseJobProvider(BaseJobProvider):
    name: str = "The Muse"
    URL: str = "https://www.themuse.com/api/public/jobs"

    def fetch_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 15,
    ) -> List[Dict[str, Any]]:
        try:
            params: Dict[str, Any] = {"page": 1, "descending": "true"}
            if query:
                params["category"] = "Engineering"

            with httpx.Client(timeout=6.0) as client:
                r = client.get(self.URL, params=params)
                if r.status_code != 200:
                    return []
                data = r.json()
                results = []
                q_low = query.lower().strip() if query else ""

                for item in data.get("results", []):
                    title = item.get("name", "Software Engineer")
                    if q_low and q_low not in title.lower():
                        continue

                    loc_names = [l.get("name") for l in item.get("locations", []) if l.get("name")]
                    loc_str = ", ".join(loc_names) if loc_names else "Flexible / Remote"

                    results.append({
                        "id": f"muse-{item.get('id')}",
                        "title": title,
                        "companyName": item.get("company", {}).get("name", "Tech Enterprise"),
                        "location": loc_str,
                        "workMode": "Hybrid" if "Flexible" in loc_str else "Onsite",
                        "experienceLevel": item.get("levels", [{}])[0].get("name", "Entry / Mid-Level"),
                        "salaryRange": "Competitive Tech Benchmark",
                        "roleCategory": item.get("categories", [{}])[0].get("name", "Engineering"),
                        "requiredSkills": ["Problem Solving", "Software Engineering", "Collaboration"],
                        "preferredSkills": ["System Design", "Agile"],
                        "descriptionSummary": f"Opportunity at {item.get('company', {}).get('name', 'leading organization')} in {loc_str}.",
                        "applyUrl": item.get("refs", {}).get("landing_page") or "https://www.themuse.com",
                        "dataSource": "The Muse (Live API)",
                        "postedAt": item.get("publication_date", "")[:10] or "Recent",
                    })
                    if len(results) >= limit:
                        break
                return results
        except Exception:
            return []
