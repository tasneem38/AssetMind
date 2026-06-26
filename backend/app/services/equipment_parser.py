# equipment_parser service
import re


def extract_id(question: str) -> str | None:
    """Extract equipment ID from a free‑text question.
    Looks for patterns like 'EQ-12345' or other alphanumeric identifiers with hyphens.
    Returns the ID string in uppercase, or ``None`` if not found.
    """
    if not question:
        return None
    # Match alphanumeric strings with optional hyphens, length >=3, containing at least one digit
    match = re.search(r"(?i)\b(?=[A-Z0-9-]*\d)[A-Z0-9-]{3,}\b", question)
    return match.group(0).upper() if match else None
