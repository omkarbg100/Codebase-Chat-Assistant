import os
import time
import logging
from typing import List, Dict, Any, Optional
import litellm
from litellm.integrations.custom_logger import CustomLogger
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.outputs import ChatResult, ChatGeneration
from pydantic import Field
from app.config import settings

logger = logging.getLogger("core.llm")

# Silence noisy litellm debug logs by default
litellm.set_verbose = False
litellm.drop_params = True


# ─────────────────────────────────────────────────────────────
# LiteLLM Model Callback – logs token usage, latency, errors
# ─────────────────────────────────────────────────────────────

class LLMUsageCallback(CustomLogger):
    """LiteLLM custom callback that logs model usage metrics for every call."""

    def log_pre_api_call(self, model: str, messages: list, kwargs: dict):
        logger.info(f"[LiteLLM] Request → model={model}  messages={len(messages)}")

    def log_success_event(self, kwargs: dict, response_obj: Any, start_time: float, end_time: float):
        latency_ms = round((end_time - start_time) * 1000, 2)
        usage = getattr(response_obj, "usage", None)
        if usage:
            logger.info(
                f"[LiteLLM] Success ✓ | model={kwargs.get('model')} | "
                f"prompt_tokens={getattr(usage, 'prompt_tokens', '?')} | "
                f"completion_tokens={getattr(usage, 'completion_tokens', '?')} | "
                f"total_tokens={getattr(usage, 'total_tokens', '?')} | "
                f"latency={latency_ms}ms"
            )
        else:
            logger.info(
                f"[LiteLLM] Success ✓ | model={kwargs.get('model')} | latency={latency_ms}ms"
            )

    def log_failure_event(self, kwargs: dict, response_obj: Any, start_time: float, end_time: float):
        latency_ms = round((end_time - start_time) * 1000, 2)
        logger.error(
            f"[LiteLLM] Failure ✗ | model={kwargs.get('model')} | "
            f"error={kwargs.get('exception', 'unknown')} | latency={latency_ms}ms"
        )

    async def async_log_success_event(self, kwargs: dict, response_obj: Any, start_time: float, end_time: float):
        self.log_success_event(kwargs, response_obj, start_time, end_time)

    async def async_log_failure_event(self, kwargs: dict, response_obj: Any, start_time: float, end_time: float):
        self.log_failure_event(kwargs, response_obj, start_time, end_time)


# Register the callback globally with LiteLLM
_usage_callback = LLMUsageCallback()
litellm.callbacks = [_usage_callback]


# ─────────────────────────────────────────────────────────────
# LangChain-compatible ChatLiteLLM wrapper
# ─────────────────────────────────────────────────────────────

