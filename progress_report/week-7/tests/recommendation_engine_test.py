
from scripts.recommendation_engine import recommendation_engine

print("-" * 50)
# Test with no input
print(recommendation_engine(""))

print("-" * 50)
# Test with possible low similarity or no matches.
print(recommendation_engine("test"))

print("-" * 50)
# Default test
print(recommendation_engine("charming craftsman with mountain views and character"))

print("-" * 50)
# Test with top_k results
print(recommendation_engine("charming craftsman with mountain views and character", 10))

print("-" * 50)
# With Bed only
print(recommendation_engine("Triplex minimum 6 bedrooms"))

print("-" * 50)
# With Bed and Price
print(recommendation_engine("3 bed under $800k in Sugarloaf"))

print("-" * 50)
# With Bed and City
print(recommendation_engine("Townhomes in San Jose with 5+ bedrooms"))

print("-" * 50)
# With Bed, City, and Sq Ft
print(recommendation_engine("Looking for a loft in Oakland with minimum 1 bed and 1,100 sqft."))

print("-" * 50)
# With all structural fields.
print(recommendation_engine("Timeshares Under $1 million in San Francisco with a minimum of 2 beds and 2,500 sq ft"))