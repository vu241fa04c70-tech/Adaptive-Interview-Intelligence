import io
import re
from typing import Dict, Any, List, Optional
from pypdf import PdfReader
from docx import Document
from services.gemini_service import gemini_client

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from all pages of a PDF file."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text_parts = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t.strip())
        return "\n".join(text_parts)
    except Exception as e:
        return f"Error extracting PDF text: {str(e)}"

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts text from both paragraphs and tables in a DOCX file."""
    try:
        doc = Document(io.BytesIO(file_bytes))
        text_parts = []
        
        # 1. Main body paragraphs
        for p in doc.paragraphs:
            if p.text and p.text.strip():
                text_parts.append(p.text.strip())
                
        # 2. Table cells (for resumes formatted with tables/columns)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        if p.text and p.text.strip():
                            text_parts.append(p.text.strip())
                            
        # Preserve order while deduplicating exact adjacent lines
        deduped = []
        for line in text_parts:
            if not deduped or deduped[-1] != line:
                deduped.append(line)
                
        return "\n".join(deduped)
    except Exception as e:
        return f"Error extracting DOCX text: {str(e)}"

# Comprehensive vocabulary of modern engineering skills
TECHNICAL_SKILLS_TAXONOMY = [
    # Languages
    "Python", "Java", "C++", "C#", "C", "JavaScript", "TypeScript", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby", "R", "SQL",
    # Frontend & Web
    "React", "React Native", "Next.js", "Vue", "Angular", "HTML5", "HTML", "CSS3", "CSS", "Tailwind CSS", "Bootstrap", "Redux", "Vite", "Webpack",
    # Backend & Frameworks
    "FastAPI", "Flask", "Django", "Node.js", "Express", "Spring Boot", "REST APIs", "REST API", "GraphQL", "Microservices", "gRPC", "Swagger", "Pydantic",
    # Databases & Storage
    "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "TimescaleDB", "Cassandra", "Elasticsearch", "SQLAlchemy", "Prisma", "Firebase",
    # AI / Machine Learning / Data Science
    "Machine Learning", "Deep Learning", "NLP", "Natural Language Processing", "Computer Vision",
    "OpenCV", "MediaPipe", "PyTorch", "TensorFlow", "Keras", "Scikit-Learn", "Scikit-learn",
    "Pandas", "NumPy", "XGBoost", "LightGBM", "SHAP", "Streamlit", "HuggingFace", "LangChain", "LLMs", "GenAI",
    # Cloud & DevOps
    "Docker", "Docker Compose", "Kubernetes", "AWS", "GCP", "Google Cloud", "Azure", "CI/CD", "Linux", "Git", "GitHub", "GitLab", "Terraform", "Nginx",
    # Architecture & Fundamentals
    "Data Structures", "Algorithms", "Data Structures & Algorithms", "System Design", "DBMS", "Operating Systems",
    "Unit Testing", "PyTest", "Jest", "Web Speech API"
]

def extract_skills_heuristic(text: str) -> List[str]:
    """Extracts technical skills from text using boundary-safe matching."""
    found = []
    text_lower = text.lower()
    
    # Sort by length descending so multi-word tech (e.g. "Tailwind CSS") is prioritized
    sorted_taxonomy = sorted(TECHNICAL_SKILLS_TAXONOMY, key=len, reverse=True)
    
    for tech in sorted_taxonomy:
        tech_low = tech.lower()
        if tech in ["c", "r"]:
            pattern = r'(?:\b|(?<=[^a-zA-Z]))' + re.escape(tech_low) + r'(?:\b|(?=[^a-zA-Z]))'
            # Avoid false positives for C or R in isolated non-programming contexts
            if re.search(r'\b(programming|languages|c/c\+\+|python|java)\b', text_lower):
                if re.search(pattern, text_lower):
                    found.append(tech)
        elif tech in ["c++", "c#"]:
            if tech_low in text_lower:
                found.append(tech)
        else:
            pattern = r'\b' + re.escape(tech_low) + r'\b'
            if re.search(pattern, text_lower):
                found.append(tech)
                
    # Normalize variants (e.g. Scikit-learn vs Scikit-Learn)
    canonical = []
    seen_lower = set()
    for s in found:
        if s.lower() not in seen_lower:
            seen_lower.add(s.lower())
            canonical.append(s)
            
    return canonical

def extract_email(text: str) -> Optional[str]:
    """Finds candidate email address using robust regex."""
    match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    if match:
        email = match.group(0).strip().rstrip('.,;')
        return email
    return None

def extract_phone(text: str) -> Optional[str]:
    """Finds candidate telephone number."""
    match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?[6-9]\d{9}|(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,5}', text)
    if match:
        return match.group(0).strip()
    return None

def extract_candidate_name(text: str, filename: Optional[str] = None) -> str:
    """
    High-precision name extractor.
    Scans the top lines for candidate full name, converts all-caps to Title Case,
    and falls back to filename if text headers are obscured.
    """
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    
    # Exclude common resume headers, roles, and sections
    blocklist_words = {
        "resume", "curriculum", "vitae", "profile", "summary", "contact",
        "education", "experience", "skills", "projects", "objective",
        "email", "phone", "address", "linkedin", "github", "b.tech", "m.tech",
        "engineering", "developer", "intern", "undergraduate", "student",
        "professional", "technical", "competencies", "certifications"
    }
    
    for line in lines[:8]:
        clean = re.sub(r'[|•\-_:\(\)\d\+@]', ' ', line).strip()
        words = clean.split()
        
        # Name is typically 2 to 4 words, each word >= 2 letters
        if 2 <= len(words) <= 4:
            has_blocked = any(w.lower() in blocklist_words for w in words)
            if not has_blocked and all(w.isalpha() for w in words):
                # Format to title case (e.g. "KANCHANA METTA" -> "Kanchana Metta")
                formatted = " ".join(w.capitalize() for w in words)
                return formatted
                
    # Check if first line has 1 word or mixed letters
    if lines:
        first = re.sub(r'[^a-zA-Z\s]', '', lines[0]).strip()
        words = first.split()
        if 1 <= len(words) <= 3 and not any(w.lower() in blocklist_words for w in words):
            return " ".join(w.capitalize() for w in words)
            
    # Check filename fallback
    if filename:
        clean_fn = re.sub(r'\.(docx|pdf|txt)$', '', filename, flags=re.IGNORECASE)
        clean_fn = re.sub(r'resume|cv|final|updated|all|for|my|new|\d+', '', clean_fn, flags=re.IGNORECASE)
        clean_fn = re.sub(r'[-_]', ' ', clean_fn).strip()
        fn_words = [w for w in clean_fn.split() if len(w) > 2]
        if fn_words:
            return " ".join(w.capitalize() for w in fn_words)
            
    return "Candidate"

def extract_projects_heuristic(text: str, available_skills: List[str]) -> List[Dict[str, Any]]:
    """Extracts project titles, descriptions, and technologies."""
    projects = []
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    
    in_project_section = False
    current_proj = None
    
    for i, line in enumerate(lines):
        # Section header detection
        if re.match(r'^(selected\s+)?projects?\b', line, re.IGNORECASE):
            in_project_section = True
            continue
        elif in_project_section and re.match(r'^(experience|education|skills|achievements|certifications)\b', line, re.IGNORECASE):
            in_project_section = False
            if current_proj:
                projects.append(current_proj)
                current_proj = None
            break
            
        if in_project_section:
            # Look for project title lines (often contain separator like | or - or tech list)
            if ("|" in line or "—" in line or "-" in line) and len(line) < 180 and not line.startswith("•") and not line.startswith("-"):
                if current_proj:
                    projects.append(current_proj)
                
                parts = [p.strip() for p in re.split(r'[|—]', line) if p.strip()]
                title = parts[0]
                # Filter out trailing tags like "GitHub"
                title = re.sub(r'(GitHub|Live Demo|Hackathon Project).*$', '', title, flags=re.IGNORECASE).strip()
                
                # Match tech stack in title or line
                matched_tech = [s for s in available_skills if re.search(r'\b' + re.escape(s.lower()) + r'\b', line.lower())]
                
                current_proj = {
                    "title": title[:60],
                    "description": "",
                    "technologies": matched_tech[:6]
                }
            elif current_proj:
                # Add to description
                clean_desc = re.sub(r'^[•\-\*]\s*', '', line).strip()
                if not current_proj["description"]:
                    current_proj["description"] = clean_desc
                else:
                    current_proj["description"] += " " + clean_desc
                    
                # Search for extra technologies in description
                more_tech = [s for s in available_skills if re.search(r'\b' + re.escape(s.lower()) + r'\b', line.lower())]
                for mt in more_tech:
                    if mt not in current_proj["technologies"]:
                        current_proj["technologies"].append(mt)
                        
    if current_proj:
        projects.append(current_proj)
        
    # If standard block parser did not find structured projects, fallback to pattern search
    if not projects:
        matches = re.findall(r'(?:Project|Built|Developed)\s*:?\s*([^\n]+)', text, re.IGNORECASE)
        for m in matches[:4]:
            t_text = m.strip()[:60]
            matched = [s for s in available_skills if s.lower() in t_text.lower()]
            projects.append({
                "title": t_text,
                "description": m.strip(),
                "technologies": matched if matched else available_skills[:3]
            })
            
    return projects[:6]

def parse_resume_with_ai_or_heuristic(raw_text: str, filename: Optional[str] = None) -> Dict[str, Any]:
    """
    Parses resume raw text into structured JSON.
    Generates a deterministic NLP heuristic extraction first (instant & reliable).
    If Gemini is active and responsive, augments the data without overriding verified fields.
    """
    # 1. Deterministic NLP extraction
    extracted_skills = extract_skills_heuristic(raw_text)
    candidate_name = extract_candidate_name(raw_text, filename)
    candidate_email = extract_email(raw_text)
    candidate_phone = extract_phone(raw_text)
    extracted_projects = extract_projects_heuristic(raw_text, extracted_skills)
    
    heuristic_data: Dict[str, Any] = {
        "name": candidate_name,
        "email": candidate_email,
        "phone": candidate_phone,
        "skills": extracted_skills if extracted_skills else ["Python", "Software Engineering", "Problem Solving"],
        "projects": extracted_projects,
        "experience": [],
        "education": [],
        "technologies": extracted_skills if extracted_skills else ["Python", "Git"],
        "summary": f"{candidate_name} is a software engineer with technical proficiency in {', '.join(extracted_skills[:6]) if extracted_skills else 'software development'}."
    }
    
    # 2. If Gemini API is configured, attempt intelligent augmentation
    if gemini_client.has_valid_key():
        system_instruction = (
            "You are an expert technical recruiter and resume parsing engine. "
            "Extract candidate information into structured JSON. Do not hallucinate."
        )
        prompt = f"""
        Extract structured information from the candidate resume below.
        
        Resume Text:
        {raw_text[:4000]}
        
        Return JSON matching this exact structure:
        {{
            "name": "{candidate_name}",
            "email": "{candidate_email or 'candidate@example.com'}",
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
            "summary": "2-sentence summary of candidate background"
        }}
        """
        try:
            ai_parsed = gemini_client.generate_json(prompt, system_instruction)
            if ai_parsed and isinstance(ai_parsed, dict) and "skills" in ai_parsed:
                # Merge AI parsing with heuristic to guarantee no null/missing critical fields
                merged_name = ai_parsed.get("name")
                if not merged_name or merged_name in ["Candidate", "Candidate Full Name"]:
                    merged_name = candidate_name
                    
                merged_email = ai_parsed.get("email")
                if not merged_email or "example.com" in merged_email:
                    merged_email = candidate_email
                    
                ai_skills = ai_parsed.get("skills", [])
                all_skills = list(dict.fromkeys(extracted_skills + ai_skills))
                
                ai_projects = ai_parsed.get("projects", [])
                final_projects = ai_projects if ai_projects else extracted_projects
                
                return {
                    "name": merged_name,
                    "email": merged_email,
                    "phone": candidate_phone,
                    "skills": all_skills if all_skills else extracted_skills,
                    "projects": final_projects,
                    "experience": ai_parsed.get("experience", []),
                    "education": ai_parsed.get("education", []),
                    "technologies": all_skills,
                    "summary": ai_parsed.get("summary") or heuristic_data["summary"]
                }
        except Exception:
            # Fall back directly to heuristic data without delay
            pass

    return heuristic_data
