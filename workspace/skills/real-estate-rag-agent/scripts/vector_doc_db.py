import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PDFPlumberLoader, PyPDFLoader
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma

embeddings = OllamaEmbeddings(model="embeddinggemma:latest")

pdf_files = ["../docs/Zillow_Real_Estate_Terms.pdf", "../docs/realestateglossary.pdf", "../docs/Total_Mortage.pdf",  "../docs/AI_Agentic_Engineer_Intern_Handbook_2026.pdf"]

docs = []
for file_path in pdf_files:
    if os.path.exists(file_path):
        if file_path == "../docs/AI_Agentic_Engineer_Intern_Handbook_2026.pdf":
            pdf_loader = PDFPlumberLoader(file_path)
        else:
            pdf_loader = PyPDFLoader(file_path)
        docs.extend(pdf_loader.load())

print("-" * 50)
print(f"Loaded {len(docs)} document(s).")
total_chars = 0
for i in range(len(docs)):
    total_chars += len(docs[i].page_content)

print(f"Total length: {total_chars:,} characters")
print("-" * 50)
# print(docs[0].page_content[:3000])
# print("-" * 50)

# Initialize the text splitter with a specified chunk size and overlap
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=600,
    chunk_overlap=100
)

split_docs = text_splitter.split_documents(docs)

# avg_chunk_size = sum(len(c.page_content) for c in split_docs) / len(split_docs)
# print(f"Total chunks: {len(split_docs)}")
# print(f"Average chunk length: {avg_chunk_size:.1f} characters")
# print("-" * 50)

vector_store = Chroma.from_documents(
    collection_name="documents",
    documents=split_docs,
    persist_directory="./chroma_db_rag",
    embedding=embeddings
)

retriever = vector_store.as_retriever(
    search_kwargs={"k": 4}
)