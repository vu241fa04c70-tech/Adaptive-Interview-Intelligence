import json
import logging
from typing import Dict, Any, List, Optional
from services.gemini_service import gemini_client
from services.competency_engine import update_competency_status

logger = logging.getLogger("proofhire.adaptive")

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
    Generates the initial greeting and opening resume/intro question.
    """
    if gemini_client.has_valid_key():
        system_prompt = "You are a professional senior technical interviewer at ProofHire AI."
        prompt = f"""
        Generate the opening question for an interview session.
        Candidate: {candidate_name}
        Target Role: {role}
        Resume Projects: {parsed_resume.get('projects', [])}
        Resume Skills: {parsed_resume.get('skills', [])}
        Job Title: {job_description.get('title', role)}
        Interview Duration: {duration_minutes} minutes
        Difficulty: {target_difficulty}
        
        Return JSON matching:
        {{
            "question_text": "Professional greeting + introduction + role & resume context question",
            "question_type": "opening",
            "difficulty": "{target_difficulty}",
            "target_competency": "{competencies[0] if competencies else 'Communication & Problem-Solving'}",
            "reason_for_next_question": "Starting the interview by breaking the ice and probing the candidate's core project experience from their resume."
        }}
        """
        res = gemini_client.generate_json(prompt, system_prompt)
        if res and isinstance(res, dict) and "question_text" in res:
            return res

    # Adaptive fallback
    project_name = "your recent project"
    if parsed_resume.get("projects") and len(parsed_resume["projects"]) > 0:
        p = parsed_resume["projects"][0]
        project_name = p.get("title", "your recent project")
    
    first_skill = parsed_resume.get("skills", ["software development"])[0] if parsed_resume.get("skills") else "software development"
    
    greeting = (
        f"Welcome to your technical interview for the {role} role, {candidate_name}! "
        f"I'm your ProofHire AI interviewer. We'll spend the next {duration_minutes} minutes discussing your technical experience, "
        f"problem-solving approach, and foundational skills.\n\n"
        f"To kick things off, I noticed in your resume that you worked on {project_name} using {first_skill}. "
        f"Could you give me a 2-minute summary of that project, specifically highlighting your personal engineering contribution and the key technical challenges you solved?"
    )

    return {
        "question_text": greeting,
        "question_type": "opening",
        "difficulty": target_difficulty,
        "target_competency": competencies[0] if competencies else "Project Ownership & Architecture",
        "reason_for_next_question": f"Greeting the candidate and probing their resume project ({project_name}) to establish a baseline for their personal engineering contribution."
    }


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
    Evaluates candidate's answer against rubric (0-4), updates competency map,
    and constructs the next adaptive follow-up question.
    """
    question_index = len(history) + 1
    total_expected_questions = max(5, duration_minutes // 3)
    is_last_question = question_index >= total_expected_questions

    # Unassessed competencies list
    unassessed = [k for k, v in competency_map.items() if v["status"] in ["unassessed", "claimed_untested"]]
    partially_tested = [k for k, v in competency_map.items() if v["status"] == "partially_demonstrated"]

    if gemini_client.has_valid_key():
        system_prompt = (
            "You are ProofHire AI's lead interviewer and competency evaluator. "
            "Evaluate candidate's answer accurately on a 0-4 rubric scale. "
            "Identify demonstrated concepts, missing details, evidence, and construct the next contextually relevant adaptive follow-up question."
        )
        prompt = f"""
        Session Context:
        Target Role: {role}
        Target Difficulty: {target_difficulty}
        Current Question #{question_index}: {current_question.get('question_text')}
        Target Competency: {current_question.get('target_competency')}
        Candidate Answer: {candidate_answer}
        Competency State: {json.dumps({k: v['status'] for k, v in competency_map.items()})}
        Is Final Question: {is_last_question}
        
        Previous Q&A History Summary:
        {[{"q": h.get("question_text"), "a": h.get("candidate_answer")} for h in history[-2:]]}
        
        Return JSON matching this exact structure:
        {{
            "answer_summary": "Concise 1-2 sentence summary of candidate's answer",
            "score": 3.0,
            "rubric_scores": {{
                "technical_correctness": 3.0,
                "depth_of_understanding": 3.0,
                "problem_solving": 3.0,
                "clarity_of_explanation": 3.0,
                "relevance": 4.0
            }},
            "demonstrated_concepts": ["Concept 1", "Concept 2"],
            "missing_concepts": ["Missing detail 1"],
            "evidence": [
                {{"point": "Demonstrated X", "quote": "Direct quote from answer", "status": "strong"}}
            ],
            "uncertainties": [],
            "target_competency": "{current_question.get('target_competency')}",
            "is_interview_complete": {str(is_last_question).lower()},
            "next_question_text": "Follow up question based on previous answer",
            "next_question_type": "follow_up",
            "next_question_difficulty": "intermediate",
            "next_target_competency": "Next skill to assess",
            "reason_for_next_question": "Explain why this question was chosen based on previous response."
        }}
        """
        ai_res = gemini_client.generate_json(prompt, system_prompt)
        if ai_res and isinstance(ai_res, dict) and "score" in ai_res:
            # Update competency map
            target_comp = ai_res.get("target_competency") or current_question.get("target_competency")
            updated_map = update_competency_status(
                competency_map,
                target_comp,
                float(ai_res.get("score", 2.5)),
                question_index
            )
            ai_res["updated_competency_map"] = updated_map
            return ai_res

    # Fallback Adaptive Rule Engine with rich contextual analysis
    answer_clean = candidate_answer.strip()
    words = len(answer_clean.split())
    answer_lower = answer_clean.lower()

    # Detect answer quality signals
    idk_phrases = ["don't know", "dont know", "not sure", "no idea", "haven't used", "havent used", "unfamiliar", "never used"]
    is_idk = any(phrase in answer_lower for phrase in idk_phrases) and words < 25
    
    is_vague = (words < 15 or "etc" in answer_lower or "stuff like that" in answer_lower) and not is_idk
    is_strong = words >= 25 and any(kw in answer_lower for kw in ["because", "for example", "handled", "trade-off", "performance", "pattern", "index", "async", "latency", "scale", "tested", "architecture", "custom exception", "try-except", "logging", "fastapi", "pydantic"])
    
    # Calculate rubric score (0 to 4 scale)
    if is_idk:
        score = 0.5
        tech_score = 0.0
        depth_score = 0.0
        ps_score = 0.5
        clarity_score = 3.0 # Honest communication
        relevance_score = 2.0
        summary = "Candidate transparently stated they were unfamiliar with the queried topic."
        demonstrated = ["Professional honesty and transparency"]
        missing = ["Technical knowledge of target domain concept"]
        evidence = [{"point": "Candidate acknowledged limitation directly", "quote": answer_clean[:100], "status": "acknowledged"}]
    elif is_vague:
        score = 1.5
        tech_score = 1.5
        depth_score = 1.0
        ps_score = 1.5
        clarity_score = 2.0
        relevance_score = 2.5
        summary = "Candidate gave a brief or high-level answer without concrete implementation details."
        demonstrated = ["High-level conceptual awareness"]
        missing = ["Implementation details", "Practical code examples", "Architectural trade-offs"]
        evidence = [{"point": "Provided high-level summary but missed technical specifics", "quote": answer_clean[:120], "status": "partial"}]
    elif is_strong:
        score = 3.5
        tech_score = 3.5
        depth_score = 3.5
        ps_score = 3.5
        clarity_score = 3.5
        relevance_score = 4.0
        summary = "Candidate provided a detailed, well-structured response with concrete examples and sound reasoning."
        demonstrated = ["In-depth technical knowledge", "Practical problem-solving", "Clear communication"]
        missing = ["Edge-case boundary testing under extreme load"]
        evidence = [{"point": "Elaborated with relevant technical concepts and practical experience", "quote": answer_clean[:150], "status": "strong"}]
    else:
        score = 2.5
        tech_score = 2.5
        depth_score = 2.0
        ps_score = 2.5
        clarity_score = 3.0
        relevance_score = 3.0
        summary = "Candidate gave a correct baseline answer covering the core concepts."
        demonstrated = ["Core conceptual correctness"]
        missing = ["Deeper optimization considerations and failure recovery strategies"]
        evidence = [{"point": "Answered main question correctly", "quote": answer_clean[:120], "status": "moderate"}]

    target_comp = current_question.get("target_competency") or (list(competency_map.keys())[0] if competency_map else "Technical Competency")
    updated_map = update_competency_status(competency_map, target_comp, score, question_index)

    # Determine next question strategy based on answer quality and remaining competencies
    if is_last_question:
        next_q_text = (
            f"Thank you, that covers all our interview topics for today! "
            f"You've demonstrated your technical approach across {len(competency_map)} key competencies. "
            f"Please click 'Finish & View Report' below to generate your comprehensive performance and skill gap analysis report."
        )
        next_type = "closing"
        next_diff = target_difficulty
        next_comp = "Interview Completion"
        reason = "Interview timer/question count reached. Wrapping up session for final report generation."
    else:
        # Choose next competency
        next_comp = target_comp
        if is_idk:
            # Pivot professionally to a new skill
            next_comp = unassessed[0] if unassessed else (partially_tested[0] if partially_tested else target_comp)
            next_type = "technical"
            next_diff = "intermediate" if target_difficulty != "beginner" else "beginner"
            next_q_text = (
                f"I appreciate your honesty! Let's pivot to a different area. "
                f"Regarding {next_comp}, how do you usually approach error handling, logging, and state validation when building production services?"
            )
            reason = f"Candidate admitted not knowing {target_comp}. Pivoting gracefully to unassessed skill ({next_comp}) to maintain momentum."
        elif is_vague:
            # Probe deeper on same competency
            next_type = "follow_up"
            next_diff = target_difficulty
            next_q_text = (
                f"You mentioned {answer_clean[:40]}... Could you elaborate on a specific scenario where you implemented that? "
                f"What potential bottlenecks or edge cases did you encounter, and how did you verify your solution?"
            )
            reason = f"Previous answer on {target_comp} was high-level/vague. Asking a targeted follow-up to request a concrete implementation scenario."
        elif is_strong:
            # Increase difficulty or move to next competency with a challenge
            if unassessed:
                next_comp = unassessed[0]
                next_type = "technical"
                next_diff = "advanced" if target_difficulty == "intermediate" else target_difficulty
                next_q_text = (
                    f"Great answer! Now stepping up to {next_comp}: Imagine a high-throughput scenario where performance degrades under concurrent user traffic. "
                    f"How would you diagnose the bottleneck, and what specific architectural or data structure optimizations would you apply?"
                )
                reason = f"Previous answer on {target_comp} was strong (score {score}). Escalating difficulty and moving to unassessed competency: {next_comp}."
            else:
                next_type = "behavioral"
                next_diff = target_difficulty
                next_q_text = (
                    f"That was a solid technical breakdown. Turning to project execution and collaboration: "
                    f"Can you share an instance where you disagreed with a peer or team member on a software design decision? "
                    f"How did you resolve the disagreement while keeping project goals on track?"
                )
                reason = f"Technical competencies well-covered with strong answers. Transitioning to behavioral and project ownership assessment."
        else: # Standard correct answer
            next_comp = unassessed[0] if unassessed else (partially_tested[0] if partially_tested else target_comp)
            next_type = "follow_up"
            next_diff = target_difficulty
            next_q_text = (
                f"Thanks for that explanation. Next, let's explore {next_comp}. "
                f"In your experience, what are the key trade-offs between speed of development vs long-term maintainability for that layer?"
            )
            reason = f"Previous answer covered basics of {target_comp}. Moving to assess {next_comp} with emphasis on engineering trade-offs."

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
        "updated_competency_map": updated_map
    }
