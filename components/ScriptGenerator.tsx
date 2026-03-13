import React, { useState } from 'react';
import { Loader2, Wand2, Play, Download, Sparkles } from 'lucide-react';
import { generateScript, generateVideoFromText } from '../services/geminiService';

interface ScriptGeneratorProps {
  apiKeyValid: boolean;
  setError: (error: string | null) => void;
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ apiKeyValid, setError }) => {
  const [scriptTopic, setScriptTopic] = useState('');
  const [scriptPlatform, setScriptPlatform] = useState('Reels/TikTok');
  const [scriptDuration, setScriptDuration] = useState('6 a 8 segundos');
  const [scriptObjective, setScriptObjective] = useState('Conversão / Venda');
  
  const [scriptResult, setScriptResult] = useState<string | null>(null);
  const [scriptLoading, setScriptLoading] = useState<boolean>(false);
  const [sceneVideos, setSceneVideos] = useState<{ prompt: string; url?: string; loading: boolean; error?: string }[]>([]);

  const handleGenerateScript = async () => {
    if (!apiKeyValid) {
      setError("Verificação da chave API necessária.");
      return;
    }

    setScriptLoading(true);
    setError(null);
    setScriptResult(null);
    setSceneVideos([]);

    try {
      const script = await generateScript(scriptTopic, scriptPlatform, scriptDuration, scriptObjective);
      setScriptResult(script);
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

    const regex = /vell3 prompt[^:]*:\s*\*?\*?\s*([^\n]+)/gi;
    const prompts: string[] = [];
    let match;
    while ((match = regex.exec(scriptResult)) !== null) {
      const promptText = match[1].replace(/\*+$/, '').trim();
      if (promptText) {
        prompts.push(promptText);
      }
    }

    if (prompts.length === 0) {
      setError("Nenhum 'vell3 prompt' encontrado no roteiro. Tente gerar o roteiro novamente.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const initialScenes = prompts.map(p => ({ prompt: p, loading: true }));
    setSceneVideos(initialScenes);

    for (let i = 0; i < prompts.length; i++) {
      try {
        const url = await generateVideoFromText(prompts[i], '9:16');
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      {/* Left Column: Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Gerador de Roteiros</h2>
              <p className="text-xs text-zinc-400">Crie scripts virais e de conversão</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1 block">Tópico / Produto</label>
              <input 
                type="text"
                value={scriptTopic}
                onChange={(e) => setScriptTopic(e.target.value)}
                placeholder="Ex: IPTV, Curso de Inglês, Tênis..."
                className="w-full bg-zinc-900/80 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00]/50 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1 block">Plataforma</label>
              <select
                value={scriptPlatform}
                onChange={(e) => setScriptPlatform(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00]/50 outline-none transition-all"
              >
                <option value="Reels/TikTok">Reels / TikTok / Shorts</option>
                <option value="YouTube">YouTube (Longo)</option>
                <option value="Vídeo de Vendas (VSL)">Vídeo de Vendas (VSL)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1 block">Duração</label>
                <select
                  value={scriptDuration}
                  onChange={(e) => setScriptDuration(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00]/50 outline-none transition-all"
                >
                  <option value="6 a 8 segundos">6 a 8 segundos</option>
                  <option value="9 a 30 segundos">9 a 30 segundos</option>
                  <option value="31 a 90 segundos">31 a 90 segundos</option>
                  <option value="Mais de 2 minutos">Mais de 2 minutos</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1 block">Objetivo</label>
                <select
                  value={scriptObjective}
                  onChange={(e) => setScriptObjective(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00]/50 outline-none transition-all"
                >
                  <option value="Conversão / Venda">Conversão / Venda</option>
                  <option value="Viral / Engajamento">Viral / Engajamento</option>
                  <option value="Autoridade / Educação">Autoridade / Educação</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleGenerateScript}
              disabled={scriptLoading || !scriptTopic.trim()}
              className="w-full py-4 bg-[#FF6B00] hover:bg-[#FF8533] text-black rounded-xl text-lg font-bold transition-all shadow-xl hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scriptLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              GERAR ROTEIRO
            </button>
          </div>
        </div>
        
        <div className="text-xs text-zinc-600 p-4 border border-dashed border-zinc-800 rounded-xl">
          <strong className="text-zinc-500 block mb-1">Dica Pro:</strong>
          Seja específico no tópico. Em vez de "Tênis", use "Tênis de corrida para maratona com amortecimento extra". Isso gera roteiros muito mais persuasivos.
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="glass-panel rounded-2xl p-6 lg:p-8 min-h-[500px] flex flex-col relative overflow-hidden border border-white/5 shadow-2xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF6B00]/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Estúdio de Criação</h2>
                <p className="text-sm text-zinc-500 font-medium">Roteiro e Cenas em Vídeo</p>
              </div>
            </div>
            
            {scriptResult && (
              <span className="text-xs text-yellow-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"/>
                Roteiro Pronto
              </span>
            )}
          </div>

          <div className="flex-grow flex flex-col relative z-10">
            {scriptLoading ? (
              <div className="flex-grow flex flex-col items-center justify-center gap-6 text-zinc-400">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-zinc-800 border-t-[#FF6B00] rounded-full animate-spin shadow-[0_0_30px_rgba(255,107,0,0.2)]" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-lg font-bold text-white tracking-wide animate-pulse">Gerando Roteiro...</p>
                  <p className="text-sm text-zinc-500">Criando estrutura persuasiva e cenas</p>
                </div>
              </div>
            ) : scriptResult ? (
              <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 overflow-y-auto max-h-[70vh] text-zinc-300 text-sm font-mono whitespace-pre-wrap shadow-2xl flex flex-col gap-4">
                <div>{scriptResult}</div>
                
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-zinc-800">
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
              <div className="flex-grow flex flex-col items-center justify-center text-zinc-500">
                <Wand2 className="w-12 h-12 mb-4 opacity-20" />
                <p>Preencha os dados ao lado e clique em Gerar Roteiro</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;
