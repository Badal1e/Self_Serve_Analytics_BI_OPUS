 # ============================================
# DISPLAY OUTPUT
# ============================================
 
from IPython.display import display
 
 
def display_output(output):
 
    print("\n" + "=" * 60)
    print("BUSINESS INSIGHT")
    print("=" * 60)
    print(output["answer"])
 
    print("\nSQL USED")
    print(output["sql"])
 
    print("\nHYPOTHESES")
    for h in output["hypotheses"]:
        print(f"- {h}")
 
    # ----------------------------------------
    # Hypothesis Testing Results (NEW)
    # ----------------------------------------
    if output.get("hypothesis_results"):
        print("\nHYPOTHESIS TEST RESULTS")
 
        for h in output["hypothesis_results"]:
            status = "SUPPORTED" if h["supported"] else "NOT SUPPORTED"
 
            print(f"\n- {h['hypothesis']}")
            print(f"  Metric: {h['metric']}")
            print(f"  Last Week: {h['last_week']}")
            print(f"  Previous Week: {h['prev_week']}")
            print(f"  Change: {h['change_pct']}%")
            print(f"  Result: {status}")
 
    print(f"\nCONFIDENCE: {output['confidence']}")
    print(f"\nREASON: {output['confidence_reason']}")

    if output.get("best_hypothesis"):
        print("\nTOP DRIVER:")
        print(f"- {output['best_hypothesis']['hypothesis']}")
        print(f"  Impact: {output['best_hypothesis']['change_pct']}%")
 
 
    # ----------------------------------------
    # Chart
    # ----------------------------------------
    if output["chart"]:
        display(output["chart"])
 