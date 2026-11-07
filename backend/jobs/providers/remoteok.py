"""
RemoteOK Public Job Provider.
Consumes legal public RemoteOK API with strict 6s timeout and graceful degradation.
"""

from typing import Any, Dict, List
import httpx
from backend.jobs.providers.base import BaseJobProvider


class RemoteOKJobProvider(BaseJobProvider):
    name: str = "RemoteOK"
    URL: str = "https://remoteok.com/api"

    def fetch_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 15,
    ) -> List[Dict[str, Any]]:
        try:
            headers = {"User-Agent": "CareerMatch-AI-StudentBot/4.0"}
            with httpx.Client(timeout=6.0, headers=headers) as client:
                r = client.get(self.URL)
                if r.status_code != 200:
                    return []
                data = r.json()
                job_rows = [x for x in data if isinstance(x, dict) and "position" in x]
                results = []
                q_low = query.lower().strip() if query else ""

                for row in job_rows:
                    pos = row.get("position", "")
                    tags = row.get("tags", [])
                    if q_low:
                        pos_l = pos.lower()
                        tags_l = " ".join(tags).lower()
                        if q_low not in pos_l and q_low not in tags_l:
                            continue

                    sal = "Competitive Tech Benchmark"
                    min_sal = row.get("salary_min")
                    max_sal = row.get("salary_max")
                    if min_sal and max_sal:
                        sal = f"${min_sal:,} - ${max_sal:,} (~₹{int(min_sal*83/100000)}L - ₹{int(max_sal*83/100000)}L PA)"

                    results.append({
                        "id": f"rok-{row.get('id', '')}",
                        "title": pos,
                        "companyName": row.get("company", "Tech Co"),
                        "location": row.get("location") or "Remote (India / Global)",
                        "workMode": "Remote",
                        "experienceLevel": "Entry / Mid-Level",
                        "salaryRange": sal,
                        "roleCategory": "Software Engineering",
                        "requiredSkills": tags[:5] if tags else ["Software Engineering", "Problem Solving"],
                        "preferredSkills": tags[5:8] if len(tags) > 5 else ["Git"],
                        "descriptionSummary": f"High-impact remote role at {row.get('company', 'innovative company')} working with modern stacks.",
                        "applyUrl": row.get("url") or f"https://remoteok.com/l/{row.get('id')}",
                        "dataSource": "RemoteOK (Live API)",
                        "postedAt": "Recent",
                    })
                    if len(results) >= limit:
                        break
                return results
        except Exception:
            return []
