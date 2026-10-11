import json
import logging
import re
from typing import Dict, Any, List, Optional
from services.gemini_service import gemini_client
from services.competency_engine import update_competency_status

logger = logging.getLogger("proofhire.adaptive")

def _extract_key_phrases(text: str) -> List[str]:
    """Helper to extract meaningful technical terms and phrases from candidate answer."""
    if not text:
        return []
    words = re.findall(r'\b[A-Za-z0-9_\-\+\#]{3,}\b', text)
    tech_keywords = [
        "python", "fastapi", "django", "flask", "sql", "postgresql", "mysql", "sqlite",
        "redis", "docker", "kubernetes", "pytest", "git", "react", "typescript", "javascript",
        "nextjs", "tailwind", "redux", "pytorch", "tensorflow", "scikit-learn", "pandas",
        "numpy", "opencv", "async", "concurrency", "threading", "latency", "cache",
        "database", "query", "orm", "sqlalchemy", "pydantic", "rest", "api", "json",
        "jwt", "auth", "middleware", "websocket", "pipeline", "model", "index", "architecture",
        "kafka", "rabbitmq", "aws", "gcp", "azure", "ci/cd", "microservices", "graphql"
    ]
    extracted = [w for w in words if w.lower() in tech_keywords]
    unique = []
    for w in extracted:
        if w.lower() not in [u.lower() for u in unique]:
            unique.append(w)
    return unique

