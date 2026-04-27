import altair as alt
import pandas as pd
 
 
def generate_chart(df, chart_type):
    
    if df is None or df.empty or chart_type == "none":
        return None
    
    df_plot = df.copy()
    
    df_plot.columns = [str(c).lower() for c in df_plot.columns]
    
    if len(df_plot.columns) < 2:
        return None
    
    x, y = df_plot.columns[0], df_plot.columns[1]
    
    # Try convert datetime
    try:
        df_plot[x] = pd.to_datetime(df_plot[x])
        is_time = True
    except:
        is_time = False
    
    # ----------------------------------------
    # LINE CHART
    # ----------------------------------------
    if chart_type == "line":
        return alt.Chart(df_plot).mark_line().encode(
            x=alt.X(x, type='temporal' if is_time else 'ordinal'),
            y=alt.Y(y, type='quantitative')
        ).properties(width=700, height=400)
    
    # ----------------------------------------
    # BAR CHART
    # ----------------------------------------
    if chart_type == "bar":
        return alt.Chart(df_plot).mark_bar().encode(
            x=alt.X(x, type='nominal'),
            y=alt.Y(y, type='quantitative')
        ).properties(width=700, height=400)
    
    return None
 
def decide_chart_type(client, query, df):
    
    if df is None or df.empty:
        return None
    
    columns = list(df.columns)
    
    prompt = f"""
    Decide the best chart type.
 
    Return ONLY one of:
    line, bar, none
 
    Rules:
    - Use line for time trends
    - Use bar for category comparisons
    - Use none if only 1 value
 
    Query:
    {query}
 
    Columns:
    {columns}
 
    Sample Data:
    {df.head(5).to_string(index=False)}
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content.strip().lower()