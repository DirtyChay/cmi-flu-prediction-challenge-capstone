View the challenge here:

```
https://www.kaggle.com/competitions/cmi-flu-internal-prediction-challenge/data
```

To download the data:

- Create a Kaggle account and API token.
- Install the Kaggle CLI: `pip install kaggle`
- Accept the competition rules. Then run these commands:

```shell
export KAGGLE_API_TOKEN=[YOUR_API_TOKEN]
kaggle competitions download -c cmi-flu-internal-prediction-challenge
```

Extract files and move them to the data folder.

Submission:

Where a geometric mean is required, the geometric mean is calculated as exp(mean(log(values+1))).

To submit, drag and drop the csv on Kaggle.