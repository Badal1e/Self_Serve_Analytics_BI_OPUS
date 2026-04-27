def generate_hypotheses(client, query, complexity):
    
    if complexity == "simple":
        return ["Direct computation"]
    
    prompt = f"Generate 3 hypotheses:\n{query}"
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return [h.strip("- ") for h in response.choices[0].message.content.split("\n") if h.strip()]
 