
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { FormState, StrategyResult, ContentAnalysisResult, HistoryItem } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Define the strict schema for JSON output
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.OBJECT,
      properties: {
        hookAssessment: { type: Type.STRING, description: "Análise da força do hook atual." },
        valueProposition: { type: Type.STRING, description: "Ponto de dor resolvido ou valor entregue." },
        originalityTrend: { type: Type.STRING, description: "Análise de originalidade vs tendência." },
        trendContext: { type: Type.STRING, description: "Contexto de tendências em tempo real obtido via Search." },
        scores: {
          type: Type.OBJECT,
          properties: {
            watchTime: { type: Type.INTEGER, description: "Nota de 1 a 5" },
            shareability: { type: Type.INTEGER, description: "Nota de 1 a 5" },
            saveability: { type: Type.INTEGER, description: "Nota de 1 a 5" },
            commentVelocity: { type: Type.INTEGER, description: "Nota de 1 a 5" }
          },
          required: ["watchTime", "shareability", "saveability", "commentVelocity"]
        }
      },
      required: ["hookAssessment", "valueProposition", "originalityTrend", "scores"]
    },
    optimization: {
      type: Type.OBJECT,
      properties: {
        formatRecommendation: { type: Type.STRING },
        hookVariations: { type: Type.ARRAY, items: { type: Type.STRING } },
        optimizedCTA: { type: Type.STRING, description: "CTA obrigatório: Combine viralização oculta (Salvar/Compartilhar) com engajamento visível (Comentar). Ex: 'Salve este post para não esquecer e comente sua opinião mais controversa!'." }
      },
      required: ["formatRecommendation", "hookVariations", "optimizedCTA"]
    },
    platforms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          tactics: { type: Type.STRING },
          keyElements: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "tactics", "keyElements"]
      }
    },
    distribution: {
      type: Type.OBJECT,
      properties: {
        timing: { type: Type.STRING },
        initialTrigger: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["timing", "initialTrigger"]
    }
  },
  required: ["analysis", "optimization", "platforms", "distribution"]
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, description: "Score from 0 to 100 based on viral potential" },
    feedback: { type: Type.STRING, description: "Senior specialist feedback on what is good and bad" },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific changes to make" },
    rewrittenContent: { type: Type.STRING, description: "The improved text version OR detailed instructions for image/video/audio editing" },
    visualAnalysis: {
      type: Type.OBJECT,
      nullable: true,
      description: "Only populate for IMAGE analysis. Returns null for text/audio/video.",
      properties: {
        estimatedFixationTime: { type: Type.STRING, description: "Estimated time eye pauses on image (e.g. '0.5s (Flash)' or '3.5s (Deep)'). Explain reasoning." },
        stoppingPowerScore: { type: Type.INTEGER, description: "0-100 score. High score means immediate attention grab (Contrast/Face/Surprise)." },
        colorPalette: {
          type: Type.ARRAY,
          items: {
             type: Type.OBJECT,
             properties: {
                hex: { type: Type.STRING, description: "Hex code #RRGGBB" },
                usage: { type: Type.STRING, description: "Where to use this color (Background, CTA, Text)" },
                psychology: { type: Type.STRING, description: "Psychological effect (e.g. Urgency, Trust) aligned with brand Identity." }
             }
          }
        }
      }
    }
  },
  required: ["score", "feedback", "improvements", "rewrittenContent"]
};

