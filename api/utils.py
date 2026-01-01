import pandas as pd
import io

def parse_data(text):
    df = pd.read_csv(io.StringIO(text))
    return {
        "columns": list(df.columns),
        "preview": df.head(20).to_dict(orient="records"),
        "summary": df.describe().to_dict()
    }
