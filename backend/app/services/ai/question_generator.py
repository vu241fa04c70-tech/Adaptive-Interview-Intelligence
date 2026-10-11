from app.services.ai.gemini_service import gemini_client
from typing import Dict, Any, List

def generate_contextual_question(
    candidate_name: str,
    role: str,
    target_competency: str,
    target_difficulty: str,
    history: List[Dict[str, Any]]
) -> Dict[str, Any]:
    prompt = f"Generate an adaptive interview question for {candidate_name} applying for {role}. Competency: {target_competency}, Difficulty: {target_difficulty}."
    return {"question_text": prompt, "target_competency": target_competency, "difficulty": target_difficulty}