export const generateViralStrategy = async (form: FormState, pastHistory: HistoryItem[] = []): Promise<StrategyResult> => {
  if (!apiKey) throw new Error("API Key not found");

  // Step 1: Use Google Search Grounding to get real-time trend context
  let trendContext = "Nenhum dado de tendência específico encontrado.";
  try {
    const searchResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `What are the current viral trends and algorithm updates for social media (Instagram, TikTok, LinkedIn, Facebook, Pinterest) related to: "${form.content}" or general organic growth in 2024/2025? Summarize in 3 bullets.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    trendContext = searchResponse.text || trendContext;
  } catch (e) {
    console.warn("Search grounding failed, proceeding without trend data.");
  }

  // Step 2: Prepare Learning Context
  const relevantHistory = pastHistory
    .filter(h => h.performance)
    .map(h => ({
      content: h.form.content,
      objective: h.form.objective,
      performance: h.performance
    }))
    .slice(0, 3);

  let learningContext = "";
  if (relevantHistory.length > 0) {
    learningContext = `
      CONTEXTO DE APRENDIZADO (Performance Passada):
      ${JSON.stringify(relevantHistory, null, 2)}
      Instrução: Recalibre a estratégia. Se o compartilhamento foi alto antes, dobre a aposta na tática usada.
    `;
  }

  // Step 3: Generate Strategy using Reasoning Model (Gemini 3 Pro) if text-only, or Flash if multimodal
  const modelName = form.media ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';
  
  const promptText = `
    CONTEXTO DE TENDÊNCIAS (Real-time):
    ${trendContext}

    ${learningContext}

    Analise o seguinte conteúdo e objetivo para criar uma estratégia de viralização orgânica Multicanal.
    
    Conteúdo: "${form.content}"
    Objetivo: "${form.objective}"
    
    ${form.media ? 'ATENÇÃO: Analise o ARQUIVO visual/auditivo fornecido.' : ''}
    ${form.media?.type === 'video' ? 'CONTEXTO DE HOOKS: Gere hooks focados em ritmo visual, movimento nos primeiros 3s e cortes rápidos.' : ''}
    ${form.media?.type === 'image' ? 'CONTEXTO DE HOOKS: Gere hooks visuais que referenciem cores, elementos de texto na imagem ou curiosidade visual.' : ''}

    Metodologia Growth Hacking:
    1. Avalie Hook, Valor, Originalidade.
    2. Scores (1-5).
    3. Formato ideal.
    4. 3 Hooks ${form.media ? 'CONTEXTUAIS À MÍDIA' : ''}.
    5. CTA Viral (Compartilhar/Salvar + Comentar).
    6. Táticas por plataforma (Instagram, TikTok, LinkedIn, Facebook, Pinterest, Twitter/X).
    7. Distribuição.
    
    Retorne APENAS JSON.
  `;

  const parts: any[] = [{ text: promptText }];
  
  if (form.media) {
    parts.push({
      inlineData: {
        mimeType: form.media.mimeType,
        data: form.media.data
      }
    });
  }

  const config: any = {
    responseMimeType: "application/json",
    responseSchema: responseSchema,
  };

  // Add thinking budget only for the Pro model (Text only workflow)
  if (!form.media) {
     config.thinkingConfig = { thinkingBudget: 8192 }; 
  } else {
     config.systemInstruction = "Você é um Especialista Sênior em Crescimento e Viralização.";
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: config
    });

    const text = response.text;
    if (!text) throw new Error("No response generated");
    
    const result = JSON.parse(text) as StrategyResult;
    if (result.analysis) {
        result.analysis.trendContext = trendContext;
    }
    return result;
  } catch (error) {
    console.error("Error generating strategy:", error);
    throw error;
  }
};

export const analyzeContent = async (
  originalStrategyContext: string, 
  contentToAnalyze: string, 
  type: 'text' | 'image' | 'video' | 'audio',
  mediaData?: { data: string, mimeType: string }
): Promise<ContentAnalysisResult> => {
  
  const getRole = () => {
    switch (type) {
      case 'text': return 'Editor Chefe e Copywriter Sênior.';
      case 'image': return 'Diretor de Arte Sênior e Especialista em Neuro-Marketing.';
      case 'video': return 'Diretor de Vídeo e Especialista em Retenção.';
      case 'audio': return 'Produtor de Áudio.';
      default: return 'Especialista em Marketing.';
    }
  };

  const promptText = `
    Estratégia Base: ${originalStrategyContext}
    Papel: ${getRole()}
    
    Analise o material.
    - IMAGEM: Calcule 'stoppingPowerScore' e 'estimatedFixationTime'. Sugira paleta de cores específica (hex codes) alinhada à identidade da marca e impacto psicológico desejado.
    - TEXTO/VÍDEO/ÁUDIO: Siga as melhores práticas de retenção.
    
    Retorne JSON.
    Material: ${type === 'text' ? contentToAnalyze : 'Veja anexo.'}
  `;

  const parts: any[] = [{ text: promptText }];
  
  if (type !== 'text' && mediaData) {
    parts.push({
      inlineData: {
        mimeType: mediaData.mimeType,
        data: mediaData.data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      }
    });

    const text = response.text;
    return JSON.parse(text) as ContentAnalysisResult;

  } catch (error) {
    throw error;
  }
};

// --- NEW GENERATIVE TOOLS ---

// 1. Generate High-Quality Thumbnail (Imagen 4)
export const generateViralThumbnail = async (hook: string, description: string, brandColors?: { primary: string, secondary: string }): Promise<string> => {
    try {
        const colorContext = brandColors ? `Use brand colors ${brandColors.primary} and ${brandColors.secondary} for text overlays and accents.` : '';
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `Vertical social media thumbnail (9:16). Text overlay: "${hook}". Context: ${description}. ${colorContext} High contrast, professional, viral aesthetics, 8k resolution, hyper realistic.`,
            config: {
                numberOfImages: 1,
                aspectRatio: '9:16',
                outputMimeType: 'image/jpeg',
            },
        });
        const base64 = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64}`;
    } catch (e) {
        console.error("Thumbnail generation failed", e);
        throw e;
    }
};

// 2. Generate Concept Video (Veo 3.1)
export const generateConceptVideo = async (hook: string, description: string, brandColors?: { primary: string, secondary: string }): Promise<string> => {
    try {
        const colorContext = brandColors ? `Color palette: ${brandColors.primary} (dominant), ${brandColors.secondary} (accent).` : '';
        
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Cinematic social media video concept. Visualizing: ${description}. Hook text integration: ${hook}. ${colorContext} High energy, fast paced, viral style, 4k.`,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '9:16'
            }
        });

        // Polling mechanism - Increased to 10s as recommended for Veo
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10s
            operation = await ai.operations.getVideosOperation({operation: operation});
        }
        
        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!uri) throw new Error("No video URI returned from Veo.");
        
        const vidResponse = await fetch(`${uri}&key=${apiKey}`);
        if (!vidResponse.ok) throw new Error(`Failed to fetch video bytes: ${vidResponse.statusText}`);
        
        const blob = await vidResponse.blob();
        return URL.createObjectURL(blob);

    } catch (e) {
        console.error("Video generation failed", e);
        throw e;
    }
};

// 3. Generate Audio Draft (TTS Gemini 2.5)
export const generateScriptAudio = async (script: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: script }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data returned");
        return base64Audio;
    } catch (e) {
        console.error("TTS failed", e);
        throw e;
    }
};
