
from scripts.rag_agent import rag_invoke

print("-" * 50)
# Test with no input
print(rag_invoke(""))

print("-" * 50)
# Test with normal input
print(rag_invoke("What does DOM mean?"))

print("-" * 50)
# Test with another normal input
print(rag_invoke("What is a list-to-close ratio?"))

print("-" * 50)
# Test with MLS columns
print(rag_invoke("What columns are in california_sold?"))

print("-" * 50)
# Test with irrelevant question
print(rag_invoke("What are some nice restaurants in San Jose?"))