# =========================================================================
# REAL HUMAN INTERVIEWER ROLE-SPECIFIC SCENARIO KNOWLEDGE BASE
# Used by both the Adaptive Fallback Engine and Gemini Few-Shot Grounding
# =========================================================================
ROLE_REAL_INTERVIEW_SCENARIOS = {
    "Python Developer": {
        "stage_2_tradeoffs": (
            "Thanks for explaining that architectural foundation. When you were developing your Python services, "
            "how did you handle concurrency and asynchronous I/O—for instance, balancing asyncio coroutines versus "
            "multiprocessing for CPU-heavy tasks given Python's GIL? What led you to your choice of database driver or ORM, "
            "and what trade-offs did you accept?"
        ),
        "stage_3_firedrill": (
            "Now let's walk through a realistic production scenario: Imagine your Python service is deployed to production, "
            "and during peak traffic, user request latency suddenly spikes from 80ms to over 4 seconds, causing 504 Gateway Timeouts. "
            "CPU usage is at 95% and PostgreSQL connection pools are exhausted. Walk me through your triage process: "
            "What telemetry and logs would you inspect first, and what concrete steps—like connection pooling, caching, or query optimization—would you take to stabilize the system?"
        ),
        "stage_4_design": (
            "Let's move into a concrete component design: Suppose we need to build an asynchronous background task queue "
            "for processing large batch reports and external webhook deliveries in Python. How would you design the API contract, "
            "worker retry logic with exponential backoff, and guarantee idempotent processing so tasks aren't duplicated on failure?"
        ),
        "stage_5_behavioral": (
            "Technical skill is critical, but engineering is fundamentally collaborative. Could you share a real experience "
            "where you and another engineer had a disagreement about a technical implementation or architectural pattern? "
            "How did you present your trade-offs, and how did you reach alignment?"
        )
    },
    "Backend Developer": {
        "stage_2_tradeoffs": (
            "That's a very clear breakdown of your service layout. When designing your backend API contracts and database schema, "
            "how did you approach normalization, database indexing, and foreign key constraints? "
            "What specific trade-offs did you evaluate between synchronous database lookups versus caching frequently accessed data in Redis?"
        ),
        "stage_3_firedrill": (
            "Let's simulate a live production fire drill: Suppose your backend starts throwing 500 Internal Server Errors under high load, "
            "and your database logs show widespread deadlocks and slow queries. Downstream microservices are cascading into timeouts. "
            "How would you isolate which transactions are colliding, analyze query execution plans with EXPLAIN ANALYZE, and introduce circuit breakers to protect the system?"
        ),
        "stage_4_design": (
            "Let's look at an architectural design challenge: Suppose we need to build a distributed rate limiter for our public API "
            "that handles 50,000 requests per second across multiple container instances. How would you structure the algorithm—such as a token bucket or sliding window log—using Redis, "
            "and how would you handle clock skew and fail-open vs fail-closed policies?"
        ),
        "stage_5_behavioral": (
            "In backend engineering, we often face tight deadlines where product wants a quick release, but engineering sees critical technical debt. "
            "Can you tell me about a time when you had to advocate for code quality or refactoring against business pressure? How did you negotiate the trade-off?"
        )
    },
    "Full Stack Developer": {
        "stage_2_tradeoffs": (
            "I appreciate how you connected the frontend user experience with the backend data flow. "
            "When building full stack features, how do you handle state synchronization, optimistic UI updates, and data fetching? "
            "What guided your choice between client-side rendering versus server-side rendering for critical pages?"
        ),
        "stage_3_firedrill": (
            "Imagine users in production report that the web app is freezing for 2 to 3 seconds during large data table interactions, "
            "and mobile users are frequently seeing 401 Unauthorized errors after returning from background mode. "
            "How would you profile the client-side JavaScript rendering bottleneck, and how would you resolve the session token expiration lifecycle?"
        ),
        "stage_4_design": (
            "Let's design a real-time collaborative feature—for example, a live activity dashboard or notification feed. "
            "How would you structure the WebSocket or Server-Sent Events connection, handle automatic reconnections with exponential backoff, "
            "and ensure backend state consistency across multiple server instances?"
        ),
        "stage_5_behavioral": (
            "As a full stack engineer, you bridge the gap between design, product, and backend infrastructure. "
            "Tell me about a time when a feature requirement was ambiguous or contradictory. How did you clarify the requirements and keep the project moving forward?"
        )
    },
    "Frontend Developer": {
        "stage_2_tradeoffs": (
            "Thanks for explaining your UI architecture. In modern frontend development, state management and component composition are key. "
            "How do you decide between local component state, Context API, and global state libraries? "
            "What rules of thumb do you use to prevent unnecessary component re-renders without overusing useMemo or useCallback?"
        ),
        "stage_3_firedrill": (
            "Let's look at a frontend performance challenge: A release causes your Core Web Vitals—specifically Largest Contentful Paint (LCP) and Interaction to Next Paint (INP)—to drop significantly, "
            "and your production bundle size ballooned to 4MB. How do you profile the bundle, identify code-splitting boundaries, and eliminate layout thrashing in the browser?"
        ),
        "stage_4_design": (
            "Let's design an accessible, high-performance UI component: Suppose we need a virtualized dropdown list that smoothly renders 10,000 items with keyboard navigation, screen reader support, and debounced search. "
            "Walk me through your component hierarchy, DOM recycling technique, and ARIA attributes."
        ),
        "stage_5_behavioral": (
            "Frontends are often subject to changing design specs from UI/UX designers late in a sprint. "
            "Can you share an experience where you had to push back on an unfeasible animation or layout change, and how you worked with the designer to find a great alternative?"
        )
    },
    "Software Development Engineer": {
        "stage_2_tradeoffs": (
            "That's a solid architectural overview. Let's dig deeper into the algorithmic decisions: "
            "When designing your core modules, how did you analyze the time and space complexity of your critical paths? "
            "Can you give an example of a situation where you had to choose between asymptotic efficiency and memory footprint or cache locality?"
        ),
        "stage_3_firedrill": (
            "Suppose your core service experiences an intermittent memory leak in production, causing containers to be killed with OOM errors every 8 hours under sustained load. "
            "How would you reproduce this issue locally, capture heap snapshots, and isolate which objects or circular references are preventing garbage collection?"
        ),
        "stage_4_design": (
            "Let's walk through a systems design problem: Suppose you need to design a distributed unique ID generator (similar to Twitter Snowflake) "
            "that generates millions of 64-bit time-sortable IDs per second across distributed nodes without coordinating locks. "
            "How would you structure the bit allocation, and how do you handle clock drift or leap seconds?"
        ),
        "stage_5_behavioral": (
            "Software engineering at scale involves mentoring and peer reviews. Can you tell me about a time when you conducted a code review "
            "where you noticed significant architectural flaws or performance traps? How did you deliver constructive feedback while preserving a positive team relationship?"
        )
    },
    "AI Engineer": {
        "stage_2_tradeoffs": (
            "That's a fascinating look into your AI pipeline. When building applications on top of Large Language Models and vector embeddings, "
            "how did you determine your document chunking strategy, embedding model, and vector indexing algorithm? "
            "What trade-offs did you evaluate between context recall and LLM inference latency?"
        ),
        "stage_3_firedrill": (
            "Let's look at a live AI deployment issue: Users report that your generative AI assistant is occasionally hallucinating confident but factually incorrect answers, "
            "and API latency exceeds 8 seconds on complex multi-turn chats. How would you implement automated evaluation guardrails, response caching, and prompt optimization to solve this?"
        ),
        "stage_4_design": (
            "Let's design an autonomous multi-step AI agent with external tool-calling capabilities. "
            "How would you manage agent memory across conversation turns, enforce strict JSON schema outputs from the model, and prevent runaway execution loops when tools return unexpected errors?"
        ),
        "stage_5_behavioral": (
            "In fast-moving AI engineering, stakeholder expectations often outpace current model capabilities. "
            "Can you describe a situation where leadership wanted an AI solution for a problem that was better solved with classical engineering or heuristics? How did you navigate that conversation?"
        )
    },
    "Machine Learning Engineer": {
        "stage_2_tradeoffs": (
            "That's a thorough explanation of your model development workflow. When engineering features and training your baseline models, "
            "how did you detect and guard against data leakage and class imbalance? "
            "What guided your choice between tree-based gradient boosting models versus deep learning architectures for this problem?"
        ),
        "stage_3_firedrill": (
            "Your model achieved a 0.94 ROC-AUC during offline validation, but after three weeks in production, business KPIs show that prediction accuracy has degraded sharply. "
            "Walk me through how you would diagnose covariate shift, concept drift, or upstream data pipeline corruption in production."
        ),
        "stage_4_design": (
            "Let's design a real-time model inference pipeline that must serve predictions under 40 milliseconds for 5,000 requests per second. "
            "How would you handle feature store lookups, dynamic micro-batching, and model serialization (like ONNX or TensorRT) to hit your latency SLA?"
        ),
        "stage_5_behavioral": (
            "Tell me about a time when an ML experiment you spent significant time on failed to produce meaningful improvements. "
            "How did you decide when to stop tuning, what did you learn, and how did you communicate the findings to your team?"
        )
    },
    "Data Scientist": {
        "stage_2_tradeoffs": (
            "Thanks for sharing that methodology. In data science, statistical rigor is paramount. "
            "How did you approach exploratory data analysis, handling missing values, and testing for statistical significance? "
            "What metrics did you prioritize to evaluate your findings beyond simple correlation?"
        ),
        "stage_3_firedrill": (
            "Suppose leadership wants to run an A/B test on a core conversion funnel, but preliminary data shows high variance and potential sample ratio mismatch. "
            "How would you calculate statistical power, determine required sample size, and verify that the randomization mechanism isn't biased?"
        ),
        "stage_4_design": (
            "Let's design an end-to-end predictive customer retention system. How would you structure your cohort analysis, feature engineering from raw event logs, "
            "and explainability methods (like SHAP values) so that business stakeholders understand the model's key drivers?"
        ),
        "stage_5_behavioral": (
            "Data scientists often have to deliver findings that contradict executive intuition. "
            "Can you tell me about a time when your data analysis revealed an inconvenient truth about a product or strategy? How did you present your findings effectively?"
        )
    },
    "Data Analyst": {
        "stage_2_tradeoffs": (
            "I like how you structured your analytical approach. When working with large transactional datasets in SQL, "
            "how do you leverage advanced SQL concepts like window functions (ROW_NUMBER, LAG, LEAD), common table expressions (CTEs), and indexing? "
            "What techniques do you use to ensure your analytical queries run efficiently without locking production tables?"
        ),
        "stage_3_firedrill": (
            "Suppose your company's executive KPI dashboard shows a sudden 35% decline in daily active users today, sparking alarm among leadership. "
            "How would you trace data lineage, verify raw ingestion logs, and check for tracking errors versus an actual platform outage?"
        ),
        "stage_4_design": (
            "Let's design a reliable dimensional data mart for business reporting. "
            "How would you model fact and dimension tables (star schema), handle slowly changing dimensions, and create automated data quality checks?"
        ),
        "stage_5_behavioral": (
            "Can you describe a situation where a stakeholder asked for 'all the data' without a clear question in mind? "
            "How did you work with them to discover the true underlying business problem and deliver an actionable insight?"
        )
    },
    "Cloud Engineer": {
        "stage_2_tradeoffs": (
            "That's a very sound cloud architecture foundation. When provisioning cloud infrastructure, "
            "how do you apply Infrastructure as Code (Terraform or CloudFormation) principles for environment parity? "
            "What trade-offs do you evaluate between managed cloud services versus running self-managed clusters?"
        ),
        "stage_3_firedrill": (
            "Let's walk through an infrastructure emergency: During a high-traffic release, an automated deployment causes a cascading crash loop "
            "across your container pods, and ingress controllers begin dropping connections. Automatic rollback is blocked by a database migration dependency. "
            "Walk me through your emergency incident response protocol to restore availability."
        ),
        "stage_4_design": (
            "Let's design a secure, multi-tier VPC network architecture for an enterprise web application. "
            "How would you configure public vs private subnets, NAT gateways, security groups, and IAM least-privilege roles to protect database instances from public exposure?"
        ),
        "stage_5_behavioral": (
            "Cloud engineers frequently manage post-mortems after production incidents. "
            "Can you describe an incident where human error caused downtime? How did you lead a blameless post-mortem and implement guardrails so the issue could never happen again?"
        )
    },
    "Cybersecurity Analyst": {
        "stage_2_tradeoffs": (
            "Thanks for breaking down that security architecture. In information security, defense-in-depth is essential. "
            "How do you prioritize threat modeling and vulnerability scanning across application code, container images, and cloud IAM? "
            "How do you balance strict zero-trust security controls against developer friction and productivity?"
        ),
        "stage_3_firedrill": (
            "It's 2:00 AM and your SIEM generates a critical alert indicating suspicious outbound DNS tunneling and privilege escalation on an internal database host. "
            "Walk me through your immediate incident response steps: containment, forensic evidence preservation, and eradication."
        ),
        "stage_4_design": (
            "Let's design an automated vulnerability management and compliance verification pipeline. "
            "How would you integrate SAST, DAST, and secret scanning into GitHub Actions CI/CD to prevent vulnerabilities from ever reaching production?"
        ),
        "stage_5_behavioral": (
            "Security teams often encounter pushback from developers who want to bypass security requirements to hit tight release deadlines. "
            "Can you share an experience where you resolved this tension, found a secure workaround, and educated the team on security risks?"
        )
    },
    "Java Developer": {
        "stage_2_tradeoffs": (
            "That's a great walkthrough of your Java backend architecture. When developing enterprise applications with Spring Boot, "
            "how do you manage transaction boundaries with @Transactional, connection pooling in HikariCP, and avoid N+1 queries in Spring Data JPA? "
            "What trade-offs did you consider between synchronous Spring MVC versus reactive Spring WebFlux?"
        ),
        "stage_3_firedrill": (
            "Let's simulate a production JVM issue: Under heavy concurrent load, your Java service starts experiencing severe Stop-The-World garbage collection pauses "
            "and eventually throws OutOfMemoryError: Metaspace. How do you capture thread dumps and heap dumps, analyze GC logs, and tune JVM memory flags to resolve the crash?"
        ),
        "stage_4_design": (
            "Let's design an asynchronous event-driven order processing system in Java using Spring Boot and message queues (like Kafka or RabbitMQ). "
            "How would you handle consumer group scaling, message deduplication, and dead-letter queue retries on transient failures?"
        ),
        "stage_5_behavioral": (
            "In large Java codebases, legacy code and architectural drift are common. Can you share a time when you refactored a critical legacy module? "
            "How did you write test harnesses to ensure zero regression while bringing the codebase up to modern standards?"
        )
    }
}

