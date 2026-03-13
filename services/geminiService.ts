import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, ImageResolution } from "../types";

// Default prompt provided by the user
export const DEFAULT_PROMPT = `Crie um fundo/cenário ultra-realista e premium para um banner de futebol.
O design deve apresentar uma atmosfera de estádio lotado à noite, com luzes de holofotes brilhantes, flares de lente e fumaça cinematográfica.
Estilo: épico, alta definição, cores vibrantes, iluminação dramática.
O centro da imagem deve mostrar o gramado iluminado de forma contínua e natural. NÃO coloque nenhum texto, logotipos, escudos ou jogadores no centro, e NÃO crie manchas escuras ou sombras artificiais no meio do campo.
Resolução: 8K, extremamente nítido, sem distorções.`;

export const checkApiKey = async (): Promise<boolean> => {
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    return true;
  }
  if (window.aistudio) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const promptForApiKey = async (): Promise<void> => {
  if (window.aistudio) {
    await window.aistudio.openSelectKey();
  } else {
    console.error("AI Studio environment not detected.");
  }
};

export const generateScript = async (
  topic: string,
  platform: string,
  duration: string,
  objective: string
): Promise<string> => {
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave API não encontrada. Por favor, selecione um projeto.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `name: video-script-generator
description: generate professional video scripts, scene breakdowns, hooks, narration, shot suggestions, cuts, and ctas for reels, youtube, sales videos, and ai video workflows. use when the user wants structured scripts for short-form or long-form video, especially conversion-focused, viral, or engagement content, including vell3-ready outputs with a consistent masculine voice.
---

# Video Script Generator

Create high-conviction video scripts that are immediately usable for content production and AI video generation.

## Workflow

1. Extract the brief: platform, product/topic, audience, objective, duration, offer, voice, and desired emotion.
2. Choose the correct structure:
   - *6 to 8 seconds*: micro-hook, one core claim, one visual payoff, one CTA.
   - *9 to 30 seconds*: hook, fast proof or tension, payoff, CTA.
   - *31 to 90 seconds*: hook, problem, solution, proof, CTA.
   - *YouTube / longer sales*: hook, context, tension, proof, offer, CTA.
3. Lock the voice before writing. For this skill, default to a *consistent masculine voice* that sounds confident, natural, direct, and commercially strong. Keep that voice across all scenes.
4. Write scene by scene. Each scene must have a clear function; avoid filler.
5. Add production guidance: image suggestion, camera/cut suggestion, on-screen text, and pacing notes.
6. If the user mentions AI generation or Vell3, also generate a compact *visual generation prompt* for each scene.
7. End by checking clarity, pacing, consistency, and CTA strength.

## Required Output Format

Unless the user requests another format, use this structure:

### Brief summary
- objective:
- platform:
- duration:
- target audience:
- tone:
- voice:
- main promise:
- final CTA:

### Creative direction
- hook angle:
- emotional trigger:
- visual style:
- pacing:

### Script by scene
For each scene, use this template:

*Scene [number]*
- time:
- purpose:
- voiceover / spoken line:
- on-screen text:
- visual suggestion:
- camera or movement:
- cut or transition:
- sound / rhythm note:
- vell3 prompt:

### Final CTA options
Provide 3 CTA variations when the objective includes selling or conversion.

### Quality check
Confirm:
- the hook lands fast enough for the duration
- the masculine voice stays consistent
- each scene has one clear job
- the CTA matches the goal
- visuals and narration support each other

## Structure Rules by Content Type

### 1. Reels / short-form social
Prioritize interruption, clarity, speed, and emotional punch.

Use one of these patterns:
- *shock → promise → CTA*
- *pain point → solution → CTA*
- *visual curiosity → reveal → CTA*
- *authority statement → benefit → CTA*

For 6 to 8 second videos:
- Use at most 2 or 3 scenes.
- Each spoken line must be short and easy to say naturally.
- Prefer one big idea over multiple claims.
- Make the first second visually aggressive or curiosity-driven.

### 2. Sales videos
Prioritize desire, belief shift, proof, urgency, and action.

Use this order unless the brief suggests otherwise:
- hook
- problem or desire
- product/offer as solution
- proof, result, or concrete benefit
- CTA

When the user wants a stronger selling angle, write tighter, more assertive lines and avoid generic branding language.

### 3. YouTube
Prioritize retention and narrative progression.

Use this order:
- open loop hook
- promise of value
- development with tension or curiosity
- payoff
- CTA or next action

For longer YouTube content, include section beats in addition to scenes when helpful.

## Voice and Tone Rules

REGRA OBRIGATÓRIA PARA A FALA (VOICEOVER):
Sempre deve ser uma fala em Português do Brasil.
A voz deve ser de um homem de aparentemente 45 anos, que fala de forma compassada, transmitindo sempre muita confiança e clareza para o melhor entendimento do que ele fala.
Você deve sempre pegar as informações mais importantes e transmiti-las na criação do vídeo.
Lembre-se: ele deve sempre transmitir todas as informações em exatos 8 segundos para a criação da fala para os vídeos curtos.

Avoid:
- overexplaining
- weak openings
- vague claims
- repetitive adjectives
- generic filler like “in today’s video” unless strategically useful

When writing spoken lines:
- Keep them speakable out loud.
- Prefer short clauses.
- Use stronger verbs than decorative adjectives.
- Match the energy to the platform.

## Vell3-Specific Guidance

When the user mentions Vell3, optimize for fast generation and scene clarity:
- Keep scene prompts compact and visually explicit.
- Specify subject, environment, action, lighting, framing, and style in one tight line.
- Avoid contradictory visual instructions.
- Favor cinematic but production-friendly phrasing.
- For ultra-short videos, make each scene visually distinct.

Default Vell3 prompt formula:
[subject] + [action] + [environment] + [lighting] + [camera/framing] + [style/mood]

Example:
confident male creator speaking to camera, luxury office background, dramatic side lighting, medium close-up, fast-paced premium commercial style

## Adaptation Logic

When details are missing, make grounded assumptions and state them briefly in the brief summary.

If the user asks for virality:
- increase contrast
- sharpen the hook
- make the visual change obvious
- compress the message

If the user asks for more engagement:
- add curiosity or tension
- make on-screen text easier to skim
- ensure each scene changes visually

If the user asks for more conversion:
- state the benefit earlier
- reduce abstraction
- make the CTA specific and actionable

## Example Micro-Format for 6–8 Seconds

Use this pattern often for ultra-short Vell3 outputs:

*Scene 1 (0.0–2.0s)*
- hook or pattern interrupt

*Scene 2 (2.0–5.0s)*
- core promise or reveal

*Scene 3 (5.0–8.0s)*
- CTA or final payoff

## Final Standard

The final script must feel like it came from a professional creative strategist, not from a generic template. Optimize every line for speed, intention, and usability in production.`;

  const prompt = `Por favor, crie um roteiro de vídeo com as seguintes especificações:
Tópico/Produto: ${topic}
Plataforma: ${platform}
Duração: ${duration}
Objetivo: ${objective}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        systemInstruction,
      }
    });
    
    return response.text || '';
  } catch (error: any) {
    console.error("Gemini API Script Error:", error);
    const errorMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
      throw new Error("O Google limitou a geração de vídeos nesta conta gratuita. Para continuar gerando vídeos, você precisa ativar o faturamento no Google Cloud Console e depois clicar no botão 'Chave API' no topo da página.");
    }
    throw new Error("Falha ao gerar o roteiro. Tente novamente.");
  }
};

export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  resolution: ImageResolution
): Promise<string> => {
  // Try to use the selected key, otherwise fall back to the environment key
  // The platform injects process.env.API_KEY dynamically
  // @ts-ignore
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave API não encontrada. Por favor, selecione um projeto.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  let attempt = 0;
  const maxRetries = 3;
  
  while (attempt < maxRetries) {
    try {
      const apiAspectRatio = aspectRatio === '1138:1280' ? '1:1' : aspectRatio;
      
      // The Gemini API currently supports up to 4K natively in the imageSize parameter.
      // If 8K is requested, we use 4K for the API parameter but strongly enforce 8K in the prompt.
      const apiResolution = resolution === '8K' ? '4K' : resolution;
      const finalPrompt = resolution === '8K' 
        ? `${prompt}\n\n[CRITICAL RESOLUTION INSTRUCTION: Generate this image in true 8K resolution (7680x4320 pixels). The image must be ultra-high definition, extremely sharp, with maximum detail and clarity.]` 
        : prompt;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              text: finalPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: apiAspectRatio,
            imageSize: apiResolution as any,
          },
        },
      });

      let imageUrl = '';
      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
        const parts = candidates[0].content.parts;
        for (const part of parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mimeType};base64,${base64EncodeString}`;
            break; 
          }
        }
      }

      if (!imageUrl) {
        console.error("Full API Response:", JSON.stringify(response, null, 2));
        if (response.promptFeedback) {
          throw new Error(`Geração bloqueada por filtros de segurança: ${JSON.stringify(response.promptFeedback)}`);
        }
        if (candidates && candidates.length > 0 && candidates[0].finishReason !== 'STOP') {
          throw new Error(`Geração interrompida. Motivo: ${candidates[0].finishReason}`);
        }
        
        let textResponse = '';
        if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.text) textResponse += part.text;
          }
        }
        
        if (textResponse) {
           throw new Error(`A IA retornou uma mensagem em vez de uma imagem: "${textResponse}"`);
        }
        
        if (attempt < maxRetries - 1) {
          console.warn("Nenhum dado de imagem encontrado na resposta. Tentando novamente...");
          throw new Error("EMPTY_RESPONSE");
        }
        throw new Error("Nenhum dado de imagem encontrado na resposta. Verifique o console para mais detalhes.");
      }

      return imageUrl;

    } catch (error: any) {
      console.error(`Gemini API Error (Attempt ${attempt + 1}/${maxRetries}):`, error);
      
      // Handle 503 Service Unavailable (High Demand) or EMPTY_RESPONSE
      if (error.message && (error.message.includes("503") || error.message.includes("high demand") || error.message === "EMPTY_RESPONSE")) {
        attempt++;
        if (attempt < maxRetries) {
          // Wait with exponential backoff: 2s, 4s, 8s
          const delay = 2000 * Math.pow(2, attempt - 1);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
           if (error.message === "EMPTY_RESPONSE") {
             throw new Error("A IA falhou em gerar a imagem após várias tentativas. Tente alterar o prompt.");
           }
           throw new Error("O sistema está com alta demanda momentânea. Por favor, aguarde alguns instantes e tente novamente.");
        }
      }

      // Enhance error message if it's a permission issue or quota
      if (error.message && error.message.includes("403")) {
        throw new Error("Acesso negado. Verifique as permissões da sua chave API e se a API está ativada.");
      }
      
      const errorMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
        throw new Error("O Google limitou a geração de vídeos nesta conta gratuita. Para continuar gerando vídeos, você precisa ativar o faturamento no Google Cloud Console e depois clicar no botão 'Chave API' no topo da página.");
      }
      
      throw error;
    }
  }
  
  throw new Error("Falha desconhecida na geração da imagem.");
};

