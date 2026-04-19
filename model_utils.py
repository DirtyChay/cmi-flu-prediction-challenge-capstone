import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import KFold, cross_val_predict
from sklearn.pipeline import Pipeline


def vaccine_cols(data, strains, day):
    # Only returns columns that actually exist in `data`. Some vaccine strains (e.g. the
    # challenge-only H3N2 A/Massachusetts/18/2022) have no training measurements.
    return [c for c in (f'HAI_{s}_d{day}' for s in strains) if c in data.columns]


def evaluate(X, y_vals, task_label, plot_color='teal', y_axis_label='True'):
    """Fit + 5-fold CV, print metrics, show scatter, return held-out predictions."""
    cat_cols = X.select_dtypes(include='object').columns.tolist()
    if cat_cols:
        X = pd.get_dummies(X, columns=cat_cols, drop_first=True)

    model = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('regressor', LinearRegression()),
    ])
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    y_pred_cv = cross_val_predict(model, X, y_vals, cv=cv)

    rho_cv, pval_cv = spearmanr(y_vals, y_pred_cv)
    rmse = np.sqrt(mean_squared_error(y_vals, y_pred_cv))
    mse = mean_squared_error(y_vals, y_pred_cv)
    mae = mean_absolute_error(y_vals, y_pred_cv)

    print(f'Samples: {len(X)}   Features: {X.shape[1]}')
    print(f'Spearman (5-fold CV): {rho_cv:.3f}  (p-value: {pval_cv:.4g})')
    print(f"{'Model':<40} {'RMSE':>8} {'MSE':>10} {'MAE':>8} {'Spearman':>10}")
    print(f"{'Linear Regression (5-Fold CV)':<40} {rmse:>8.4f} {mse:>10.4f} {mae:>8.4f} {rho_cv:>10.4f}")

    plt.figure(figsize=(6, 5))
    plt.scatter(y_vals, y_pred_cv, alpha=0.5, color=plot_color)
    plt.plot([y_vals.min(), y_vals.max()], [y_vals.min(), y_vals.max()], 'r--', label='Perfect')
    plt.xlabel(y_axis_label)
    plt.ylabel('Predicted (held-out)')
    plt.title(f'{task_label} - Linear Model (5-Fold CV)\nSpearman \u03c1 = {rho_cv:.3f}')
    plt.legend()
    plt.tight_layout()
    plt.show()

    return y_pred_cv
