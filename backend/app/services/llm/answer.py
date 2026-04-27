def synthesize_answer(client, query, df, insight_data=None):

    if df is None or df.empty:
        return "No data available."

    if insight_data:
        prompt = f"""
        You are a business analyst.

        Answer in simple human language.

        Query: {query}

        Current value: {insight_data['current']}
        Previous value: {insight_data['previous']}
        Change: {insight_data['change_pct']}%

        Rules:
        - Say clearly if it increased or decreased
        - Use numbers
        - Keep it short (1-2 lines)
        """
    else:
        data_str = df.to_string(index=False)

        prompt = f"""
        You are a business analyst.

        Answer the question using the data.

        Query: {query}

        Data:
        {data_str}
        """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content.strip()



def compute_insight(df):
    if df is None or len(df) < 2:
        return None

    current = df.iloc[0]['revenue']
    previous = df.iloc[1]['revenue']

    change_pct = ((current - previous) / previous) * 100 if previous != 0 else 0

    return {
        "current": current,
        "previous": previous,
        "change_pct": round(change_pct, 2)
    }