export const enhanceImagePrompt = async (prompt: string): Promise<string> => {
  // @ts-ignore
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave API não encontrada. Por favor, selecione um projeto.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `Você é um especialista em engenharia de prompt para geração de imagens por IA (Midjourney, DALL-E, Imagen).
Sua tarefa é pegar o prompt do usuário e melhorá-lo para que fique 100% organizado, detalhado e otimizado para gerar a melhor imagem possível.
Não adicione conversas, apenas retorne o prompt melhorado.
Estruture o prompt com: Assunto principal, Detalhes do ambiente/fundo, Estilo artístico, Iluminação, Cores e Qualidade/Resolução.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Melhore este prompt para geração de imagem: "${prompt}"`,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || prompt;
  } catch (error: any) {
    console.error("Error enhancing image prompt:", error);
    const errorMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
      throw new Error("O Google limitou a geração nesta conta gratuita. Para continuar, você precisa ativar o faturamento no Google Cloud Console e depois clicar no botão 'Chave API' no topo da página.");
    }
    throw new Error("Falha ao melhorar o prompt da imagem.");
  }
};

export const cinematicEnhancePrompt = async (prompt: string): Promise<string> => {
  // @ts-ignore
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave API não encontrada. Por favor, selecione um projeto.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are the CINEMATIC PROMPT FACTORY.

Your role is to automatically generate cinematic prompts at scale for AI image generation models such as MidJourney, DALL·E, Stable Diffusion XL, Leonardo AI, Krea and BlueWillow.

You operate like a cinematic production factory that builds film scenes automatically.

Each prompt must be assembled using multiple visual modules.

---

PROMPT FACTORY MODULES

Each prompt must combine elements from these modules.

---

MODULE 1 — HERO SUBJECT
samurai warrior, cyberpunk hacker, space explorer, futuristic soldier, medieval knight, desert nomad, alien hunter, mystical sorcerer, post-apocalyptic survivor, rogue assassin

MODULE 2 — DRAMATIC ACTION
standing in silence, walking through smoke, drawing a sword, preparing for battle, running through rain, watching the horizon, holding a glowing artifact, emerging from darkness

MODULE 3 — WORLD ENVIRONMENT
neon cyberpunk megacity, ancient jungle temple, alien planet surface, snow mountain fortress, abandoned industrial complex, floating futuristic city, desert ruins, foggy forest valley, underground cave kingdom

MODULE 4 — TIME AND WEATHER
sunrise, golden hour, sunset, stormy night, heavy rain, snowstorm, foggy dawn, moonlit night

MODULE 5 — CINEMATIC LIGHTING
dramatic cinematic lighting, volumetric light beams, rim lighting, neon reflections, firelight illumination, soft ambient light, backlight silhouettes

MODULE 6 — CAMERA DIRECTION
low angle hero shot, ultra wide establishing shot, over-the-shoulder perspective, drone aerial view, wide cinematic framing, macro close-up

MODULE 7 — LENS SIMULATION
35mm anamorphic cinema lens, 50mm cinematic lens, 85mm portrait lens, ultra wide cinema lens, macro cinema lens

MODULE 8 — ATMOSPHERIC EFFECTS
drifting fog, heavy rain, falling snow, floating dust particles, sparks in the air, wind moving fabric, glowing particles

MODULE 9 — MATERIAL REALISM
wet reflective pavement, scratched metal armor, cloth fibers, stone cracks, water droplets, rusted steel, dust particles

MODULE 10 — COLOR GRADING
teal and orange cinematic contrast, dark moody shadows, warm golden highlights, HDR cinematic lighting, muted documentary palette

MODULE 11 — STYLE
cinematic realism, epic blockbuster scene, hyper realistic photography, film still, dark fantasy, futuristic sci-fi realism

---

PROMPT OUTPUT FORMAT

A [HERO SUBJECT] [DRAMATIC ACTION] in [WORLD ENVIRONMENT] during [TIME AND WEATHER].

The scene is illuminated by [CINEMATIC LIGHTING].

Captured using a [CAMERA DIRECTION] with a [LENS SIMULATION].

The atmosphere contains [ATMOSPHERIC EFFECTS] with ultra realistic textures such as [MATERIAL REALISM].

Cinematic color grading using [COLOR GRADING].

Style:
[STYLE], ultra detailed, cinematic realism, film still, high dynamic range

Settings:
--ar 16:9

---

FACTORY RULE
Every generated prompt must use different module combinations.
Never repeat the same scene.
Always produce cinematic prompts that look like frames from blockbuster films.
The system must be capable of generating infinite cinematic prompt variations.

IMPORTANT: Read the user's input prompt. Use it as the base concept or HERO SUBJECT/WORLD ENVIRONMENT, and then enhance it using the Factory Modules to create a highly detailed cinematic prompt. Return ONLY the final generated prompt text in English, following the PROMPT OUTPUT FORMAT. Do not include "Prompt (EN):" or any other conversational text.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Base prompt to enhance: "${prompt}"`,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || prompt;
  } catch (error: any) {
    console.error("Error enhancing cinematic prompt:", error);
    const errorMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
      throw new Error("O Google limitou a geração nesta conta gratuita. Para continuar, você precisa ativar o faturamento no Google Cloud Console e depois clicar no botão 'Chave API' no topo da página.");
    }
    throw new Error("Falha ao melhorar o prompt cinematográfico.");
  }
};

