import numpy as np
import pandas as pd


def log_standard_scale(df, exclude_cols=('participant_id',)):
    """
    Apply log2(x + 1) transform followed by standard scaling (z-score)
    to all numeric columns except those in `exclude_cols`.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with pivoted gene expression columns (TPM values).
    exclude_cols : tuple of str
        Column names to leave untouched (e.g. 'participant_id').

    Returns
    -------
    pd.DataFrame
        A copy of the DataFrame with transformed gene columns.
    """
    df = df.copy()
    gene_cols = [c for c in df.columns if c not in exclude_cols]

    # Log-transform to reduce right-skew typical of TPM data
    df[gene_cols] = np.log2(df[gene_cols] + 1)

    # Standard scale: zero mean, unit variance per gene
    df[gene_cols] = (df[gene_cols] - df[gene_cols].mean()) / df[gene_cols].std()

    return df


def peek(df, rows=5, cols=20):
    """Quick preview of a wide DataFrame, truncated to first `cols` columns."""
    return df.iloc[:rows, :cols]