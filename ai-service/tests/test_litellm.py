import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.core.llm import ChatLiteLLM, get_llm
from app.core.rag_pipeline import get_rag_chain
from langchain_core.documents import Document


def test_message_conversion():
    llm = ChatLiteLLM(model="gemini/gemini-2.5-flash")
    messages = [
        SystemMessage(content="System instruction"),
        HumanMessage(content="User query"),
        AIMessage(content="Assistant response")
    ]
    converted = llm._convert_messages(messages)
    assert len(converted) == 3
    assert converted[0] == {"role": "system", "content": "System instruction"}
    assert converted[1] == {"role": "user", "content": "User query"}
    assert converted[2] == {"role": "assistant", "content": "Assistant response"}


def test_gemini_provider_configuration():
    with patch("app.config.settings.GOOGLE_API_KEY", "mock-gemini-key"), \
         patch("app.config.settings.GROQ_API_KEY", "mock-groq-key"), \
         patch("app.config.settings.LLM_PROVIDER", "gemini"):
        
        llm = get_llm(provider="gemini")
        assert "gemini" in llm.model
        assert llm.fallback_model is not None
        assert "groq" in llm.fallback_model


def test_groq_provider_configuration():
    with patch("app.config.settings.GOOGLE_API_KEY", "mock-gemini-key"), \
         patch("app.config.settings.GROQ_API_KEY", "mock-groq-key"), \
         patch("app.config.settings.LLM_PROVIDER", "groq"):
        
        llm = get_llm(provider="groq")
        assert "groq" in llm.model
        assert llm.fallback_model is not None
        assert "gemini" in llm.fallback_model


def test_automatic_failover_to_fallback():
    """Verify that when primary model raises an exception, LiteLLM falls over to fallback."""
    llm = ChatLiteLLM(
        model="gemini/gemini-2.5-flash",
        fallback_model="groq/llama-3.3-70b-versatile"
    )

    mock_fallback_resp = MagicMock()
    mock_fallback_resp.choices = [MagicMock(message=MagicMock(content="Fallback Groq response"))]

    def side_effect(model, **kwargs):
        if "gemini" in model:
            raise RuntimeError("Gemini rate limit exceeded (429)")
        return mock_fallback_resp

    with patch("litellm.completion", side_effect=side_effect):
        result = llm.invoke([HumanMessage(content="test")])
        assert result.content == "Fallback Groq response"


@pytest.mark.anyio
async def test_async_completion_with_litellm():
    llm = ChatLiteLLM(model="gemini/gemini-2.5-flash")
    mock_resp = MagicMock()
    mock_resp.choices = [MagicMock(message=MagicMock(content="Async response"))]

    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=mock_resp):
        result = await llm.ainvoke([HumanMessage(content="async test")])
        assert result.content == "Async response"


def test_rag_pipeline_with_litellm():
    mock_retriever = MagicMock()
    del mock_retriever.as_retriever
    mock_retriever.invoke.return_value = [
        Document(page_content="def authenticate(): pass", metadata={"file_path": "auth.py"})
    ]


    llm = ChatLiteLLM(model="gemini/gemini-2.5-flash")
    chain = get_rag_chain(mock_retriever, llm=llm)

    mock_resp = MagicMock()
    mock_resp.choices = [MagicMock(message=MagicMock(content="Generated answer via LiteLLM"))]

    with patch("litellm.completion", return_value=mock_resp):
        answer = chain.invoke({"input": "how does auth work", "chat_history": []})
        assert answer == "Generated answer via LiteLLM"
        assert mock_retriever.invoke.called

