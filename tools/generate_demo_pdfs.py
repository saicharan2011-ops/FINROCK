import os
from pathlib import Path
from datetime import date

import fitz  # PyMuPDF


OUT_DIR = Path(__file__).resolve().parent.parent / "tests" / "demo_docs"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def _title(page, text: str):
    page.insert_text((72, 72), text, fontsize=20, fontname="helv", fill=(0, 0, 0))


def _h(page, y: int, text: str):
    page.insert_text((72, y), text, fontsize=13, fontname="helv", fill=(0, 0, 0))


def _p(page, y: int, text: str):
    page.insert_textbox(
        fitz.Rect(72, y, 540, y + 220),
        text,
        fontsize=10.5,
        fontname="helv",
        fill=(0.05, 0.05, 0.05),
        align=fitz.TEXT_ALIGN_LEFT,
    )


def make_court_record_pdf(path: Path):
    doc = fitz.open()
    p1 = doc.new_page()
    _title(p1, "HIGH COURT OF KARNATAKA — CASE INFORMATION SHEET (DEMO)")
    _h(p1, 110, f"Generated: {date.today().isoformat()}   |   Reference: CS-AUDIT-COURT-001")
    _p(
        p1,
        150,
        "Parties:\n"
        "  Petitioner: Nexus Global Pvt. Ltd.\n"
        "  Respondent: State Tax Authority\n\n"
        "Case Type: Writ Petition (Commercial)\n"
        "Filing No.: WP-COMM/2024/01988\n"
        "Next Hearing: 2026-05-02\n\n"
        "Allegations Summary:\n"
        "- Disputed GST input credit reversal notices for FY 2023-24\n"
        "- Alleged circular invoicing through 6 counter-parties\n\n"
        "Interim Orders:\n"
        "- Interim stay granted subject to 15% deposit and bank guarantee\n\n"
        "Risk Notes (CreditSense):\n"
        "- Litigation presence increases legal/compliance risk\n"
        "- Allegation involves trading loop patterns (requires graph audit)\n",
    )
    p2 = doc.new_page()
    _title(p2, "ANNEXURE — HEARING HISTORY (DEMO)")
    _p(
        p2,
        110,
        "2025-11-18: Matter admitted; notice issued.\n"
        "2026-01-10: Respondent filed counter affidavit.\n"
        "2026-03-08: Interim stay order; compliance reporting directed.\n\n"
        "Court Observations (Excerpt):\n"
        "\"The dispute appears to involve input credit reversals linked to alleged circular trading.\n"
        "The petitioner shall maintain full transactional transparency pending final adjudication.\"",
    )
    doc.save(str(path))


def make_gst_filing_pdf(path: Path):
    doc = fitz.open()
    p = doc.new_page()
    _title(p, "GST RETURN SUMMARY — GSTR-3B (DEMO)")
    _h(p, 110, "Taxpayer: Nexus Global Pvt. Ltd.   |   GSTIN: 29ABCDE1234F1Z5")
    _p(
        p,
        150,
        "Period: Apr 2024 – Mar 2025\n\n"
        "Key Figures:\n"
        "- Outward taxable supplies: INR 128.4 Cr\n"
        "- ITC claimed: INR 11.2 Cr\n"
        "- Net tax payable: INR 7.6 Cr\n\n"
        "Compliance Notes:\n"
        "- 2 late filings (Aug, Sep)\n"
        "- ITC variance flagged against counterparty mismatch in GSTR-2A\n\n"
        "CreditSense Audit Flags:\n"
        "- Revenue vs bank inflow mismatch requires reconciliation\n"
        "- High ITC-to-sales ratio relative to sector median\n",
    )
    doc.save(str(path))


def make_bank_statement_pdf(path: Path):
    doc = fitz.open()
    p = doc.new_page()
    _title(p, "BANK STATEMENT — TRANSACTION SUMMARY (DEMO)")
    _h(p, 110, "Bank: Axis Bank   |   Account: 91XXXXXX2041   |   Period: 01-Apr-2024 to 31-Mar-2025")
    _p(
        p,
        150,
        "Top Credits (sample):\n"
        "  2024-06-18  + INR 2.10 Cr   NEFT: VISTA TRADERS LLP\n"
        "  2024-07-02  + INR 1.65 Cr   RTGS: ORBIT SUPPLIERS PVT LTD\n"
        "  2024-09-14  + INR 1.92 Cr   NEFT: VISTA TRADERS LLP\n\n"
        "Top Debits (sample):\n"
        "  2024-06-19  - INR 2.05 Cr   NEFT: ORBIT SUPPLIERS PVT LTD\n"
        "  2024-07-03  - INR 1.60 Cr   RTGS: VISTA TRADERS LLP\n"
        "  2024-09-15  - INR 1.90 Cr   NEFT: ORBIT SUPPLIERS PVT LTD\n\n"
        "Anomaly Notes (CreditSense):\n"
        "- Rapid credit→debit cycles between same counterparties within 24h\n"
        "- Repeated round-amount transfers suggest potential layering\n",
    )
    doc.save(str(path))


def main():
    make_court_record_pdf(OUT_DIR / "court_record_demo.pdf")
    make_gst_filing_pdf(OUT_DIR / "gst_filing_demo.pdf")
    make_bank_statement_pdf(OUT_DIR / "bank_statement_demo.pdf")
    print(f"Wrote demo PDFs to: {OUT_DIR}")


if __name__ == "__main__":
    main()

