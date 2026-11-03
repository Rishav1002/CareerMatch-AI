"""
Comprehensive 40+ Categorized Role Catalog for CareerMatch AI.
Serves GET /api/roles and powers semantic matching, benchmarks, and roadmaps.
"""

from typing import Any, Dict, List

ROLES_CATALOG: List[Dict[str, Any]] = [
    # 1. Software Engineering
    {
        "id": "role-fullstack",
        "title": "Full Stack Developer",
        "category": "Software Engineering",
        "mandatorySkills": ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "REST APIs", "Git"],
        "preferredSkills": ["Docker", "AWS", "Redis", "Automated Testing", "CI/CD"],
        "softSkills": ["Problem Solving", "Communication", "Agile & Scrum"],
        "avgSalaryIndia": {"entry": "₹6L - ₹10L", "mid": "₹12L - ₹20L", "senior": "₹24L - ₹40L"},
    },
    {
        "id": "role-backend-python",
        "title": "Python Backend Developer",
        "category": "Software Engineering",
        "mandatorySkills": ["Python", "FastAPI", "Django", "SQL", "REST APIs", "Git", "Docker"],
        "preferredSkills": ["Redis", "AWS", "CI/CD", "Automated Testing", "PostgreSQL"],
        "softSkills": ["Problem Solving", "System Architecture", "Agile & Scrum"],
        "avgSalaryIndia": {"entry": "₹6L - ₹11L", "mid": "₹14L - ₹22L", "senior": "₹26L - ₹45L"},
    },
    {
        "id": "role-backend-java",
        "title": "Java Developer",
        "category": "Software Engineering",
        "mandatorySkills": ["Java", "Spring Boot", "SQL", "REST APIs", "Git", "Automated Testing"],
        "preferredSkills": ["Docker", "Kubernetes", "AWS", "Kafka", "Microservices"],
        "softSkills": ["Problem Solving", "Team Collaboration", "Agile & Scrum"],
        "avgSalaryIndia": {"entry": "₹6L - ₹10L", "mid": "₹13L - ₹22L", "senior": "₹25L - ₹42L"},
    },
    {
        "id": "role-backend-golang",
        "title": "Go / Golang Engineer",
        "category": "Software Engineering",
        "mandatorySkills": ["Go", "Distributed Systems", "SQL", "gRPC", "Docker", "Git"],
        "preferredSkills": ["Kubernetes", "Kafka", "Redis", "Prometheus", "CI/CD"],
        "softSkills": ["Analytical Thinking", "Concurrency Design", "Problem Solving"],
        "avgSalaryIndia": {"entry": "₹8L - ₹14L", "mid": "₹18L - ₹28L", "senior": "₹32L - ₹55L"},
    },
    {
        "id": "role-frontend-engineer",
        "title": "Frontend Engineer (React / TypeScript)",
        "category": "Software Engineering",
        "mandatorySkills": ["React", "TypeScript", "JavaScript", "HTML/CSS", "State Management", "Git"],
        "preferredSkills": ["Next.js", "Tailwind CSS", "Jest", "Webpack/Vite", "Accessibility"],
        "softSkills": ["UI/UX Empathy", "Design Handoff", "Communication"],
        "avgSalaryIndia": {"entry": "₹5L - ₹9L", "mid": "₹12L - ₹19L", "senior": "₹22L - ₹38L"},
    },
    {
        "id": "role-systems-cpp",
        "title": "Systems / Low-Level Engineer (C++)",
        "category": "Software Engineering",
        "mandatorySkills": ["C++", "Data Structures & Algorithms", "Operating Systems", "Memory Management", "Linux", "Git"],
        "preferredSkills": ["Multithreading", "Network Protocols", "CMake", "GDB", "CUDA"],
        "softSkills": ["Analytical Rigor", "Performance Optimization", "Root Cause Analysis"],
        "avgSalaryIndia": {"entry": "₹8L - ₹15L", "mid": "₹18L - ₹30L", "senior": "₹35L - ₹60L"},
    },
    {
        "id": "role-embedded-systems",
        "title": "Embedded Systems Engineer",
        "category": "Software Engineering",
        "mandatorySkills": ["C", "C++", "Microcontrollers", "RTOS", "Linux Device Drivers", "Git"],
        "preferredSkills": ["UART/SPI/I2C", "ARM Architecture", "Oscilloscopes", "Python"],
        "softSkills": ["Hardware Debugging", "Patience", "Precision"],
        "avgSalaryIndia": {"entry": "₹5L - ₹9L", "mid": "₹11L - ₹18L", "senior": "₹20L - ₹35L"},
    },

    # 2. Data & AI
    {
        "id": "role-data-eng",
        "title": "Data Engineer",
        "category": "Data & AI",
        "mandatorySkills": ["Python", "SQL", "Apache Spark", "Airflow", "Data Warehousing", "Git"],
        "preferredSkills": ["AWS", "Kafka", "Linux", "CI/CD", "Snowflake", "Docker"],
        "softSkills": ["Analytical Thinking", "Pipeline Reliability", "Communication"],
        "avgSalaryIndia": {"entry": "₹7L - ₹12L", "mid": "₹15L - ₹24L", "senior": "₹28L - ₹48L"},
    },
    {
        "id": "role-ml-eng",
        "title": "Machine Learning Engineer",
        "category": "Data & AI",
        "mandatorySkills": ["Python", "Machine Learning", "Deep Learning", "Pandas & NumPy", "SQL", "Git"],
        "preferredSkills": ["NLP", "FastAPI", "AWS", "Apache Spark", "PyTorch", "MLflow"],
        "softSkills": ["Mathematical Thinking", "Experimentation", "Communication"],
        "avgSalaryIndia": {"entry": "₹8L - ₹14L", "mid": "₹18L - ₹28L", "senior": "₹32L - ₹55L"},
    },
    {
        "id": "role-genai-engineer",
        "title": "Generative AI / LLM Engineer",
        "category": "Data & AI",
        "mandatorySkills": ["Python", "Large Language Models", "LangChain", "Vector Databases", "Prompt Engineering", "Git"],
        "preferredSkills": ["Fine-Tuning", "RAG Systems", "HuggingFace", "FastAPI", "Docker", "PyTorch"],
        "softSkills": ["Rapid Prototyping", "Safety Awareness", "Creative Problem Solving"],
        "avgSalaryIndia": {"entry": "₹10L - ₹16L", "mid": "₹20L - ₹34L", "senior": "₹38L - ₹65L"},
    },
    {
        "id": "role-data-scientist",
        "title": "Data Scientist",
        "category": "Data & AI",
        "mandatorySkills": ["Python", "Statistics", "Machine Learning", "SQL", "Pandas & NumPy", "Data Visualization"],
        "preferredSkills": ["A/B Testing", "Tableau/PowerBI", "Scikit-Learn", "Hypothesis Testing"],
        "softSkills": ["Business Storytelling", "Curiosity", "Strategic Thinking"],
        "avgSalaryIndia": {"entry": "₹7L - ₹12L", "mid": "₹15L - ₹25L", "senior": "₹28L - ₹48L"},
    },
    {
        "id": "role-mlops-engineer",
        "title": "MLOps Engineer",
        "category": "Data & AI",
        "mandatorySkills": ["Python", "Docker", "Kubernetes", "MLflow", "CI/CD", "Model Serving", "Git"],
        "preferredSkills": ["Kubeflow", "AWS SageMaker", "Feature Stores", "Monitoring & Drift", "Terraform"],
        "softSkills": ["Reliability Mindset", "Automation Passion", "Collaboration"],
        "avgSalaryIndia": {"entry": "₹8L - ₹15L", "mid": "₹18L - ₹28L", "senior": "₹32L - ₹52L"},
    },
    {
        "id": "role-data-analyst",
        "title": "Data Analyst",
        "category": "Data & AI",
        "mandatorySkills": ["SQL", "Python", "Pandas & NumPy", "Data Visualization", "Statistics"],
        "preferredSkills": ["Tableau", "Power BI", "Data Warehousing", "Excel Mastery", "Git"],
        "softSkills": ["Communication", "Analytical Thinking", "Attention to Detail"],
        "avgSalaryIndia": {"entry": "₹4.5L - ₹8L", "mid": "₹9L - ₹16L", "senior": "₹18L - ₹30L"},
    },
    {
        "id": "role-bi-engineer",
        "title": "Business Intelligence (BI) Engineer",
        "category": "Data & AI",
        "mandatorySkills": ["SQL", "Power BI / Tableau", "Data Modeling", "ETL Pipelines", "Data Warehousing"],
        "preferredSkills": ["Python", "dbt", "Snowflake", "DAX", "BigQuery"],
        "softSkills": ["Executive Reporting", "Requirement Gathering", "Data Storytelling"],
        "avgSalaryIndia": {"entry": "₹5L - ₹9L", "mid": "₹11L - ₹18L", "senior": "₹20L - ₹35L"},
    },

    # 3. Cloud & DevOps
    {
        "id": "role-cloud-devops",
        "title": "Cloud / DevOps Engineer",
        "category": "Cloud & DevOps",
        "mandatorySkills": ["Linux", "Docker", "Kubernetes", "AWS", "CI/CD", "Git", "Python"],
        "preferredSkills": ["Terraform", "Ansible", "Prometheus", "System Design", "Network Security"],
        "softSkills": ["Incident Management", "Automation First", "Cross-Team Communication"],
        "avgSalaryIndia": {"entry": "₹7L - ₹12L", "mid": "₹15L - ₹25L", "senior": "₹28L - ₹50L"},
    },
    {
        "id": "role-sre",
        "title": "Site Reliability Engineer (SRE)",
        "category": "Cloud & DevOps",
        "mandatorySkills": ["Linux", "Python/Go", "Kubernetes", "Observability (SLO/SLI)", "CI/CD", "Git"],
        "preferredSkills": ["Grafana", "Chaos Engineering", "Incident Postmortems", "Terraform", "Distributed Systems"],
        "softSkills": ["Calm Under Pressure", "Root Cause Analysis", "Continuous Learning"],
        "avgSalaryIndia": {"entry": "₹8L - ₹14L", "mid": "₹18L - ₹30L", "senior": "₹34L - ₹58L"},
    },
    {
        "id": "role-cloud-platform-arch",
        "title": "Cloud Platform Architect",
        "category": "Cloud & DevOps",
        "mandatorySkills": ["Cloud Architecture (AWS/GCP/Azure)", "Terraform", "Microservices", "Security & Governance", "Cost Optimization"],
        "preferredSkills": ["Multi-Cloud", "High Availability", "Disaster Recovery", "Zero Trust"],
        "softSkills": ["Executive Presentation", "Strategic Planning", "Mentorship"],
        "avgSalaryIndia": {"entry": "₹14L - ₹20L", "mid": "₹25L - ₹40L", "senior": "₹45L - ₹80L"},
    },
    {
        "id": "role-dba",
        "title": "Database Administrator (PostgreSQL / MySQL)",
        "category": "Cloud & DevOps",
        "mandatorySkills": ["PostgreSQL", "SQL Tuning", "Database Replication", "Backup & Recovery", "Linux", "Sharding"],
        "preferredSkills": ["MySQL", "Redis", "PgBouncer", "Database Migrations", "Python"],
        "softSkills": ["Extreme Reliability", "Data Integrity Guard", "Documentation"],
        "avgSalaryIndia": {"entry": "₹6L - ₹10L", "mid": "₹12L - ₹20L", "senior": "₹22L - ₹38L"},
    },

    # 4. Cyber Security
    {
        "id": "role-cybersecurity",
        "title": "Cybersecurity Analyst",
        "category": "Cyber Security",
        "mandatorySkills": ["Network Security", "SIEM & SOC", "OWASP & AppSec", "Linux", "Python", "IAM & Cryptography"],
        "preferredSkills": ["AWS Security", "Wireshark", "Threat Hunting", "Incident Response"],
        "softSkills": ["Analytical Thinking", "Investigative Mindset", "Communication"],
        "avgSalaryIndia": {"entry": "₹6L - ₹11L", "mid": "₹13L - ₹22L", "senior": "₹25L - ₹45L"},
    },
    {
        "id": "role-appsec-engineer",
        "title": "Application Security (AppSec) Engineer",
        "category": "Cyber Security",
        "mandatorySkills": ["OWASP Top 10", "SAST/DAST Tooling", "Code Auditing", "Python/Java", "Vulnerability Management"],
        "preferredSkills": ["Penetration Testing", "Threat Modeling", "DevSecOps", "Burp Suite"],
        "softSkills": ["Developer Collaboration", "Empathy", "Risk Assessment"],
        "avgSalaryIndia": {"entry": "₹8L - ₹14L", "mid": "₹16L - ₹28L", "senior": "₹30L - ₹52L"},
    },
    {
        "id": "role-pen-tester",
        "title": "Penetration Tester / Ethical Hacker",
        "category": "Cyber Security",
        "mandatorySkills": ["Kali Linux", "Burp Suite", "Network Penetration Testing", "Metasploit", "Exploit Analysis", "Python"],
        "preferredSkills": ["CEH / OSCP", "Web App Pentesting", "Active Directory Attacks", "Reverse Engineering"],
        "softSkills": ["Persistence", "Ethical Integrity", "Report Writing"],
        "avgSalaryIndia": {"entry": "₹7L - ₹12L", "mid": "₹15L - ₹26L", "senior": "₹28L - ₹50L"},
    },
    {
        "id": "role-cloud-security",
        "title": "Cloud Security Engineer",
        "category": "Cyber Security",
        "mandatorySkills": ["AWS/Azure IAM", "Cloud Security Posture (CSPM)", "K8s Security", "Terraform", "Zero Trust"],
        "preferredSkills": ["GuardDuty", "WAF & Shield", "Compliance (SOC2/ISO27001)", "Container Security"],
        "softSkills": ["Security Evangelism", "Governance", "Communication"],
        "avgSalaryIndia": {"entry": "₹8L - ₹15L", "mid": "₹18L - ₹30L", "senior": "₹32L - ₹56L"},
    },

    # 5. Mobile Engineering
    {
        "id": "role-android-dev",
        "title": "Android Developer (Kotlin)",
        "category": "Mobile Engineering",
        "mandatorySkills": ["Kotlin", "Android SDK", "Jetpack Compose", "Coroutines & Flow", "REST APIs", "Git"],
        "preferredSkills": ["Clean Architecture", "Room DB", "Hilt/Dagger", "Unit Testing", "CI/CD"],
        "softSkills": ["UI Craftsmanship", "User Empathy", "Attention to Detail"],
        "avgSalaryIndia": {"entry": "₹5.5L - ₹9.5L", "mid": "₹12L - ₹20L", "senior": "₹24L - ₹40L"},
    },
    {
        "id": "role-ios-dev",
        "title": "iOS Developer (Swift)",
        "category": "Mobile Engineering",
        "mandatorySkills": ["Swift", "SwiftUI", "Combine / Concurrency", "UIKit", "REST APIs", "Git"],
        "preferredSkills": ["CoreData", "App Store Guidelines", "XCTest", "CocoaPods/SPM"],
        "softSkills": ["Design Aesthetics", "Apple HIG Adherence", "User Focus"],
        "avgSalaryIndia": {"entry": "₹6L - ₹11L", "mid": "₹14L - ₹22L", "senior": "₹26L - ₹45L"},
    },
    {
        "id": "role-cross-platform-mobile",
        "title": "Cross-Platform Mobile Developer (Flutter / React Native)",
        "category": "Mobile Engineering",
        "mandatorySkills": ["Flutter / React Native", "Dart / TypeScript", "State Management", "Mobile APIs", "Git"],
        "preferredSkills": ["Native Bridging", "Firebase", "App Store & Play Store Deployment", "Animation"],
        "softSkills": ["Rapid Iteration", "Cross-Platform Optimization", "Teamwork"],
        "avgSalaryIndia": {"entry": "₹5L - ₹9L", "mid": "₹11L - ₹18L", "senior": "₹22L - ₹36L"},
    },

    # 6. Quality Assurance & Testing
    {
        "id": "role-sdet",
        "title": "Software Development Engineer in Test (SDET)",
        "category": "Quality Assurance",
        "mandatorySkills": ["Java / Python", "Selenium / Playwright", "API Automation (Postman/RestAssured)", "CI/CD", "Git", "SQL"],
        "preferredSkills": ["Performance Testing (JMeter)", "Docker", "Test Framework Architecture", "K8s"],
        "softSkills": ["Bug Hunting Mindset", "Quality Advocacy", "Thoroughness"],
        "avgSalaryIndia": {"entry": "₹6L - ₹10L", "mid": "₹12L - ₹20L", "senior": "₹22L - ₹38L"},
    },
    {
        "id": "role-qa-automation",
        "title": "QA Automation Engineer",
        "category": "Quality Assurance",
        "mandatorySkills": ["Test Automation", "Selenium", "Python", "Test Case Design", "JIRA", "Git"],
        "preferredSkills": ["Cypress", "Appium", "Postman", "CI/CD Integration"],
        "softSkills": ["Critical Thinking", "Clear Documentation", "Process Focus"],
        "avgSalaryIndia": {"entry": "₹4.5L - ₹8L", "mid": "₹9L - ₹15L", "senior": "₹17L - ₹28L"},
    },
    {
        "id": "role-performance-tester",
        "title": "Performance & Load Testing Engineer",
        "category": "Quality Assurance",
        "mandatorySkills": ["JMeter", "Gatling / k6", "Load Testing Analysis", "System Bottleneck Diagnostics", "Linux"],
        "preferredSkills": ["APM Tools (Dynatrace/NewRelic)", "Network Latency Analysis", "Cloud Load Testing"],
        "softSkills": ["Metric Focus", "Patience", "Analytical Rigor"],
        "avgSalaryIndia": {"entry": "₹5L - ₹9L", "mid": "₹11L - ₹18L", "senior": "₹20L - ₹34L"},
    },

    # 7. Product & Design
    {
        "id": "role-tech-pm",
        "title": "Technical Product Manager",
        "category": "Product & Design",
        "mandatorySkills": ["Product Roadmap", "PRD Writing", "Agile & Scrum", "Data Analytics (SQL)", "System Architecture Understanding"],
        "preferredSkills": ["API Knowledge", "User Research", "Wireframing", "Growth Experimentation"],
        "softSkills": ["Stakeholder Alignment", "Strategic Prioritization", "Customer Empathy"],
        "avgSalaryIndia": {"entry": "₹10L - ₹16L", "mid": "₹20L - ₹32L", "senior": "₹35L - ₹60L"},
    },
    {
        "id": "role-uiux-designer",
        "title": "UI/UX Product Designer",
        "category": "Product & Design",
        "mandatorySkills": ["Figma", "User Journey Mapping", "Design Systems", "Prototyping", "Usability Testing"],
        "preferredSkills": ["HTML/CSS Basics", "Micro-Interactions", "Accessibility (WCAG)", "Information Architecture"],
        "softSkills": ["Visual Taste", "Empathy", "Storytelling"],
        "avgSalaryIndia": {"entry": "₹5L - ₹9L", "mid": "₹11L - ₹19L", "senior": "₹22L - ₹38L"},
    },
    {
        "id": "role-solutions-architect",
        "title": "Solutions Architect",
        "category": "Product & Design",
        "mandatorySkills": ["Distributed Systems", "Cloud Design Patterns", "Security & Compliance", "Enterprise Integration", "Client Consulting"],
        "preferredSkills": ["API Strategy", "Legacy Modernization", "Cost Modeling"],
        "softSkills": ["Executive Gravitas", "Clear Technical Communication", "Negotiation"],
        "avgSalaryIndia": {"entry": "₹16L - ₹24L", "mid": "₹28L - ₹45L", "senior": "₹50L - ₹90L"},
    },

    # 8. Systems & Embedded
    {
        "id": "role-embedded-engineer",
        "title": "Embedded Systems & Firmware Engineer",
        "category": "Systems & Embedded",
        "mandatorySkills": ["C", "C++", "RTOS", "Microcontrollers (STM32/ESP32)", "I2C/SPI/UART", "Git"],
        "preferredSkills": ["Embedded Linux", "FreeRTOS", "Hardware Debugging (JTAG/Oscilloscope)", "IoT Protocols"],
        "softSkills": ["Hardware-Software Co-design", "Attention to Detail", "Debugging Patience"],
        "avgSalaryIndia": {"entry": "₹5L - ₹9L", "mid": "₹12L - ₹20L", "senior": "₹22L - ₹38L"},
    },
    {
        "id": "role-rust-systems",
        "title": "Rust Systems Software Engineer",
        "category": "Systems & Embedded",
        "mandatorySkills": ["Rust", "Memory Safety & Concurrency", "Systems Programming", "Linux", "Git"],
        "preferredSkills": ["Async Rust (Tokio)", "Low-level Networking", "WebAssembly (WASM)", "Docker"],
        "softSkills": ["Systems Thinking", "Performance Benchmarking", "Code Rigor"],
        "avgSalaryIndia": {"entry": "₹9L - ₹16L", "mid": "₹20L - ₹34L", "senior": "₹38L - ₹65L"},
    },
    {
        "id": "role-cpp-systems",
        "title": "C++ High-Performance Systems Engineer",
        "category": "Systems & Embedded",
        "mandatorySkills": ["Modern C++ (17/20)", "Data Structures & Algorithms", "Multithreading", "Linux", "Git"],
        "preferredSkills": ["Low Latency Systems", "Socket Programming", "Memory Profiling (Valgrind)", "CMake"],
        "softSkills": ["Algorithmic Rigor", "Problem Solving", "Performance Optimization"],
        "avgSalaryIndia": {"entry": "₹8L - ₹15L", "mid": "₹18L - ₹32L", "senior": "₹35L - ₹60L"},
    },

    # 9. Data Analytics & Operations
    {
        "id": "role-data-analyst",
        "title": "Data Analyst & Business Intelligence Specialist",
        "category": "Data & AI",
        "mandatorySkills": ["SQL", "Excel / Sheets", "Tableau / PowerBI", "Python / Pandas", "Data Visualization"],
        "preferredSkills": ["Statistical Modeling", "dbt", "Snowflake / BigQuery", "A/B Testing"],
        "softSkills": ["Storytelling with Data", "Business Acumen", "Stakeholder Communication"],
        "avgSalaryIndia": {"entry": "₹5L - ₹8.5L", "mid": "₹10L - ₹17L", "senior": "₹19L - ₹32L"},
    },
    {
        "id": "role-database-admin",
        "title": "Database Administrator (DBA / Data Reliability)",
        "category": "Data & AI",
        "mandatorySkills": ["PostgreSQL", "MySQL", "Query Optimization & Indexing", "Backup & Recovery", "Linux"],
        "preferredSkills": ["Replication & High Availability", "Connection Pooling (PgBouncer)", "Monitoring (Prometheus)"],
        "softSkills": ["Disaster Readiness", "Patience Under Outages", "Root Cause Analysis"],
        "avgSalaryIndia": {"entry": "₹6L - ₹10L", "mid": "₹12L - ₹21L", "senior": "₹24L - ₹42L"},
    },

    # 10. Emerging Tech & Platform
    {
        "id": "role-platform-engineer",
        "title": "Platform & Developer Experience (DevEx) Engineer",
        "category": "Cloud & DevOps",
        "mandatorySkills": ["Kubernetes", "Internal Developer Platforms", "Terraform", "CI/CD Pipelines", "Go / Python"],
        "preferredSkills": ["Backstage", "ArgoCD", "Helm", "Service Mesh (Istio)"],
        "softSkills": ["Developer Empathy", "System Standardization", "Clear Documentation"],
        "avgSalaryIndia": {"entry": "₹8L - ₹14L", "mid": "₹18L - ₹28L", "senior": "₹32L - ₹54L"},
    },
    {
        "id": "role-soc-analyst",
        "title": "SOC Analyst / Incident Responder",
        "category": "Cyber Security",
        "mandatorySkills": ["SIEM Tools (Splunk/ELK)", "Network Traffic Analysis (Wireshark)", "Incident Response", "Linux/Windows Internals"],
        "preferredSkills": ["Threat Hunting", "MITRE ATT&CK Framework", "Python Scripting", "Forensics"],
        "softSkills": ["Vigilance", "Crisis Decision Making", "Investigation Persistence"],
        "avgSalaryIndia": {"entry": "₹5L - ₹9L", "mid": "₹11L - ₹19L", "senior": "₹22L - ₹38L"},
    },
    {
        "id": "role-dotnet-developer",
        "title": ".NET Core Backend Developer",
        "category": "Software Engineering",
        "mandatorySkills": ["C#", ".NET Core / ASP.NET", "Entity Framework", "SQL Server", "REST APIs", "Git"],
        "preferredSkills": ["Azure", "Docker", "Microservices Architecture", "Automated Unit Testing"],
        "softSkills": ["Enterprise Mindset", "Clean Architecture", "Team Collaboration"],
        "avgSalaryIndia": {"entry": "₹5.5L - ₹9.5L", "mid": "₹12L - ₹20L", "senior": "₹23L - ₹40L"},
    },

    # 11. Emerging Tech
    {
        "id": "role-blockchain-dev",
        "title": "Blockchain / Web3 Developer",
        "category": "Emerging Tech",
        "mandatorySkills": ["Solidity", "Smart Contract Security", "Ethereum / EVM", "Web3.js / Ethers.js", "Git"],
        "preferredSkills": ["Hardhat / Foundry", "Rust (Solana)", "DeFi Protocols", "ZK Proofs"],
        "softSkills": ["Paranoia for Security", "Mathematical Curiosity", "Decentralized Ethos"],
        "avgSalaryIndia": {"entry": "₹8L - ₹15L", "mid": "₹18L - ₹30L", "senior": "₹35L - ₹65L"},
    },
    {
        "id": "role-robotics-software",
        "title": "Robotics Software Engineer",
        "category": "Emerging Tech",
        "mandatorySkills": ["ROS / ROS2", "C++", "Python", "Kinematics & Motion Planning", "Linux", "Git"],
        "preferredSkills": ["Gazebo Simulation", "OpenCV", "SLAM Algorithms", "Sensor Fusion"],
        "softSkills": ["Physics Intuition", "Real-World Debugging", "Multidisciplinary Collaboration"],
        "avgSalaryIndia": {"entry": "₹7L - ₹13L", "mid": "₹16L - ₹26L", "senior": "₹30L - ₹52L"},
    },
]


def get_roles_catalog() -> List[Dict[str, Any]]:
    """Return complete list of 40+ categorized roles."""
    return ROLES_CATALOG


def get_roles_by_category() -> Dict[str, List[Dict[str, Any]]]:
    """Return dictionary of roles grouped by category."""
    grouped: Dict[str, List[Dict[str, Any]]] = {}
    for r in ROLES_CATALOG:
        cat = r["category"]
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append(r)
    return grouped
