# equipment_parser service
import re


def extract_id(question: str) -> str | None:
    """Extract equipment ID from a free‑text question.
    Looks for patterns like 'EQ-12345' or other alphanumeric identifiers with hyphens.
    Returns the ID string in uppercase, or ``None`` if not found.
    """
    if not question:
        return None
    match = re.search(r"\b[A-Z]{2,4}-[A-Z]{2,4}-\d{2,4}\b", question, re.IGNORECASE)
    return match.group(0).upper() if match else None
