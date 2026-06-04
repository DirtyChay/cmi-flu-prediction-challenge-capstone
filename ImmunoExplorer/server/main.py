"""
FastAPI backend for ImmunoExplorer chat.
Uses Ollama (local, no API key needed).

Setup:
    1. Install Ollama from https://ollama.com
    2. Run: ollama pull llama3.2
    3. pip install -r requirements.txt

Run:
    cd ImmunoExplorer/server
    uvicorn main:app --port 8000 --reload
"""

import asyncio
from pathlib import Path

import ollama
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Paths ─────────────────────────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent.parent.parent / "cleaned_data"

# ── Load data once at startup ─────────────────────────────────────────────────
def _load(filename: str) -> pd.DataFrame:
    p = DATA_DIR / filename
    if not p.exists():
        raise FileNotFoundError(f"Cannot find {p}")
    return pd.read_csv(p)

train     = _load("train_combined.csv")
challenge = _load("challenge_combined.csv")

# ── Build compact context string ──────────────────────────────────────────────
def _summarise(name: str, df: pd.DataFrame) -> str:
    part_cols = [c for c in df.columns if c.startswith("PART_")]
    hai_cols  = [c for c in df.columns if c.startswith("HAI_")]
    tran_cols = [c for c in df.columns if c.startswith("TRAN_")]
    other     = [c for c in df.columns if not c.startswith(("PART_", "HAI_", "TRAN_"))]

    d0_hai = [c for c in hai_cols if c.endswith("_d0")][:8]
    stat_block = df[d0_hai].describe().round(3).to_string() if d0_hai else "N/A"

    preview_cols = (["participant_id"] if "participant_id" in df.columns else []) \
                 + part_cols + d0_hai[:4]
    preview = df[preview_cols].head(3).to_string(index=False)

    return (
        f"=== {name} ===\n"
        f"Shape: {df.shape[0]} rows × {df.shape[1]} columns\n"
        f"Other columns : {other}\n"
        f"Demographics  : {part_cols}\n"
        f"HAI titers    : {len(hai_cols)} columns (log2-transformed). "
        f"Timepoints: _d0 (baseline), _d28 (D28), _d365 (D365).\n"
        f"  All strains: {[c.replace('HAI_','').rsplit('_',1)[0] for c in hai_cols if c.endswith('_d0')]}\n"
        f"Transcriptomics: {len(tran_cols)} PCA columns (TRAN_PC1 … TRAN_PC{len(tran_cols)})\n"
        f"\nSample rows (demographics + first 4 D0 HAI columns):\n{preview}\n"
        f"\nD0 HAI statistics (first 8 strains, log2 scale):\n{stat_block}\n"
    )

SYSTEM_PROMPT = f"""You are a concise, expert data analyst assistant for an immunology flu vaccine study.
You have full knowledge of these two datasets:

{_summarise("train_combined", train)}

{_summarise("challenge_combined", challenge)}

Guidelines:
- Answer factually and concisely. Use the dataset descriptions above to give accurate column names,
  shapes, and statistics.
- For computations you cannot do in your head (e.g. filtering, correlations), write a short
  Python/pandas snippet the user can run — do NOT make up numbers.
- HAI values are log2-transformed. Raw titer = 2^(log2 value).
- TRAN_PCx columns are PCA projections of Day 7 transcriptomics.
- Use markdown formatting (bold, inline code, bullet lists) in your replies.
- Keep replies under 300 words unless a longer explanation is genuinely needed.
"""

# MODEL = "llama3.2"
MODEL = "gemma4"


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="ImmunoExplorer Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str    # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []


@app.post("/chat")
async def chat(req: ChatRequest):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.message})

    try:
        # Run synchronous ollama call in a thread so it doesn't block the server
        response = await asyncio.to_thread(
            ollama.chat, model=MODEL, messages=messages
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    return {"response": response.message.content}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": MODEL,
        "train_rows": len(train),
        "train_cols": len(train.columns),
        "challenge_rows": len(challenge),
        "challenge_cols": len(challenge.columns),
    }
