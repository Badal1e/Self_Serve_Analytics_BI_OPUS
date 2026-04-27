def compute_confidence(success, rows, hypothesis_results, query):
    
    if not success:
        return 0.3, "Low confidence due to query execution failure."
    
    # ----------------------------------------
    # Base confidence
    # ----------------------------------------
    score = 0.6
    reasons = []
    
    # ----------------------------------------
    # Data availability
    # ----------------------------------------
    if rows > 0:
        score += 0.1
        reasons.append("sufficient data available")
    else:
        score -= 0.2
        reasons.append("limited data")
    
    # ----------------------------------------
    # Hypothesis support
    # ----------------------------------------
    if hypothesis_results:
        supported = [h for h in hypothesis_results if h["supported"]]
        
        if len(supported) > 0:
            score += 0.15
            reasons.append("hypothesis supported by data")
        else:
            score -= 0.1
            reasons.append("no strong hypothesis support")
    
    # ----------------------------------------
    # Query type adjustment
    # ----------------------------------------
    if "why" in query.lower():
        score -= 0.05  # reasoning is harder
        reasons.append("reasoning-based query")
    
    # Clamp
    score = round(min(max(score, 0.3), 0.9), 2)
    
    explanation = "Confidence is {} because {}.".format(
        "high" if score > 0.75 else "moderate" if score > 0.55 else "low",
        ", ".join(reasons)
    )
    
    return score, explanation
 