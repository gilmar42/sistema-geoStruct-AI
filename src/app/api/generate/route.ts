import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  if (!apiKey || apiKey === "SUA_CHAVE_AQUI") {
    return NextResponse.json(
      { error: "API Key do Gemini não configurada no servidor (Falta variável GEMINI_API_KEY)." },
      { status: 500 }
    );
  }

  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: "O prompt é obrigatório." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1,
        responseMimeType: "application/json",
      },
      systemInstruction: `Você é a inteligência de engenharia do GeoStruct AI.
Sua missão é traduzir o prompt em um JSON estrito.
NÃO GERE markdown (sem crases).
Retorne APENAS um objeto JSON válido com a seguinte estrutura:
{
  "nome_projeto": "string",
  "descricao_tecnica": "string",
  "componente_raiz": {
    "tipo": "string (curto, ex: 'galpao', 'ponte', 'tanque', 'esteira')",
    "material": "string",
    "parametros": [{"nome": "string", "valor": number, "unidade": "string"}],
    "sub_componentes": [
      {
        "tipo": "string (curto, ex: 'pilar', 'viga', 'engrenagem', 'motor')",
        "material": "string",
        "parametros": [
          {"nome": "dim_x", "valor": number, "unidade": "m"},
          {"nome": "dim_y", "valor": number, "unidade": "m"},
          {"nome": "dim_z", "valor": number, "unidade": "m"},
          {"nome": "pos_x", "valor": number, "unidade": "m"},
          {"nome": "pos_y", "valor": number, "unidade": "m"},
          {"nome": "pos_z", "valor": number, "unidade": "m"}
        ]
      }
    ]
  },
  "criterios_otimizacao": ["string"]
}
IMPORTANTE: Para TODO sub_componente, você DEVE calcular e incluir os parâmetros 'dim_x', 'dim_y', 'dim_z' e 'pos_x', 'pos_y', 'pos_z' (relativas ao centro).
MUITO IMPORTANTE: Não crie mais do que 5 a 8 sub_componentes representativos! Resuma a estrutura para não ultrapassar o limite de texto do JSON. SEJA BREVE.`
    });

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Limpeza por precaução caso o modelo retorne markdown
    if (text.startsWith("```json")) {
      text = text.replace(/^```json/, "").replace(/```$/, "").trim();
    }
    
    let jsonOutput;
    try {
      jsonOutput = JSON.parse(text);
    } catch {
      console.error("Erro de Parsing JSON:", text.substring(0, 500) + "...");
      return NextResponse.json({ error: "A inteligência artificial gerou uma estrutura muito complexa ou cortada. Tente um prompt mais específico." }, { status: 500 });
    }

    return NextResponse.json(jsonOutput);
    
  } catch (error: unknown) {
    console.error("Erro na API de Geração:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