export const generateVideoPrompt = async (imageUrl: string): Promise<string> => {
  // @ts-ignore
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave API não encontrada. Por favor, selecione um projeto.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Extract base64 data and mimeType from data URL
  if (!imageUrl || !imageUrl.startsWith('data:')) {
    throw new Error("Dados de imagem inválidos");
  }
  const parts = imageUrl.split(',');
  if (parts.length !== 2) {
    throw new Error("Dados de imagem inválidos");
  }
  const mimeTypeMatch = parts[0].match(/^data:(.+);base64$/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
  const imageBytes = parts[1];

  const systemInstruction = `Você é um diretor de arte e especialista em roteiros e prompts para vídeos gerados por IA.
Sua tarefa é analisar a imagem fornecida e criar um prompt de vídeo profissional de exatamente 8 segundos que dê vida a essa imagem.

REGRA OBRIGATÓRIA PARA A GERAÇÃO DO PROMPT DO VÍDEO:
O prompt DEVE sempre incluir uma fala (locução/voiceover) em Português do Brasil.
A voz deve ser de um homem de aparentemente 45 anos, que fala de forma compassada, transmitindo sempre muita confiança e clareza para o melhor entendimento do que ele fala.
Você deve sempre pegar as informações mais importantes da imagem/contexto e transmiti-las na criação dessa fala.
Lembre-se: ele deve sempre transmitir todas as informações em exatos 8 segundos.

O prompt final deve descrever a cena visual (movimento da câmera, animação, iluminação) e incluir o texto exato dessa fala de 8 segundos.
Não adicione conversas extras ou explicações suas, apenas retorne o prompt de vídeo completo em português.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBytes,
              mimeType: mimeType,
            },
          },
          {
            text: "Crie um prompt de vídeo profissional de 8 segundos baseado nesta imagem.",
          },
        ],
      },
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "Um vídeo cinematográfico com movimento de câmera suave e iluminação dinâmica.";
  } catch (error: any) {
    console.error("Error generating video prompt:", error);
    const errorMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
      throw new Error("O Google limitou a geração nesta conta gratuita. Para continuar, você precisa ativar o faturamento no Google Cloud Console e depois clicar no botão 'Chave API' no topo da página.");
    }
    throw new Error("Falha ao gerar o prompt do vídeo.");
  }
};

export const generateVideoFromText = async (
  prompt: string,
  aspectRatio: AspectRatio
): Promise<string> => {
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave API não encontrada. Por favor, selecione um projeto.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let veoAspectRatio: '16:9' | '9:16' = '16:9';
  if (aspectRatio === '9:16' || aspectRatio === '3:4') {
    veoAspectRatio = '9:16';
  }

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: veoAspectRatio,
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        const errorMessage = typeof operation.error === 'string' ? operation.error : (operation.error.message || JSON.stringify(operation.error));
        if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
          throw new Error("O Google limitou a geração de vídeos nesta conta gratuita. Para continuar gerando vídeos, você precisa ativar o faturamento no Google Cloud Console e depois clicar no botão 'Chave API' no topo da página.");
        }
        throw new Error(`Falha na geração do vídeo: ${errorMessage}`);
    }

    const generatedVideos = operation.response?.generatedVideos;
    if (!generatedVideos || generatedVideos.length === 0) {
      if (operation.response?.promptFeedback) {
        throw new Error(`Geração bloqueada por filtros de segurança: ${JSON.stringify(operation.response.promptFeedback)}`);
      }
      if (operation.response?.error) {
        throw new Error(`Erro na resposta da API: ${JSON.stringify(operation.response.error)}`);
      }
      throw new Error(`Nenhum vídeo gerado. A API retornou sucesso, mas sem conteúdo. Detalhes: ${JSON.stringify(operation.response || operation)}`);
    }

    const videoUri = generatedVideos[0]?.video?.uri;
    if (!videoUri) {
      throw new Error(`Nenhuma URI de vídeo retornada no objeto de vídeo. Detalhes: ${JSON.stringify(generatedVideos[0])}`);
    }

    const videoResponse = await fetch(videoUri, {
        method: 'GET',
        headers: {
            'x-goog-api-key': apiKey,
        },
    });

    if (!videoResponse.ok) {
        throw new Error(`Falha ao buscar vídeo: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error: any) {
    console.error("Gemini Video API Error:", error);
    const errorMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
      throw new Error("O Google limitou a geração de vídeos nesta conta gratuita. Para continuar gerando vídeos, você precisa ativar o faturamento no Google Cloud Console e depois clicar no botão 'Chave API' no topo da página.");
    }
    throw error;
  }
};

