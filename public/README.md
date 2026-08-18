# Chat com PDF

Aplicação web que permite fazer perguntas em linguagem natural sobre o conteúdo de qualquer PDF, utilizando RAG (Retrieval-Augmented Generation) com IA generativa.

Como funciona?

1 - O usuário faz upload de um PDF
2 - O texto é extraído e dividido em chunks de 500 palavras
3 - Cada chunk é transformado em um embedding vetorial (via modelo local)
4 - O usuário faz uma pergunta
5 - O sistema busca os chunks mais relevantes por similaridade de cosseno
6 - Os chunks + pergunta são enviados ao modelo de linguagem (Groq)
7 - O modelo responde baseado exclusivamente no conteúdo do documento

## Tecnologias

Node.js + TypeScript — backend e servidor REST
Express — servidor HTTP e rotas da API
@xenova/transformers — geração de embeddings localmente (modelo `all-MiniLM-L6-v2`)
Groq API — geração de respostas com LLM (`openai/gpt-oss-20b`)
pdf2json — extração de texto de arquivos PDF
Multer — upload de arquivos
HTML + CSS + JavaScript — frontend simples e responsivo

## Arquitetura

src/
├── index.ts # Servidor Express + rotas /upload e /chat
├── pdfService.ts # Extração de texto e divisão em chunks
├── embeddingService.ts # Geração de embeddings e busca por similaridade
└── groqService.ts # Integração com a API do Groq
public/
└── index.html # Frontend


## Como rodar localmente

Pré-requisitos: Node.js 18+ e uma chave de API do Groq (gratuita em https://console.groq.com)

```bash

# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/chat-pdf.git
cd chat-pdf

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env e adicione sua GROQ_API_KEY

# 4. Rode o servidor
npm run dev

# 5. Acesse no navegador
http://localhost:3000
```

##  Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
GROQ_API_KEY=sua_chave_aqui
PORT=3000
```

## Conceitos aplicados

RAG (Retrieval-Augmented Generation) — padrão de arquitetura que combina busca vetorial com geração de texto
Embeddings — representação vetorial de texto que captura significado semântico
Similaridade de cosseno — métrica para comparar vetores e encontrar trechos relevantes
API REST — comunicação entre frontend e backend via HTTP
Programação assíncrona — uso de async/await para operações de I/O
