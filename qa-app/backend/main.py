import os
import tempfile
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# LangChain Official Google Integration
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

load_dotenv()
app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# CONFIG: Updated to the current stable model IDs for 2026
LLM_MODEL = "gemini-2.5-flash"
EMBED_MODEL = "models/gemini-embedding-001"
DB_PATH = "vectorstore/db_faiss"
vector_store = None


class ChatRequest(BaseModel):
    question: str


@app.on_event("startup")
async def load_db():
    global vector_store
    if os.path.exists(DB_PATH):
        try:
            embeddings = GoogleGenerativeAIEmbeddings(model=EMBED_MODEL)
            vector_store = FAISS.load_local(
                DB_PATH, embeddings, allow_dangerous_deserialization=True
            )
            print("✅ Vector database loaded successfully.")
        except Exception as e:
            print(f"⚠️ Could not load database: {e}")


@app.post("/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    global vector_store

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # RESTORED: The logic to define tmp_path
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # Load and Split
        loader = PyPDFLoader(tmp_path)
        docs = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200
        )
        splits = text_splitter.split_documents(docs)

        # Embed and Save
        embeddings = GoogleGenerativeAIEmbeddings(model=EMBED_MODEL)
        vector_store = FAISS.from_documents(splits, embeddings)
        vector_store.save_local(DB_PATH)

        return {
            "status": "success",
            "message": f"Processed {file.filename} successfully!",
        }

    except Exception as e:
        print(f"🔥 Error during upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.post("/chat")
async def chat(request: ChatRequest):
    global vector_store
    if not vector_store:
        raise HTTPException(status_code=400, detail="Please upload a PDF first.")

    try:
        # 1. Similarity Search
        docs = vector_store.similarity_search(request.question, k=3)
        context = "\n\n".join([d.page_content for d in docs])

        # 2. Use LangChain's Official Google Chat Class
        llm = ChatGoogleGenerativeAI(model=LLM_MODEL, temperature=0.3)

        # We wrap the context and question into a prompt
        prompt = f"""You are 'DocuBrain', an expert document intelligence assistant. 
Your task is to analyze the provided extracted text from a document and answer the user's question accurately.

### CONSTRAINTS & RULES:
1. **Rely on Context:** Base your answer strictly on the provided context. Do not bring in outside knowledge unless it is to briefly explain a complex technical term found in the text.
2. **Handle Summaries:** If the user asks for a summary, an overview, or "what you understood," synthesize the core themes and main points from the provided context.
3. **Missing Information:** If the context does not contain the information needed to answer the question, politely state: "The provided document does not contain information about..." Do not guess.
4. **Formatting:** Use Markdown formatting (bullet points, bold text) to make your answers easy to read and digest.

### EXTRACTED CONTEXT:
{context}

### USER QUESTION:
{request.question}

### YOUR ANSWER:
"""

        response = llm.invoke(prompt)

        return {"answer": response.content}

    except Exception as e:
        print(f"🔥 Error during chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))
