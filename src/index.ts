import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { extractTextFromPDF, splitIntoChunks, Chunk } from './pdfService';
import { embedChunks, findRelevantChunks, ChunkWithEmbedding } from './embeddingService';
import { generateAnswer } from './groqService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Serve o frontend estático
app.use(express.static(path.join(__dirname, '../public')));

// Configura onde e como salvar os PDFs enviados
const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// Memória temporária — guarda os chunks do PDF carregado
let documentChunks: ChunkWithEmbedding[] = [];
let documentLoaded = false;

// ─── ROTA: POST /upload ───────────────────────────────────────────
// Recebe o PDF, processa e gera embeddings
app.post('/upload', upload.single('pdf'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Nenhum arquivo enviado.' });
            return;
        }

        console.log('PDF recebido:', req.file.originalname);
        console.log('Extraindo texto...');

        const filePath = path.resolve(req.file.path);
        const text = await extractTextFromPDF(filePath);
        console.log('Texto extraído (primeiros 500 chars):', text.slice(0, 500));

        console.log('Dividindo em chunks...');
        const chunks: Chunk[] = splitIntoChunks(text, 500);
        console.log(`${chunks.length} chunks gerados`);

        console.log('Gerando embeddings... (pode demorar alguns segundos)');
        documentChunks = await embedChunks(chunks);
        documentLoaded = true;

        res.json({
            message: 'PDF processado com sucesso!',
            chunks: chunks.length,
        });

    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({ error: 'Erro ao processar o PDF.' });
    }
});

// ─── ROTA: POST /chat ─────────────────────────────────────────────
// Recebe a pergunta e retorna a resposta baseada no documento
app.post('/chat', async (req: Request, res: Response) => {
    try {
        if (!documentLoaded) {
            res.status(400).json({ error: 'Nenhum documento carregado. Faça upload de um PDF primeiro.' });
            return;
        }

        const { question } = req.body;

        if (!question) {
            res.status(400).json({ error: 'Pergunta não informada.' });
            return;
        }

        console.log('Pergunta recebida:', question);
        console.log('Buscando chunks relevantes...');

        const relevantChunks = await findRelevantChunks(question, documentChunks);

        console.log('Gerando resposta...');
        const answer = await generateAnswer(question, relevantChunks);

        res.json({ answer });

    } catch (error) {
        console.error('Erro no chat:', error);
        res.status(500).json({ error: 'Erro ao gerar resposta.' });
    }
});

// ─── ROTA: GET /health ────────────────────────────────────────────
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        documentLoaded,
        chunks: documentChunks.length,
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});