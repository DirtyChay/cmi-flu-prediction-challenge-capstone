import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

files_with_timepoints = {
    "challenge_hai": DATA_DIR / "challenge_hai.tsv",
    "challenge_flow": DATA_DIR / "challenge_flow.tsv",
    "challenge_transcriptomics": DATA_DIR / "challenge_transcriptomics.tsv",
}

for name, path in files_with_timepoints.items():
    df = pd.read_csv(path, sep="\t")
    timepoints = sorted(df["timepoint"].unique())
    print(f"{name}: {timepoints}")
