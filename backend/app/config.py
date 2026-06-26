import os

# Map SARVAM_API_KEY to GEMINI_API_KEY for compatibility with libraries expecting GEMINI_API_KEY
if "SARVAM_API_KEY" in os.environ and "GEMINI_API_KEY" not in os.environ:
    os.environ["GEMINI_API_KEY"] = os.environ["SARVAM_API_KEY"]
