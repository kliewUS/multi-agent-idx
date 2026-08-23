from typing import Literal, List, Optional
from pydantic import BaseModel, Field
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
import sys

class IntentClassification(BaseModel):
    """Schema for classifying user query intent and extracting entities."""
    
    intent: Literal[ "search", "market", "recommend", "knowledge", "mixed", "unknown"]
    confidence: float
    reasoning: str
    extracted_entities: Optional[List[str]] = Field(
        default=None,
        description="Key entities extracted from the query (e.g., order ID, product name, email)."
    )

def invoke_intent_classification(query):
    llm = ChatOllama(
        model="llama3.2:3b",
        temperature=0.0
    )

    structured_llm = llm.with_structured_output(
        IntentClassification,
        method="json_schema" 
    )

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """
                You are an expert real estate intent classification assistant. Analyze the user query and classify it strictly according to the provided schema.

                Categories:
                - "search": Looking for specific listings by criteria (location, price, amenities, beds/baths).
                - "market": Inquiring about market trends, timing to buy/sell, average prices, or economic conditions.
                - "recommend": Asking for personalized suggestions or similar comps.
                - "knowledge": Definitions of real estate terms (e.g., DOM, HOA) or schema questions.
                - "mixed": Query must contain elements of two or more categories above (e.g., asking for listing search and market trends simultaneously).
                - "unknown": Unrelated queries.

                EXAMPLES:
                Query: "Show me 3-bedroom condos in Irvine under $1.5M."
                Classify: {{"intent": "search", "confidence": 0.95, "reasoning": "Searching for specific listing criteria."}}

                Query: "Is now a good time to buy in San Diego?"
                Classify: {{"intent": "market", "confidence": 0.95, "reasoning": "Asking about market timing/conditions."}}

                Query: "Find me affordable homes in Pasadena and tell me if it's a good time to buy there."
                Classify: {{"intent": "mixed", "confidence": 0.95, "reasoning": "Contains both a listing search ('find affordable homes') and a market condition inquiry ('good time to buy')."}}
            """
            
        ),
        ("human", "{query}")
    ])

    chain = prompt | structured_llm

    answer = chain.invoke({"query": query})

    return answer

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = sys.argv[1]
        answer = invoke_intent_classification(query)
        # print(f"\nQuery: '{query}'")
        print(f"{answer.intent}")
        # print(f"Intent:     {answer.intent}")
        # print(f"Confidence: {answer.confidence}")
        # print(f"Entities:   {answer.extracted_entities}")
        # print(f"Reason:     {answer.reasoning}")      
    else:
        print("Please provide a user query!")