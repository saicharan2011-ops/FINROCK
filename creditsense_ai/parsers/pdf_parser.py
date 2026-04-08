import fitz
import pdfplumber

RISK_KEYWORDS = [
    "default", "npa", "winding up", "legal notice",
    "arbitration", "drt", "nclt", "ots", "insolvency",
    "moratorium", "pledge invoked", "cheque bounce",
    "cheque dishonour", "overdue", "restructured",
    "enforcement directorate", "cbi", "sebi penalty",
    "rbi action", "show cause notice", "plant shutdown",
    "capacity underutilization", "strike", "labour dispute"
]

def parse_pdf(filepath: str) -> dict:
    doc = fitz.open(filepath)
    full_text = ""
    for page in doc:
        full_text += page.get_text()

    page_count = doc.page_count    # save BEFORE closing
    doc.close()

    text_lower = full_text.lower()

    found_keywords = [
        kw for kw in RISK_KEYWORDS if kw in text_lower
    ]

    keyword_counts = {
        kw: text_lower.count(kw) for kw in found_keywords
    }

    risk_score = min(1.0, len(found_keywords) * 0.1)

    return {
        "text":                full_text,
        "page_count":          page_count,
        "risk_keywords_found": found_keywords,
        "keyword_counts":      keyword_counts,
        "litigation_risk":     round(risk_score, 2),
        "char_count":          len(full_text),
        "has_risk":            len(found_keywords) > 0
    }


def extract_tables_from_pdf(filepath: str) -> list:
    """
    Bonus function: extracts tables from PDFs.
    Used for financial statement tables in annual reports.
    Returns list of tables, each table is a list of rows.
    """
    all_tables = []
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            if tables:
                all_tables.extend(tables)
    return all_tables