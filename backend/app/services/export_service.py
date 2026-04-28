import io
import logging
from typing import Tuple
import base64

import pandas as pd
from jinja2 import Template

from app.models.query_log import QueryLog

logger = logging.getLogger(__name__)

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Analytics Export - Query #{{ query_id }}</title>
    <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
    <style>
        body { font-family: 'Segoe UI', sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; }
        h1 { color: #1a1a2e; }
        .section { margin: 24px 0; }
        .label { font-weight: bold; color: #555; }
        pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #16213e; color: white; }
        .confidence { font-size: 1.2em; color: #e94560; }
        img { margin-top: 10px; border-radius: 8px; }
    </style>
</head>
<body>
    <h1>Query #{{ query_id }}</h1>

    <div class="section">
        <p class="label">Question:</p>
        <p>{{ question }}</p>
    </div>

    <div class="section">
        <p class="label">Answer:</p>
        <p>{{ answer }}</p>
    </div>

    <div class="section">
        <p class="label">Confidence:</p>
        <p class="confidence">{{ confidence }}% - {{ confidence_reason }}</p>
    </div>

    <div class="section">
        <p class="label">Generated SQL:</p>
        <pre>{{ sql }}</pre>
    </div>

    {% if data_html %}
    <div class="section">
        <p class="label">Data:</p>
        {{ data_html }}
    </div>
    {% endif %}

    {% if chart %}
    <div class="section">
        <p class="label">Chart:</p>
        <div id="vis"></div>
        <script>
            var spec = {{ chart | safe }};
            vegaEmbed('#vis', spec).catch(console.error);
        </script>
    </div>
    {% endif %}

</body>
</html>"""


class ExportService:

    # =========================
    # PDF EXPORT (WITH CHART)
    # =========================
    def export_pdf(self, log: QueryLog) -> Tuple[io.BytesIO, str, str]:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
        from reportlab.lib.styles import getSampleStyleSheet

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Title
        story.append(Paragraph(f"Query #{log.id}", styles["Title"]))
        story.append(Spacer(1, 12))

        # Question
        story.append(Paragraph("Question:", styles["Heading2"]))
        story.append(Paragraph(log.natural_language_query, styles["Normal"]))
        story.append(Spacer(1, 12))

        # Answer
        story.append(Paragraph("Answer:", styles["Heading2"]))
        story.append(Paragraph(log.answer_text or "N/A", styles["Normal"]))
        story.append(Spacer(1, 12))

        # Confidence
        confidence_pct = round((log.confidence_score or 0) * 100, 1)
        story.append(Paragraph("Confidence:", styles["Heading2"]))
        story.append(Paragraph(
            f"{confidence_pct}% - {log.confidence_reason or 'N/A'}",
            styles["Normal"]
        ))
        story.append(Spacer(1, 12))

        # SQL
        story.append(Paragraph("Generated SQL:", styles["Heading2"]))
        story.append(Paragraph(
            f"<pre>{log.generated_sql or 'N/A'}</pre>",
            styles["Code"]
        ))
        story.append(Spacer(1, 12))

        # 🔥 CHART ADDITION
        if log.chart_spec:
            try:
                import json
                import vl_convert as vlc
                
                # Try parsing as JSON first
                try:
                    spec = json.loads(log.chart_spec)
                    # Convert to PNG using vl-convert
                    png_data = vlc.vegalite_to_png(spec)
                    img_buffer = io.BytesIO(png_data)
                    story.append(Paragraph("Chart:", styles["Heading2"]))
                    story.append(Image(img_buffer, width=450, height=250))
                    story.append(Spacer(1, 12))
                except json.JSONDecodeError:
                    # Fallback if it actually was base64 for some reason
                    if log.chart_spec.startswith("data:image"):
                        image_data = base64.b64decode(log.chart_spec.split(",")[1])
                        img_buffer = io.BytesIO(image_data)
                        story.append(Paragraph("Chart:", styles["Heading2"]))
                        story.append(Image(img_buffer, width=450, height=250))
                        story.append(Spacer(1, 12))
                    else:
                        logger.warning("Chart format not supported")

            except Exception as e:
                logger.error("Chart rendering failed: %s", e)

        doc.build(story)
        buf.seek(0)

        return buf, "application/pdf", f"query_{log.id}.pdf"

    # =========================
    # EXCEL EXPORT
    # =========================
    def export_excel(self, log: QueryLog) -> Tuple[io.BytesIO, str, str]:
        buf = io.BytesIO()

        data = log.result_summary.get("data", []) if log.result_summary else []
        df = pd.DataFrame(data) if data else pd.DataFrame()

        summary = pd.DataFrame([{
            "Query": log.natural_language_query,
            "Answer": log.answer_text or "",
            "SQL": log.generated_sql or "",
            "Confidence": log.confidence_score or 0,
            "Confidence Reason": log.confidence_reason or "",
        }])

        with pd.ExcelWriter(buf, engine="openpyxl") as writer:
            summary.to_excel(writer, sheet_name="Summary", index=False)
            if not df.empty:
                df.to_excel(writer, sheet_name="Data", index=False)

        buf.seek(0)
        return buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", f"query_{log.id}.xlsx"

    # =========================
    # HTML EXPORT (WITH CHART)
    # =========================
    def export_html(self, log: QueryLog) -> Tuple[io.BytesIO, str, str]:
        data = log.result_summary.get("data", []) if log.result_summary else []
        df = pd.DataFrame(data) if data else pd.DataFrame()

        data_html = df.to_html(index=False, classes="data-table") if not df.empty else ""

        template = Template(HTML_TEMPLATE)
        html_content = template.render(
            query_id=log.id,
            question=log.natural_language_query,
            answer=log.answer_text or "N/A",
            confidence=round((log.confidence_score or 0) * 100, 1),
            confidence_reason=log.confidence_reason or "N/A",
            sql=log.generated_sql or "N/A",
            data_html=data_html,
            chart=log.chart_spec  # 🔥 KEY FIX
        )

        buf = io.BytesIO(html_content.encode("utf-8"))

        return buf, "text/html", f"query_{log.id}.html"