class ChatLiteLLM(BaseChatModel):
    """LangChain-compatible chat model powered by LiteLLM.

    Supports Ollama (local), Gemini, and Groq via a unified interface.
    Model callbacks (usage, latency, errors) are registered globally via LLMUsageCallback.
    """

    model: str = Field(default="ollama/llama3.2", description="Primary LiteLLM model identifier")
    fallback_model: Optional[str] = Field(default=None, description="Optional fallback model if primary fails")
    temperature: float = Field(default=0.2, description="Sampling temperature")
    api_key: Optional[str] = Field(default=None, description="Optional direct API key")
    api_base: Optional[str] = Field(default=None, description="Base URL for local models (e.g. Ollama)")

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

    def _build_kwargs(self, extra: dict) -> dict:
        """Builds common LiteLLM call kwargs, injecting api_base when set (e.g. for Ollama)."""
        kw = {**extra}
        if self.api_base:
            kw["api_base"] = self.api_base
        if self.api_key:
            kw["api_key"] = self.api_key
        return kw

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
        call_kwargs = self._build_kwargs(kwargs)

        try:
            response = litellm.completion(
                model=self.model,
                messages=formatted_messages,
                temperature=self.temperature,
                fallbacks=fallbacks,
                stop=stop,
                **call_kwargs
            )
            content = response.choices[0].message.content or ""
            return ChatResult(generations=[ChatGeneration(message=AIMessage(content=content))])
        except Exception as e:
            logger.error(f"LiteLLM completion error for model {self.model}: {e}")
            if self.fallback_model:
                logger.info(f"Attempting manual failover to {self.fallback_model}...")
                response = litellm.completion(
                    model=self.fallback_model,
                    messages=formatted_messages,
                    temperature=self.temperature,
                    stop=stop,
                    **{k: v for k, v in call_kwargs.items() if k != "api_base"}
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
        call_kwargs = self._build_kwargs(kwargs)

        try:
            response = await litellm.acompletion(
                model=self.model,
                messages=formatted_messages,
                temperature=self.temperature,
                fallbacks=fallbacks,
                stop=stop,
                **call_kwargs
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
                    **{k: v for k, v in call_kwargs.items() if k != "api_base"}
                )
                content = response.choices[0].message.content or ""
                return ChatResult(generations=[ChatGeneration(message=AIMessage(content=content))])
            raise e


# ─────────────────────────────────────────────────────────────
# LLM Factory
# ─────────────────────────────────────────────────────────────

def get_llm(
    provider: Optional[str] = None,
    model: Optional[str] = None,
    temperature: Optional[float] = None
) -> ChatLiteLLM:
    """Factory that creates a ChatLiteLLM instance.

    Supports:
      - provider='ollama' : Local Ollama server (e.g. ollama/llama3.2). No API key needed.
      - provider='gemini' : Google Gemini via LiteLLM (requires GOOGLE_API_KEY).
      - provider='groq'   : Groq cloud (requires GROQ_API_KEY), with Gemini as fallback.
      - provider='auto'   : Picks Ollama first, then Gemini, then Groq based on availability.
    """
    selected_provider = (provider or settings.LLM_PROVIDER).lower()
    temp = temperature if temperature is not None else settings.LLM_TEMPERATURE

    has_gemini = bool(settings.GOOGLE_API_KEY)
    has_groq = bool(settings.GROQ_API_KEY)

    # Sync cloud API keys into LiteLLM env vars
    if has_gemini:
        if not os.getenv("GEMINI_API_KEY"):
            os.environ["GEMINI_API_KEY"] = settings.GOOGLE_API_KEY
        if not os.getenv("GOOGLE_API_KEY"):
            os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY
    if has_groq:
        if not os.getenv("GROQ_API_KEY"):
            os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY

    primary: str
    fallback: Optional[str] = None
    api_base: Optional[str] = None

    if selected_provider == "ollama":
        # Local Ollama — point LiteLLM at the Ollama base URL
        primary = model or settings.OLLAMA_MODEL
        api_base = settings.OLLAMA_BASE_URL
        fallback = None  # no cloud fallback by default for local-only setup

    elif selected_provider == "gemini" and has_gemini:
        primary = model or settings.GEMINI_MODEL
        fallback = settings.GROQ_MODEL if has_groq else None

    elif selected_provider == "groq" and has_groq:
        primary = model or settings.GROQ_MODEL
        fallback = settings.GEMINI_MODEL if has_gemini else None

    elif selected_provider == "auto":
        # Priority: Ollama → Gemini → Groq
        primary = model or settings.OLLAMA_MODEL
        api_base = settings.OLLAMA_BASE_URL
        fallback = None

    elif has_groq and not has_gemini:
        primary = model or settings.GROQ_MODEL

    elif has_gemini:
        primary = model or settings.GEMINI_MODEL
        fallback = settings.GROQ_MODEL if has_groq else None

    else:
        # Last resort — attempt Ollama
        primary = model or settings.OLLAMA_MODEL
        api_base = settings.OLLAMA_BASE_URL

    logger.info(
        f"[LLM Factory] provider={selected_provider} | model={primary} | "
        f"fallback={fallback} | api_base={api_base or 'cloud'}"
    )
    return ChatLiteLLM(
        model=primary,
        fallback_model=fallback,
        temperature=temp,
        api_base=api_base,
    )
