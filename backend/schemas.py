"""
CareerMatch AI: Pydantic Schema Contracts for API Responses
Enforces strict contracts between backend services and frontend UI modules.
"""

from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class MatchResultSchema(BaseModel):
    overallScore: float = 0.0
    mandatorySatisfiedPct: float = 0.0
    preferredSatisfiedPct: float = 0.0
    projectsExperienceScore: float = 0.0
    educationScore: float = 0.0
    matchedSkills: List[Any] = Field(default_factory=list)
    partialSkills: List[Any] = Field(default_factory=list)
    missingSkills: List[Any] = Field(default_factory=list)


class AnalyzeResponseSchema(BaseModel):
    analysisId: Optional[Union[int, str]] = None
    saved: bool = True
    source: str = "template"
    aiError: Optional[str] = None
    resume: Dict[str, Any] = Field(default_factory=dict)
    activeJob: Dict[str, Any] = Field(default_factory=dict)
    matchResult: Dict[str, Any] = Field(default_factory=dict)
    skillGaps: List[Dict[str, Any]] = Field(default_factory=list)
    roadmapNodes: List[Dict[str, Any]] = Field(default_factory=list)
    completedNodes: Dict[str, Any] = Field(default_factory=dict)
    stages: List[Dict[str, Any]] = Field(default_factory=list)
    advisor: Dict[str, Any] = Field(default_factory=dict)
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    improvements: Dict[str, Any] = Field(default_factory=dict)
    atsReport: Optional[Dict[str, Any]] = None
    dashboard: Optional[Dict[str, Any]] = None

    # Backward-compatible aliases
    job: Optional[Dict[str, Any]] = None
    match: Optional[Dict[str, Any]] = None
    roadmap: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None
    ats: Optional[Dict[str, Any]] = None


class HistoryItemResponseSchema(AnalyzeResponseSchema):
    id: Optional[Union[int, str]] = None
    resumeId: Optional[str] = None
    candidateName: Optional[str] = None
    targetRole: Optional[str] = None
    goalCompany: Optional[str] = None
    overallScore: Optional[float] = None
    mandatoryMetPct: Optional[float] = None
    preferredMetPct: Optional[float] = None
    matchedSkills: Optional[List[Any]] = None
    partialSkills: Optional[List[Any]] = None
    missingSkills: Optional[List[Any]] = None
    createdAt: Optional[str] = None


class DashboardMetricsSchema(BaseModel):
    dashboard: Dict[str, Any] = Field(default_factory=dict)


class BootstrapResponseSchema(BaseModel):
    roles: List[Dict[str, Any]] = Field(default_factory=list)
    defaultWeights: Dict[str, Any] = Field(default_factory=dict)
    defaultPriWeights: Dict[str, Any] = Field(default_factory=dict)
    dashboard: Optional[Dict[str, Any]] = None
    studentProfile: Optional[Dict[str, Any]] = None


class ResumeParseResponseSchema(BaseModel):
    resume: Dict[str, Any] = Field(default_factory=dict)
    saved: bool = True
    dashboard: Optional[Dict[str, Any]] = None


class AtsEvaluateResponseSchema(BaseModel):
    atsScore: float = 0.0
    breakdown: Dict[str, Any] = Field(default_factory=dict)
    recommendations: List[str] = Field(default_factory=list)
    keywordsFound: List[str] = Field(default_factory=list)
    keywordsMissing: List[str] = Field(default_factory=list)


class ReadinessIndexResponseSchema(BaseModel):
    readinessIndex: float = 0.0
    tier: str = "Foundational"
    breakdown: Dict[str, Any] = Field(default_factory=dict)
    actionableRecommendations: List[str] = Field(default_factory=list)


class CareerCompareResponseSchema(BaseModel):
    comparisons: List[Dict[str, Any]] = Field(default_factory=list)


class JobMarketResponseSchema(BaseModel):
    jobs: List[Dict[str, Any]] = Field(default_factory=list)
    totalListings: int = 0
    trendingSkills: List[Dict[str, Any]] = Field(default_factory=list)
    dataSource: str = ""


class AssessmentGenerateResponseSchema(BaseModel):
    sessionId: str
    topic: str
    difficulty: str
    questions: List[Dict[str, Any]]
    codingChallenge: Optional[Dict[str, Any]] = None
    evaluationDisclosure: Optional[str] = None


class AssessmentSubmitResponseSchema(BaseModel):
    sessionId: str
    overallScore: float
    mcqScore: float
    codingScore: float
    evaluationMode: Optional[str] = None
    codingReview: Optional[Dict[str, Any]] = None
    questionReviews: Optional[List[Dict[str, Any]]] = None


class AssessmentHintResponseSchema(BaseModel):
    hint: str
    penaltyPct: Optional[Union[int, float]] = 0


class InterviewStartResponseSchema(BaseModel):
    sessionId: str
    targetRole: str
    goalCompany: str
    interviewRound: str
    difficulty: str
    totalQuestions: int
    currentQuestionIndex: int
    currentQuestion: Dict[str, Any]
    allQuestions: Optional[List[Dict[str, Any]]] = None
    startedAt: Optional[str] = None


class InterviewAnswerResponseSchema(BaseModel):
    sessionId: str
    questionIndex: int
    questionEvaluation: Dict[str, Any]
    nextQuestion: Optional[Dict[str, Any]] = None
    isCompleted: Optional[bool] = None
    finalReport: Optional[Dict[str, Any]] = None


class GithubAnalyzeResponseSchema(BaseModel):
    available: bool = True
    username: Optional[str] = None
    dataSource: Optional[str] = None
    portfolioStrengthScore: Optional[float] = 0.0
    verificationRatePct: Optional[float] = 0.0
    verifiedSkills: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    unverifiedResumeSkills: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    publicReposCount: Optional[int] = 0
    followersCount: Optional[int] = 0
    readmeQualityReport: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AiStatusResponseSchema(BaseModel):
    enabled: bool = False
