"""
querychat Shiny app for ImmunoExplorer.

This is the "smart" data chat: querychat turns natural-language questions into
SQL, runs the SQL against the real train_combined dataset (via DuckDB), and
answers from the actual results — so questions like "how many participants in
each vaccine arm?" get computed, not guessed.

The React dashboard embeds this app in an <iframe> (see ChatPanel).

Setup:
    1. Install Ollama from https://ollama.com and have a tool-capable model
       available (this project uses `gemma4`, which reports the `tools` capability).
    2. pip install -r requirements.txt

Run (port 8001 is what the React iframe points at):
    cd ImmunoExplorer/server
    shiny run querychat_app.py --port 8001 --reload

Optional env vars:
    QUERYCHAT_MODEL      Ollama model name (default: gemma4)
    OLLAMA_BASE_URL      Ollama host (default: http://localhost:11434)
"""

import os
from pathlib import Path

import chatlas
import pandas as pd
from shiny import App, render, ui
from querychat import QueryChat

# ── Load data ─────────────────────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent.parent.parent / "cleaned_data"
CSV_PATH = DATA_DIR / "train_combined.csv"
if not CSV_PATH.exists():
    raise FileNotFoundError(f"Cannot find {CSV_PATH}")

train = pd.read_csv(CSV_PATH)

# ── Local Ollama model (via chatlas) ──────────────────────────────────────────
# querychat accepts any chatlas.Chat; ChatOllama talks to a local Ollama server.
# The model must support tool calling (llama3.2, qwen2.5, mistral-nemo, …).
MODEL = os.getenv("QUERYCHAT_MODEL", "gemma4")
ollama_client = chatlas.ChatOllama(
    model=MODEL,
    base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
)

# ── Describe the schema so the model writes correct SQL ───────────────────────
DATA_DESCRIPTION = """
The `train` table is one row per participant in a flu-vaccine study.

Key columns:
- `participant_id`        : unique participant identifier
- `PART_biological_sex`   : participant biological sex
- `PART_arm_name`         : the vaccine arm / cohort the participant was assigned to
- `PART_age`              : participant age in years

HAI antibody titer columns are named `HAI_<strain>_<timepoint>` where timepoint is
one of `d0` (Day 0 baseline), `d28` (Day 28, post-vaccination), or `d365` (Day 365).
HAI values are log2-transformed, so a +1 difference means a doubling of titer; the
raw titer is 2 ^ (log2 value). Many HAI columns contain NULLs where a strain was
not assayed for that participant or timepoint.

`TRAN_PC*` columns (if present) are PCA projections of Day-7 transcriptomics.

Note: column names contain spaces and slashes, so quote them in SQL with double
quotes, e.g. SELECT "HAI_H1N1 A/California/7/2009_d28" FROM train.
""".strip()

EXTRA_INSTRUCTIONS = """
- When asked "per vaccine arm" or "per cohort", group by `PART_arm_name`.
- Prefer COUNT / AVG / GROUP BY over listing raw rows.
- HAI values are on a log2 scale; mention that when reporting titer changes.
- If a question needs a column that doesn't exist, say so plainly.
""".strip()

GREETING = """
👋 I can query the **train_combined** flu-vaccine dataset for you.

Try asking:
- *How many participants are in each vaccine arm?*
- *What is the age distribution by sex?*
- *Which HAI strains have the most missing Day-28 values?*
""".strip()

# ── Build the app ─────────────────────────────────────────────────────────────
qc = QueryChat(
    train,
    "train",
    client=ollama_client,
    greeting=GREETING,
    data_description=DATA_DESCRIPTION,
    extra_instructions=EXTRA_INSTRUCTIONS,
)

# ── Dark theme to match the React dashboard ───────────────────────────────────
# Bootstrap 5 supports a built-in dark mode via data-bs-theme="dark"; we enable
# it and override the palette to the dashboard's colors (#0F1117 / #1E2130 / teal).
DARK_CSS = """
:root {
  --bs-body-bg: #0F1117;
  --bs-body-color: #CBD5E1;
  --bs-primary: #2E86AB;
  --bs-primary-rgb: 46,134,171;
  --bs-border-color: rgba(255,255,255,0.08);
  --bs-emphasis-color: #E2E8F0;
}
body, .bslib-page-sidebar { background-color: #0F1117 !important; }
.card, .bslib-sidebar-layout > .sidebar, .sidebar {
  background-color: #1E2130 !important;
  border-color: rgba(255,255,255,0.07) !important;
}
.card-header { background-color: #181B26 !important; color: #E2E8F0 !important; }
.form-control, .form-select, textarea {
  background-color: #0F1117 !important;
  color: #E2E8F0 !important;
  border-color: rgba(255,255,255,0.12) !important;
}
.btn-primary { background-color: #2E86AB; border-color: #2E86AB; }
a, .suggestion { color: #00D9C0 !important; }
"""

app_ui = ui.page_sidebar(
    qc.sidebar(),
    ui.card(
        ui.card_header(ui.output_text("data_title")),
        ui.output_data_frame("data_table"),
        fill=True,
    ),
    ui.head_content(
        # Enable Bootstrap dark mode as early as possible to avoid a light flash.
        ui.tags.script(
            "document.documentElement.setAttribute('data-bs-theme','dark');"
        ),
        ui.tags.style(DARK_CSS),
    ),
    title="ImmunoExplorer · train",
    fillable=True,
)


def server(input, output, session):
    qc_vals = qc.server()

    @render.data_frame
    def data_table():
        return qc_vals.df()

    @render.text
    def data_title():
        return qc_vals.title() or "train dataset"


app = App(app_ui, server)
