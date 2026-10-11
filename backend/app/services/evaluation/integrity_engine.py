import logging
from typing import List, Dict, Any

logger = logging.getLogger("proofhire.integrity")

INTEGRITY_EVENT_TYPES = {
    "TAB_SWITCH": {"name": "Tab Switch / Window Blur", "base_severity": "medium", "weight": 20},
    "PASTE_DETECTED": {"name": "Large Text Paste Detected", "base_severity": "high", "weight": 35},
    "SPEECH_PAUSE": {"name": "Unusual Speech Silence Pause", "base_severity": "low", "weight": 10},
    "AUDIO_ANOMALY": {"name": "Audio Input Disconnection / Multiple Voices", "base_severity": "medium", "weight": 25},
    "SPEED_ANOMALY": {"name": "Unnatural Answer Typing Speed", "base_severity": "medium", "weight": 20},
    "GAZE_DEVIATION": {"name": "Off-screen Camera Gaze Shift", "base_severity": "low", "weight": 15},
    "WINDOW_RESIZE": {"name": "Browser Window Resize / Split View", "base_severity": "low", "weight": 10}
}

def classify_event(event_type: str, details: str = "", confidence: float = 0.9) -> Dict[str, Any]:
    meta = INTEGRITY_EVENT_TYPES.get(event_type.upper(), {
        "name": event_type,
        "base_severity": "low",
        "weight": 10
    })
    return {
        "event_type": event_type.upper(),
        "event_name": meta["name"],
        "severity": meta["base_severity"],
        "confidence": confidence,
        "details": details or f"Observed {meta['name']} during active question prompt."
    }

def analyze_integrity_events(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not events:
        return {
            "risk_level": "low",
            "risk_score": 0.0,
            "summary": "No integrity risk signals detected during the session. Candidate completed interview under normal monitored conditions.",
            "events_timeline": [],
            "flagged_counts": {},
            "requires_human_review": False,
            "explainable_risk_profile": "Clean session observation. Zero focus losses, paste anomalies, or speech interruptions recorded."
        }

    total_risk = 0.0
    counts: Dict[str, int] = {}
    timeline = []

    for evt in events:
        evt_type = evt.get("event_type", "UNKNOWN").upper()
        timestamp = evt.get("timestamp", "")
        details = evt.get("details", "")

        meta = INTEGRITY_EVENT_TYPES.get(evt_type, {"name": evt_type, "base_severity": "low", "weight": 10})
        counts[evt_type] = counts.get(evt_type, 0) + 1
        
        weight = meta["weight"]
        if counts[evt_type] > 2:
            weight = int(weight * 1.5)

        total_risk += weight

        timeline.append({
            "event_type": evt_type,
            "event_name": meta["name"],
            "severity": meta["base_severity"],
            "timestamp": timestamp,
            "details": details or f"Recorded {meta['name']}",
            "confidence": evt.get("confidence", 0.9)
        })

    risk_score = min(100.0, round(total_risk, 1))

    if risk_score >= 60.0:
        risk_level = "high"
        requires_review = True
        summary = f"High Integrity Risk Signal ({risk_score}/100). Multiple high-severity events detected (Paste events: {counts.get('PASTE_DETECTED', 0)}, Tab switches: {counts.get('TAB_SWITCH', 0)})."
        explainable = "FACTS: Repetitive focus shifts and text pastes recorded. RECOMMENDATION: Mandatory human recruiter review recommended before finalizing hiring decision."
    elif risk_score >= 25.0:
        risk_level = "medium"
        requires_review = True
        summary = f"Moderate Integrity Risk Signal ({risk_score}/100). Minor focus shifts or speech pauses detected."
        explainable = "FACTS: Isolated focus changes or typing bursts detected. RECOMMENDATION: Flagged for optional recruiter sanity check."
    else:
        risk_level = "low"
        requires_review = False
        summary = f"Low Integrity Risk Signal ({risk_score}/100). Standard interview interaction pattern."
        explainable = "FACTS: Session completed cleanly within acceptable operational thresholds. RECOMMENDATION: No manual review required."

    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "summary": summary,
        "events_timeline": timeline,
        "flagged_counts": counts,
        "requires_human_review": requires_review,
        "explainable_risk_profile": explainable
    }
