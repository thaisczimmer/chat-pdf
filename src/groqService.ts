import Groq from 'groq-sdk';
import { Chunk } from './pdfService';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Monta o prompt e envia para o Groq gerar a resposta
export async function generateAnswer(
    question: string,
    relevantChunks: Chunk[]
): Promise<string> {

    // Junta os chunks mais relevantes em um único contexto
    const context = relevantChunks
        .map((chunk, i) => `Trecho ${i + 1}:\n${chunk.text}`)
        .join('\n\n');

    // Prompt que instrui a IA a responder baseada APENAS no documento
    const prompt = `Você é um assistente que responde perguntas baseado exclusivamente no conteúdo de um documento fornecido.

Contexto do documento:
${context}

Pergunta: ${question}

Instruções:
- Responda apenas com base nos trechos fornecidos acima
- Se a resposta não estiver no contexto, diga "Não encontrei essa informação no documento"
- Seja claro e objetivo
- Responda em português`;

    const response = await groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, // baixo para respostas mais precisas e menos criativas
    });

    return response.choices[0].message.content ?? 'Sem resposta';
}