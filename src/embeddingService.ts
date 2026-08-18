import { Chunk } from './pdfService';

let pipeline: any = null;

// Carrega o modelo de embedding local (baixa uma vez e fica em cache)
async function getEmbedder() {
    if (!pipeline) {
        console.log('Carregando modelo de embedding local...');
        const { pipeline: createPipeline } = await import('@xenova/transformers');
        pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('Modelo carregado!');
    }
    return pipeline;
}

export interface ChunkWithEmbedding {
    chunk: Chunk;
    embedding: number[];
}

// Gera embedding de um texto localmente
async function generateEmbedding(text: string): Promise<number[]> {
    const embedder = await getEmbedder();
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data) as number[];
}

// Calcula similaridade entre dois vetores (0 a 1)
function cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

// Gera embeddings para todos os chunks
export async function embedChunks(chunks: Chunk[]): Promise<ChunkWithEmbedding[]> {
    const result: ChunkWithEmbedding[] = [];

    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.text);
        result.push({ chunk, embedding });
        console.log(`Chunk ${chunk.index + 1}/${chunks.length} processado`);
    }

    return result;
}

// Busca os chunks mais relevantes para a pergunta
export async function findRelevantChunks(
    question: string,
    chunksWithEmbeddings: ChunkWithEmbedding[],
    topK: number = 3
): Promise<Chunk[]> {
    const questionEmbedding = await generateEmbedding(question);

    const scored = chunksWithEmbeddings.map(({ chunk, embedding }) => ({
        chunk,
        score: cosineSimilarity(questionEmbedding, embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(({ chunk }) => chunk);
}