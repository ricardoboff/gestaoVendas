import { GoogleGenAI, Type } from "@google/genai";
import { TransactionType } from "../types";

// Chave para armazenar no LocalStorage do navegador do usuário
const GEMINI_API_KEY_STORAGE = 'ornare_gemini_api_key';

export const getStoredApiKey = () => {
  return localStorage.getItem(GEMINI_API_KEY_STORAGE) || process.env.API_KEY || '';
};

export const setStoredApiKey = (key: string) => {
  localStorage.setItem(GEMINI_API_KEY_STORAGE, key);
};

interface ScannedItem {
  date: string;
  description: string;
  value: number;
  type: 'sale' | 'payment';
}

export const analyzeLedgerImage = async (base64Image: string): Promise<ScannedItem[]> => {
  try {
    const apiKey = getStoredApiKey();
    
    if (!apiKey) {
      throw new Error("API_KEY_MISSING");
    }

    // Inicializa a IA apenas no momento da chamada para garantir que pegou a chave mais recente
    const ai = new GoogleGenAI({ apiKey });

    // Remove cabeçalho data URL se presente
    const data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const model = "gemini-2.5-flash"; 

    const prompt = `
      Analise esta imagem de um caderno de controle de caixa/fiado.
      Extraia os itens listados nas linhas manuscritas.
      
      Geralmente o formato é:
      - Uma data (dia/mês ou apenas dia). Assuma o ano corrente se não estiver explícito.
      - Uma descrição do produto (ex: "Anel", "Brinco", "Conjunto").
      - Um valor monetário.
      
      Identifique se é uma SAÍDA (Venda/Débito) ou ENTRADA (Pagamento).
      Se houver colunas separadas para Entradas e Saídas, use essa lógica.
      Na imagem de exemplo fornecida pelo usuário, a coluna da direita com valores geralmente são as VENDAS (Saídas do estoque, dívida do cliente).
      
      IMPORTANTE SOBRE DATAS:
      Converta todas as datas encontradas para o formato ISO 8601: YYYY-MM-DD (Ano-Mês-Dia).
      Exemplo: se ler "10/05", retorne "2025-05-10" (assumindo ano corrente).
      
      Retorne APENAS um JSON array.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Data da transação no formato YYYY-MM-DD" },
              description: { type: Type.STRING, description: "Descrição do item ou histórico" },
              value: { type: Type.NUMBER, description: "Valor numérico (ex: 150.00)" },
              type: { type: Type.STRING, enum: ["sale", "payment"], description: "sale para venda/dívida, payment para pagamento recebido" }
            },
            required: ["date", "description", "value", "type"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const items: ScannedItem[] = JSON.parse(text);
    return items;

  } catch (error: any) {
    console.error("Error analyzing image:", error);
    
    if (error.message === "API_KEY_MISSING") {
      throw new Error("MISSING_KEY");
    }

    if (error.toString().includes("403") || error.toString().includes("API key not valid")) {
      throw new Error("INVALID_KEY");
    }

    throw new Error("Falha ao processar a imagem. Tente novamente com uma foto mais clara.");
  }
};