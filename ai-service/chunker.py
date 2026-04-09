from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunk_code(files_data):
    """Splits code files into chunks while preserving metadata."""
    # Using a mix of common programming separators
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=200,
        length_function=len,
        separators=["\nclass ", "\ndef ", "\nfunction ", "\nconst ", "\nlet ", "\nvar ", "\n\n", "\n", " "]
    )
    
    chunks = []
    for file_info in files_data:
        file_chunks = text_splitter.split_text(file_info["content"])
        for i, chunk_text in enumerate(file_chunks):
            # Enrich metadata with chunk info
            metadata = file_info["metadata"].copy()
            metadata["chunk_id"] = i
            chunks.append({
                "page_content": chunk_text,
                "metadata": metadata
            })
            
    return chunks
