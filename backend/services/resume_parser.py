import io
import re
from typing import Dict, Any, List
from pypdf import PdfReader
from docx import Document
from services.gemini_service import gemini_client

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text_parts.append(t)
    return "\n".join(text_parts)

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    text_parts = [p.text for p in doc.paragraphs if p.text]
    return "\n".join(text_parts)

def extract_skills_heuristic(text: str) -> List[str]:
    common_tech = [
        "Python", "Java", "JavaScript", "TypeScript", "React", "Node.js", "Express",
        "FastAPI", "Django", "Flask", "SQL", "PostgreSQL", "MongoDB", "Redis",
        "Docker", "Kubernetes", "AWS", "GCP", "Git", "REST API", "GraphQL",
        "Pandas", "NumPy", "Scikit-Learn", "TensorFlow", "PyTorch", "HTML", "CSS",
        "Tailwind CSS", "Redux", "CI/CD", "Linux", "Microservices", "System Design",
        "Unit Testing", "Jest", "PyTest", "C++", "C#", "Go", "Rust"
    ]
    found = []
    text_lower = text.lower()
    for tech in common_tech:
        # Match whole word or substring safely
        pattern = r'\b' + re.escape(tech.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found.append(tech)
    return list(set(found))

def parse_resume_with_ai_or_heuristic(raw_text: str) -> Dict[str, Any]:
    """
    Parses resume raw text into structured JSON.
    Uses Gemini if key available, else returns accurate heuristic extraction.
    """
    if gemini_client.has_valid_key():
        system_instruction = (
            "You are an expert resume parser for technical roles. "
            "Extract candidate information into structured JSON."
        )
        prompt = f"""
        Extract structured information from the candidate resume below.
        
        Resume Text:
        {raw_text[:4000]}
        
        Return JSON matching this exact structure:
        {{
            "name": "Candidate Full Name or Candidate",
            "email": "candidate@example.com or null",
            "skills": ["Skill1", "Skill2"],
            "projects": [
                {{"title": "Project Name", "description": "Brief summary", "technologies": ["Tech1", "Tech2"]}}
            ],
            "experience": [
                {{"company": "Company Name", "role": "Role Title", "duration": "Dates", "highlights": "Key work"}}
            ],
            "education": [
                {{"degree": "Degree Title", "institution": "University/College", "year": "Year"}}
            ],
            "technologies": ["Tech1", "Tech2"],
            "summary": "Brief 2-sentence summary of candidate background"
        }}
        """
        parsed = gemini_client.generate_json(prompt, system_instruction)
        if parsed and isinstance(parsed, dict) and "skills" in parsed:
            return parsed

    # Heuristic fallback
    skills = extract_skills_heuristic(raw_text)
    
    # Try to extract name from top lines
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    name = "Candidate"
    if lines:
        first_line = lines[0]
        if len(first_line) < 40 and not re.search(r'resume|curriculum|email|phone', first_line, re.IGNORECASE):
            name = first_line

    # Simple project detection
    projects = []
    proj_matches = re.findall(r'(?:Project|Portfolio|Built|Developed)\s*:?\s*([^\n]+)', raw_text, re.IGNORECASE)
    for p in proj_matches[:3]:
        projects.append({
            "title": p.strip()[:60],
            "description": p.strip(),
            "technologies": [s for s in skills[:4]]
        })

    return {
        "name": name,
        "email": None,
        "skills": skills if skills else ["Python", "Problem Solving", "Git"],
        "projects": projects,
        "experience": [],
        "education": [],
        "technologies": skills if skills else ["Python", "Git"],
        "summary": f"Technical candidate with skills in {', '.join(skills[:5]) if skills else 'software development'}."
    }
