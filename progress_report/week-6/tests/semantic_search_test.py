
from scripts.semantic_search import find_similar_listings

print("-" * 50)
# Test with no input
print(find_similar_listings(""))

print("-" * 50)
# Default test
print(find_similar_listings("charming craftsman with mountain views and character"))

print("-" * 50)
# Test with top_k results
print(find_similar_listings("charming craftsman with mountain views and character", 10))