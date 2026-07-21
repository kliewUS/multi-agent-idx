
from scripts.market_analytics import get_price_trend

# No Month specified
print(get_price_trend("Pasadena"))

#Month specified
print(get_price_trend("San Diego", 12))

#Outside of California
print(get_price_trend("Portland", 12))