# ============================================
# STREAMLIT APP
# ============================================

import streamlit as st
from pipeline.pipeline import run_pipeline
import altair as alt
import pandas as pd

st.set_page_config(
    page_title="AI Analytics Assistant",
    layout="wide"
)

st.title("AI Analytics Assistant")
st.markdown("Ask business questions and get instant insights + charts")

query = st.text_input("Enter your question")

if st.button("Run Analysis") and query:

    with st.spinner("Analyzing..."):
        output = run_pipeline(query)

    # ----------------------------------------
    # DISPLAY
    # ----------------------------------------
    st.subheader("Business Insight")
    st.write(output["answer"])

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("SQL")
        st.code(output["sql"], language="sql")

    with col2:
        st.subheader("Confidence")
        st.metric(label="Confidence Score", value=output["confidence"])

    st.subheader("Hypotheses")
    for h in output["hypotheses"]:
        st.write(f"- {h}")

    # ----------------------------------------
    # CHART
    # ----------------------------------------
    if output["chart"]:
        st.subheader("Visualization")

        chart_dict = output["chart"]

        try:
            chart = alt.Chart.from_dict(chart_dict)
            st.altair_chart(chart, use_container_width=True)
        except:
            st.warning("Chart rendering failed")