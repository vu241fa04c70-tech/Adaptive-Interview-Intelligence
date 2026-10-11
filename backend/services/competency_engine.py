from typing import Dict, Any, List

DEFAULT_COMPETENCIES_BY_ROLE: Dict[str, List[str]] = {
    "Python Developer": [
        "Python Fundamentals & Syntax",
        "Data Structures & Algorithms",
        "Object-Oriented Programming",
        "Exception Handling & Resilience",
        "APIs & Backend Development",
        "Databases & SQL",
        "Testing & Debugging",
        "Project Ownership & Architecture",
        "Communication & Problem-Solving"
    ],
    "Java Developer": [
        "Java Core & Memory Management",
        "OOP & Design Patterns",
        "Spring Boot & Microservices",
        "Data Structures & Algorithms",
        "Databases & ORM",
        "Testing & Debugging",
        "System Architecture",
        "Communication & Problem-Solving"
    ],
    "Frontend Developer": [
        "JavaScript & TypeScript Core",
        "React Architecture & Hooks",
        "State Management & Performance",
        "Web APIs & Asynchronous Flow",
        "Responsive UI & CSS",
        "Frontend Testing & Debugging",
        "Component Architecture",
        "Communication & Problem-Solving"
    ],
    "Machine Learning Engineer": [
        "Python & Scientific Stack",
        "Machine Learning Algorithms",
        "Model Training & Evaluation",
        "Deep Learning Frameworks",
        "Data Preprocessing & Feature Engineering",
        "ML Architecture & MLOps",
        "Testing & Validation",
        "Problem Formulation & Math"
    ],
    "Data Analyst": [
        "SQL & Relational Databases",
        "Data Manipulation & Pandas",
        "Statistical Reasoning & Metrics",
        "Data Visualization & Reporting",
        "Data Cleaning & Quality",
        "Business Acumen",
        "Analytical Problem Solving"
    ]
}

def get_role_competency_map(role_title: str, required_skills: List[str] = None) -> Dict[str, Dict[str, Any]]:
    # Match key in default maps
    base_comp_list = None
    role_lower = role_title.lower()
    
    if "python" in role_lower:
        base_comp_list = DEFAULT_COMPETENCIES_BY_ROLE["Python Developer"]
    elif "java" in role_lower:
        base_comp_list = DEFAULT_COMPETENCIES_BY_ROLE["Java Developer"]
    elif "front" in role_lower or "react" in role_lower or "web" in role_lower:
        base_comp_list = DEFAULT_COMPETENCIES_BY_ROLE["Frontend Developer"]
    elif "machine" in role_lower or "ml" in role_lower or "ai" in role_lower:
        base_comp_list = DEFAULT_COMPETENCIES_BY_ROLE["Machine Learning Engineer"]
    elif "data" in role_lower or "analytic" in role_lower:
        base_comp_list = DEFAULT_COMPETENCIES_BY_ROLE["Data Analyst"]
    else:
        base_comp_list = DEFAULT_COMPETENCIES_BY_ROLE["Python Developer"]

    comp_map = {}
    for comp in base_comp_list:
        comp_map[comp] = {
            "name": comp,
            "score": 0.0,
            "status": "unassessed", # unassessed, claimed_untested, demonstrated, partially_demonstrated, not_demonstrated
            "evidence_count": 0,
            "tested_questions": []
        }

    # Add custom skills from job description if not already present
    if required_skills:
        for skill in required_skills[:3]:
            if skill and skill not in comp_map and len(comp_map) < 12:
                comp_map[skill] = {
                    "name": skill,
                    "score": 0.0,
                    "status": "unassessed",
                    "evidence_count": 0,
                    "tested_questions": []
                }

    return comp_map

def update_competency_status(
    comp_map: Dict[str, Dict[str, Any]],
    target_competency: str,
    score: float,
    question_idx: int
) -> Dict[str, Dict[str, Any]]:
    """
    Updates the competency score and status based on evidence score (0 to 4).
    """
    if not target_competency or target_competency not in comp_map:
        # Try fuzzy match
        matched_key = None
        for key in comp_map.keys():
            if target_competency and (key.lower() in target_competency.lower() or target_competency.lower() in key.lower()):
                matched_key = key
                break
        if matched_key:
            target_competency = matched_key
        else:
            # Fallback to first unassessed competency
            unassessed = [k for k, v in comp_map.items() if v["status"] in ["unassessed", "claimed_untested"]]
            if unassessed:
                target_competency = unassessed[0]
            else:
                return comp_map

    item = comp_map[target_competency]
    prev_score = item.get("score", 0.0)
    count = item.get("evidence_count", 0)
    tested_q = item.get("tested_questions", [])
    
    # Running average score
    new_score = ((prev_score * count) + score) / (count + 1)
    item["score"] = round(new_score, 2)
    item["evidence_count"] = count + 1
    if question_idx not in tested_q:
        tested_q.append(question_idx)
    item["tested_questions"] = tested_q

    # Determine status
    if new_score >= 3.0:
        item["status"] = "demonstrated"
    elif new_score >= 1.5:
        item["status"] = "partially_demonstrated"
    else:
        item["status"] = "not_demonstrated"

    comp_map[target_competency] = item
    return comp_map
