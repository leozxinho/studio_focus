export default async function handler(req, res) {
    // Permitir apenas requisições POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { messages, system_prompt } = req.body;

    if (!messages || !system_prompt) {
        return res.status(400).json({ error: 'Dados insuficientes' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
        return res.status(500).json({ error: 'Chave de API não configurada no servidor Vercel' });
    }

    const MODEL = "gemini-1.5-flash";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    const FALLBACK_MODEL = "gemini-1.5-pro";
    const FALLBACK_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODEL}:generateContent?key=${API_KEY}`;

    const makeRequest = async (url) => {
        return await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: system_prompt }] },
                contents: messages,
                generationConfig: { 
                    maxOutputTokens: 2048, 
                    temperature: 0.7 
                }
            })
        });
    };

    try {
        let response = await makeRequest(API_URL);
        let data = await response.json();

        // Se falhar por alta demanda (503) ou erro de modelo, tenta o fallback
        if (response.status !== 200) {
            console.warn("Modelo principal falhou, tentando fallback...", data.error);
            response = await makeRequest(FALLBACK_API_URL);
            data = await response.json();
        }

        return res.status(response.status).json(data);
    } catch (error) {
        console.error("Erro na API Bridge:", error);
        return res.status(500).json({ error: 'Erro interno ao comunicar com Gemini' });
    }
}