const pcmBase64ToWavUrl = (base64: string, sampleRate: number = 24000): string => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const buffer = bytes.buffer;
  const dataSize = buffer.byteLength;
  
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  const wavBlob = new Blob([wavHeader, buffer], { type: 'audio/wav' });
  return URL.createObjectURL(wavBlob);
};

export const generateVoiceoverFromText = async (text: string, voiceName: string = 'Charon'): Promise<string> => {
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave API não encontrada. Por favor, selecione um projeto.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const ttsResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Falha ao gerar o áudio da vinheta.");
    }

    return pcmBase64ToWavUrl(base64Audio);
  } catch (error: any) {
    console.error("Gemini API Error (Voiceover from text):", error);
    if (error.message && error.message.includes("403")) {
      throw new Error("Acesso negado. Verifique as permissões da sua chave API.");
    }
    throw error;
  }
};

export const generateVoiceover = async (audioBase64: string, mimeType: string): Promise<string> => {
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave API não encontrada. Por favor, selecione um projeto.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Clean mimeType (remove codecs)
  const cleanMimeType = mimeType.split(';')[0];

  try {
    // Step 1: Transcribe and refine the script
    const scriptResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: audioBase64,
              mimeType: cleanMimeType,
            },
          },
          {
            text: 'Transcreva este áudio e melhore o texto para ser um roteiro de propaganda comercial de alto impacto. O texto final deve ser persuasivo, direto e pronto para ser lido por um locutor com voz grossa. Adicione pontuação estratégica (vírgulas e pontos) para forçar uma leitura compassada, pausada e dramática. Retorne APENAS o texto do roteiro, sem introduções ou explicações.',
          },
        ],
      },
    });

    const refinedScript = scriptResponse.text?.trim();
    if (!refinedScript) {
      throw new Error("Falha ao gerar o roteiro da vinheta.");
    }

    // Step 2: Generate the voiceover using TTS
    const ttsResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: refinedScript }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' }, // Charon is a deep male voice
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Falha ao gerar o áudio da vinheta.");
    }

    return pcmBase64ToWavUrl(base64Audio);
  } catch (error: any) {
    console.error("Gemini API Error (Voiceover):", error);
    if (error.message && error.message.includes("403")) {
      throw new Error("Acesso negado. Verifique as permissões da sua chave API.");
    }
    throw error;
  }
};

