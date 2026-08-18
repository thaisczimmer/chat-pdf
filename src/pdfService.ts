import fs from 'fs';
import PDFParser from 'pdf2json';

export interface Chunk {
    text: string;
    index: number;
}

export async function extractTextFromPDF(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new (PDFParser as any)(null, 1);

        pdfParser.on('pdfParser_dataError', (err: any) => {
            reject(err.parserError);
        });

        pdfParser.on('pdfParser_dataReady', () => {
            const text = pdfParser.getRawTextContent();
            resolve(text);
        });

        pdfParser.loadPDF(filePath);
    });
}

export function splitIntoChunks(text: string, chunkSize: number = 500): Chunk[] {
    const words = text.split(' ');
    const chunks: Chunk[] = [];

    let currentChunk: string[] = [];
    let chunkIndex = 0;

    for (const word of words) {
        currentChunk.push(word);

        if (currentChunk.length >= chunkSize) {
            chunks.push({
                text: currentChunk.join(' '),
                index: chunkIndex,
            });
            currentChunk = currentChunk.slice(-50);
            chunkIndex++;
        }
    }

    if (currentChunk.length > 0) {
        chunks.push({ text: currentChunk.join(' '), index: chunkIndex });
    }

    return chunks;
}