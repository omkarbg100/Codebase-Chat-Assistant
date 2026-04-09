# GPT-2 From Scratch (Using Kaggle OpenAI GPT-2 Weights)

This whole project is about implementing the GPT-2 architecture from scratch and loading the pretrained weights from the Kaggle dataset to validate our implementation.

also we will be fine-tuning the model to make it work like a chatbot.

**Just a Note : i have Learned LLM From : https://youtube.com/playlist?list=PLPTV0NXA_ZSgsLAr8YCgCwhPIJNNtexWu&si=KhisQ-FVEYWqcwCL **


This project implements the **GPT-2 architecture from scratch** using the pretrained weights from the Kaggle dataset:

> Dataset: *OpenAI GPT-2 Weights* (Kaggle)

The goal of this project is to deeply understand how GPT-2 works internally — including:
- Encoding
- Transformer blocks
- Multi-Head Attention
- Layer Normalization
- Feed Forward Networks
- Weight Loading from pretrained GPT-2


1. LLM-FULL-Detailed.ipynb helps you understand the Architecture and how to use the GPT-2 Weights inside your Model

2. LLM-GPT-Chatbot.ipynb Here we Finetune Our Model to make it Work it Like a Chatbot
---

# 📌 Project Overview

GPT-2 is a **decoder-only Transformer** model designed for autoregressive language modeling.

It predicts the next token in a sequence:

```
P(x_t | x_1, x_2, ..., x_{t-1})
```

Architecture consists of:
- Token Embeddings
- Positional Embeddings
- Stacked Transformer Blocks
- Final Linear Layer (Language Modeling Head)

---

# 📂 Dataset Used

**Kaggle Dataset:** OpenAI GPT-2 Weights  

It contains:
- Pretrained GPT-2 weights
- Model configuration
- Vocabulary files

These weights are loaded into our custom model implementation.

---

# 🧠 Core Concepts Explained

---

# 1️⃣ Encoding

Encoding converts raw text into numerical representations the model can process.

## Step 1: Tokenization

GPT-2 uses **Byte Pair Encoding (BPE)**.

Example:

```
Input: "Machine learning is amazing"
Tokens: ["Machine", " learning", " is", " amazing"]
Token IDs: [5023, 7890, 318, 4998]
```

## Step 2: Token Embeddings

Each token ID maps to a dense vector.

```
Embedding Matrix Shape:
[vocab_size, embedding_dim]
```

If:
- vocab_size = 50257
- embedding_dim = 768

Then each token becomes a 768-dimensional vector.

---

# 2️⃣ Positional Encoding

Transformers do not understand sequence order naturally.

So GPT-2 adds **learned positional embeddings**.

Final input to transformer:

```
Input Representation = Token Embedding + Positional Embedding
```

Shape:

```
(batch_size, sequence_length, embedding_dim)
```

---

# 3️⃣ Transformer Block

GPT-2 consists of multiple identical transformer blocks.

For GPT-2 small:
- 12 transformer layers
- 12 attention heads
- 768 embedding size

Each block contains:

```
1. Layer Normalization
2. Multi-Head Self Attention
3. Residual Connection
4. Layer Normalization
5. Feed Forward Network
6. Residual Connection
```

---

# 4️⃣ Multi-Head Attention (Core of GPT-2)

Multi-Head Attention allows the model to focus on different parts of the sentence simultaneously.

## Step 1: Create Q, K, V

From input X:

```
Q = XWq
K = XWk
V = XWv
```

Where:
- Wq, Wk, Wv are learnable weight matrices

## Step 2: Scaled Dot-Product Attention

```
Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V
```

- QKᵀ → similarity score
- sqrt(d_k) → scaling factor
- softmax → probability distribution

## Step 3: Causal Masking

GPT-2 uses **causal masking** to prevent seeing future tokens.

Example mask:

```
[1 0 0 0]
[1 1 0 0]
[1 1 1 0]
[1 1 1 1]
```

This ensures autoregressive behavior.

## Step 4: Multi-Head

Instead of one attention head:

```
MultiHead(Q,K,V) = Concat(head1, head2, ... headh) Wo
```

Each head:
- Learns different linguistic patterns
- Captures different relationships

Example:
- Head 1 → grammar
- Head 2 → long-range dependencies
- Head 3 → subject-object relations

---

# 5️⃣ Layer Normalization

LayerNorm stabilizes training.

Formula:

```
LayerNorm(x) = (x - mean) / sqrt(var + eps) * gamma + beta
```

Why it’s important:
- Prevents exploding/vanishing gradients
- Stabilizes deep transformer stacks
- Makes training faster

GPT-2 uses **Pre-LayerNorm** architecture:

```
x = x + Attention(LayerNorm(x))
x = x + FFN(LayerNorm(x))
```

---

# 6️⃣ Feed Forward Network (FFN)

Each transformer block has a small neural network:

```
FFN(x) = GELU(xW1 + b1)W2 + b2
```

Structure:
- Linear layer (expand)
- GELU activation
- Linear layer (project back)

Example dimensions (GPT-2 small):
- 768 → 3072 → 768

Purpose:
- Adds non-linearity
- Learns complex token transformations

---

# 7️⃣ Residual Connections

Each major block has:

```
Output = Input + SubLayer(Input)
```

Why?
- Helps gradient flow
- Enables deep models
- Prevents degradation problem

---

# 8️⃣ Final Output Layer

After all transformer layers:

```
Logits = FinalHiddenState × W_vocab^T
```

Shape:

```
(batch_size, sequence_length, vocab_size)
```

Softmax converts logits into probabilities.

---

# 🔄 Full Forward Pass

```
Text
 ↓
Tokenizer (BPE)
 ↓
Token Embeddings
 + Positional Embeddings
 ↓
[Transformer Block × N]
 ↓
Final LayerNorm
 ↓
Linear Projection
 ↓
Softmax
 ↓
Next Token Prediction
```

---

# 📊 Model Architecture Summary (GPT-2 Small)

| Component | Value |
|------------|--------|
| Layers | 12 |
| Heads | 12 |
| Embedding Size | 768 |
| FFN Hidden Size | 3072 |
| Vocab Size | 50257 |
| Parameters | ~124M |

---

# 🛠 Loading Kaggle GPT-2 Weights

Steps:
1. Initialize model architecture manually.
2. Load Kaggle pretrained weights.
3. Map weight keys to custom model.
4. Verify shapes match.
5. Run inference to validate.

Important:
- Weight names must match exactly.
- Pay attention to transpose differences.

---

# 🚀 Why This Project Is Important

This project demonstrates:
- Deep understanding of Transformer internals
- Ability to implement large language models
- Weight mapping and architecture recreation
- Knowledge of attention mechanisms
- Strong foundation for LLM research roles

Perfect for:
- SDE roles at Microsoft / Google
- AI Research Internships
- LLM engineering positions

---

# 📈 Future Improvements

- Add training loop
- Implement fine-tuning
- Add text generation (top-k, nucleus sampling)
- Add distributed training
- Convert to HuggingFace compatible format

---

# 🏁 Conclusion

This implementation recreates GPT-2 architecture from scratch and loads pretrained Kaggle weights to validate correctness.

Understanding these components deeply prepares you for:
- Building LLMs
- Custom transformer research
- Large-scale AI systems

---

**Author:** Omkar Gaikwad 
**Dataset:** Kaggle - OpenAI GPT-2 Weights  
**Architecture:** Decoder-only Transformer  
