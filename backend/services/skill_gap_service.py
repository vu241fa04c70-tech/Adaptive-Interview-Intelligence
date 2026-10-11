import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from models import User, Candidate, InterviewSession, QuestionAnswer, EvaluationReport, SkillAnalysis, LearningRoadmap, UserSkillProgress

# ==========================================
# 1. STANDARDIZED ROLE TAXONOMY & REQUIREMENTS
# ==========================================

SUPPORTED_ROLES = [
    "Python Developer",
    "Java Developer",
    "Full Stack Developer",
    "Backend Developer",
    "Frontend Developer",
    "Data Analyst",
    "Data Scientist",
    "Machine Learning Engineer",
    "AI Engineer",
    "Cloud Engineer",
    "Cybersecurity Analyst",
    "Software Development Engineer"
]

SKILL_CATEGORIES = [
    "programming_languages",
    "frameworks_and_libraries",
    "databases",
    "cloud_and_devops",
    "ai_and_ml",
    "cs_fundamentals",
    "tools_and_platforms",
    "soft_skills"
]

CATEGORY_LABELS = {
    "programming_languages": "Programming Languages",
    "frameworks_and_libraries": "Frameworks & Libraries",
    "databases": "Databases & Storage",
    "cloud_and_devops": "Cloud & DevOps",
    "ai_and_ml": "AI & Machine Learning",
    "cs_fundamentals": "Computer Science Fundamentals",
    "tools_and_platforms": "Tools & Platforms",
    "soft_skills": "Soft Skills & Leadership"
}

