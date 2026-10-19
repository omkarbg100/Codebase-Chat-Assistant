from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_code(files_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Splits code files into chunks while preserving metadata and calculating line numbers."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=200,
        length_function=len,
        separators=["\nclass ", "\ndef ", "\nfunction ", "\nconst ", "\nlet ", "\nvar ", "\n\n", "\n", " "]
    )

    chunks = []
    for file_info in files_data:
        content = file_info.get("content", "")
        file_chunks = text_splitter.split_text(content)
        last_idx = 0

        for i, chunk_text in enumerate(file_chunks):
            # Calculate line numbers
            prefix = chunk_text[:min(50, len(chunk_text))]
            idx = content.find(prefix, last_idx)
            if idx == -1:
                idx = content.find(prefix)
            if idx != -1:
                start_line = content[:idx].count("\n") + 1
                end_line = start_line + chunk_text.count("\n")
                last_idx = idx
            else:
                start_line = 1
                end_line = 1 + chunk_text.count("\n")

            # Enrich metadata
            metadata = file_info.get("metadata", {}).copy()
            metadata["chunk_id"] = i
            metadata["start_line"] = start_line
            metadata["end_line"] = end_line
            if "file_path" in metadata and isinstance(metadata["file_path"], str):
                metadata["file_path"] = metadata["file_path"].replace("\\", "/")

            chunks.append({
                "page_content": chunk_text,
                "metadata": metadata
            })

    return chunks
