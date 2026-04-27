import json

def understand_query(client, query):

    prompt = f"""
    Extract structured info.

    Return ONLY JSON:
    {{
      "complexity": "simple or complex",
      "metric": "revenue | transactions | avg_value | failures",
      "time_filter": "7d | 30d | monthly | none",
      "comparison": "yes or no"
    }}

    Query: {query}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}]
    )

    content = response.choices[0].message.content.strip()

    try:
        return json.loads(content)

    except:
        # 🔥 fallback (VERY IMPORTANT)
        return {
            "complexity": "simple",
            "metric": "revenue",
            "time_filter": "none",
            "comparison": "no"
        }