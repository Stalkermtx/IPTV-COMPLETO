import React, { useState, useEffect, useRef } from 'react';
import { generateImage, generateVideo, DEFAULT_PROMPT, generateVideoPrompt, generateScript, generateVideoFromText, promptForApiKey } from '../services/geminiService';
import { AspectRatio, ImageResolution } from '../types';
import ImageDisplay, { ImageDisplayRef } from '../components/ImageDisplay';
import Controls from '../components/Controls';
import ScriptGenerator from '../components/ScriptGenerator';
import VoiceRecorder from '../components/VoiceRecorder';
import WhatsAppCampaign from '../components/WhatsAppCampaign';
import ApiKeyChecker from '../components/ApiKeyChecker';
import FAQ from '../components/FAQ';
import Features from '../components/Features';
import { Sparkles, Zap, Play, Loader2, LogOut, User, ShieldCheck, Download, History, Trash2, Clock, Film, Key, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HistoryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: AspectRatio;
}

const Generator: React.FC = () => {
  const { user, logout, incrementUsage, logGeneration, generations } = useAuth();
  const navigate = useNavigate();
  const [apiKeyValid, setApiKeyValid] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1138:1280');
  const [videoAspectRatio, setVideoAspectRatio] = useState<AspectRatio>('16:9');
  const [videoScript, setVideoScript] = useState<string>('');
  const [resolution, setResolution] = useState<ImageResolution>('4K');
  const [imageType, setImageType] = useState<'logo' | 'background'>('background');
  const [outputFormat, setOutputFormat] = useState<'PNG' | 'JPEG'>('PNG');
  const [transparentBackground, setTransparentBackground] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [videoGenerationTime, setVideoGenerationTime] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState<boolean>(false);
  const [generatingVideoPrompt, setGeneratingVideoPrompt] = useState<boolean>(false);
  const [scriptResult, setScriptResult] = useState<string | null>(null);
  const [scriptLoading, setScriptLoading] = useState<boolean>(false);
  const [sceneVideos, setSceneVideos] = useState<{ prompt: string; url?: string; loading: boolean; error?: string }[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [appMode, setAppMode] = useState<'images' | 'scripts' | 'campaigns'>('images');
  const imageDisplayRef = useRef<ImageDisplayRef>(null);

  // Load history from server on mount
  useEffect(() => {
    if (user && generations) {
      let hiddenIds: string[] = [];
      try {
        hiddenIds = JSON.parse(localStorage.getItem('hidden_generations') || '[]');
      } catch (e) {
        console.error("Failed to parse hidden generations", e);
      }

      // Find generations for this user and map them to HistoryItem format
      const userGenerations = generations
        .filter((g: any) => g.userId === user.id && !hiddenIds.includes(g.id))
        .map((g: any) => ({
          id: g.id,
          type: g.model.includes('veo') ? 'video' : 'image',
          url: g.imageUrl,
          prompt: g.prompt,
          timestamp: new Date(g.timestamp).getTime(),
          aspectRatio: '1:1' as AspectRatio // Defaulting as it wasn't saved in GenerationHistory
        }))
        .sort((a: any, b: any) => b.timestamp - a.timestamp);
      
      setHistory(userGenerations);
    }
  }, [user, generations]);

  useEffect(() => {
    if (user?.subscriptionStatus === 'inactive') {
      navigate('/subscription');
    }
  }, [user, navigate]);

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setHistory(prev => [newItem, ...prev]);
    // Note: logGeneration in AuthContext handles saving to the backend
  };

  const clearHistory = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      // Get current history IDs to mark as deleted
      const currentIds = history.map(h => h.id);
      
      // Save to localStorage so they don't show up again for this user
      try {
        const hidden = JSON.parse(localStorage.getItem('hidden_generations') || '[]');
        localStorage.setItem('hidden_generations', JSON.stringify([...hidden, ...currentIds]));
      } catch (e) {
        console.error("Failed to save hidden generations", e);
      }
      
      setHistory([]);
    }
  };

  const addWatermarkToImage = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Configure watermark text
        const text = "ConexTV Pro";
        // Calculate font size based on image width to maintain proportion
        const fontSize = Math.max(24, Math.floor(img.width / 12)); 
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)"; // 15% opacity
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Draw grid of watermarks
        const cols = 3;
        const rows = 3;
        const colWidth = img.width / cols;
        const rowHeight = img.height / rows;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = c * colWidth + colWidth / 2;
            const y = r * rowHeight + rowHeight / 2;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-15 * Math.PI / 180); // -15 degrees rotation
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (e) => reject(new Error("Failed to load image for watermarking"));
      img.src = imageUrl;
    });
  };

  const extractLastFrame = async (videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Seek to almost the end (e.g., 0.1s before the end)
        video.currentTime = Math.max(0, video.duration - 0.1);
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      
      video.onerror = (e) => {
        reject(new Error('Failed to load video'));
      };
    });
  };

  const handleGrabLastFrame = async () => {
    if (!videoUrl) return;
    try {
      setLoading(true);
      const lastFrameDataUrl = await extractLastFrame(videoUrl);
      setImageUrl(lastFrameDataUrl);
      setVideoUrl(null); // Clear the video to show the new image and allow generating a new video
      setVideoScript(''); // Clear the script for the new scene
    } catch (err: any) {
      console.error("Error extracting last frame:", err);
      setError("Falha ao extrair o último frame do vídeo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!apiKeyValid) {
       setError("Verificação da chave API necessária.");
       return;
    }

    if (!prompt.trim()) {
      setError("Por favor, descreva a imagem que você deseja gerar.");
      return;
    }

    // Check Basic Plan Limits
    if (user?.planId === 'basic') {
      if ((user.usageCount || 0) >= 3) {
        setError("Limite do plano Básico atingido (3 imagens). Atualize para o Pro para continuar gerando.");
        return;
      }
    }

    // Check Credits
    if (user?.planId === 'credits') {
      if ((user.credits || 0) <= 0) {
        setError("Seus créditos acabaram. Adquira um novo pacote para continuar gerando.");
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    setImageUrl(null);
    setVideoUrl(null);
    setScriptResult(null);
    setGenerationTime(null);

    const startTime = Date.now();

    try {
      // Force Low resolution for Basic plan
      const effectiveResolution = user?.planId === 'basic' ? '1K' : resolution;
      
      let finalPrompt = prompt;
      if (imageType === 'background') {
        finalPrompt += "\n\n[MUITO IMPORTANTE: O cenário deve ser contínuo e natural em toda a imagem. NÃO crie manchas pretas, sombras artificiais, buracos ou espaços escuros no centro. O centro deve apenas mostrar a continuação do fundo (ex: gramado, luzes, arquibancada) sem logotipos e sem escudos. Se o prompt pedir textos, inclua-os normalmente.]";
      }
      if (aspectRatio === '1138:1280') {
        finalPrompt += "\n\n[REGRAS DE FORMATAÇÃO DE TEXTO OBRIGATÓRIAS PARA 1138x1280: 1. A imagem será cortada nas laterais. 2. TODOS os textos e elementos principais DEVEM estar estritamente na ZONA SEGURA CENTRAL (apenas os 60% do meio da imagem). 3. Deixe margens GIGANTESCAS vazias nas laterais, no topo e no fundo. 4. NUNCA coloque texto perto das bordas. 5. Textos longos DEVEM ser quebrados em múltiplas linhas curtas e empilhadas.]";
      }
      if (transparentBackground) {
        finalPrompt += "\n\n[MUITO IMPORTANTE: Gere a imagem com um fundo puramente branco (#FFFFFF) e sólido, sem sombras, sem cenário e sem gradientes, para que possa ser facilmente recortado como PNG transparente.]";
      }
      
      let url = await generateImage(finalPrompt, aspectRatio, effectiveResolution);
      
      // Apply watermark if Basic plan
      if (user?.planId === 'basic') {
        url = await addWatermarkToImage(url);
      }

      const endTime = Date.now();
      const timeInSeconds = Math.floor((endTime - startTime) / 1000);
      setGenerationTime(timeInSeconds);

      setImageUrl(url);
      incrementUsage();
      logGeneration(prompt, url, 'gemini-3.1-flash-image-preview');
      addToHistory({
        type: 'image',
        url: url,
        prompt: prompt,
        aspectRatio: aspectRatio
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro inesperado durante a geração.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideoPrompt = async () => {
    if (!imageUrl || !apiKeyValid) return;
    
    setGeneratingVideoPrompt(true);
    setError(null);
    
    try {
      let finalImageUrlToUse = imageUrl;
      if (imageDisplayRef.current) {
        const combinedImage = await imageDisplayRef.current.getCombinedImage();
        if (combinedImage) {
          finalImageUrlToUse = combinedImage;
        }
      }
      
      const generatedPrompt = await generateVideoPrompt(finalImageUrlToUse);
      setVideoScript(generatedPrompt);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Falha ao gerar o prompt do vídeo.");
    } finally {
      setGeneratingVideoPrompt(false);
    }
  };

  const handleGenerateScript = async (topic: string, platform: string, duration: string, objective: string) => {
    if (!apiKeyValid) {
      setError("Verificação da chave API necessária.");
      return;
    }

    setScriptLoading(true);
    setError(null);
    setScriptResult(null);
    setImageUrl(null);
    setVideoUrl(null);
    setSceneVideos([]);

    try {
      const script = await generateScript(topic, platform, duration, objective);
      setScriptResult(script);
      // Optional: log generation
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao gerar o roteiro.");
    } finally {
      setScriptLoading(false);
    }
  };

  const handleGenerateSceneVideos = async () => {
    if (!scriptResult || !apiKeyValid) return;

    setError(null);

    // Extract vell3 prompts more robustly (handles bolding, capitalization, missing dashes)
    const regex = /vell3 prompt[^:]*:\s*\*?\*?\s*([^\n]+)/gi;
    const prompts: string[] = [];
    let match;
    while ((match = regex.exec(scriptResult)) !== null) {
      const promptText = match[1].replace(/\*+$/, '').trim(); // Remove trailing asterisks if any
      if (promptText) {
        prompts.push(promptText);
      }
    }

    console.log("Extracted prompts:", prompts);

    if (prompts.length === 0) {
      setError("Nenhum 'vell3 prompt' encontrado no roteiro. Tente gerar o roteiro novamente.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Initialize state
    const initialScenes = prompts.map(p => ({ prompt: p, loading: true }));
    setSceneVideos(initialScenes);

    // Generate videos sequentially to avoid rate limits
    for (let i = 0; i < prompts.length; i++) {
      try {
        const url = await generateVideoFromText(prompts[i], '9:16'); // Defaulting to vertical for shorts
        setSceneVideos(prev => {
          const next = [...prev];
          next[i] = { ...next[i], url, loading: false };
          return next;
        });
      } catch (err: any) {
        console.error(`Error generating scene ${i + 1}:`, err);
        setSceneVideos(prev => {
          const next = [...prev];
          next[i] = { ...next[i], loading: false, error: err.message || "Erro ao gerar cena" };
          return next;
        });
      }
    }
  };

  const handleGenerateVideo = async () => {
    if (!imageUrl || !apiKeyValid) return;
    
    setVideoLoading(true);
    setError(null);
    setVideoGenerationTime(null);
    
    const startTime = Date.now();
    
    try {
      const promptToUse = videoScript.trim() 
        ? videoScript 
        : "Um vídeo de introdução curto e animado de 5 segundos. Os elementos metálicos do logotipo ganham vida com efeitos de brilho sutis e um movimento futurista. Adequado para uma introdução de vídeo.";
      
      // Get the combined image (with overlay) if available, otherwise fallback to original
      let finalImageUrlToUse = imageUrl;
      if (imageDisplayRef.current) {
        const combinedImage = await imageDisplayRef.current.getCombinedImage();
        if (combinedImage) {
          finalImageUrlToUse = combinedImage;
        }
      }
      
      const url = await generateVideo(finalImageUrlToUse, promptToUse, videoAspectRatio);
      
      const endTime = Date.now();
      const timeInSeconds = Math.floor((endTime - startTime) / 1000);
      setVideoGenerationTime(timeInSeconds);
      
      setVideoUrl(url);
      logGeneration(promptToUse, url, 'veo-3.1-fast-generate-preview');
      addToHistory({
        type: 'video',
        url: url,
        prompt: videoScript.trim() ? "Roteiro Personalizado" : "Intro Animada",
        aspectRatio: videoAspectRatio
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Falha na geração do vídeo.");
    } finally {
      setVideoLoading(false);
    }
  };

  const handleGenerateImageKwai = async () => {
    if (!apiKeyValid) {
       setError("Verificação da chave API necessária.");
       return;
    }

    if (!prompt.trim()) {
      setError("Por favor, descreva a imagem que você deseja gerar.");
      return;
    }

    // Check Basic Plan Limits
    if (user?.planId === 'basic') {
      if ((user.usageCount || 0) >= 3) {
        setError("Limite do plano Básico atingido (3 imagens). Atualize para o Pro para continuar gerando.");
        return;
      }
    }

    // Check Credits
    if (user?.planId === 'credits') {
      if ((user.credits || 0) <= 0) {
        setError("Seus créditos acabaram. Adquira um novo pacote para continuar gerando.");
        return;
      }
    }
    
    // Set Kwai specific settings
    setAspectRatio('9:16');
    setLoading(true);
    setError(null);
    setImageUrl(null);
    setVideoUrl(null);
    setScriptResult(null);
    setGenerationTime(null);

    const startTime = Date.now();

    try {
      // Force Low resolution for Basic plan
      const effectiveResolution = user?.planId === 'basic' ? '1K' : resolution;
      
      let finalPrompt = prompt;
      if (imageType === 'background') {
        finalPrompt += "\n\n[MUITO IMPORTANTE: O cenário deve ser contínuo e natural em toda a imagem. NÃO crie manchas pretas, sombras artificiais, buracos ou espaços escuros no centro. O centro deve apenas mostrar a continuação do fundo (ex: gramado, luzes, arquibancada) sem logotipos e sem escudos. Se o prompt pedir textos, inclua-os normalmente.]";
      }
      if (transparentBackground) {
        finalPrompt += "\n\n[MUITO IMPORTANTE: Gere a imagem com um fundo puramente branco (#FFFFFF) e sólido, sem sombras, sem cenário e sem gradientes, para que possa ser facilmente recortado como PNG transparente.]";
      }
      
      // 1. Generate Image
      let url = await generateImage(finalPrompt, '9:16', effectiveResolution);
      
      // Apply watermark if Basic plan
      if (user?.planId === 'basic') {
        url = await addWatermarkToImage(url);
      }

      const endTime = Date.now();
      const timeInSeconds = Math.floor((endTime - startTime) / 1000);
      setGenerationTime(timeInSeconds);

      setImageUrl(url);
      incrementUsage();
      logGeneration(prompt, url, 'gemini-3.1-flash-image-preview');
      addToHistory({
        type: 'image',
        url: url,
        prompt: prompt,
        aspectRatio: '9:16'
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro inesperado durante a geração para Kwai.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideoKwai = async () => {
    if (!imageUrl || !apiKeyValid) return;
    
    setVideoAspectRatio('9:16');
    setVideoLoading(true);
    setError(null);
    setVideoGenerationTime(null);
    
    try {
      // 1. Generate Video Prompt
      setGeneratingVideoPrompt(true);
      const generatedPrompt = await generateVideoPrompt(imageUrl);
      setVideoScript(generatedPrompt);
      setGeneratingVideoPrompt(false);

      // 2. Generate Video
      const videoStartTime = Date.now();
      const generatedVideoUrl = await generateVideo(imageUrl, generatedPrompt, '9:16');
      
      const videoEndTime = Date.now();
      const videoTimeInSeconds = Math.floor((videoEndTime - videoStartTime) / 1000);
      setVideoGenerationTime(videoTimeInSeconds);
      
      setVideoUrl(generatedVideoUrl);
      logGeneration(generatedPrompt, generatedVideoUrl, 'veo-3.1-fast-generate-preview');
      addToHistory({
        type: 'video',
        url: generatedVideoUrl,
        prompt: "Vídeo Kwai com Narração",
        aspectRatio: '9:16'
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro inesperado durante a geração do vídeo para Kwai.");
      setGeneratingVideoPrompt(false);
    } finally {
      setVideoLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  if (user.subscriptionStatus === 'expired') {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Clock className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Assinatura Expirada</h2>
            <p className="text-zinc-400 mt-2">
              Sua assinatura de 30 dias chegou ao fim.
            </p>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
            <p className="text-sm text-zinc-300">
              Sua conta está bloqueada aguardando reativação pelo administrador ou exclusão automática.
            </p>
          </div>
          <a 
            href="https://wa.me/5565992203318?text=Olá, minha assinatura expirou e gostaria de renovar."
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Solicitar Reativação
          </a>
          <button 
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="text-sm text-zinc-500 hover:text-white underline transition-colors"
          >
            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#050505] to-black text-white selection:bg-yellow-500/30 flex flex-col">
      <ApiKeyChecker onKeyValid={() => setApiKeyValid(true)} />
      
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                  <Zap className="w-5 h-5 text-black fill-current" />
               </div>
               <h1 className="text-xl font-bold tracking-tight text-white">
                 Conex<span className="text-yellow-500">TV</span>
               </h1>
            </div>
            
            <div className="hidden md:flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
              <button 
                onClick={() => setAppMode('images')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${appMode === 'images' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Imagens
              </button>
              <button 
                onClick={() => setAppMode('scripts')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${appMode === 'scripts' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Roteiros & Vídeos
              </button>
              <button 
                onClick={() => setAppMode('campaigns')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${appMode === 'campaigns' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Campanhas
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://conextv.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hidden md:flex items-center gap-2 text-xs font-bold text-black bg-yellow-500 hover:bg-yellow-400 px-4 py-2 rounded-full transition-colors shadow-lg shadow-yellow-500/20"
            >
              <Sparkles className="w-4 h-4" />
              ConexTV Brand Generator
            </a>
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              POWERED BY CONEXTV PRO
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <button 
                onClick={() => promptForApiKey()}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full transition-colors text-xs font-medium text-zinc-300"
                title="Alterar Chave API do Google Cloud"
              >
                <Key className="w-3 h-3 text-yellow-500" />
                Chave API
              </button>
              {user.planId === 'credits' && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                  <span className="text-xs font-bold text-yellow-500">{user.credits || 0} Créditos</span>
                </div>
              )}
              <button 
                onClick={() => navigate(user.role === 'admin' ? '/admin' : '/profile')}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-yellow-500 transition-colors"
                title={user.role === 'admin' ? "Painel Administrativo" : "Meu Perfil"}
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                  {user.email.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:block text-sm text-zinc-300">
                  {user.email}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto flex-grow w-full">
        {appMode === 'campaigns' ? (
          <WhatsAppCampaign history={history} />
        ) : appMode === 'scripts' ? (
          <ScriptGenerator apiKeyValid={apiKeyValid} setError={setError} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <Controls 
              prompt={prompt}
              setPrompt={setPrompt}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              resolution={resolution}
              setResolution={setResolution}
              imageType={imageType}
              setImageType={setImageType}
              outputFormat={outputFormat}
              setOutputFormat={setOutputFormat}
              transparentBackground={transparentBackground}
              setTransparentBackground={setTransparentBackground}
              onGenerate={handleGenerate}
              onGenerateImageKwai={handleGenerateImageKwai}
              onGenerateScript={handleGenerateScript}
              loading={loading}
              scriptLoading={scriptLoading}
            />
            
            <VoiceRecorder onAudioGenerated={(url) => console.log('Audio generated:', url)} />
            
            <div className="text-xs text-zinc-600 p-4 border border-dashed border-zinc-800 rounded-xl">
              <strong className="text-zinc-500 block mb-1">Dica Pro:</strong>
              Use terminologia de alto contraste como "iluminação cinematográfica", "8K" e "ray-traced" para obter os melhores efeitos metálicos. O modelo é otimizado para texturas de alta fidelidade.
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-8">
            <div className="sticky top-24 space-y-4">
               <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    Pré-visualização ao Vivo
                    {generationTime !== null && imageUrl && (
                      <span className="text-xs text-yellow-500 lowercase font-normal">
                        (gerada em {Math.floor(generationTime / 60)}m {generationTime % 60}s)
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-4">
                    {scriptResult && (
                      <span className="text-xs text-yellow-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"/>
                        Roteiro Pronto
                      </span>
                    )}
                    {imageUrl && (
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
                        Imagem Pronta
                      </span>
                    )}
                    {videoUrl && (
                      <span className="text-xs text-blue-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
                        Vídeo Pronto
                      </span>
                    )}
                  </div>
               </div>
               
               {scriptLoading ? (
                 <div className="w-full aspect-video bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-4">
                   <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                   <span className="text-sm text-zinc-400">Gerando roteiro profissional...</span>
                 </div>
               ) : scriptResult ? (
                 <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 overflow-y-auto max-h-[70vh] text-zinc-300 text-sm font-mono whitespace-pre-wrap shadow-2xl flex flex-col gap-4">
                   <div>{scriptResult}</div>
                   
                   <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-800">
                     <button
                       onClick={() => navigator.clipboard.writeText(scriptResult)}
                       className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                     >
                       Copiar Roteiro
                     </button>
                     <button
                       onClick={handleGenerateSceneVideos}
                       disabled={sceneVideos.length > 0 && sceneVideos.some(s => s.loading)}
                       className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-sm font-bold transition-colors shadow-lg shadow-yellow-500/20 disabled:opacity-50"
                     >
                       <Play className="w-4 h-4" />
                       Gerar Vídeos das Cenas
                     </button>
                   </div>

                   {sceneVideos.length > 0 && (
                     <div className="mt-6 space-y-4">
                       <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Cenas Geradas</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {sceneVideos.map((scene, idx) => (
                           <div key={idx} className="bg-black border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
                             <div className="p-3 bg-zinc-900 border-b border-zinc-800">
                               <span className="text-xs font-bold text-yellow-500">Cena {idx + 1}</span>
                               <p className="text-xs text-zinc-400 mt-1 line-clamp-2" title={scene.prompt}>{scene.prompt}</p>
                             </div>
                             <div className="relative aspect-[9/16] bg-zinc-900 flex items-center justify-center">
                               {scene.loading ? (
                                 <div className="flex flex-col items-center gap-2">
                                   <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                                   <span className="text-xs text-zinc-500">Gerando vídeo...</span>
                                 </div>
                               ) : scene.error ? (
                                 <div className="p-4 text-center text-xs text-red-400">
                                   {scene.error}
                                 </div>
                               ) : scene.url ? (
                                 <>
                                   <video src={scene.url} controls autoPlay loop className="w-full h-full object-cover" />
                                   <a 
                                     href={scene.url} 
                                     download={`cena-${idx + 1}-${Date.now()}.mp4`}
                                     className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors"
                                     title="Baixar Cena"
                                   >
                                     <Download className="w-4 h-4" />
                                   </a>
                                 </>
                               ) : null}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               ) : (
                 <ImageDisplay 
                   ref={imageDisplayRef}
                   imageUrl={imageUrl} 
                   loading={loading} 
                   error={error} 
                   outputFormat={outputFormat}
                   transparentBackground={transparentBackground}
                   aspectRatio={aspectRatio}
                   generationTime={generationTime}
                 />
               )}

               {imageUrl && !videoLoading && !scriptResult && (
                 <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Formato do Vídeo</label>
                      <div className="flex gap-2">
                        {['16:9', '9:16', '1:1', '4:3', '3:4'].map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setVideoAspectRatio(ratio as AspectRatio)}
                            className={`px-2 py-1 text-xs rounded border transition-all ${
                              videoAspectRatio === ratio 
                                ? 'bg-yellow-500 text-black border-yellow-500 font-bold' 
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Roteiro do Vídeo (Opcional)</label>
                        <div className="flex items-center gap-2">
                          {videoUrl && (
                            <button
                              onClick={handleGrabLastFrame}
                              disabled={generatingVideoPrompt || videoLoading}
                              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Pegar último frame para nova cena"
                            >
                              <Sparkles className="w-3 h-3" />
                              Continuar Cena
                            </button>
                          )}
                          <button
                            onClick={handleGenerateVideoKwai}
                            disabled={generatingVideoPrompt || videoLoading}
                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00] hover:bg-[#FF6B00]/20 border border-[#FF6B00]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Gerar Vídeo Kwai com IA"
                          >
                            {generatingVideoPrompt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Film className="w-3 h-3" />}
                            GERAR VÍDEO KWAI
                          </button>
                          <button
                            onClick={handleGenerateVideoPrompt}
                            disabled={generatingVideoPrompt || videoLoading}
                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Gerar prompt profissional com IA"
                          >
                            {generatingVideoPrompt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Gerar Prompt Profissional
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={videoScript}
                        onChange={(e) => setVideoScript(e.target.value)}
                        placeholder="Descreva como você quer a animação (ex: zoom lento, brilho intenso, partículas flutuando...) ou clique em 'Gerar Prompt Profissional' para a IA criar um para você."
                        rows={3}
                        className="w-full bg-zinc-900/50 border border-zinc-700 text-zinc-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all resize-none"
                      />
                   </div>

                   <button 
                     onClick={handleGenerateVideo}
                     className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all group"
                   >
                     <Play className="w-4 h-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                     Gerar Intro Animada (5s)
                   </button>
                 </div>
               )}

               {videoLoading && (
                 <div className="w-full py-8 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-3">
                   <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                   <span className="text-sm text-zinc-400">Gerando intro de vídeo... isso pode levar um minuto</span>
                 </div>
               )}

               {videoUrl && (
                 <div className="mt-4 space-y-4">
                   <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    VÍDEO GERADO
                    {videoGenerationTime !== null && videoUrl && (
                      <span className="text-xs text-blue-500 lowercase font-normal">
                        (gerado em {Math.floor(videoGenerationTime / 60)}m {videoGenerationTime % 60}s)
                      </span>
                    )}
                  </h3>
                   <div className={`group relative w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black ${
                     videoAspectRatio === '1:1' ? 'aspect-square' : 
                     videoAspectRatio === '16:9' ? 'aspect-video' : 
                     videoAspectRatio === '9:16' ? 'aspect-[9/16] max-h-[70vh] mx-auto' : 
                     videoAspectRatio === '4:3' ? 'aspect-[4/3]' : 
                     videoAspectRatio === '3:4' ? 'aspect-[3/4] max-h-[70vh] mx-auto' : 'aspect-video'
                   }`}>
                     {/* Background Blur for nicer framing */}
                     <div 
                       className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110"
                       style={{ backgroundImage: `url(${imageUrl})` }} 
                     />
                     
                     <div className="relative z-10 w-full h-full flex items-center justify-center">
                       <video 
                         src={videoUrl} 
                         controls 
                         autoPlay 
                         loop 
                         className="w-full h-full object-contain relative z-10"
                       />
                     </div>

                     {user?.planId === 'basic' && (
                        <div className="absolute inset-0 z-20 pointer-events-none grid grid-cols-2 md:grid-cols-3 grid-rows-3 gap-4 p-4 overflow-hidden">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-center">
                              <span className="text-white/20 text-xl md:text-3xl font-bold uppercase tracking-widest -rotate-12 select-none whitespace-nowrap">
                                ConexTV Pro
                              </span>
                            </div>
                          ))}
                        </div>
                     )}

                     {/* Sticky Download Button - Always Visible */}
                     <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const text = encodeURIComponent(`Confira o vídeo que eu gerei na ConexTV!`);
                            window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors shadow-lg shadow-black/50"
                          title="Compartilhar no WhatsApp"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Compartilhar
                        </button>
                        <a 
                          href={videoUrl} 
                          download={`conextv-intro-${Date.now()}.mp4`}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors shadow-lg shadow-black/50"
                        >
                          <Download className="w-4 h-4" />
                          Baixar Vídeo
                        </a>
                     </div>
                   </div>
                 </div>
               )}
               
               {/* Technical Specs Footer beneath image */}
               <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="glass-panel p-4 rounded-lg flex flex-col items-center justify-center text-center">
                     <span className="text-zinc-500 text-xs uppercase mb-1">Modelo</span>
                     <span className="text-zinc-200 font-mono text-sm">ConexTV Pro Gerador</span>
                  </div>
                  <div className="glass-panel p-4 rounded-lg flex flex-col items-center justify-center text-center">
                     <span className="text-zinc-500 text-xs uppercase mb-1">Resolução</span>
                     <span className="text-zinc-200 font-mono text-sm">{resolution} / 720p</span>
                  </div>
                  <div className="glass-panel p-4 rounded-lg flex flex-col items-center justify-center text-center">
                     <span className="text-zinc-500 text-xs uppercase mb-1">Processamento</span>
                     <span className="text-zinc-200 font-mono text-sm">Deep Ray-Tracing</span>
                  </div>
               </div>
            </div>
          </div>
          </div>
        )}

        {/* History Section */}
          {history.length > 0 && (
            <div className="lg:col-span-12 mt-8 border-t border-white/5 pt-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-zinc-400" />
                  <h2 className="text-lg font-semibold text-white">Histórico de Geração</h2>
                </div>
                <button 
                  onClick={clearHistory}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpar Histórico
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {history.map((item) => (
                  <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
                    {item.type === 'image' ? (
                      <img src={item.url} alt="History" className="w-full h-full object-cover" />
                    ) : (
                      <video src={item.url} className="w-full h-full object-cover" />
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 bg-black/50 px-2 py-1 rounded-full">
                        {item.type === 'video' ? 'Vídeo' : 'Imagem'}
                      </span>
                      <div className="flex gap-2">
                        <a 
                          href={item.url} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 hover:scale-110 transition-all"
                          title="Visualizar"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </a>
                        <a 
                          href={item.url} 
                          download={`conextv-${item.type}-${item.timestamp}.${item.type === 'video' ? 'mp4' : 'png'}`}
                          className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"
                          title="Baixar"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {item.type === 'image' && (
                          <button
                            onClick={() => {
                              setImageUrl(item.url);
                              setPrompt(item.prompt);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-2 bg-yellow-500 text-black rounded-full hover:bg-yellow-400 hover:scale-110 transition-all"
                            title="Criar Vídeo a partir desta Imagem"
                          >
                            <Film className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-center">
                         <p className="text-[10px] text-zinc-400 truncate w-full">{new Date(item.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Section */}
          <div className="lg:col-span-12 mt-12 border-t border-white/5 pt-12">
            <Features />
          </div>

          {/* FAQ Section */}
          <div className="lg:col-span-12 mt-12 border-t border-white/5 pt-12">
            <FAQ />
          </div>

      </main>

      <footer className="w-full border-t border-white/5 bg-black/50 backdrop-blur-xl py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-zinc-500 text-sm">
            &copy; 2026 <span className="font-bold text-zinc-300">ConexTV.</span> Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Generator;
