"""
Base Job Provider Interface.
Standardizes external API responses into normalized CareerMatch job listings.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BaseJobProvider(ABC):
    """Abstract base class for all job market providers."""

    name: str = "base"

    @abstractmethod
    def fetch_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 15,
    ) -> List[Dict[str, Any]]:
        """
        Fetch and normalize jobs from provider API.
        Must return list of dicts with standardized keys:
        - id: str
        - title: str
        - companyName: str
        - location: str
        - workMode: str ("Remote", "Hybrid", "Onsite")
        - experienceLevel: str ("Entry", "Mid-Level", "Senior")
        - salaryRange: str (e.g. "₹8L - ₹14L PA" or "$80,000 - $110,000")
        - roleCategory: str
        - requiredSkills: List[str]
        - preferredSkills: List[str]
        - descriptionSummary: str
        - applyUrl: str
        - dataSource: str
        - postedAt: str
        """
        pass
