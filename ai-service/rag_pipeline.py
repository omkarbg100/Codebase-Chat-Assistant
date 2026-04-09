import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def get_rag_chain(vector_store):
    """Creates a custom RAG chain using LCEL.
    Relies only on 'langchain_core' and 'langchain_google_genai'.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError("GOOGLE_API_KEY is missing. Please update your .env file.")

    llm = ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview",
        google_api_key=api_key,
        temperature=0.2
    )
    
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    
    system_prompt = (
        "You are an expert software engineer assistant. Help users understand a codebase using the code snippets below.\n\n"
        "Instructions:\n"
        "1. Use provided context to answer accurately.\n"
        "2. State clearly if information is missing.\n"
        "3. Reference file names and include snippets if helpful.\n\n"
        "Context:\n{context}"
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
    ])
    
    # Building the chain manually to avoid 'langchain.chains'
    chain = (
        RunnablePassthrough.assign(
            context=lambda x: format_docs(retriever.invoke(x["input"]))
        )
        | prompt
        | llm
        | StrOutputParser()
    )
    
    return chain