# Verified official documentation and learning resources only (No dead or fabricated links)
VERIFIED_RESOURCES = {
    "Python": {"title": "Python Official Documentation", "url": "https://docs.python.org/3/tutorial/", "type": "Documentation"},
    "FastAPI": {"title": "FastAPI Official Tutorial", "url": "https://fastapi.tiangolo.com/tutorial/", "type": "Documentation"},
    "Django": {"title": "Django Official Getting Started", "url": "https://docs.djangoproject.com/en/stable/intro/tutorial01/", "type": "Documentation"},
    "Flask": {"title": "Flask Quickstart Guide", "url": "https://flask.palletsprojects.com/en/latest/quickstart/", "type": "Documentation"},
    "JavaScript": {"title": "MDN JavaScript Guide", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "type": "Documentation"},
    "TypeScript": {"title": "TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/handbook/intro.html", "type": "Documentation"},
    "React": {"title": "React Official Documentation", "url": "https://react.dev/learn", "type": "Documentation"},
    "Next.js": {"title": "Next.js Official Documentation", "url": "https://nextjs.org/docs", "type": "Documentation"},
    "Node.js": {"title": "Node.js Guides", "url": "https://nodejs.org/en/docs/guides", "type": "Documentation"},
    "Java": {"title": "Oracle Java Tutorials", "url": "https://docs.oracle.com/javase/tutorial/", "type": "Documentation"},
    "Spring Boot": {"title": "Spring Boot Reference Guide", "url": "https://docs.spring.io/spring-boot/docs/current/reference/html/", "type": "Documentation"},
    "SQL": {"title": "PostgreSQL SQL Tutorial", "url": "https://www.postgresql.org/docs/current/tutorial-sql.html", "type": "Documentation"},
    "PostgreSQL": {"title": "PostgreSQL Official Manual", "url": "https://www.postgresql.org/docs/current/", "type": "Documentation"},
    "MongoDB": {"title": "MongoDB Manual & Guides", "url": "https://www.mongodb.com/docs/manual/", "type": "Documentation"},
    "Redis": {"title": "Redis Official Documentation", "url": "https://redis.io/docs/latest/", "type": "Documentation"},
    "Docker": {"title": "Docker Get Started Guide", "url": "https://docs.docker.com/get-started/", "type": "Documentation"},
    "Kubernetes": {"title": "Kubernetes Concepts & Basics", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "type": "Documentation"},
    "AWS": {"title": "AWS Cloud Practitioner & Architecture Guide", "url": "https://docs.aws.amazon.com/whitepapers/latest/aws-overview/introduction.html", "type": "Documentation"},
    "Git": {"title": "Git SCM Book & Documentation", "url": "https://git-scm.com/doc", "type": "Documentation"},
    "Linux": {"title": "Linux Kernel & Command Line Documentation", "url": "https://www.kernel.org/doc/html/latest/", "type": "Documentation"},
    "Data Structures & Algorithms": {"title": "freeCodeCamp Algorithms Guide", "url": "https://www.freecodecamp.org/news/learn-data-structures-and-algorithms/", "type": "Tutorial"},
    "System Design": {"title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer", "type": "Guide"},
    "Machine Learning": {"title": "Scikit-Learn User Guide", "url": "https://scikit-learn.org/stable/user_guide.html", "type": "Documentation"},
    "Deep Learning": {"title": "PyTorch Official Tutorials", "url": "https://pytorch.org/tutorials/", "type": "Documentation"},
    "Pandas": {"title": "Pandas Getting Started", "url": "https://pandas.pydata.org/docs/getting_started/index.html", "type": "Documentation"},
    "REST APIs": {"title": "MDN HTTP & REST Guide", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP", "type": "Documentation"},
    "GraphQL": {"title": "GraphQL Official Introduction", "url": "https://graphql.org/learn/", "type": "Documentation"},
    "Tailwind CSS": {"title": "Tailwind CSS Documentation", "url": "https://tailwindcss.com/docs", "type": "Documentation"},
    "CI/CD": {"title": "GitHub Actions Documentation", "url": "https://docs.github.com/en/actions", "type": "Documentation"},
    "Cybersecurity": {"title": "OWASP Top Ten Security Risks", "url": "https://owasp.org/www-project-top-ten/", "type": "Documentation"}
}

# Role definitions with baseline required competencies & importance
ROLE_TAXONOMY_MAP = {
    "Python Developer": {
        "description": "Designs, implements, and maintains backend services, automation suites, and data pipelines using modern Python standards.",
        "skills": [
            {"name": "Python", "category": "programming_languages", "importance": "Critical", "req_prof": 4, "why": "Core language for application logic, concurrency, and OOP.", "action": "Practice generators, async/await, typing, and memory profiling."},
            {"name": "FastAPI", "category": "frameworks_and_libraries", "importance": "High", "req_prof": 3, "why": "Leading high-performance async REST framework.", "action": "Build an async API with Pydantic validation and JWT authentication."},
            {"name": "SQLAlchemy", "category": "databases", "importance": "High", "req_prof": 3, "why": "Industry standard ORM and database abstraction.", "action": "Design relational models with relationships, migrations (Alembic), and query optimization."},
            {"name": "PostgreSQL", "category": "databases", "importance": "High", "req_prof": 3, "why": "Primary relational database for enterprise Python backends.", "action": "Write complex JOINs, indexes, transactions, and analyze EXPLAIN query plans."},
            {"name": "Docker", "category": "cloud_and_devops", "importance": "Medium", "req_prof": 3, "why": "Containerization standard for consistent deployment.", "action": "Write multi-stage Dockerfiles and compose setups for Python apps."},
            {"name": "Git", "category": "tools_and_platforms", "importance": "High", "req_prof": 3, "why": "Distributed version control and team collaboration.", "action": "Master branching strategies, rebasing, and merge resolution."},
            {"name": "Data Structures & Algorithms", "category": "cs_fundamentals", "importance": "High", "req_prof": 3, "why": "Essential for efficient code execution and technical interviews.", "action": "Practice hash tables, recursion, two-pointer algorithms, and binary trees."},
            {"name": "REST APIs", "category": "frameworks_and_libraries", "importance": "Critical", "req_prof": 4, "why": "Standard client-server architecture.", "action": "Implement standard status codes, idempotency, rate limiting, and OpenAPI specs."},
            {"name": "Unit Testing", "category": "tools_and_platforms", "importance": "Medium", "req_prof": 3, "why": "Ensures software reliability and prevents regression.", "action": "Write pytest suites with fixtures, mocking, and coverage reports."},
            {"name": "Communication", "category": "soft_skills", "importance": "High", "req_prof": 3, "why": "Cross-functional design alignment and code reviews.", "action": "Practice explaining trade-offs concisely in architectural design reviews."}
        ]
    },
    "Java Developer": {
        "description": "Builds resilient, high-throughput enterprise systems, distributed microservices, and robust backend architectures with Java.",
        "skills": [
            {"name": "Java", "category": "programming_languages", "importance": "Critical", "req_prof": 4, "why": "Core language for enterprise computing and multi-threaded systems.", "action": "Master JVM memory model, garbage collection, Streams API, and concurrency."},
            {"name": "Spring Boot", "category": "frameworks_and_libraries", "importance": "Critical", "req_prof": 4, "why": "Defacto standard for microservices and enterprise Java applications.", "action": "Build Spring Boot services with Spring Data JPA and Spring Security."},
            {"name": "PostgreSQL", "category": "databases", "importance": "High", "req_prof": 3, "why": "Reliable relational database persistence.", "action": "Configure connection pooling (HikariCP) and optimize indexing."},
            {"name": "REST APIs", "category": "frameworks_and_libraries", "importance": "High", "req_prof": 3, "why": "Microservice communication standard.", "action": "Design REST endpoints with Spring MVC and validate payloads."},
            {"name": "Docker", "category": "cloud_and_devops", "importance": "Medium", "req_prof": 3, "why": "Packaging Java artifacts for container runtimes.", "action": "Create minimal JRE Docker containers with Alpine or distroless images."},
            {"name": "Data Structures & Algorithms", "category": "cs_fundamentals", "importance": "High", "req_prof": 4, "why": "Algorithmic thinking and computational complexity.", "action": "Solve graph, dynamic programming, and heap problems in Java."},
            {"name": "Git", "category": "tools_and_platforms", "importance": "High", "req_prof": 3, "why": "Version control and CI/CD integration.", "action": "Manage trunk-based development with feature branches."},
            {"name": "System Design", "category": "cs_fundamentals", "importance": "High", "req_prof": 3, "why": "Designing scalable, fault-tolerant enterprise architectures.", "action": "Learn message queues (Kafka/RabbitMQ), caching, and load balancing."}
        ]
    },
    "Full Stack Developer": {
        "description": "Delivers end-to-end features spanning responsive web user interfaces, robust backend APIs, and database persistence layers.",
        "skills": [
            {"name": "JavaScript", "category": "programming_languages", "importance": "Critical", "req_prof": 4, "why": "Foundational language for both client-side and server-side runtimes.", "action": "Master ES6+, closures, async/await, and event loop mechanics."},
            {"name": "TypeScript", "category": "programming_languages", "importance": "High", "req_prof": 3, "why": "Strong typing for scalable full-stack codebases.", "action": "Apply generics, utility types, and strict null checks across frontend and backend."},
            {"name": "React", "category": "frameworks_and_libraries", "importance": "Critical", "req_prof": 4, "why": "Leading component-based UI framework.", "action": "Master custom hooks, state management, memoization, and server rendering."},
            {"name": "Node.js", "category": "frameworks_and_libraries", "importance": "High", "req_prof": 3, "why": "Server-side JavaScript runtime for API services.", "action": "Build Express or Fastify microservices with error middleware."},
            {"name": "Tailwind CSS", "category": "frameworks_and_libraries", "importance": "Medium", "req_prof": 3, "why": "Utility-first CSS framework for rapid responsive design.", "action": "Construct responsive mobile-first layouts with dark mode support."},
            {"name": "PostgreSQL", "category": "databases", "importance": "High", "req_prof": 3, "why": "Primary relational database engine.", "action": "Model relational schemas and handle relational constraints and migrations."},
            {"name": "REST APIs", "category": "frameworks_and_libraries", "importance": "Critical", "req_prof": 4, "why": "Communication contract between UI and backend.", "action": "Standardize pagination, filtering, error contracts, and API security."},
            {"name": "Git", "category": "tools_and_platforms", "importance": "High", "req_prof": 3, "why": "Team collaboration and code review workflows.", "action": "Collaborate with feature branching and pull request reviews."},
            {"name": "Docker", "category": "cloud_and_devops", "importance": "Medium", "req_prof": 2, "why": "Local multi-container dev environments.", "action": "Compose frontend, backend, and database in docker-compose.yml."}
        ]
    },
    "Backend Developer": {
        "description": "Architects high-performance server-side APIs, database schemas, asynchronous queues, and scalable microservices.",
        "skills": [
            {"name": "Python", "category": "programming_languages", "importance": "Critical", "req_prof": 4, "why": "Primary server language for rapid API development.", "action": "Implement async background workers and optimize memory usage."},
            {"name": "REST APIs", "category": "frameworks_and_libraries", "importance": "Critical", "req_prof": 4, "why": "Core interface for distributed systems.", "action": "Implement caching headers, rate limiting, and authentication flows."},
            {"name": "PostgreSQL", "category": "databases", "importance": "Critical", "req_prof": 4, "why": "Data integrity, ACID compliance, and query performance.", "action": "Optimize indexing, solve N+1 query patterns, and write transaction logic."},
            {"name": "Redis", "category": "databases", "importance": "High", "req_prof": 3, "why": "In-memory caching and session store.", "action": "Use Redis for cache-aside patterns, rate limiting, and pub/sub queues."},
            {"name": "Docker", "category": "cloud_and_devops", "importance": "High", "req_prof": 3, "why": "Consistent microservice containerization.", "action": "Containerize services and configure environment variable injection."},
            {"name": "System Design", "category": "cs_fundamentals", "importance": "Critical", "req_prof": 4, "why": "Architecture of highly available distributed systems.", "action": "Study database sharding, CAP theorem, message brokers, and CDNs."},
            {"name": "Data Structures & Algorithms", "category": "cs_fundamentals", "importance": "High", "req_prof": 3, "why": "Computational efficiency and algorithmic problem solving.", "action": "Analyze time and space complexity with Big-O notation."}
        ]
    },
    "Frontend Developer": {
        "description": "Specializes in modern user interfaces, responsive web applications, design systems, and client-side performance.",
        "skills": [
            {"name": "JavaScript", "category": "programming_languages", "importance": "Critical", "req_prof": 4, "why": "Core scripting language of the web platform.", "action": "Master event bubbling, DOM manipulation, promises, and module loaders."},
            {"name": "TypeScript", "category": "programming_languages", "importance": "High", "req_prof": 3, "why": "Reliable type safety for component interfaces.", "action": "Type complex React props, event handlers, and API response payloads."},
            {"name": "React", "category": "frameworks_and_libraries", "importance": "Critical", "req_prof": 4, "why": "Industry leading frontend UI library.", "action": "Master state lifting, Context API, useCallback/useMemo, and virtual DOM."},
            {"name": "HTML & CSS", "category": "frameworks_and_libraries", "importance": "Critical", "req_prof": 4, "why": "Semantic web documents and responsive styling.", "action": "Build accessible semantic HTML5 layouts with Flexbox and Grid."},
            {"name": "Tailwind CSS", "category": "frameworks_and_libraries", "importance": "High", "req_prof": 3, "why": "Standard styling framework in modern web applications.", "action": "Build reusable UI component design tokens with Tailwind."},
            {"name": "Web Performance", "category": "tools_and_platforms", "importance": "Medium", "req_prof": 3, "why": "Lighthouse score, Core Web Vitals, and fast rendering.", "action": "Optimize bundle size, code splitting, lazy loading, and asset caching."},
            {"name": "Git", "category": "tools_and_platforms", "importance": "High", "req_prof": 3, "why": "Version control and collaborative PR workflows.", "action": "Maintain clean commit histories and manage merge conflicts."}
        ]
    },
    "Data Analyst": {
        "description": "Transforms raw transactional data into business intelligence, KPI dashboards, and statistical insights.",
        "skills": [
            {"name": "SQL", "category": "databases", "importance": "Critical", "req_prof": 4, "why": "Foundational querying language for analytical warehouses.", "action": "Master window functions (ROW_NUMBER, LAG, LEAD), CTEs, and aggregation."},
            {"name": "Python", "category": "programming_languages", "importance": "High", "req_prof": 3, "why": "Data wrangling, automation, and exploratory data analysis.", "action": "Clean messy tabular data and automate reporting scripts."},
            {"name": "Pandas", "category": "frameworks_and_libraries", "importance": "High", "req_prof": 3, "why": "Tabular data manipulation and transformation.", "action": "Practice merge, group-by, pivot tables, and datetime parsing."},
            {"name": "Data Visualization", "category": "tools_and_platforms", "importance": "High", "req_prof": 4, "why": "Communicating insights visually to executive stakeholders.", "action": "Create informative charts using Matplotlib, Seaborn, or Tableau."},
            {"name": "Statistical Analysis", "category": "cs_fundamentals", "importance": "Medium", "req_prof": 3, "why": "Hypothesis testing and identifying significant trends.", "action": "Calculate confidence intervals, p-values, correlation vs causation."},
            {"name": "Communication", "category": "soft_skills", "importance": "Critical", "req_prof": 4, "why": "Translating technical numbers into actionable business strategy.", "action": "Practice presenting data stories with clear executive takeaways."}
        ]
    },
    "Data Scientist": {
        "description": "Applies statistical modeling, predictive machine learning, and deep exploratory analytics to solve business challenges.",
        "skills": [
            {"name": "Python", "category": "programming_languages", "importance": "Critical", "req_prof": 4, "why": "De facto standard language for data science and modeling.", "action": "Write modular, vectorized Python code for data pipelines."},
            {"name": "Pandas", "category": "frameworks_and_libraries", "importance": "Critical", "req_prof": 4, "why": "Core data manipulation and feature engineering library.", "action": "Handle missing values, categorical encoding, and feature scaling."},
            {"name": "Machine Learning", "category": "ai_and_ml", "importance": "Critical", "req_prof": 4, "why": "Supervised and unsupervised predictive algorithms.", "action": "Train regression, classification (Random Forest, XGBoost), and clustering models."},
            {"name": "SQL", "category": "databases", "importance": "High", "req_prof": 3, "why": "Extracting large datasets from cloud data warehouses.", "action": "Write optimized analytical queries on distributed tables."},
            {"name": "Statistical Analysis", "category": "cs_fundamentals", "importance": "High", "req_prof": 4, "why": "Grounding predictive models in mathematical rigor.", "action": "Conduct A/B tests, ANOVA, cross-validation, and bias-variance tradeoff analysis."},
            {"name": "Data Visualization", "category": "tools_and_platforms", "importance": "Medium", "req_prof": 3, "why": "Visual diagnostics of model performance and data distributions.", "action": "Plot ROC curves, confusion matrices, and feature importance charts."}
        ]
    },
    "Machine Learning Engineer": {
        "description": "Takes machine learning models from prototype to production, building scalable inference APIs and training pipelines.",
        "skills": [
            {"name": "Python", "category": "programming_languages", "importance": "Critical", "req_prof": 4, "why": "Language for ML model development and deployment.", "action": "Optimize tensor computation and multiprocessing pipelines."},
            {"name": "Machine Learning", "category": "ai_and_ml", "importance": "Critical", "req_prof": 4, "why": "Theoretical and practical foundation of predictive models.", "action": "Implement regularization, hyperparameter tuning, and model evaluation metrics."},
            {"name": "Deep Learning", "category": "ai_and_ml", "importance": "High", "req_prof": 3, "why": "Neural networks for computer vision, NLP, and tabular embeddings.", "action": "Train neural nets in PyTorch with loss functions, optimizers, and dataloaders."},
            {"name": "Docker", "category": "cloud_and_devops", "importance": "High", "req_prof": 3, "why": "Packaging model weights and dependencies into portable images.", "action": "Create GPU-accelerated Docker containers for model serving."},
            {"name": "FastAPI", "category": "frameworks_and_libraries", "importance": "High", "req_prof": 3, "why": "Low-latency REST endpoints for live model inference.", "action": "Serve model predictions with asynchronous batching and schema validation."},
            {"name": "Data Structures & Algorithms", "category": "cs_fundamentals", "importance": "High", "req_prof": 3, "why": "Efficient matrix operations and algorithmic complexity.", "action": "Optimize computational complexity of custom preprocessing algorithms."},
            {"name": "Git", "category": "tools_and_platforms", "importance": "High", "req_prof": 3, "why": "Version control for code and configuration.", "action": "Collaborate on model code with Git and experiment tracking."}
        ]
    },
    "AI Engineer": {
        "description": "Develops intelligent applications utilizing Large Language Models (LLMs), RAG pipelines, agents, and generative AI.",
        "skills": [
            {"name": "Python", "category": "programming_languages", "importance": "Critical", "req_prof": 4, "why": "Primary language for generative AI orchestration.", "action": "Build asynchronous LLM pipelines with structured outputs and error handling."},
            {"name": "AI & GenAI", "category": "ai_and_ml", "importance": "Critical", "req_prof": 4, "why": "Foundational knowledge of transformers, tokens, and prompt engineering.", "action": "Implement few-shot prompting, system instructions, and temperature tuning."},
            {"name": "RAG & Vector DBs", "category": "ai_and_ml", "importance": "Critical", "req_prof": 4, "why": "Retrieval Augmented Generation with semantic search.", "action": "Create vector embeddings, chunk documents, and query vector databases."},
            {"name": "FastAPI", "category": "frameworks_and_libraries", "importance": "High", "req_prof": 3, "why": "Serving generative AI APIs and webhooks.", "action": "Implement streaming SSE endpoints for token-by-token LLM responses."},
            {"name": "PostgreSQL", "category": "databases", "importance": "High", "req_prof": 3, "why": "Storage of user chat history, sessions, and pgvector embeddings.", "action": "Store structured outputs and manage relational user sessions."},
            {"name": "Docker", "category": "cloud_and_devops", "importance": "Medium", "req_prof": 3, "why": "Deploying containerized AI microservices.", "action": "Deploy containerized AI apps with environment secret injection."},
            {"name": "System Design", "category": "cs_fundamentals", "importance": "High", "req_prof": 3, "why": "Designing fault tolerant AI architectures with rate limits and fallbacks.", "action": "Design multi-agent fallback architectures with semantic caching."}
        ]
    },
    "Cloud Engineer": {
        "description": "Provisions, secures, and automates scalable cloud infrastructure, networks, and CI/CD pipelines.",
        "skills": [
            {"name": "Cloud (AWS/GCP/Azure)", "category": "cloud_and_devops", "importance": "Critical", "req_prof": 4, "why": "Core public cloud architecture, IAM, VPC, and compute services.", "action": "Design multi-tier secure cloud networks with private subnets and IAM roles."},
            {"name": "Docker", "category": "cloud_and_devops", "importance": "Critical", "req_prof": 4, "why": "Containerization standard across cloud infrastructure.", "action": "Build optimized container images and configure runtime security."},
            {"name": "Kubernetes", "category": "cloud_and_devops", "importance": "High", "req_prof": 3, "why": "Industry standard container orchestration.", "action": "Deploy Deployments, Services, Ingress, and ConfigMaps in Kubernetes."},
            {"name": "Linux", "category": "tools_and_platforms", "importance": "Critical", "req_prof": 4, "why": "Host operating system for almost all cloud workloads.", "action": "Master shell scripting, process management, SSH keys, and systemd."},
            {"name": "CI/CD", "category": "cloud_and_devops", "importance": "High", "req_prof": 3, "why": "Automating continuous integration and continuous deployment.", "action": "Create automated build, test, and deploy pipelines with GitHub Actions."},
            {"name": "Python", "category": "programming_languages", "importance": "Medium", "req_prof": 3, "why": "Infrastructure automation scripts and Lambda functions.", "action": "Write automation scripts with Boto3 / cloud SDKs."},
            {"name": "Cybersecurity", "category": "cloud_and_devops", "importance": "High", "req_prof": 3, "why": "Cloud security, least privilege IAM, and encryption at rest/in transit.", "action": "Audit security groups, rotate access keys, and configure KMS encryption."}
        ]
    },
    "Cybersecurity Analyst": {
        "description": "Defends organizational infrastructure against cyber threats, conducts vulnerability assessments, and enforces compliance.",
        "skills": [
            {"name": "Cybersecurity", "category": "cloud_and_devops", "importance": "Critical", "req_prof": 4, "why": "Core principles of defense-in-depth, threat modeling, and OWASP.", "action": "Analyze vulnerabilities, penetration testing concepts, and MITRE ATT&CK."},
            {"name": "Linux", "category": "tools_and_platforms", "importance": "Critical", "req_prof": 4, "why": "Command-line auditing, log analysis, and system security.", "action": "Inspect system logs (/var/log), manage permissions, and configure iptables."},
            {"name": "Networking", "category": "cs_fundamentals", "importance": "Critical", "req_prof": 4, "why": "TCP/IP, DNS, SSL/TLS, packet inspection, and firewalls.", "action": "Analyze packet captures in Wireshark and troubleshoot TLS handshakes."},
            {"name": "Python", "category": "programming_languages", "importance": "High", "req_prof": 3, "why": "Security automation, log parsing, and scanning scripts.", "action": "Write scripts to parse access logs and automate port scanning."},
            {"name": "Cloud (AWS/GCP/Azure)", "category": "cloud_and_devops", "importance": "High", "req_prof": 3, "why": "Securing cloud workloads, IAM roles, and VPC endpoints.", "action": "Configure CloudTrail auditing, guardrails, and IAM least privilege."},
            {"name": "Communication", "category": "soft_skills", "importance": "High", "req_prof": 3, "why": "Documenting incident response reports for leadership.", "action": "Write clear security advisories and incident remediation steps."}
        ]
    },
    "Software Development Engineer": {
        "description": "Solves complex algorithmic problems, writes clean maintainable software, and designs scalable distributed architectures.",
        "skills": [
            {"name": "Data Structures & Algorithms", "category": "cs_fundamentals", "importance": "Critical", "req_prof": 4, "why": "Core algorithmic problem solving and time/space optimization.", "action": "Master graphs, dynamic programming, binary search, and tree traversals."},
            {"name": "Python", "category": "programming_languages", "importance": "Critical", "req_prof": 4, "why": "Primary programming language for system implementation.", "action": "Write clean, modular, and maintainable object-oriented code."},
            {"name": "System Design", "category": "cs_fundamentals", "importance": "Critical", "req_prof": 4, "why": "Designing high-scale distributed systems and APIs.", "action": "Design architectures balancing consistency, availability, latency, and throughput."},
            {"name": "PostgreSQL", "category": "databases", "importance": "High", "req_prof": 3, "why": "Relational data modeling, transactions, and indexing.", "action": "Design normalized schemas, evaluate isolation levels, and write complex queries."},
            {"name": "Git", "category": "tools_and_platforms", "importance": "High", "req_prof": 3, "why": "Version control and collaborative engineering.", "action": "Conduct rigorous code reviews and manage Git branching models."},
            {"name": "REST APIs", "category": "frameworks_and_libraries", "importance": "High", "req_prof": 3, "why": "Service-oriented architecture and inter-service communication.", "action": "Design clean API contracts with versioning and validation."},
            {"name": "Docker", "category": "cloud_and_devops", "importance": "Medium", "req_prof": 3, "why": "Consistent runtime environment across developer and cloud instances.", "action": "Build and run containerized services."},
            {"name": "Communication", "category": "soft_skills", "importance": "High", "req_prof": 3, "why": "Technical design documentation and sprint collaboration.", "action": "Write engineering design proposals (RFCs) with alternative analysis."}
        ]
    }
}

# ==========================================
# 2. SKILL NORMALIZATION & EXTRACTION ENGINE
# ==========================================

NORMALIZATION_MAP = {
    "python3": "Python",
    "python 3": "Python",
    "fast api": "FastAPI",
    "fastapi": "FastAPI",
    "django rest framework": "Django",
    "drf": "Django",
    "react.js": "React",
    "reactjs": "React",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "node": "Node.js",
    "nodejs": "Node.js",
    "express.js": "Node.js",
    "expressjs": "Node.js",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "k8s": "Kubernetes",
    "aws ec2": "AWS",
    "amazon web services": "AWS",
    "gcp": "Cloud (AWS/GCP/Azure)",
    "azure": "Cloud (AWS/GCP/Azure)",
    "dsa": "Data Structures & Algorithms",
    "algorithms": "Data Structures & Algorithms",
    "data structures": "Data Structures & Algorithms",
    "system architecture": "System Design",
    "distributed systems": "System Design",
    "restful": "REST APIs",
    "rest api": "REST APIs",
    "rest": "REST APIs",
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "pytorch": "Deep Learning",
    "tensorflow": "Deep Learning",
    "nlp": "AI & GenAI",
    "genai": "AI & GenAI",
    "llm": "AI & GenAI",
    "generative ai": "AI & GenAI",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "html": "HTML & CSS",
    "css": "HTML & CSS",
    "html5": "HTML & CSS",
    "css3": "HTML & CSS",
    "ci / cd": "CI/CD",
    "github actions": "CI/CD",
    "infosec": "Cybersecurity",
    "security": "Cybersecurity"
}

def normalize_skill_name(raw_name: str) -> str:
    cleaned = raw_name.strip()
    lowered = cleaned.lower()
    if lowered in NORMALIZATION_MAP:
        return NORMALIZATION_MAP[lowered]
    # Check partial matches
    for key, val in NORMALIZATION_MAP.items():
        if key == lowered or f" {key} " in f" {lowered} ":
            return val
    return cleaned

def categorize_skill(skill_name: str) -> str:
    norm = normalize_skill_name(skill_name)
    lang = ["Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "Go", "Rust", "SQL", "Ruby", "PHP", "Kotlin", "Swift"]
    frame = ["FastAPI", "Django", "Flask", "React", "Next.js", "Node.js", "Spring Boot", "REST APIs", "GraphQL", "Tailwind CSS", "HTML & CSS", "Vue", "Angular"]
    db = ["PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "SQLAlchemy", "Cassandra", "Elasticsearch"]
    cloud = ["Docker", "Kubernetes", "AWS", "Cloud (AWS/GCP/Azure)", "CI/CD", "Linux", "Cybersecurity", "Terraform"]
    ai = ["Machine Learning", "Deep Learning", "AI & GenAI", "Pandas", "Scikit-Learn", "RAG & Vector DBs"]
    cs = ["Data Structures & Algorithms", "System Design", "Statistical Analysis", "Networking", "Operating Systems"]
    tools = ["Git", "Linux", "Data Visualization", "Unit Testing", "Web Performance", "Jira", "Postman"]
    
    if norm in lang: return "programming_languages"
    if norm in frame: return "frameworks_and_libraries"
    if norm in db: return "databases"
    if norm in cloud: return "cloud_and_devops"
    if norm in ai: return "ai_and_ml"
    if norm in cs: return "cs_fundamentals"
    if norm in tools: return "tools_and_platforms"
    return "soft_skills"

# ==========================================
# 3. INTERVIEW PERFORMANCE EVIDENCE INTEGRATION
# ==========================================

def extract_interview_evidence(user_id: str, db: Session) -> Dict[str, Dict[str, Any]]:
    """
    Inspects completed InterviewSession, QuestionAnswer, and EvaluationReport records
    for the current user to find verified demonstrated skills vs demonstrated weak areas.
    """
    evidence_map = {}
    
    # 1. Look for user's completed sessions
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == user_id,
        InterviewSession.status.in_(["completed", "evaluated", "in_progress"])
    ).all()
    
    if not sessions:
        return evidence_map
        
    session_ids = [s.id for s in sessions]
    
    # 2. Extract Q&A records
    qas = db.query(QuestionAnswer).filter(
        QuestionAnswer.session_id.in_(session_ids)
    ).all()
    
    for qa in qas:
        target = qa.target_competency or ""
        demonstrated = qa.demonstrated_concepts or []
        missing = qa.missing_concepts or []
        score = qa.score or 0.0 # 0.0 - 4.0
        
        # Check competency name
        norm_target = normalize_skill_name(target)
        if norm_target and len(norm_target) > 1:
            if norm_target not in evidence_map:
                evidence_map[norm_target] = {"scores": [], "demonstrated_count": 0, "missing_count": 0, "quotes": []}
            evidence_map[norm_target]["scores"].append(score)
            if score >= 2.8:
                evidence_map[norm_target]["demonstrated_count"] += 1
                if qa.answer_summary:
                    evidence_map[norm_target]["quotes"].append(qa.answer_summary[:120] + "...")
            elif score < 2.2:
                evidence_map[norm_target]["missing_count"] += 1

        # Check demonstrated concepts
        for concept in demonstrated:
            norm_c = normalize_skill_name(concept)
            if norm_c not in evidence_map:
                evidence_map[norm_c] = {"scores": [], "demonstrated_count": 0, "missing_count": 0, "quotes": []}
            evidence_map[norm_c]["demonstrated_count"] += 1
            evidence_map[norm_c]["scores"].append(max(score, 3.2))

        # Check missing concepts
        for concept in missing:
            norm_m = normalize_skill_name(concept)
            if norm_m not in evidence_map:
                evidence_map[norm_m] = {"scores": [], "demonstrated_count": 0, "missing_count": 0, "quotes": []}
            evidence_map[norm_m]["missing_count"] += 1
            evidence_map[norm_m]["scores"].append(min(score, 1.8))

    return evidence_map

# ==========================================
# 4. SKILL GAP ENGINE
# ==========================================

def analyze_candidate_skills(
    candidate: Optional[Candidate],
    target_role: str,
    experience_level: str = "Intermediate",
    custom_jd_text: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Optional[Session] = None
) -> Dict[str, Any]:
    """
    Performs comprehensive skill gap analysis comparing candidate's resume,
    projects, experience, and interview performance against target role requirements.
    """
    # 1. Resolve role requirements
    role_def = ROLE_TAXONOMY_MAP.get(target_role)
    if not role_def:
        # Build dynamic requirements from custom JD or default template
        role_def = _build_custom_role_requirements(target_role, custom_jd_text)

    # Multiplier for experience level
    exp_level_multiplier = {
        "Beginner": 0.8,
        "Intermediate": 1.0,
        "Advanced": 1.25
    }.get(experience_level, 1.0)

    # 2. Extract candidate's raw profile data
    resume_skills = []
    projects_text = ""
    experience_text = ""
    raw_resume_text = ""

    if candidate:
        resume_skills = [normalize_skill_name(s) for s in (candidate.parsed_skills or [])]
        raw_resume_text = (candidate.raw_resume_text or "").lower()
        
        for p in (candidate.parsed_projects or []):
            if isinstance(p, dict):
                projects_text += f" {p.get('title', '')} {p.get('description', '')} {' '.join(p.get('technologies', []))}".lower()
            else:
                projects_text += f" {str(p)}".lower()

        for e in (candidate.parsed_experience or []):
            if isinstance(e, dict):
                experience_text += f" {e.get('title', '')} {e.get('company', '')} {e.get('description', '')}".lower()
            else:
                experience_text += f" {str(e)}".lower()

    # 3. Pull interview evidence if db & user_id available
    interview_evidence = {}
    if user_id and db:
        interview_evidence = extract_interview_evidence(user_id, db)

    # Also check existing UserSkillProgress reassessment records
    reassessed_skills = {}
    if user_id and db:
        prog_records = db.query(UserSkillProgress).filter(
            UserSkillProgress.user_id == user_id,
            UserSkillProgress.reassessment_passed == True
        ).all()
        for r in prog_records:
            reassessed_skills[r.skill_name] = r.current_proficiency

    # 4. Evaluate each requirement in the role taxonomy
    skill_breakdown = []
    total_weighted_score = 0.0
    total_weight = 0.0
    critical_gaps_count = 0
    strengths = []
    gaps_to_close = []

    weight_map = {
        "Critical": 3.5,
        "High": 2.2,
        "Medium": 1.2,
        "Low": 0.8
    }

    # Track extracted candidate skills by category
    extracted_by_category = {cat: [] for cat in SKILL_CATEGORIES}

    for req in role_def["skills"]:
        s_name = req["name"]
        norm_name = normalize_skill_name(s_name)
        category = req.get("category", categorize_skill(s_name))
        importance = req.get("importance", "Medium")
        base_req_prof = req.get("req_prof", 3)
        
        # Adjust required proficiency based on target level
        required_prof = min(5, max(1, round(base_req_prof * exp_level_multiplier)))
        
        why = req.get("why", "Required for technical proficiency in this role.")
        action = req.get("action", f"Practice and build projects utilizing {s_name}.")
        
        # Check evidence & determine estimated proficiency
        estimated_prof = None
        evidence_type = "None"
        evidence_details = "No supporting evidence found in resume or interview records."
        verified = False

        # Check 1: Passed ProofHire Reassessment Quiz (Highest verification)
        if s_name in reassessed_skills:
            estimated_prof = reassessed_skills[s_name]
            evidence_type = "ProofHire Reassessment Verified"
            evidence_details = f"Verified with $\ge 75\%$ score on technical reassessment quiz."
            verified = True
        # Check 2: Demonstrated in AI Interview
        elif norm_name in interview_evidence and interview_evidence[norm_name]["demonstrated_count"] > 0:
            avg_s = sum(interview_evidence[norm_name]["scores"]) / max(1, len(interview_evidence[norm_name]["scores"]))
            if avg_s >= 3.0:
                estimated_prof = 4
                evidence_type = "Demonstrated in AI Interview"
                quotes = interview_evidence[norm_name]["quotes"]
                evidence_details = f"Demonstrated with {avg_s:.1f}/4.0 score in AI mock interview. {quotes[0] if quotes else ''}"
                verified = True
            else:
                estimated_prof = 3
                evidence_type = "Partially Demonstrated in Interview"
                evidence_details = f"Addressed in interview with score {avg_s:.1f}/4.0."
        # Check 3: Applied in Projects / Work Experience
        elif (norm_name.lower() in projects_text or norm_name.lower() in experience_text):
            estimated_prof = 3
            evidence_type = "Applied in Projects / Work Experience"
            evidence_details = f"Mentioned in project or work experience descriptions with practical implementation context."
        # Check 4: Claimed in Resume Skills list or Raw Text
        elif (norm_name in resume_skills or norm_name.lower() in raw_resume_text):
            estimated_prof = 2
            evidence_type = "Claimed on Resume"
            evidence_details = f"Listed in resume skill set, but lacks verifiable project or live interview demonstration."
        
        # Gap Level Calculation
        gap_level = "Missing"
        status = "Missing Skill"

        if estimated_prof is not None:
            diff = estimated_prof - required_prof
            if diff >= 0:
                gap_level = "Strong"
                status = "Strong Skill"
                strengths.append(s_name)
            elif diff == -1:
                gap_level = "Minor Gap"
                status = "Skill to Improve"
                gaps_to_close.append({"name": s_name, "importance": importance, "gap": gap_level})
            elif diff == -2:
                gap_level = "Moderate Gap"
                status = "Skill to Improve"
                gaps_to_close.append({"name": s_name, "importance": importance, "gap": gap_level})
            else:
                gap_level = "Critical Gap"
                status = "Skill to Improve"
                gaps_to_close.append({"name": s_name, "importance": importance, "gap": gap_level})
                critical_gaps_count += 1
        else:
            if importance in ["Critical", "High"]:
                critical_gaps_count += 1
            gaps_to_close.append({"name": s_name, "importance": importance, "gap": "Missing"})

        # Record candidate skill if detected
        if estimated_prof is not None:
            extracted_by_category[category].append({
                "name": s_name,
                "proficiency": estimated_prof,
                "evidence": evidence_type
            })

        # Calculate weighted score
        w = weight_map.get(importance, 1.0)
        total_weight += w
        if estimated_prof is not None:
            # Score contribution ratio
            ratio = min(1.0, estimated_prof / max(1, required_prof))
            total_weighted_score += (ratio * w)

        # Resource links
        res_info = VERIFIED_RESOURCES.get(s_name, {
            "title": f"{s_name} Documentation",
            "url": f"https://developer.mozilla.org/en-US/search?q={s_name}",
            "type": "Documentation"
        })

        skill_breakdown.append({
            "skill_name": s_name,
            "category": category,
            "category_label": CATEGORY_LABELS.get(category, category),
            "importance": importance,
            "required_proficiency": required_prof,
            "estimated_proficiency": estimated_prof,
            "gap_level": gap_level,
            "status": status,
            "evidence_type": evidence_type,
            "evidence_details": evidence_details,
            "why_it_matters": why,
            "recommended_action": action,
            "verified": verified,
            "resource": res_info
        })

    # Match Percentage
    overall_match = 0.0
    if total_weight > 0:
        overall_match = round((total_weighted_score / total_weight) * 100.0, 1)

    # Readiness Classification
    if overall_match >= 85.0:
        readiness_status = "Role Ready"
    elif overall_match >= 70.0:
        readiness_status = "Near Ready (Minor Upskilling Needed)"
    elif overall_match >= 50.0:
        readiness_status = "Needs Focused Upskilling"
    else:
        readiness_status = "Foundational Stage"

    summary_text = (
        f"Candidate matches {overall_match}% of the core competencies for {target_role} ({experience_level} level). "
        f"Demonstrated {len(strengths)} key strengths. Identified {critical_gaps_count} critical gaps requiring priority upskilling."
    )

    return {
        "target_role": target_role,
        "experience_level": experience_level,
        "overall_match_percentage": overall_match,
        "readiness_status": readiness_status,
        "summary": summary_text,
        "critical_gaps_count": critical_gaps_count,
        "strengths_count": len(strengths),
        "strengths": strengths,
        "extracted_skills": extracted_by_category,
        "skill_breakdown": skill_breakdown
    }

def _build_custom_role_requirements(role_title: str, custom_jd: Optional[str]) -> Dict[str, Any]:
    """Generates a structured role taxonomy for custom roles or pasted JDs."""
    skills = []
    
    # Common default foundational tech
    core_skills = [
        {"name": "Python", "category": "programming_languages", "importance": "Critical", "req_prof": 4},
        {"name": "REST APIs", "category": "frameworks_and_libraries", "importance": "High", "req_prof": 3},
        {"name": "SQL", "category": "databases", "importance": "High", "req_prof": 3},
        {"name": "Git", "category": "tools_and_platforms", "importance": "High", "req_prof": 3},
        {"name": "Data Structures & Algorithms", "category": "cs_fundamentals", "importance": "High", "req_prof": 3},
        {"name": "Docker", "category": "cloud_and_devops", "importance": "Medium", "req_prof": 3},
        {"name": "Communication", "category": "soft_skills", "importance": "High", "req_prof": 3}
    ]

    if custom_jd:
        lowered = custom_jd.lower()
        for key, res in VERIFIED_RESOURCES.items():
            if key.lower() in lowered and not any(s["name"] == key for s in core_skills):
                core_skills.append({
                    "name": key,
                    "category": categorize_skill(key),
                    "importance": "High",
                    "req_prof": 3,
                    "why": f"Explicitly listed in target job description.",
                    "action": f"Master {key} fundamentals and practical implementation."
                })

    return {
        "description": f"Custom role profile for {role_title}",
        "skills": core_skills
    }

# ==========================================
# 5. MULTI-ROLE COMPARISON ENGINE
# ==========================================

def compare_multiple_roles(
    candidate: Optional[Candidate],
    roles: List[str],
    experience_level: str = "Intermediate",
    user_id: Optional[str] = None,
    db: Optional[Session] = None
) -> Dict[str, Any]:
    """
    Compares candidate profile against 2-3 target roles simultaneously,
    highlighting transferable skills, match discrepancies, and timeline to readiness.
    """
    results = []
    transferable_pool = {}

    for r_title in roles[:3]:
        analysis = analyze_candidate_skills(
            candidate=candidate,
            target_role=r_title,
            experience_level=experience_level,
            user_id=user_id,
            db=db
        )

        # Collect transferable skills
        for item in analysis["skill_breakdown"]:
            if item["gap_level"] in ["Strong", "Minor Gap"]:
                transferable_pool[item["skill_name"]] = transferable_pool.get(item["skill_name"], 0) + 1

        # Estimate weeks to close gaps
        crit_count = analysis["critical_gaps_count"]
        est_weeks = max(2, min(12, crit_count * 2 + 1))

        results.append({
            "role": r_title,
            "overall_match": analysis["overall_match_percentage"],
            "readiness_status": analysis["readiness_status"],
            "critical_gaps": crit_count,
            "strengths_count": analysis["strengths_count"],
            "estimated_weeks_to_ready": est_weeks,
            "top_gaps": [item["skill_name"] for item in analysis["skill_breakdown"] if item["gap_level"] in ["Critical Gap", "Missing"]][:4],
            "top_strengths": analysis["strengths"][:4]
        })

    # Transferable across all selected roles
    common_transferable = [s for s, count in transferable_pool.items() if count >= 2]

    return {
        "roles_compared": results,
        "common_transferable_skills": common_transferable,
        "recommended_role": max(results, key=lambda x: x["overall_match"])["role"] if results else None
    }

# ==========================================
# 6. PERSONALIZED LEARNING ROADMAP GENERATOR
# ==========================================

def generate_learning_roadmap(
    skill_breakdown: List[Dict[str, Any]],
    target_role: str,
    daily_commitment: str = "1h",
    timeline_weeks: int = 4
) -> List[Dict[str, Any]]:
    """
    Constructs an actionable, milestone-based learning roadmap targeting identified gaps
    with realistic time budgets, official documentation links, hands-on tasks, and portfolio blueprints.
    """
    # Filter gaps in priority order: Critical Gaps -> Missing Skills -> Moderate Gaps -> Minor Gaps
    critical_skills = [s for s in skill_breakdown if s["gap_level"] == "Critical Gap" or (s["gap_level"] == "Missing" and s["importance"] == "Critical")]
    high_skills = [s for s in skill_breakdown if s["gap_level"] in ["Moderate Gap", "Missing"] and s["importance"] == "High"]
    minor_skills = [s for s in skill_breakdown if s["gap_level"] in ["Minor Gap", "Moderate Gap"] and s["importance"] in ["Medium", "Low"]]

    priority_queue = critical_skills + high_skills + minor_skills

    # If candidate is already strong on everything, provide advanced mastery topics
    if not priority_queue:
        priority_queue = [s for s in skill_breakdown if s["importance"] in ["Critical", "High"]]

    milestones = []
    num_weeks = max(2, min(8, timeline_weeks))
    skills_per_week = max(1, len(priority_queue) // num_weeks + 1)

    # Commitment minutes per day
    mins_per_day = {"30m": 30, "1h": 60, "2h": 120}.get(daily_commitment, 60)

    # Blueprint library
    blueprints = [
        {
            "title": f"High-Throughput {target_role} Core Service",
            "description": f"Architect and deploy a production-grade backend service implementing async operations, JWT security, and structured logging.",
            "tech_stack": ["Python", "FastAPI", "PostgreSQL", "Docker"],
            "deliverable": "Working Dockerized GitHub repository with OpenAPI docs, unit tests, and CI/CD workflow."
        },
        {
            "title": f"Scalable Real-Time Event Pipeline",
            "description": f"Design an asynchronous message processing system with Redis caching, transaction retries, and data validation.",
            "tech_stack": ["Redis", "PostgreSQL", "SQLAlchemy", "REST APIs"],
            "deliverable": "Benchmarked microservice handling 1,000 requests/sec with live latency metrics."
        },
        {
            "title": f"End-to-End Enterprise System & Architecture",
            "description": f"Comprehensive portfolio project demonstrating end-to-end full stack architecture, database indexing, and resilience.",
            "tech_stack": ["React", "FastAPI", "Docker", "Git"],
            "deliverable": "Live hosted web app with automated integration test suite and System Architecture RFC."
        },
        {
            "title": f"Cloud-Native Distributed Solution",
            "description": f"Multi-container application orchestrated with health checks, structured observability, and zero-downtime deployment.",
            "tech_stack": ["Docker", "Kubernetes", "CI/CD", "Linux"],
            "deliverable": "Kubernetes manifest repository with Helm chart and GitHub Actions deploy pipeline."
        }
    ]

    for w in range(1, num_weeks + 1):
        start_idx = (w - 1) * skills_per_week
        week_skills = priority_queue[start_idx:start_idx + skills_per_week]
        if not week_skills and priority_queue:
            week_skills = [priority_queue[w % len(priority_queue)]]

        skill_names = [s["skill_name"] for s in week_skills]
        tasks = []

        for idx, sk in enumerate(week_skills):
            res = sk.get("resource") or VERIFIED_RESOURCES.get(sk["skill_name"], {
                "title": f"{sk['skill_name']} Official Docs",
                "url": "https://developer.mozilla.org/",
                "type": "Documentation"
            })
            
            tasks.append({
                "task_id": f"w{w}_t{idx+1}",
                "title": f"Study & Master: {sk['skill_name']}",
                "duration_minutes": mins_per_day * 2,
                "resource_title": res.get("title", f"{sk['skill_name']} Documentation"),
                "resource_url": res.get("url", "https://developer.mozilla.org/"),
                "resource_type": res.get("type", "Documentation"),
                "exercise": sk.get("recommended_action", f"Build a practical implementation using {sk['skill_name']}."),
                "why_it_matters": sk.get("why_it_matters", "Core competency for this role.")
            })

        bp = blueprints[(w - 1) % len(blueprints)]

        milestones.append({
            "week": w,
            "phase": f"Phase {w}: {'Foundations & Critical Gaps' if w == 1 else 'Core Competency Scaling' if w == 2 else 'Advanced Integration & Delivery'}",
            "title": f"Week {w} Milestone — Focus on {', '.join(skill_names[:2])}",
            "description": f"Targeting {len(skill_names)} critical skills with dedicated daily practice ({daily_commitment}/day).",
            "skills_targeted": skill_names,
            "tasks": tasks,
            "project_blueprint": bp
        })

    return milestones

# ==========================================
# 7. REASSESSMENT QUIZ QUESTION BANK
# ==========================================

REASSESSMENT_QUIZ_BANK = {
    "Python": [
        {
            "question": "What is the primary difference between a Python list and a generator expression in terms of memory?",
            "options": [
                "Generators evaluate lazily yielding one item at a time in O(1) memory, while lists allocate full memory upfront",
                "Lists are immutable whereas generators are mutable",
                "Generators cannot be iterated with a for loop",
                "There is no difference in memory allocation"
            ],
            "correct_index": 0,
            "explanation": "Generators produce items on demand using the iterator protocol, resulting in constant O(1) auxiliary memory consumption."
        },
        {
            "question": "How does Python's GIL (Global Interpreter Lock) impact multithreaded CPU-bound execution?",
            "options": [
                "It enables parallel execution across multiple CPU cores for CPU-bound tasks",
                "It restricts CPython bytecode execution to one native thread at a time, preventing true multicore parallelism for CPU-bound work",
                "It automatically converts CPU-bound tasks into asynchronous coroutines",
                "It disables memory garbage collection"
            ],
            "correct_index": 1,
            "explanation": "The GIL ensures memory safety in CPython by allowing only one thread to execute Python bytecode at a time, making multiprocessing necessary for CPU-bound parallelism."
        },
        {
            "question": "What is the purpose of Python's `asyncio.gather(*tasks)`?",
            "options": [
                "Terminates all running coroutines",
                "Executes multiple asynchronous coroutines concurrently and waits for all of them to complete",
                "Converts synchronous blocking functions into coroutines",
                "Locks the database session"
            ],
            "correct_index": 1,
            "explanation": "`asyncio.gather` takes coroutines or futures and runs them concurrently in the event loop, returning an aggregated list of results."
        }
    ],
    "FastAPI": [
        {
            "question": "How does FastAPI achieve high performance comparable to Node.js and Go?",
            "options": [
                "By compiling Python to C machine code at runtime",
                "By using Starlette for web tooling and Pydantic for data validation on top of ASGI async runtimes like Uvicorn",
                "By disabling request serialization",
                "By running in a dedicated multithreaded sandbox"
            ],
            "correct_index": 1,
            "explanation": "FastAPI is built on top of Starlette and Pydantic, executing on asynchronous ASGI web servers like Uvicorn."
        },
        {
            "question": "What happens if a client submits an invalid request payload according to a Pydantic schema in FastAPI?",
            "options": [
                "FastAPI returns a 500 Internal Server Error",
                "FastAPI automatically ignores the invalid fields",
                "FastAPI returns a 422 Unprocessable Entity error with detailed JSON validation messages",
                "The server crashes and restarts"
            ],
            "correct_index": 2,
            "explanation": "FastAPI automatically validates request data and responds with HTTP status 422 containing exact field-level validation errors."
        },
        {
            "question": "What is the primary role of `Depends()` in FastAPI?",
            "options": [
                "Declares dependency injection for database sessions, security tokens, or shared logic",
                "Installs missing third-party packages from PyPI",
                "Forces synchronous execution of endpoints",
                "Generates database migrations"
            ],
            "correct_index": 0,
            "explanation": "`Depends()` provides a hierarchical, reusable dependency injection mechanism for authentication, DB sessions, and business logic."
        }
    ],
    "PostgreSQL": [
        {
            "question": "What is an index scan versus a sequential scan in PostgreSQL query planning?",
            "options": [
                "An index scan traverses a B-Tree structure to retrieve matching row pointers directly, avoiding reading every table block",
                "A sequential scan is always faster than an index scan on large tables",
                "An index scan only works for integer primary keys",
                "Sequential scans disable ACID transaction isolation"
            ],
            "correct_index": 0,
            "explanation": "Index scans use B-Tree or Hash indexes to locate specific rows in $O(\\log N)$ time instead of scanning every disk page sequentially."
        },
        {
            "question": "What does the ACID 'I' (Isolation) property guarantee in relational databases?",
            "options": [
                "Immediate replication across read replicas",
                "Concurrent transactions execute without interfering with one another or reading intermediate uncommitted state",
                "Instant indexing on table creation",
                "In-memory caching of all active queries"
            ],
            "correct_index": 1,
            "explanation": "Isolation guarantees that concurrently running transactions appear to run serially or according to defined isolation levels without dirty reads."
        },
        {
            "question": "Why is an 'N+1 query problem' detrimental to backend performance?",
            "options": [
                "It causes syntax errors in PostgreSQL",
                "It executes 1 initial query followed by N individual database queries inside a loop, multiplying round-trip network latency",
                "It consumes all available table IDs",
                "It prevents foreign keys from validating"
            ],
            "correct_index": 1,
            "explanation": "Instead of executing 1 bulk `JOIN` or `IN` query, an N+1 pattern queries the database repeatedly per row, creating severe network and connection bottlenecks."
        }
    ],
    "Docker": [
        {
            "question": "What is the key benefit of multi-stage Docker builds?",
            "options": [
                "They run multiple containers simultaneously from one image",
                "They separate the build environment from the lean runtime container, minimizing final image size and attack surface",
                "They allow Docker to execute without a Linux daemon",
                "They bypass container permission checks"
            ],
            "correct_index": 1,
            "explanation": "Multi-stage builds compile artifacts in an intermediate build container and only copy runtime essentials into the final production image."
        },
        {
            "question": "What is the difference between an `ENTRYPOINT` and `CMD` instruction in a Dockerfile?",
            "options": [
                "ENTRYPOINT sets the default executable, while CMD provides default arguments that can be easily overridden via CLI",
                "CMD cannot be overridden",
                "ENTRYPOINT only works on Windows containers",
                "There is no difference"
            ],
            "correct_index": 0,
            "explanation": "ENTRYPOINT configures the fixed container binary, whereas CMD defines default arguments that can be substituted at runtime."
        }
    ],
    "React": [
        {
            "question": "Why should you never mutate state directly in React (e.g. `state.items.push(x)`)?",
            "options": [
                "Direct mutation skips React's re-render triggers and violates object immutability checks",
                "React will throw an immediate syntax error",
                "Direct mutation deletes the component DOM node",
                "It causes a memory leak in the browser cache"
            ],
            "correct_index": 0,
            "explanation": "React compares state references using shallow equality. Mutating objects in-place fails reference equality checks and prevents components from re-rendering."
        },
        {
            "question": "What is the primary purpose of the `useCallback` hook in React?",
            "options": [
                "To memorize a computed value",
                "To cache a function definition between renders to prevent unnecessary re-rendering of memoized child components",
                "To initiate an asynchronous HTTP request",
                "To bind event listeners to the window object"
            ],
            "correct_index": 1,
            "explanation": "`useCallback` returns a memoized version of the callback that only changes if one of the dependencies has updated."
        }
    ],
    "Data Structures & Algorithms": [
        {
            "question": "What is the average and worst-case time complexity of lookup in a Hash Table?",
            "options": [
                "Average O(1), Worst-case O(N) when collisions degrade buckets to linked lists",
                "Average O(log N), Worst-case O(N)",
                "Average O(N), Worst-case O(N^2)",
                "Always O(1) in all conditions"
            ],
            "correct_index": 0,
            "explanation": "Under normal uniform hashing, hash table lookup is $O(1)$. In the worst-case of excessive hash collisions, lookup degrades to $O(N)$."
        },
        {
            "question": "When is Breadth-First Search (BFS) preferred over Depth-First Search (DFS) on an unweighted graph?",
            "options": [
                "When finding the shortest path (minimum number of edges) between two nodes",
                "When checking if a graph contains a cycle",
                "When performing topological sorting",
                "When minimizing memory usage on deeply nested trees"
            ],
            "correct_index": 0,
            "explanation": "BFS explores nodes level by level, guaranteeing that the first time a target node is visited, it is reached via the shortest path in an unweighted graph."
        }
    ]
}

def get_skill_quiz(skill_name: str) -> List[Dict[str, Any]]:
    """Returns assessment quiz questions for the requested skill."""
    norm = normalize_skill_name(skill_name)
    if norm in REASSESSMENT_QUIZ_BANK:
        return REASSESSMENT_QUIZ_BANK[norm]
    # Default high-quality quiz template for general tech
    return [
        {
            "question": f"In production software systems, what is the best practice for managing errors and exceptions in {norm}?",
            "options": [
                "Catching exceptions specifically, logging contextual diagnostics, and providing structured fallback or error responses",
                "Using empty try/catch blocks to suppress failures silently",
                "Terminating the server process immediately on any error",
                "Relying solely on frontend validation without backend handling"
            ],
            "correct_index": 0,
            "explanation": "Robust software handles specific exceptions, logs structured telemetry, and gracefully degrades without masking root causes."
        },
        {
            "question": f"Which design principle most directly improves maintainability and testability when writing code using {norm}?",
            "options": [
                "Dependency Injection and Single Responsibility Principle",
                "Global mutable state accessible everywhere",
                "Writing monolithic functions over 1,000 lines",
                "Hardcoding configuration constants directly in business logic"
            ],
            "correct_index": 0,
            "explanation": "Separation of concerns, modular functions, and dependency injection allow components to be isolated and unit-tested."
        },
        {
            "question": f"When scaling applications utilizing {norm}, which architectural approach provides horizontal scalability?",
            "options": [
                "Designing stateless services that can be replicated behind a load balancer with shared state in Redis or database",
                "Storing user session tokens exclusively in local in-memory server state",
                "Restricting deployment to a single vertical server with more RAM",
                "Avoiding database connection pooling"
            ],
            "correct_index": 0,
            "explanation": "Stateless service design allows arbitrary horizontal replication across multiple instances without sticky session bottlenecks."
        }
    ]

def evaluate_quiz_submission(skill_name: str, answers: List[int]) -> Dict[str, Any]:
    """
    Evaluates candidate answers against the quiz bank.
    Passing requires >= 75% correct answers.
    """
    questions = get_skill_quiz(skill_name)
    total_q = len(questions)
    correct_count = 0
    feedback = []

    for idx, q in enumerate(questions):
        user_ans = answers[idx] if idx < len(answers) else -1
        is_corr = (user_ans == q["correct_index"])
        if is_corr:
            correct_count += 1
        feedback.append({
            "question": q["question"],
            "user_answer": user_ans,
            "correct_answer": q["correct_index"],
            "is_correct": is_corr,
            "explanation": q["explanation"]
        })

    score_pct = round((correct_count / max(1, total_q)) * 100.0, 1)
    passed = (score_pct >= 75.0)

    return {
        "skill_name": skill_name,
        "score_percentage": score_pct,
        "passed": passed,
        "correct_count": correct_count,
        "total_questions": total_q,
        "feedback": feedback
    }
