import os
import logging
from typing import List, Dict, Any, Optional
import litellm
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.outputs import ChatResult, ChatGeneration
from pydantic import Field
from app.config import settings

logger = logging.getLogger("core.llm")

# Silence noisy litellm debug logs by default
litellm.set_verbose = False
litellm.drop_params = True


class ChatLiteLLM(BaseChatModel):
    """LangChain-compatible chat model powered by LiteLLM supporting Gemini and Groq."""

    model: str = Field(default="gemini/gemini-2.5-flash", description="Primary LiteLLM model identifier")
    fallback_model: Optional[str] = Field(default=None, description="Optional fallback model if primary fails")
    temperature: float = Field(default=0.2, description="Sampling temperature")
    api_key: Optional[str] = Field(default=None, description="Optional direct API key")

    @property
    def _llm_type(self) -> str:
        return "litellm-universal-chat"

    def _convert_messages(self, messages: List[BaseMessage]) -> List[Dict[str, str]]:
        """Converts LangChain message objects to LiteLLM/OpenAI format."""
        formatted: List[Dict[str, str]] = []
        for msg in messages:
            if isinstance(msg, SystemMessage):
                formatted.append({"role": "system", "content": str(msg.content)})
            elif isinstance(msg, HumanMessage):
                formatted.append({"role": "user", "content": str(msg.content)})
            elif isinstance(msg, AIMessage):
                formatted.append({"role": "assistant", "content": str(msg.content)})
            elif isinstance(msg, dict):
                formatted.append({"role": msg.get("role", "user"), "content": str(msg.get("content", ""))})
            else:
                formatted.append({"role": "user", "content": str(getattr(msg, "content", str(msg)))})
        return formatted

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Any = None,
        **kwargs: Any
    ) -> ChatResult:
        """Synchronous chat completion via LiteLLM."""
        formatted_messages = self._convert_messages(messages)
        fallbacks = [self.fallback_model] if self.fallback_model else None

        try:
            response = litellm.completion(
                model=self.model,
                messages=formatted_messages,
                temperature=self.temperature,
                fallbacks=fallbacks,
                api_key=self.api_key,
                stop=stop,
                **kwargs
            )
            content = response.choices[0].message.content or ""
            return ChatResult(generations=[ChatGeneration(message=AIMessage(content=content))])
        except Exception as e:
            logger.error(f"LiteLLM completion error for model {self.model}: {e}")
            # If fallback wasn't handled by litellm.completion, attempt direct fallback
            if self.fallback_model:
                logger.info(f"Attempting manual failover to {self.fallback_model}...")
                response = litellm.completion(
                    model=self.fallback_model,
                    messages=formatted_messages,
                    temperature=self.temperature,
                    stop=stop,
                    **kwargs
                )
                content = response.choices[0].message.content or ""
                return ChatResult(generations=[ChatGeneration(message=AIMessage(content=content))])
            raise e

    async def _agenerate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Any = None,
        **kwargs: Any
    ) -> ChatResult:
        """Asynchronous chat completion via LiteLLM."""
        formatted_messages = self._convert_messages(messages)
        fallbacks = [self.fallback_model] if self.fallback_model else None

        try:
            response = await litellm.acompletion(
                model=self.model,
                messages=formatted_messages,
                temperature=self.temperature,
                fallbacks=fallbacks,
                api_key=self.api_key,
                stop=stop,
                **kwargs
            )
            content = response.choices[0].message.content or ""
            return ChatResult(generations=[ChatGeneration(message=AIMessage(content=content))])
        except Exception as e:
            logger.error(f"LiteLLM async completion error for model {self.model}: {e}")
            if self.fallback_model:
                logger.info(f"Attempting manual async failover to {self.fallback_model}...")
                response = await litellm.acompletion(
                    model=self.fallback_model,
                    messages=formatted_messages,
                    temperature=self.temperature,
                    stop=stop,
                    **kwargs
                )
                content = response.choices[0].message.content or ""
                return ChatResult(generations=[ChatGeneration(message=AIMessage(content=content))])
            raise e


def get_llm(
    provider: Optional[str] = None,
    model: Optional[str] = None,
    temperature: Optional[float] = None
) -> ChatLiteLLM:
    """Factory creating a ChatLiteLLM instance configured with Gemini and/or Groq.
    
    Supports:
      - provider='gemini': Uses Google Gemini (e.g. gemini/gemini-2.5-flash), with Groq as fallback if configured.
      - provider='groq': Uses Groq (e.g. groq/llama-3.3-70b-versatile), with Gemini as fallback if configured.
      - provider='auto': Intelligently selects based on available API keys with failover.
    """
    selected_provider = (provider or settings.LLM_PROVIDER).lower()
    temp = temperature if temperature is not None else settings.LLM_TEMPERATURE

    has_gemini = bool(settings.GOOGLE_API_KEY)
    has_groq = bool(settings.GROQ_API_KEY)

    # Sync keys to LiteLLM expected environment variables
    if has_gemini:
        if not os.getenv("GEMINI_API_KEY"):
            os.environ["GEMINI_API_KEY"] = settings.GOOGLE_API_KEY
        if not os.getenv("GOOGLE_API_KEY"):
            os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY
    if has_groq:
        if not os.getenv("GROQ_API_KEY"):
            os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY

    # Determine primary and fallback models
    if selected_provider == "groq" and has_groq:
        primary = model or settings.GROQ_MODEL
        fallback = settings.GEMINI_MODEL if has_gemini else None
    elif selected_provider == "gemini" and has_gemini:
        primary = model or settings.GEMINI_MODEL
        fallback = settings.GROQ_MODEL if has_groq else None
    elif has_groq and not has_gemini:
        primary = model or settings.GROQ_MODEL
        fallback = None
    elif has_gemini:
        primary = model or settings.GEMINI_MODEL
        fallback = settings.GROQ_MODEL if has_groq else None
    else:
        # Fallback to configured model or throw helpful warning
        primary = model or settings.GEMINI_MODEL
        fallback = settings.GROQ_MODEL if has_groq else None

    logger.info(f"Initialized LiteLLM client | Primary: {primary} | Fallback: {fallback}")
    return ChatLiteLLM(
        model=primary,
        fallback_model=fallback,
        temperature=temp
    )
