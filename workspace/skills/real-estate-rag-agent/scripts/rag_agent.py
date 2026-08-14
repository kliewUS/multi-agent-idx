import sys

from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from vector_doc_db import retriever

# test_queries = ["What columns are in california_sold?", "What does DOM mean?", "What is a list-to-close ratio?"]

# for test_query in test_queries:
#     scored_results = vector_store.similarity_search_with_score(test_query, k=4)

#     print(f"Query: \"{test_query}\"")
#     print(f"\nTop 4 retrieved chunks (lower distance = more similar):\n")
#     print("-" * 50)

#     for i, (doc, score) in enumerate(scored_results, 1):
#         preview = doc.page_content[:200].replace("\n"," ")
#         print(f"--- Chunk {i} (distance: {score:.4f}) ---")
#         print(f"{preview}...\n")
#         print("-" * 50)

def rag_invoke(query):
    if not query:
        return "Please enter a query!"

    rag_instruction = """
        You are an expert in answering questions about real estate questions for IDXExchange, a tech company providing data-driven tools to empower real estate professionals.
        Use only the provided context to answer the user's question.
        If the answer is not in the context, say "I'm not sure how to answer that based on our real estate documentation. Please reach out to IDXExchange Support."
        Keep your answer concise (2-4 sentences) and friendly.

        Question: {question}
        Context: {context}
        Answer:
    """

    prompt = PromptTemplate.from_template(rag_instruction)

    llm = OllamaLLM(model="gemma4:26b")

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    answer = rag_chain.invoke(query)

    return answer


if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = sys.argv[1]
        answer = rag_invoke(query)
        # print(f"Question: {query}")
        # print(f"Answer: {answer}\n")        
        print(answer)        
    else:
        print("Please provide a search query!")