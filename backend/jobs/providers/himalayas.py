"""
Himalayas Public Job Provider.
Consumes legal public Himalayas API with strict 6s timeout and graceful degradation.
"""

from typing import Any, Dict, List
import httpx
from backend.jobs.providers.base import BaseJobProvider


class HimalayasJobProvider(BaseJobProvider):
    name: str = "Himalayas"
    URL: str = "https://himalayas.app/jobs/api"

    def fetch_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 15,
    ) -> List[Dict[str, Any]]:
        try:
            params = {"limit": limit}
            with httpx.Client(timeout=6.0) as client:
                r = client.get(self.URL, params=params)
                if r.status_code != 200:
                    return []
                data = r.json()
                results = []
                q_low = query.lower().strip() if query else ""

                for j in data.get("jobs", []):
                    title = j.get("title", "")
                    if q_low and q_low not in title.lower():
                        continue

                    min_sal = j.get("minSalary")
                    max_sal = j.get("maxSalary")
                    sal_str = "Competitive Tech Benchmark"
                    if min_sal and max_sal:
                        sal_str = f"${min_sal:,} - ${max_sal:,} (~₹{int(min_sal*83/100000)}L - ₹{int(max_sal*83/100000)}L PA)"

                    skills = [s.get("name") for s in j.get("categories", []) if s.get("name")]
                    if not skills:
                        skills = ["Software Engineering", "Problem Solving"]

                    results.append({
                        "id": f"him-{j.get('id', '')}",
                        "title": title,
                        "companyName": j.get("companyName", "Tech Innovator"),
                        "location": "Remote (Worldwide / India)",
                        "workMode": "Remote",
                        "experienceLevel": j.get("seniority", "Mid-Level"),
                        "salaryRange": sal_str,
                        "roleCategory": "Software Engineering",
                        "requiredSkills": skills[:5],
                        "preferredSkills": skills[5:8] if len(skills) > 5 else [],
                        "descriptionSummary": (j.get("excerpt", "") or f"Remote software opening at {j.get('companyName')}")[:200] + "...",
                        "applyUrl": j.get("applicationLink") or f"https://himalayas.app/jobs/{j.get('slug')}",
                        "dataSource": "Himalayas (Live API)",
                        "postedAt": j.get("pubDate", "")[:10] or "Recent",
                    })
                    if len(results) >= limit:
                        break
                return results
        except Exception:
            return []
