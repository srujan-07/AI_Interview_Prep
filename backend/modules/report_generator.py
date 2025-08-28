# modules/report_generator.py

import datetime
import os
import numpy as np
import matplotlib.pyplot as plt
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Frame, PageTemplate
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
# --- THIS IS THE FIX: Import TA_LEFT ---
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT
from reportlab.lib.units import inch
from reportlab.lib import colors
from modules.llm_handler import generate_holistic_feedback, parse_scores_from_evaluation
import config

# The rest of the file remains the same...

class ReportPageTemplate(PageTemplate):
    def __init__(self, id, pagesize):
        frame = Frame(inch, inch, pagesize[0] - 2 * inch, pagesize[1] - 2 * inch, id='normal')
        PageTemplate.__init__(self, id, [frame])

    def beforeDrawPage(self, canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(colors.grey)
        footer_text = f"Page {doc.page} | AI Interview Coach Report | Generated on {datetime.datetime.now().strftime('%Y-%m-%d')}"
        canvas.drawCentredString(doc.width / 2 + inch, 0.75 * inch, footer_text)
        canvas.restoreState()

def create_radar_chart(labels, scores, file_path):
    num_vars = len(labels)
    angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
    scores += scores[:1]; angles += angles[:1]
    fig, ax = plt.subplots(figsize=(6, 6), subplot_kw=dict(polar=True))
    ax.fill(angles, scores, color='#4A90E2', alpha=0.2)
    ax.plot(angles, scores, color='#4A90E2', linewidth=2, linestyle='solid')
    ax.set_yticklabels([]); ax.set_xticks(angles[:-1]); ax.set_xticklabels(labels, size=12, color='grey')
    ax.set_ylim(0, 10)
    for angle, score in zip(angles[:-1], scores[:-1]):
        ax.text(angle, score + 1.5, str(score), ha='center', va='center', size=14, color="#000000", weight='bold')
    plt.title('Performance Snapshot', size=20, color='#333333', y=1.1)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    plt.savefig(file_path, transparent=True, dpi=150)
    plt.close(fig)
    print(f"📈 Radar chart saved to {file_path}")

def generate_pdf_report(interview_data, file_path):
    doc = SimpleDocTemplate(file_path, pagesize=(8.5 * inch, 11 * inch),
                            leftMargin=inch, rightMargin=inch, topMargin=inch, bottomMargin=inch)
    doc.addPageTemplates([ReportPageTemplate('main_template', (8.5 * inch, 11 * inch))])
    
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(name='ReportTitle', parent=styles['h1'], fontSize=28, alignment=TA_CENTER, spaceAfter=24))
    styles.add(ParagraphStyle(name='ReportSubTitle', parent=styles['h2'], fontSize=16, alignment=TA_CENTER, spaceAfter=12, textColor=colors.HexColor('#555555')))
    styles.add(ParagraphStyle(name='Justify', alignment=TA_JUSTIFY, spaceAfter=12, leading=14))
    styles.add(ParagraphStyle(name='MainHeader', parent=styles['h1'], fontSize=22, spaceBefore=12, spaceAfter=20, alignment=TA_LEFT, textColor=colors.HexColor('#2c3e50')))
    styles.add(ParagraphStyle(name='QuestionTitle', parent=styles['h2'], spaceBefore=20, spaceAfter=10, textColor=colors.HexColor('#2980b9')))
    styles.add(ParagraphStyle(name='SectionTitle', parent=styles['h3'], spaceBefore=12, spaceAfter=6, textColor=colors.HexColor('#34495e')))

    story = []

    story.append(Paragraph("Interview Performance Report", styles['ReportTitle']))
    story.append(Spacer(1, 0.5 * inch))
    story.append(Paragraph(f"Prepared for: <b>{interview_data.get('name', 'N/A')}</b>", styles['ReportSubTitle']))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(f"Interview Type: <b>{interview_data.get('type', 'N/A')}</b>", styles['ReportSubTitle']))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(f"Date of Report: <b>{datetime.datetime.now().strftime('%B %d, %Y')}</b>", styles['ReportSubTitle']))
    story.append(PageBreak())

    story.append(Paragraph("Overall Performance Analysis", styles['MainHeader']))
    full_log_text = ""
    all_scores = []
    skill_labels = ['Factual Accuracy', 'Relevance & Directness', 'Structure & Clarity']
    for i, qa in enumerate(interview_data['q_and_a']):
        full_log_text += f"Q{i+1}: {qa['question']}\nA: {qa['answer']}\n---\n"
        scores = parse_scores_from_evaluation(qa['evaluation'])
        all_scores.append([scores.get(label, 0) for label in skill_labels])
    holistic_feedback = generate_holistic_feedback(full_log_text).replace('\n', '<br/>')
    story.append(Paragraph(holistic_feedback, styles['Justify']))
    story.append(Spacer(1, 0.3 * inch))

    if all_scores:
        avg_scores = np.mean(all_scores, axis=0).tolist()
        chart_path = os.path.join(config.REPORT_FOLDER, "skill_chart.png")
        if os.path.exists(chart_path): os.remove(chart_path)
        create_radar_chart(skill_labels, avg_scores, chart_path)
        story.append(Image(chart_path, width=4.5*inch, height=4.5*inch, hAlign='CENTER'))
    story.append(PageBreak())

    story.append(Paragraph("Detailed Question Analysis", styles['MainHeader']))
    for i, qa in enumerate(interview_data['q_and_a']):
        story.append(Paragraph(f"Question {i+1}: {qa['question']}", styles['QuestionTitle']))
        story.append(Paragraph("Your Answer:", styles['SectionTitle']))
        story.append(Paragraph(qa.get('answer', 'N/A'), styles['Justify']))
        story.append(Paragraph("AI Evaluation:", styles['SectionTitle']))
        story.append(Paragraph(qa.get('evaluation', 'N/A').replace('\n', '<br/>'), styles['Justify']))

    try:
        doc.build(story)
        print(f"\n✅ Professional report generated successfully: {file_path}")
    except Exception as e:
        print(f"💥 Error generating professional PDF report: {e}")