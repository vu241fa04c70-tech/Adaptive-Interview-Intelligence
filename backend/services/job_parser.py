import re
from typing import Dict, Any, List
from services.gemini_service import gemini_client

def extract_job_skills_heuristic(text: str) -> List[str]:
    common_skills = [
        "Python", "Java", "JavaScript", "TypeScript", "React", "Node.js",
        "FastAPI", "Django", "SQL", "PostgreSQL", "MongoDB", "Docker",
        "Kubernetes", "AWS", "GCP", "Git", "RESTful APIs", "System Design",
        "Data Structures", "Algorithms", "Unit Testing", "CI/CD", "Machine Learning",
        "Pandas", "Scikit-Learn", "Agile", "Communication", "Problem Solving"
    ]
    found = []
    text_lower = text.lower()
    for s in common_skills:
        pattern = r'\b' + re.escape(s.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found.append(s)
    return list(set(found))

def parse_job_description(title: str, company: str, text: str) -> Dict[str, Any]:
    if gemini_client.has_valid_key():
        system_instruction = "You are a senior recruiter analyzing job descriptions."
        prompt = f"""
        Analyze the job description below:
        Job Title: {title}
        Company: {company}
        Job Description:
        {text[:4000]}
        
        Return JSON with:
        {{
            "title": "{title}",
            "company": "{company}",
            "required_skills": ["Skill1", "Skill2"],
            "preferred_skills": ["Skill3"],
            "experience_level": "Entry / Intermediate / Senior",
            "domain_focus": "Core software engineering focus domain"
        }}
        """
        parsed = gemini_client.generate_json(prompt, system_instruction)
        if parsed and isinstance(parsed, dict) and "required_skills" in parsed:
            return parsed

    skills = extract_job_skills_heuristic(text)
    if not skills:
        skills = ["Software Engineering", "Problem Solving", "Code Quality", "Communication"]

    return {
        "title": title,
        "company": company or "Target Company",
        "required_skills": skills[:6],
        "preferred_skills": skills[6:10] if len(skills) > 6 else ["System Architecture"],
        "experience_level": "Intermediate",
        "domain_focus": title
    }