def _get_role_scenarios(role: str) -> Dict[str, str]:
    """Returns the most appropriate scenario bank for the given role."""
    for key, scenarios in ROLE_REAL_INTERVIEW_SCENARIOS.items():
        if key.lower() in role.lower() or role.lower() in key.lower():
            return scenarios
    # Default to Backend / SDE scenario for general software engineering
    return ROLE_REAL_INTERVIEW_SCENARIOS["Backend Developer"]

# =========================================================================
# OPENING QUESTION GENERATOR
# =========================================================================
def generate_opening_question(
    candidate_name: str,
    role: str,
    parsed_resume: Dict[str, Any],
    job_description: Dict[str, Any],
    target_difficulty: str,
    duration_minutes: int,
    competencies: List[str]
) -> Dict[str, Any]:
    """
    Generates a warm, authentic, natural opening question that sounds like
    a senior human interviewer conducting a live conversational interview.
    """
    target_comp = competencies[0] if competencies else "System Architecture & Engineering Ownership"
    
    projects = parsed_resume.get("projects", [])
    skills = parsed_resume.get("skills", [])
    
    project_title = projects[0].get("title", "") if projects else ""
    first_skill = skills[0] if skills else "core software engineering"
    second_skill = skills[1] if len(skills) > 1 else first_skill

    # 1. Attempt Gemini Generation with Real Interviewer Persona
    if gemini_client.has_valid_key():
        system_prompt = (
            "You are an empathetic, world-class Staff / Principal Software Engineer conducting a live video technical interview for ProofHire AI. "
            "You sound EXACTLY like an experienced, warm, and articulate human interviewer at a top technology company (such as Google, Stripe, or Netflix). "
            "CRITICAL CONVERSATIONAL RULES:\n"
            "- Speak naturally in the first person ('Hi [Name], welcome! I'm really looking forward to our technical conversation today...').\n"
            "- Sound genuinely interested in the candidate's actual projects and code from their resume.\n"
            "- Do NOT format output with robotic bullet points, markdown bold tags, or exam-style prompts.\n"
            "- Craft a fluid, spoken opening question that asks for the system architecture of their project, their personal ownership, and the technical rationale behind their choices."
        )

        prompt = f"""
        Candidate Name: {candidate_name}
        Target Role: {role}
        Candidate Resume Skills: {skills}
        Candidate Resume Projects: {projects}
        Job Description Requirements: {job_description.get('required_skills', [])}
        Target Competency for Question 1: {target_comp}
        Difficulty Calibration: {target_difficulty}
        Session Duration: {duration_minutes} minutes
        
        Write a spoken, conversational opening question as if you are welcoming {candidate_name} in a video interview:
        1. Greet {candidate_name} warmly and introduce the interview context for the {role} position.
        2. Reference a specific project ({f"'{project_title}'" if project_title else "a key project from their resume"}) and skill ({first_skill}) directly from their background.
        3. Ask them to walk you through the system architecture, their personal technical ownership, and what led to their core design decisions.

        Return raw JSON:
        {{
            "question_text": "Spoken greeting + resume project reference + architectural deep dive question",
            "question_type": "opening",
            "difficulty": "{target_difficulty}",
            "target_competency": "{target_comp}",
            "reason_for_next_question": "Greeting candidate and probing their resume project ({project_title or first_skill}) to establish baseline architectural ownership."
        }}
        """

        try:
            res = gemini_client.generate_json(prompt, system_prompt)
            if res and isinstance(res, dict) and res.get("question_text"):
                res["adaptation_pipeline"] = {
                    "question_area": target_comp,
                    "competency_coverage": f"0 / {len(competencies)} competencies evaluated (Opening baseline)",
                    "question_relevance": f"Conversational walkthrough probing '{project_title or first_skill}' for {role}",
                    "difficulty_selection": f"Initial difficulty calibrated to '{target_difficulty.capitalize()}'",
                    "next_question": res.get("question_text"),
                    "reason_for_next_question": res.get("reason_for_next_question", "")
                }
                return res
        except Exception as e:
            logger.warning(f"Gemini opening question generation failed, falling back: {e}")

    # 2. Authentic Human Fallback Opening Question
    if project_title:
        greeting = (
            f"Hi {candidate_name}, welcome! Great to meet you today. I'm really looking forward to our technical conversation for the {role} position. "
            f"I spent some time reviewing your background, and your work on '{project_title}' caught my eye. "
            f"To get us started, could you walk me through the high-level architecture of that project, what your specific ownership was, and what motivated your choice of {first_skill} for the implementation?"
        )
    else:
        greeting = (
            f"Hi {candidate_name}, welcome! Great to meet you today. I'm excited to dive into our technical interview for the {role} position. "
            f"Looking through your background, I noticed your strong hands-on experience in {first_skill} and {second_skill}. "
            f"To kick things off, could you walk me through a technical project you led recently—specifically covering the overall system architecture, your personal contributions, and a key engineering trade-off you had to navigate?"
        )

    reason = f"Welcoming {candidate_name} and probing their practical experience in {project_title or first_skill} to establish baseline architectural ownership."

    return {
        "question_text": greeting,
        "question_type": "opening",
        "difficulty": target_difficulty,
        "target_competency": target_comp,
        "reason_for_next_question": reason,
        "adaptation_pipeline": {
            "question_area": target_comp,
            "competency_coverage": f"0 / {len(competencies)} competencies evaluated (Opening baseline)",
            "question_relevance": f"Probing claimed project ({project_title or first_skill}) for role alignment with {role}",
            "difficulty_selection": f"Baseline level set to '{target_difficulty.capitalize()}'",
            "next_question": greeting,
            "reason_for_next_question": reason
        }
    }


