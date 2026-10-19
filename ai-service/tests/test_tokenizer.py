import pytest
from app.retrieval.bm25_store import tokenize_code



def test_empty_and_whitespace():
    assert tokenize_code("") == []
    assert tokenize_code("   \n\t  ") == []
    assert tokenize_code(None) == []


def test_camel_case_splitting():
    tokens = tokenize_code("getUserById")
    assert "getuserbyid" in tokens
    assert "get" in tokens
    assert "user" in tokens
    assert "by" in tokens
    assert "id" in tokens


def test_pascal_case_splitting():
    tokens = tokenize_code("AuthController")
    assert "authcontroller" in tokens
    assert "auth" in tokens
    assert "controller" in tokens


def test_snake_case_and_kebab_case():
    tokens_snake = tokenize_code("create_vector_store")
    assert "create_vector_store" in tokens_snake
    assert "create" in tokens_snake
    assert "vector" in tokens_snake
    assert "store" in tokens_snake

    tokens_kebab = tokenize_code("hybrid-search-pipeline")
    assert "hybrid-search-pipeline" in tokens_kebab
    assert "hybrid" in tokens_kebab
    assert "search" in tokens_kebab
    assert "pipeline" in tokens_kebab


def test_file_paths_and_urls():
    tokens = tokenize_code("src/controllers/battleController.js")
    assert "src/controllers/battlecontroller.js" in tokens
    assert "src" in tokens
    assert "controllers" in tokens
    assert "battlecontroller" in tokens
    assert "battle" in tokens
    assert "controller" in tokens
    assert "js" in tokens

    api_tokens = tokenize_code("/api/v1/users/:id")
    assert "api" in api_tokens
    assert "v1" in api_tokens
    assert "users" in api_tokens
    assert "id" in api_tokens


def test_error_messages_and_symbols():
    tokens = tokenize_code("Error 404: Repository 'repo-123' not found!")
    assert "error" in tokens
    assert "404" in tokens
    assert "repository" in tokens
    assert "not" in tokens
    assert "found" in tokens
