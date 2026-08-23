import pandas as pd
import mysql.connector
from sqlalchemy import create_engine
import sys
import json

engine = create_engine(
    "mysql+mysqlconnector://root:@localhost/idx_exchange"
)

# Monthly price trends for a city. 
# Note that the oldest close date is 2025-12-16 and the latest close date is 2026-06-15, barring some outliers.
# This means only up to 6 months can seen due to the data in the california_sold.
def get_price_trend(city: str, months: int = 24):
    if not city:
        return "Please provide city name."
        
    query = """
        SELECT
            DATE_FORMAT(CloseDate, "%Y-%m") AS month,
            COUNT(*) AS sales,
            ROUND(AVG(ClosePrice), 0) AS avg_price,
            ROUND(AVG(ClosePrice / NULLIF(LivingArea,0)),0) AS avg_price_per_sqft,
            ROUND(AVG(DaysOnMarket), 1) AS avg_dom,
            ROUND(AVG(ClosePrice / NULLIF(ListPrice,0)) * 100, 1) AS list_to_close_pct
        FROM california_sold
        WHERE City = %s
            AND PropertyType = "Residential"
            AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL %s MONTH)
        GROUP BY DATE_FORMAT(CloseDate, "%Y-%m")
        ORDER BY month
    """
    df = pd.read_sql(query, engine, params=(city, months))
    df["price_change_pct"] = df["avg_price"].pct_change() * 100
    return df

if __name__ == "__main__":
    if len(sys.argv) > 1:
        city = sys.argv[1]
        months = sys.argv[2] if len(sys.argv) == 3 else 24

        results = get_price_trend(city=city, months=months)

        if len(results) == 0:
            print("No market analytics results were found. Please try another city search query.")
        else:
            results["price_change_pct"] = results["price_change_pct"].fillna(0.0)
            results_json = json.dumps(results.to_dict("records"), indent=4)
            # print(results)
            # print(results.to_dict("records"))
            print(results_json)

    else:
        print("Please provide city name.")