# =========================================================================
# EVALUATION & ADAPTIVE FOLLOW-UP GENERATOR
# =========================================================================
def evaluate_and_generate_next(
    session_id: str,
    role: str,
    history: List[Dict[str, Any]],
    current_question: Dict[str, Any],
    candidate_answer: str,
    answer_time_seconds: float,
    competency_map: Dict[str, Dict[str, Any]],
    target_difficulty: str,
    duration_minutes: int,
    parsed_resume: Dict[str, Any],
    job_description: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Evaluates candidate's answer and generates the next question following
    the 5 natural stages of an elite technical interview:
    Stage 1: Opening & Architecture Walkthrough (Completed)
    Stage 2: Technical Mechanics & Trade-offs (Deep-dive into candidate's choices)
    Stage 3: The Production Challenge ("Fire Drill" / Scale Scenario)
    Stage 4: Hands-On System Component Design & Problem Solving
    Stage 5: Engineering Culture, Team Collaboration & Disagreement
    Stage 6+: Wrap-up & Completion
    """
    question_index = len(history) + 1
    total_expected_questions = max(5, min(7, duration_minutes // 3))
    is_last_question = question_index >= total_expected_questions

    # Identify remaining competency coverage
    unassessed = [k for k, v in competency_map.items() if v["status"] in ["unassessed", "claimed_untested"]]
    partially_tested = [k for k, v in competency_map.items() if v["status"] == "partially_demonstrated"]

    # Extract resume context
    projects = parsed_resume.get("projects", [])
    skills = parsed_resume.get("skills", [])
    project_title = projects[0].get("title", "") if projects else ""

    # Analyze candidate answer
    answer_keywords = _extract_key_phrases(candidate_answer)
    answer_clean = candidate_answer.strip()

    # Determine Interview Stage Descriptor
    if question_index == 2:
        stage_name = "Stage 2: Technical Mechanics & Architectural Trade-offs"
    elif question_index == 3:
        stage_name = "Stage 3: Real-World Production Challenge (Scale, Outage, or Bottleneck)"
    elif question_index == 4:
        stage_name = "Stage 4: Hands-On Component Design & Concrete Problem Solving"
    elif question_index == 5:
        stage_name = "Stage 5: Engineering Culture, Team Collaboration & Disagreement"
    else:
        stage_name = "Stage 6+: Advanced Follow-up & System Synthesis"

    # 1. Attempt Gemini Generation with Live Context
    if gemini_client.has_valid_key():
        system_prompt = (
            "You are an experienced, empathetic Staff/Principal Engineer conducting a live technical interview for ProofHire AI. "
            "You sound EXACTLY like a real human interviewer at a top technology company (such as Google, Stripe, or Netflix): "
            "warm, authentic, collaborative, and technically sharp.\n\n"
            "CRITICAL INTERVIEWING INSTRUCTIONS:\n"
            "1. ALWAYS begin your next question by naturally acknowledging something specific the candidate just explained "
            "(e.g., 'Thanks for walking me through that—I like how you structured your API models...', 'That's a really interesting point regarding connection pooling...').\n"
            "2. Tailor your question strictly to the current interview progression stage:\n"
            f"   Current Stage: {stage_name}\n"
            "3. Ground the question in real production challenges, trade-offs, and failure modes rather than dry textbook trivia.\n"
            "4. Speak in the first person ('I', 'we') as a human interviewer speaking directly to the candidate over video.\n"
            "5. NO bullet points, NO markdown bold tags, NO robotic prefixes like 'Question 2:'."
        )

        prompt = f"""
        Interview Context:
        Target Role: {role}
        Interview Stage: {stage_name} (Question #{question_index} of {total_expected_questions})
        Target Difficulty: {target_difficulty}
        Candidate Resume Skills: {skills}
        Candidate Resume Projects: {[p.get('title') for p in projects]}
        Current Question Answered: {current_question.get('question_text')}
        Current Target Competency: {current_question.get('target_competency')}
        Candidate's Actual Answer: "{candidate_answer}"
        Extracted Answer Keywords: {answer_keywords}
        Is Final Question: {is_last_question}
        
        Evaluate the candidate's answer on a 0-4 scale across:
        - technical_correctness (0.0 to 4.0)
        - depth_of_understanding (0.0 to 4.0)
        - problem_solving (0.0 to 4.0)
        - clarity_of_explanation (0.0 to 4.0)
        - relevance (0.0 to 4.0)
        
        Next Question Generation:
        If Is Final Question is false:
        - Acknowledge a specific point the candidate made.
        - Frame a natural, conversational question matching {stage_name} for the {role} position.
        If Is Final Question is true:
        - Deliver a warm, professional wrap-up acknowledging their contributions across the session.

        Return raw JSON:
        {{
            "answer_summary": "1-2 sentence constructive evaluation summary",
            "score": 3.2,
            "rubric_scores": {{
                "technical_correctness": 3.5,
                "depth_of_understanding": 3.0,
                "problem_solving": 3.0,
                "clarity_of_explanation": 3.5,
                "relevance": 3.5
            }},
            "demonstrated_concepts": ["Concept 1", "Concept 2"],
            "missing_concepts": ["Missing edge case detail"],
            "evidence": [
                {{"point": "Explained concept X clearly", "quote": "verbatim quote from answer", "status": "strong"}}
            ],
            "uncertainties": [],
            "target_competency": "{current_question.get('target_competency')}",
            "is_interview_complete": {str(is_last_question).lower()},
            "next_question_text": "Spoken human interviewer question matching {stage_name}",
            "next_question_type": "{'closing' if is_last_question else 'technical'}",
            "next_question_difficulty": "{target_difficulty}",
            "next_target_competency": "{unassessed[0] if unassessed else 'System Design'}",
            "reason_for_next_question": "Reason why this question fits the interview progression."
        }}
        """

        try:
            ai_res = gemini_client.generate_json(prompt, system_prompt)
            if ai_res and isinstance(ai_res, dict) and "score" in ai_res:
                target_comp = ai_res.get("target_competency") or current_question.get("target_competency")
                updated_map = update_competency_status(
                    competency_map,
                    target_comp,
                    float(ai_res.get("score", 2.5)),
                    question_index
                )
                ai_res["updated_competency_map"] = updated_map
                
                next_comp = ai_res.get("next_target_competency", target_comp)
                next_diff = ai_res.get("next_question_difficulty", target_difficulty)
                evaluated_count = len([v for v in updated_map.values() if v["status"] != "unassessed"])
                
                ai_res["adaptation_pipeline"] = {
                    "question_area": next_comp,
                    "competency_coverage": f"{evaluated_count} of {len(updated_map)} competencies evaluated",
                    "question_relevance": f"{stage_name} grounded in candidate's response for {role}",
                    "difficulty_selection": f"Calibrated to '{next_diff.capitalize()}' level based on response score ({float(ai_res.get('score', 2.5)):.1f}/4.0)",
                    "next_question": ai_res.get("next_question_text", ""),
                    "reason_for_next_question": ai_res.get("reason_for_next_question", "")
                }
                return ai_res
        except Exception as e:
            logger.warning(f"Gemini evaluation and next question failed, using adaptive fallback: {e}")

    # =========================================================================
    # 2. ADAPTIVE REAL-INTERVIEWER FALLBACK ENGINE
    # =========================================================================
    words = len(answer_clean.split())
    answer_lower = answer_clean.lower()

    # Detect answer signals
    idk_phrases = ["don't know", "dont know", "not sure", "no idea", "haven't used", "havent used", "unfamiliar", "never used"]
    is_idk = any(phrase in answer_lower for phrase in idk_phrases) and words < 25
    is_vague = (words < 16 or "etc" in answer_lower or "stuff like that" in answer_lower) and not is_idk
    is_strong = words >= 18 and any(kw in answer_lower for kw in [
        "because", "for example", "handled", "trade-off", "performance", "pattern",
        "index", "async", "latency", "scale", "tested", "architecture", "custom exception",
        "logging", "fastapi", "pydantic", "validation", "concurrency", "cache"
    ])

    # Rubric scoring
    if is_idk:
        score = 0.5
        tech_score, depth_score, ps_score, clarity_score, relevance_score = 0.0, 0.0, 0.5, 3.0, 2.0
        summary = "Candidate transparently acknowledged unfamiliarity with the concept."
        demonstrated = ["Professional transparency"]
        missing = ["Technical knowledge of requested domain concept"]
        evidence = [{"point": "Acknowledged limitation directly", "quote": answer_clean[:100], "status": "acknowledged"}]
    elif is_vague:
        score = 1.5
        tech_score, depth_score, ps_score, clarity_score, relevance_score = 1.5, 1.0, 1.5, 2.0, 2.5
        summary = "Candidate gave a brief high-level response without concrete implementation specifics."
        demonstrated = ["Basic awareness of topic"]
        missing = ["Practical implementation detail", "Edge case considerations"]
        evidence = [{"point": "Provided high-level summary but lacked code/architectural specifics", "quote": answer_clean[:120], "status": "partial"}]
    elif is_strong:
        score = 3.5
        tech_score, depth_score, ps_score, clarity_score, relevance_score = 3.5, 3.5, 3.5, 3.5, 4.0
        summary = "Candidate gave a thorough, well-reasoned answer demonstrating practical depth."
        demonstrated = ["Deep technical comprehension", "Practical engineering reasoning", "Clear explanation"]
        missing = ["Extreme scale concurrency testing"]
        evidence = [{"point": "Elaborated with relevant technical concepts and engineering trade-offs", "quote": answer_clean[:150], "status": "strong"}]
    else:
        score = 2.5
        tech_score, depth_score, ps_score, clarity_score, relevance_score = 2.5, 2.0, 2.5, 3.0, 3.0
        summary = "Candidate provided a clear baseline answer covering core principles."
        demonstrated = ["Solid foundational correctness"]
        missing = ["Advanced optimization and system failure modes"]
        evidence = [{"point": "Addressed main question requirement", "quote": answer_clean[:120], "status": "moderate"}]

    target_comp = current_question.get("target_competency") or (list(competency_map.keys())[0] if competency_map else "Technical Competency")
    updated_map = update_competency_status(competency_map, target_comp, score, question_index)

    # Resolve scenario bank for candidate's target role
    role_scenarios = _get_role_scenarios(role)
    kw_highlight = answer_keywords[0] if answer_keywords else (skills[0] if skills else "your architectural choices")

    # Construct the question text based on the 5 Interview Stages
    if is_last_question:
        next_q_text = (
            f"Thank you so much for walking through all those technical details with me today! "
            f"You've shared some really thoughtful insights into your engineering process, trade-offs, and practical experience across {len(competency_map)} core areas. "
            f"That concludes our technical interview session today. Please click 'Finish & View Report' below to explore your comprehensive evaluation report and skill gap roadmap."
        )
        next_type = "closing"
        next_diff = target_difficulty
        next_comp = "Interview Completion"
        reason = "Interview question limit reached. Concluding session for final report generation."

    elif is_idk:
        # Candidate candidly admitted not knowing
        next_comp = unassessed[0] if unassessed else (partially_tested[0] if partially_tested else target_comp)
        next_type = "technical"
        next_diff = "intermediate" if target_difficulty != "beginner" else "beginner"
        pivot_skill = skills[1] if len(skills) > 1 else (skills[0] if skills else "software engineering")
        next_q_text = (
            f"Totally understand, and I really appreciate your honesty! It's impossible for any engineer to know every tool inside and out. "
            f"Let's pivot over to an area from your resume where you've had deeper hands-on experience: Looking at your work with {pivot_skill}, "
            f"how do you usually approach {next_comp} when building features for a production system?"
        )
        reason = f"Candidate transparently acknowledged unfamiliarity with {target_comp}. Smoothly pivoting to resume skill ({pivot_skill}) and unassessed competency ({next_comp})."

    elif is_vague:
        # Candidate was brief or vague -> Gentle encouragement to dive deeper
        next_comp = target_comp
        next_type = "follow_up"
        next_diff = target_difficulty
        next_q_text = (
            f"Thanks for the high-level summary! Let's zoom into the actual mechanics a bit: "
            f"When you mentioned working with {kw_highlight}, walk me through the specific implementation details. "
            f"What exact libraries, algorithms, or data models did you build, and how did you verify that your solution behaved reliably under edge cases?"
        )
        reason = f"Candidate gave a high-level response on {target_comp}. Asking a direct follow-up on '{kw_highlight}' to draw out concrete technical specifics."

    else:
        # Candidate gave a solid or strong answer -> Progress through the 5 Interview Stages
        if question_index == 2:
            # Stage 2: Trade-offs & Deep Dive
            next_comp = unassessed[0] if unassessed else target_comp
            next_type = "technical"
            next_diff = target_difficulty
            next_q_text = f"That makes a lot of sense, especially regarding your point on {kw_highlight}. {role_scenarios.get('stage_2_tradeoffs')}"
            reason = f"Stage 2 Progression: Deep-diving into architectural trade-offs and mechanics based on candidate's mention of '{kw_highlight}'."

        elif question_index == 3:
            # Stage 3: The Production Fire Drill / Scaling Incident
            next_comp = unassessed[0] if unassessed else "System Reliability & Incident Response"
            next_type = "technical"
            next_diff = "advanced" if target_difficulty != "beginner" else "intermediate"
            next_q_text = f"That's a very clear explanation. Let's take that a step further and put your system under pressure: {role_scenarios.get('stage_3_firedrill')}"
            reason = f"Stage 3 Progression: Simulating a realistic production crisis and scaling bottleneck for the {role} position."

        elif question_index == 4:
            # Stage 4: Concrete Hands-on Component Design
            next_comp = unassessed[0] if unassessed else "Component Design & Problem Solving"
            next_type = "technical"
            next_diff = target_difficulty
            next_q_text = f"Great problem-solving walkthrough on handling that incident. {role_scenarios.get('stage_4_design')}"
            reason = f"Stage 4 Progression: Posing a concrete feature component design challenge tailored to {role}."

        elif question_index == 5:
            # Stage 5: Behavioral & Team Collaboration
            next_comp = "Communication, Collaboration & Engineering Culture"
            next_type = "behavioral"
            next_diff = target_difficulty
            next_q_text = f"I really like how you reasoned through that component design. To round out our conversation: {role_scenarios.get('stage_5_behavioral')}"
            reason = f"Stage 5 Progression: Transitioning to team collaboration and handling engineering trade-offs."

        else:
            # Stage 6+: Synthesis & Advanced Probing
            next_comp = unassessed[0] if unassessed else "Advanced Engineering Synthesis"
            next_type = "technical"
            next_diff = "advanced"
            next_q_text = (
                f"That's a very thoughtful reflection. Looking forward at the broader system lifecycle for {role}: "
                f"If you had to re-architect this entire solution from scratch today with zero legacy constraints, "
                f"what would you do completely differently, and what technical debt would you prioritize eliminating first?"
            )
            reason = f"Stage 6+ Progression: Probing high-level architectural retrospection and technical debt management."

    evaluated_count = len([v for v in updated_map.values() if v["status"] != "unassessed"])
    total_comps = len(updated_map)

    adaptation_pipeline = {
        "question_area": next_comp,
        "competency_coverage": f"{evaluated_count} of {total_comps} competencies evaluated ({round((evaluated_count/max(1, total_comps))*100)}% coverage)",
        "question_relevance": f"{stage_name} tailored to {role} and candidate's answer",
        "difficulty_selection": f"Calibrated to '{next_diff.capitalize()}' difficulty (previous score: {score:.1f}/4.0)",
        "next_question": next_q_text,
        "reason_for_next_question": reason
    }

    return {
        "answer_summary": summary,
        "score": score,
        "rubric_scores": {
            "technical_correctness": tech_score,
            "depth_of_understanding": depth_score,
            "problem_solving": ps_score,
            "clarity_of_explanation": clarity_score,
            "relevance": relevance_score
        },
        "demonstrated_concepts": demonstrated,
        "missing_concepts": missing,
        "evidence": evidence,
        "uncertainties": [],
        "target_competency": target_comp,
        "is_interview_complete": is_last_question,
        "next_question_text": next_q_text,
        "next_question_type": next_type,
        "next_question_difficulty": next_diff,
        "next_target_competency": next_comp,
        "reason_for_next_question": reason,
        "adaptation_pipeline": adaptation_pipeline,
        "updated_competency_map": updated_map
    }
