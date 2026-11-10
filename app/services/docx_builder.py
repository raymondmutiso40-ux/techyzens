import os
from pathlib import Path
from datetime import datetime
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from app.models.entities import ProposalDraft, Tender, TenderTOR

def set_cell_background(cell, fill_hex: str):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

class DocxProposalBuilder:
    """
    Implements Slide 3 & 5:
    'Word (.docx) export from your templates: Drafts open in the tool your team already uses'
    """

    DARK_GREEN = RGBColor(27, 77, 62)      # #1B4D3E
    FOREST_ACCENT = RGBColor(46, 125, 50)  # #2E7D32
    MUTED_GRAY = RGBColor(100, 100, 100)

    @classmethod
    def generate_docx(
        cls,
        draft: ProposalDraft,
        tender: Tender,
        tor: TenderTOR,
        output_path: str
    ) -> str:
        doc = docx.Document()
        styles = doc.styles
        styles["Normal"].font.name = "Arial"
        styles["Normal"].font.size = Pt(10)
        styles["Normal"].paragraph_format.space_after = Pt(6)

        # Set standard margins (1 inch)
        for section in doc.sections:
            section.top_margin = Inches(1.0)
            section.bottom_margin = Inches(1.0)
            section.left_margin = Inches(1.0)
            section.right_margin = Inches(1.0)

        # Title
        p_title = doc.add_paragraph()
        p_title.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run_title = p_title.add_run(draft.title)
        run_title.font.name = "Arial"
        run_title.font.size = Pt(24)
        run_title.font.bold = True
        run_title.font.color.rgb = cls.DARK_GREEN

        p_subtitle = doc.add_paragraph()
        run_sub = p_subtitle.add_run(f"Technical Proposal & Methodological Response | {tender.donor or 'International Donor'}")
        run_sub.font.name = "Arial"
        run_sub.font.size = Pt(13)
        run_sub.font.italic = True
        run_sub.font.color.rgb = cls.FOREST_ACCENT

        # Meta Table
        table_meta = doc.add_table(rows=4, cols=2)
        table_meta.style = "Table Grid"
        table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
        meta_data = [
            ("Tender Reference:", tender.reference_code or tender.id),
            ("Procurement Authority / Donor:", tender.donor or "Specified in TOR"),
            ("Submission Deadline:", tender.deadline or "As specified"),
            ("Target Country / Region:", tender.country or "Global / Regional")
        ]
        for i, (k, v) in enumerate(meta_data):
            row = table_meta.rows[i]
            c0, c1 = row.cells[0], row.cells[1]
            c0.text = k
            c0.paragraphs[0].runs[0].font.bold = True
            c0.paragraphs[0].runs[0].font.size = Pt(10)
            c1.text = v
            c1.paragraphs[0].runs[0].font.size = Pt(10)
            set_cell_background(c0, "F0F4F2")

        doc.add_paragraph().paragraph_format.space_after = Pt(14)

        # Helper for adding styled sections
        def add_heading(text: str):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(16)
            p.paragraph_format.space_after = Pt(6)
            run = p.add_run(text)
            run.font.name = "Arial"
            run.font.size = Pt(15)
            run.font.bold = True
            run.font.color.rgb = cls.DARK_GREEN

        # 1. Executive Summary
        add_heading("1. Executive Summary")
        p_exec = doc.add_paragraph(draft.executive_summary)
        p_exec.paragraph_format.line_spacing = 1.15
        p_exec.paragraph_format.space_after = Pt(10)

        # 2. Context & TOR Understanding
        add_heading("2. Context & Understanding of Terms of Reference")
        p_context = doc.add_paragraph(draft.context_understanding)
        p_context.paragraph_format.line_spacing = 1.15
        p_context.paragraph_format.space_after = Pt(10)

        # 3. Technical Methodology
        add_heading("3. Proposed Technical Methodology & Implementation Framework")
        p_meth = doc.add_paragraph(draft.technical_methodology)
        p_meth.paragraph_format.line_spacing = 1.15
        p_meth.paragraph_format.space_after = Pt(10)

        # 4. Work Plan & Deliverables
        add_heading("4. Work Plan, Key Milestones & Deliverables")
        p_work = doc.add_paragraph(draft.work_plan_deliverables)
        p_work.paragraph_format.line_spacing = 1.15
        p_work.paragraph_format.space_after = Pt(10)

        # 5. Staffing Matrix
        add_heading("5. Proposed Key Personnel & Staffing Matrix")
        if draft.staffing_matrix:
            team_table = doc.add_table(rows=len(draft.staffing_matrix) + 1, cols=4)
            team_table.style = "Table Grid"
            team_table.alignment = WD_TABLE_ALIGNMENT.CENTER

            headers = ["Personnel Name", "Proposed Role", "Experience", "Core Specialization"]
            hdr_cells = team_table.rows[0].cells
            for idx, h_text in enumerate(headers):
                hdr_cells[idx].text = h_text
                hdr_cells[idx].paragraphs[0].runs[0].font.bold = True
                hdr_cells[idx].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
                set_cell_background(hdr_cells[idx], "1B4D3E")

            for row_idx, member in enumerate(draft.staffing_matrix, start=1):
                row_cells = team_table.rows[row_idx].cells
                row_cells[0].text = str(member.get("full_name") or "Name not provided")
                row_cells[1].text = str(member.get("role_title") or "Role not verified")
                experience = member.get("years_of_experience")
                row_cells[2].text = f"{experience} years" if experience is not None else "Not provided"
                skills = ", ".join((member.get("key_skills") or [])[:3])
                row_cells[3].text = skills or "Not provided"
                for cell in row_cells:
                    cell.paragraphs[0].runs[0].font.size = Pt(9.5)
                if row_idx % 2 == 1:
                    for cell in row_cells:
                        set_cell_background(cell, "F9FBF9")
        else:
            p_staff = doc.add_paragraph(
                "INFORMATION REQUIRED: No verified personnel records were matched. "
                "Add named personnel, roles, experience and supporting CVs/certificates before submission."
            )
            p_staff.paragraph_format.space_after = Pt(10)

        # 6. Past Performance
        add_heading("6. Past Performance & Institutional Capability")
        p_past = doc.add_paragraph(draft.past_performance)
        p_past.paragraph_format.line_spacing = 1.15
        p_past.paragraph_format.space_after = Pt(10)

        # 7. Compliance Verification Matrix
        add_heading("7. Compliance & Mandatory Criteria Matrix")
        if draft.compliance_matrix:
            comp_table = doc.add_table(rows=len(draft.compliance_matrix) + 1, cols=3)
            comp_table.style = "Table Grid"
            comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
            c_headers = ["Mandatory Requirement", "Compliance Status", "Supporting Evidence / Verification"]
            for idx, h_text in enumerate(c_headers):
                c_cell = comp_table.rows[0].cells[idx]
                c_cell.text = h_text
                c_cell.paragraphs[0].runs[0].font.bold = True
                c_cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
                set_cell_background(c_cell, "1B4D3E")

            for r_idx, comp_item in enumerate(draft.compliance_matrix, start=1):
                c_row = comp_table.rows[r_idx].cells
                c_row[0].text = str(comp_item.get("requirement", "Criterion"))
                c_row[1].text = str(comp_item.get("status", "NOT_VERIFIED"))
                c_row[2].text = str(comp_item.get("evidence", "No supporting evidence supplied; human verification required."))
                for cell in c_row:
                    cell.paragraphs[0].runs[0].font.size = Pt(9.5)

        # Human Review Notice Footer
        doc.add_paragraph().paragraph_format.space_before = Pt(20)
        p_notice = doc.add_paragraph()
        run_notice = p_notice.add_run(
            "*** HUMAN REVIEW NOTE: This document is a generated review-ready draft package. "
            "In strict accordance with BidDesk governance rules, submitting is always a person's call. "
            "The system never auto-submits. Please review, edit as needed, and sign off before final submission. ***"
        )
        run_notice.font.size = Pt(9)
        run_notice.font.italic = True
        run_notice.font.color.rgb = cls.MUTED_GRAY

        # Ensure parent folder exists
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        doc.save(output_path)
        return output_path