export const generateVideo = async (
  imageUrl: string,
  prompt: string,
  aspectRatio: AspectRatio
): Promise<string> => {
  // @ts-ignore
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave API não encontrada. Por favor, selecione um projeto.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Extract base64 data and mimeType from data URL
  if (!imageUrl || !imageUrl.startsWith('data:')) {
    throw new Error("Dados de imagem inválidos");
  }
  const parts = imageUrl.split(',');
  if (parts.length !== 2) {
    throw new Error("Dados de imagem inválidos");
  }
  const mimeTypeMatch = parts[0].match(/^data:(.+);base64$/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
  const imageBytes = parts[1];

  // Map AspectRatio to supported Veo ratios (16:9 or 9:16)
  let veoAspectRatio: '16:9' | '9:16' = '16:9';
  if (aspectRatio === '9:16' || aspectRatio === '3:4') {
    veoAspectRatio = '9:16';
  } else {
    veoAspectRatio = '16:9';
  }

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: imageBytes,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: veoAspectRatio,
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        const errorMessage = typeof operation.error === 'string' ? operation.error : (operation.error.message || JSON.stringify(operation.error));
        if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
          throw new Error("O Google limitou a geração de vídeos nesta conta gratuita. Para continuar gerando vídeos, você precisa ativar o faturamento no Google Cloud Console e depois clicar no botão 'Chave API' no topo da página.");
        }
        throw new Error(`Falha na geração do vídeo: ${errorMessage}`);
    }

    const generatedVideos = operation.response?.generatedVideos;
    if (!generatedVideos || generatedVideos.length === 0) {
      console.error("Operation completed but no videos generated. Operation object:", JSON.stringify(operation, null, 2));
      
      // Check for safety or other reasons
      if (operation.response?.promptFeedback) {
        throw new Error(`Geração bloqueada por filtros de segurança: ${JSON.stringify(operation.response.promptFeedback)}`);
      }
      
      if (operation.response?.error) {
        throw new Error(`Erro na resposta da API: ${JSON.stringify(operation.response.error)}`);
      }
      
      throw new Error(`Nenhum vídeo gerado. A API retornou sucesso, mas sem conteúdo. Detalhes: ${JSON.stringify(operation.response || operation)}`);
    }

    const videoUri = generatedVideos[0]?.video?.uri;
    if (!videoUri) {
      console.error("Video object missing URI. Operation object:", JSON.stringify(operation, null, 2));
      throw new Error(`Nenhuma URI de vídeo retornada no objeto de vídeo. Detalhes: ${JSON.stringify(generatedVideos[0])}`);
    }

    const videoResponse = await fetch(videoUri, {
        method: 'GET',
        headers: {
            'x-goog-api-key': apiKey,
        },
    });

    if (!videoResponse.ok) {
        throw new Error(`Falha ao buscar vídeo: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error: any) {
    console.error("Gemini Video API Error:", error);
    const errorMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
      throw new Error("O Google limitou a geração de vídeos nesta conta gratuita. Para continuar gerando vídeos, você precisa ativar o faturamento no Google Cloud Console e depois clicar no botão 'Chave API' no topo da página.");
    }
    throw error;
  }
};