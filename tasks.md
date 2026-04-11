### Tasks 4.1 – 4.10: Antibody Response Prediction

| # | Task | Feature | Training Data | Shortlisted | Assay | Measure | Metric | Description |
|---|------|---------|---------------|-------------|-------|---------|--------|-------------|
| 4.1 | Predict magnitude of antibody response (D28) | H1N1 A/Victoria/4897/2022 | Demographics + Day 0 + Day 7 innate | ❌ | HAI | Absolute value | Spearman correlation | Post-vac HAI of the H1N1 vaccine strain at Day 28 |
| 4.2 | Predict magnitude of antibody response (D28) | H3N2 A/Massachusetts/18/2022 | Demographics + Day 0 + Day 7 innate | ❌ | HAI | Absolute value | Spearman correlation | Post-vac HAI of the H3N2 vaccine strain at Day 28 |
| 4.3 | Predict magnitude of antibody response (D28) | Vic B/Austria/1359417/2021 | Demographics + Day 0 + Day 7 innate | ❌ | HAI | Absolute value | Spearman correlation | Post-vac HAI of the B Victoria vaccine strain at Day 28 |
| 4.4 | Predict magnitude of antibody response – all 3 strains (D28) | 3 vaccine strains | Demographics + Day 0 + Day 7 innate | ✅ | HAI | Geo mean | Spearman correlation | Geo mean of HAI across the 3 vaccine strains (4.1, 4.2, 4.3) at Day 28 |
| 4.5 | Predict antibody breadth – all variants (D28) | All variants | Demographics + Day 0 + Day 7 innate | ✅ | HAI | Geo mean | Spearman correlation | Geomean HAI across all variants |
| 4.6 | Predict antibody breadth – all variants (D28) | All variants | Demographics + Day 0 + Day 7 innate | ❌ | HAI | Percentage | Spearman correlation | Percentage of variants with HAI ≥ 40 |
| 4.7 | Predict antibody durability (D365) | H1N1 A/Victoria/4897/2022 | Demographics + Day 0 + Day 7 innate | ❌ | HAI | Post-vac HAI | Spearman correlation | Post-vac HAI of the H1N1 vaccine strain at Day 365 |
| 4.8 | Predict antibody durability (D365) | H3N2 A/Massachusetts/18/2022 | Demographics + Day 0 + Day 7 innate | ❌ | HAI | Post-vac HAI | Spearman correlation | Post-vac HAI of the H3N2 vaccine strain at Day 365 |
| 4.9 | Predict antibody durability (D365) | Vic B/Austria/1359417/2021 | Demographics + Day 0 + Day 7 innate | ❌ | HAI | Post-vac HAI | Spearman correlation | Post-vac HAI of the B Victoria vaccine strain at Day 365 |
| 4.10 | Predict antibody durability – all 3 strains (D365) | 3 vaccine strains | Demographics + Day 0 + Day 7 innate | ❌ | HAI | Geo mean HAI | Spearman correlation | Geo mean of HAI across the 3 vaccine strains at Day 365 |

**Shortlisted tasks:** 4.4 and 4.5 only.