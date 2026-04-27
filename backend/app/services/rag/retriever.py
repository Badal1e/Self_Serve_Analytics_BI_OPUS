from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
 
schema_docs = [
    "txn_id: unique transaction id",
    "user_id: user identifier",
    "amount: transaction amount",
    "status: SUCCESS/FAILED/PENDING",
    "payment_method: CARD/UPI/WALLET",
    "country: transaction country",
    "created_at: timestamp of transaction"
]
 
model = SentenceTransformer(r"models\local_embedding_model")
embeddings = model.encode(schema_docs)
 
index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(np.array(embeddings))
 
def retrieve_schema(query, k=3):
    q_emb = model.encode([query])
    _, indices = index.search(np.array(q_emb), k)
    
    context = "\n".join([schema_docs[i] for i in indices[0]])
    context += "\nUse only these columns."
    
    return context