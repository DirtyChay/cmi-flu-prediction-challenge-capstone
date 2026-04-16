import pandas as pd
from pathlib import Path

CLEANED_DIR = Path("cleaned_data")
EXCLUDE = {"array_cleaned.csv", "bcr_cleaned.csv"}

dfs = {}
for csv_file in sorted(CLEANED_DIR.glob("*.csv")):
    if csv_file.name in EXCLUDE:
        continue
    name = csv_file.stem.replace("_cleaned", "")
    dfs[name] = pd.read_csv(csv_file, low_memory=False)
    print(f"Loaded {csv_file.name}: {dfs[name].shape}")

# Start with participants as the base (one row per participant)
merged = dfs.pop("participants")

for name, df in dfs.items():
    merged = merged.merge(df, on="participant_id", how="outer", suffixes=("", f"_{name}"))
    print(f"After joining {name}: {merged.shape}")

print(f"\nFinal shape: {merged.shape}")
print(merged.head())
