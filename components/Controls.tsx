import React, { useState } from 'react';
import { AspectRatio, ImageResolution } from '../types';
import { Settings2, Wand2, Sparkles, Loader2, ArrowRight, CalendarDays, DownloadCloud, Search, Film, Tv, Trophy, Megaphone, FileText } from 'lucide-react';
import { enhanceImagePrompt, cinematicEnhancePrompt, generateImage } from '../services/geminiService';

interface ControlsProps {
  prompt: string;
  setPrompt: (p: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  resolution: ImageResolution;
  setResolution: (res: ImageResolution) => void;
  imageType: 'logo' | 'background';
  setImageType: (type: 'logo' | 'background') => void;
  outputFormat: 'PNG' | 'JPEG';
  setOutputFormat: (format: 'PNG' | 'JPEG') => void;
  transparentBackground: boolean;
  setTransparentBackground: (transparent: boolean) => void;
  onGenerate: () => void;
  onGenerateImageKwai?: () => void;
  onGenerateScript?: (topic: string, platform: string, duration: string, objective: string) => void;
  loading: boolean;
  scriptLoading?: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  prompt,
  setPrompt,
  aspectRatio,
  setAspectRatio,
  resolution,
  setResolution,
  imageType,
  setImageType,
  outputFormat,
  setOutputFormat,
  transparentBackground,
  setTransparentBackground,
  onGenerate,
  onGenerateImageKwai,
  onGenerateScript,
  loading,
  scriptLoading = false
}) => {
  const [enhancing, setEnhancing] = useState(false);
  const [cinematicEnhancing, setCinematicEnhancing] = useState(false);
  const [importingGames, setImportingGames] = useState(false);
  const [gameBatches, setGameBatches] = useState<any[][]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [onlyBrazilianGames, setOnlyBrazilianGames] = useState(true);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // TMDB State
  const [activeTab, setActiveTab] = useState<'sports' | 'movies' | 'marketing'>('sports');
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('cinematic');

  // Marketing State
  const [brandName, setBrandName] = useState('GHTV SERVICES');
  const [planPrice, setPlanPrice] = useState('25,00');
  const [whatsapp, setWhatsapp] = useState('(11) 99999-9999');

  const getFormattedDate = () => {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    let formatted = formatter.format(date).toUpperCase();
    // "SEXTA-FEIRA, 14 DE FEVEREIRO" -> "SEXTA - 14 DE FEVEREIRO"
    formatted = formatted.replace('-FEIRA', '');
    formatted = formatted.replace(',', ' -');
    return formatted;
  };

  const getPromptForBatch = (batch: any[]) => {
    const dateText = getFormattedDate();
    const firstTeam = batch[0]?.time1 || "Bologna FC";

    let matchCardsText = "";
    batch.forEach((game: any, index: number) => {
      const channelName = game.canais && game.canais.length > 0 ? game.canais[0].nome : "TV";
      matchCardsText += `
${index + 1}️⃣
${game.competicao} league logo
${game.time1} logo vs ${game.time2} logo
Text: ${game.time1.toUpperCase()} X ${game.time2.toUpperCase()}
Time: ${game.horario}
Channel: ${channelName}
`;
    });

    return `A highly detailed professional football schedule poster designed for social media in a sports broadcast graphic style, square format.

Background: blurred football stadium crowd atmosphere with dark gradient overlay and subtle sports lighting, creating a dramatic television broadcast feel.

At the top center large bold white typography reads:

PRINCIPAIS
JOGOS DO DIA

Below it a rounded white rectangle banner with black text:

${dateText}

The left side of the layout displays five horizontal match cards, each with rounded corners and soft shadows.

Each match card contains:

• League logo on the far left
• Team logos facing each other with a “VS” between them
• Match title text above the time
• Time displayed inside a dark rounded rectangle
• TV broadcast channel logo on the right

Match cards content:
${matchCardsText}
Right side of the poster features a professional football player portrait wearing a ${firstTeam} jersey, arms crossed, neutral expression, studio lighting, highly realistic skin texture.

IMPORTANT:
The CINE HUB BR logo that originally appears on the right side must be completely removed, leaving clean space in that area while maintaining the same layout balance.

At the bottom of the poster there is a horizontal strip with multiple small streaming platform icons (DAZN, Prime Video, ESPN, Paramount+, Star+, Apple TV, etc.) arranged in a colorful row.

Below that a dark banner section with text:

DISPONÍVEL NAS LOJAS OFICIAIS

Followed by platform logos:

Samsung
LG
Android TV
Roku
Cloud

On the right side of this bottom section a call to action reads:

BAIXE NOSSO APLICATIVO

Design style:

• modern sports broadcast graphics
• ultra sharp typography
• realistic club logos
• subtle shadows
• glassmorphism match cards
• professional football media layout
• high contrast
• studio lighting on player
• social media poster quality

ultra detailed, 4K sports graphic design, ESPN broadcast style layout, modern sports infographic.`;
  };

  const generatePromptForBatch = (batch: any[]) => {
    const newPrompt = getPromptForBatch(batch);
    setPrompt(newPrompt);
    setAspectRatio('1:1');
    setImageType('background');
  };

  const handleImportGames = async () => {
    setImportingGames(true);
    try {
      const response = await fetch('/api/proxy/games');
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        alert("Nenhum jogo encontrado para hoje.");
        return;
      }

      // Filter only Brazilian competitions
      const isBrazilianCompetition = (competicao: string) => {
        if (!competicao) return false;
        const comp = competicao.toLowerCase();
        const brazilianKeywords = [
          'brasil', 'brasileiro', 'brasileirão', 'série a', 'série b', 'série c', 'série d',
          'paulista', 'carioca', 'mineiro', 'gaúcho', 'baiano', 'pernambucano',
          'cearense', 'paranaense', 'catarinense', 'goiano', 'nordeste', 'copinha',
          'supercopa', 'estadual', 'capixaba', 'paraense', 'potiguar', 'alagoano',
          'sergipano', 'mato-grossense', 'sul-mato-grossense', 'brasiliense',
          'amazonense', 'piauiense', 'maranhense', 'paraibano', 'rondoniense',
          'tocantinense', 'acreano', 'amapaense', 'roraimense', 'verde'
        ];
        return brazilianKeywords.some(keyword => comp.includes(keyword));
      };

      let filteredGames = data;
      if (onlyBrazilianGames) {
        filteredGames = data.filter((g: any) => isBrazilianCompetition(g.competicao));
        if (filteredGames.length === 0) {
          alert("Nenhum jogo de campeonato brasileiro encontrado para hoje.\n\nDesmarque a opção 'Apenas jogos do Brasil' para importar jogos internacionais.");
          return;
        }
      }

      // Sort: Destaque first
      const sortedGames = [
        ...filteredGames.filter((g: any) => g.status === 'Destaque'),
        ...filteredGames.filter((g: any) => g.status !== 'Destaque')
      ];

      // Chunk into 5s
      const chunks = [];
      for (let i = 0; i < sortedGames.length; i += 5) {
        chunks.push(sortedGames.slice(i, i + 5));
      }

      setGameBatches(chunks);
      setActiveBatchIndex(0);
      generatePromptForBatch(chunks[0]);
    } catch (error) {
      console.error("Failed to import games:", error);
      alert("Falha ao importar jogos. Tente novamente.");
    } finally {
      setImportingGames(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try {
      const enhanced = await enhanceImagePrompt(prompt);
      setPrompt(enhanced);
    } catch (error) {
      console.error("Failed to enhance prompt:", error);
      alert("Falha ao melhorar o prompt. Tente novamente.");
    } finally {
      setEnhancing(false);
    }
  };

  const handleCinematicEnhance = async () => {
    if (!prompt.trim()) return;
    setCinematicEnhancing(true);
    try {
      const enhanced = await cinematicEnhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (error) {
      console.error("Failed to enhance cinematic prompt:", error);
      alert("Falha ao melhorar o prompt cinematográfico. Tente novamente.");
    } finally {
      setCinematicEnhancing(false);
    }
  };

  const handleDownloadAllBatches = async () => {
    if (gameBatches.length === 0) return;
    
    // Check API key before starting
    const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert("Chave API não encontrada. Por favor, selecione um projeto ou configure a chave.");
      return;
    }

    setDownloadingAll(true);
    
    try {
      for (let i = 0; i < gameBatches.length; i++) {
        const batch = gameBatches[i];
        const promptForBatch = getPromptForBatch(batch);
        
        // Update UI to show progress
        setActiveBatchIndex(i);
        setPrompt(promptForBatch);
        
        try {
          // Generate the image
          const imageUrl = await generateImage(promptForBatch, '1:1', resolution);
          
          // Download the image
          const link = document.createElement('a');
          link.href = imageUrl;
          link.download = `conextv-sports-banner-batch-${i + 1}-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Small delay to prevent rate limiting issues if any
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
          console.error(`Failed to generate batch ${i + 1}:`, err);
          alert(`Falha ao gerar o banner ${i + 1}. A geração continuará para os próximos.`);
        }
      }
      alert("Geração e download de todos os banners concluídos!");
    } finally {
      setDownloadingAll(false);
    }
  };

  const searchTmdb = async () => {
    if (!tmdbQuery.trim()) return;
    setIsSearchingTmdb(true);
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=9ae9713b2292d6e130bb9e4c44db58e6&language=pt-BR&query=${encodeURIComponent(tmdbQuery)}`);
      const data = await res.json();
      setTmdbResults(data.results.filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 4));
    } catch (e) {
      console.error(e);
      alert("Erro ao buscar no TMDB.");
    } finally {
      setIsSearchingTmdb(false);
    }
  };

  const handleSelectMovie = (movie: any, style: string = selectedStyle) => {
    setSelectedMovie(movie);
    setSelectedStyle(style);
    
    const title = movie.title || movie.name;
    const overview = movie.overview || '';
    const type = movie.media_type === 'tv' ? 'Série' : 'Filme';

    let stylePrompt = '';
    switch (style) {
      case 'cinematic':
        stylePrompt = 'Pôster de filme épico e cinemático, iluminação dramática de estúdio, altamente detalhado, resolução 8k, fotorrealista, obra-prima. Atmosfera sombria e imersiva.';
        break;
      case 'neon':
        stylePrompt = 'Estilo cyberpunk vibrante com luzes neon, alto contraste, estética futurista, cores synthwave (magenta, ciano, roxo profundo).';
        break;
      case 'minimalist':
        stylePrompt = 'Design minimalista premium, composição limpa, muito espaço negativo, tipografia elegante, gradientes sutis, estilo editorial moderno.';
        break;
      case 'anime':
        stylePrompt = 'Estilo de ilustração de anime de alta qualidade, estética Studio Ghibli ou Makoto Shinkai, cores vibrantes, fundo detalhado e bonito, obra-prima 2D.';
        break;
    }

    const newPrompt = `A modern IPTV streaming advertisement poster in Portuguese, vertical layout, cinematic marketing design.
Dark purple and blue gradient background with a blurred collage of streaming platform thumbnails in the background (movies, series, sports and TV content).

Top center logo area with a glowing glitch-style tech logo text that says "${brandName}", digital distortion effect, neon blue and white glow.

Below the logo, a very large bold headline in Portuguese:

"TENHA TODAS AS PLATAFORMAS DE STREAMING"

Huge white bold typography, centered, modern sans-serif, strong contrast.

Under the headline, a horizontal row of streaming platform style icons (generic streaming platform icons similar to Netflix, Prime Video, HBO Max, Disney+, Globoplay, Star+), aligned in a dark rectangular strip.

Subheadline text below:

"Filmes, Séries, Canais ao VIVO, Animes e muito mais em um só lugar!"

White clean typography.

Left side decorative cinematic elements:
popcorn flying
popcorn bucket
soda cup
movie film reel

Center content block with yellow highlight bullet points:
+ DE 2 MIL CANAIS DE TV
+ DE 14 MIL FILMES
+ DE 5 MIL SÉRIES
Bold yellow typography.

Bottom pricing section:
"Plano Mensal"
Very large price typography:
"R$ ${planPrice}"

Right side device mockups:
smartphone, tablet and smart TV showing streaming interface.

Feature text near devices:
"CANAIS EM 4K, HD e FullHD
Assista direto do seu celular, TV, Notebook, TV Box e muito mais."

Bottom call to action:
"ASSINE JÁ"
WhatsApp icon and phone number: "${whatsapp}"

Background color palette:
deep purple, indigo blue, neon highlights.

Lighting:
cinematic glow, modern marketing lighting.

Texture:
smooth digital gradients, modern streaming service aesthetic.

Ultra sharp commercial poster, modern digital marketing banner, professional ad layout.
[CRITICAL: Keep all text and important elements strictly in the center safe zone, leaving large empty margins around the edges to prevent cropping.]

[INFORMAÇÕES ADICIONAIS DO FILME/SÉRIE SELECIONADO:
Título: ${title}
Tipo: ${type}
Sinopse: ${overview ? overview.substring(0, 200) + '...' : ''}
Estilo Visual Desejado: ${stylePrompt}
(Incorpore sutilmente elementos deste filme/série no fundo ou nos mockups de tela, mantendo a estrutura principal do banner de marketing intacta)]`;

    setPrompt(newPrompt);
    setAspectRatio('1138:1280');
    setImageType('background');
    setTmdbResults([]); // Clear results after selection
  };

  const handleGenerateMarketingPrompt = () => {
    const newPrompt = `A modern IPTV streaming advertisement poster in Portuguese, vertical layout, cinematic marketing design.
Dark purple and blue gradient background with a blurred collage of streaming platform thumbnails in the background (movies, series, sports and TV content).

Top center logo area with a glowing glitch-style tech logo text that says "${brandName}", digital distortion effect, neon blue and white glow.

Below the logo, a very large bold headline in Portuguese:

"TENHA TODAS AS PLATAFORMAS DE STREAMING"

Huge white bold typography, centered, modern sans-serif, strong contrast.

Under the headline, a horizontal row of streaming platform style icons (generic streaming platform icons similar to Netflix, Prime Video, HBO Max, Disney+, Globoplay, Star+), aligned in a dark rectangular strip.

Subheadline text below:

"Filmes, Séries, Canais ao VIVO, Animes e muito mais em um só lugar!"

White clean typography.

Left side decorative cinematic elements:
popcorn flying
popcorn bucket
soda cup
movie film reel

Center content block with yellow highlight bullet points:
+ DE 2 MIL CANAIS DE TV
+ DE 14 MIL FILMES
+ DE 5 MIL SÉRIES
Bold yellow typography.

Bottom pricing section:
"Plano Mensal"
Very large price typography:
"R$ ${planPrice}"

Right side device mockups:
smartphone, tablet and smart TV showing streaming interface.

Feature text near devices:
"CANAIS EM 4K, HD e FullHD
Assista direto do seu celular, TV, Notebook, TV Box e muito mais."

Bottom call to action:
"ASSINE JÁ"
WhatsApp icon and phone number: "${whatsapp}"

Background color palette:
deep purple, indigo blue, neon highlights.

Lighting:
cinematic glow, modern marketing lighting.

Texture:
smooth digital gradients, modern streaming service aesthetic.

Ultra sharp commercial poster, modern digital marketing banner, professional ad layout.
[CRITICAL: Keep all text and important elements strictly in the center safe zone, leaving large empty margins around the edges to prevent cropping.]`;

    setPrompt(newPrompt);
    setAspectRatio('1138:1280');
    setImageType('background');
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex p-1 bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('sports')}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'sports' ? 'bg-[#FF6B00] text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
        >
          <Trophy className="w-4 h-4" />
          Esportes
        </button>
        <button
          onClick={() => setActiveTab('movies')}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'movies' ? 'bg-[#FF6B00] text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
        >
          <Film className="w-4 h-4" />
          Filmes
        </button>
        <button
          onClick={() => setActiveTab('marketing')}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'marketing' ? 'bg-[#FF6B00] text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
        >
          <Megaphone className="w-4 h-4" />
          Marketing
        </button>
      </div>

      <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-zinc-100 font-medium pb-2 border-b border-white/5">
          <Settings2 className="w-4 h-4 text-yellow-500" />
          <h3>Configuração de Geração</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Tipo de Arte</label>
            <select
              value={imageType}
              onChange={(e) => setImageType(e.target.value as 'logo' | 'background')}
              disabled={loading}
              className="w-full bg-zinc-900/50 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all"
            >
              <option value="logo">Logotipo / Escudo</option>
              <option value="background">Apenas Fundo (Sem Logo)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Proporção</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              disabled={loading}
              className="w-full bg-zinc-900/50 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all"
            >
              <option value="1:1">Quadrado (1:1)</option>
              <option value="16:9">Cinemático (16:9)</option>
              <option value="9:16">Mobile (9:16)</option>
              <option value="3:4">Retrato (3:4)</option>
              <option value="4:3">Padrão (4:3)</option>
              <option value="4:1">Banner Largo (4:1)</option>
              <option value="8:1">Banner Ultra Largo (8:1)</option>
              <option value="1:4">Vertical Largo (1:4)</option>
              <option value="1:8">Vertical Ultra Largo (1:8)</option>
              <option value="1138:1280">Banner Futebol (1138x1280)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Resolução</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value as ImageResolution)}
              disabled={loading}
              className="w-full bg-zinc-900/50 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all"
            >
              <option value="1K">1K Padrão</option>
              <option value="2K">2K Alta Definição</option>
              <option value="4K">4K Ultra HD</option>
              <option value="8K">8K (7680x4320)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex flex-col gap-3 text-zinc-100 font-medium pb-3 border-b border-white/5">
           <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-yellow-500" />
              <h3>Detalhes do Prompt</h3>
           </div>
           <div className="flex flex-wrap items-center gap-2">
             {activeTab === 'sports' && (
               <>
                 <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer mr-2">
                   <input 
                     type="checkbox" 
                     checked={onlyBrazilianGames}
                     onChange={(e) => setOnlyBrazilianGames(e.target.checked)}
                     className="rounded border-zinc-700 bg-zinc-900/50 text-blue-500 focus:ring-blue-500/50"
                   />
                   Apenas Brasileiros
                 </label>
                 <button
                   onClick={handleImportGames}
                   disabled={loading || importingGames}
                   className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   title="Importar jogos do dia via API"
                 >
                   {importingGames ? <Loader2 className="w-3 h-3 animate-spin" /> : <CalendarDays className="w-3 h-3" />}
                   Importar Jogos
                 </button>
               </>
             )}
             <button
               onClick={handleEnhancePrompt}
               disabled={loading || enhancing || cinematicEnhancing || !prompt.trim()}
               className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               title="Melhorar prompt com IA"
             >
               {enhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
               Otimizar Prompt
             </button>
             <button
               onClick={handleCinematicEnhance}
               disabled={loading || enhancing || cinematicEnhancing || !prompt.trim()}
               className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border border-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               title="Agente Cinematográfico"
             >
               {cinematicEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Film className="w-3 h-3" />}
               Agente Cinematográfico
             </button>
           </div>
        </div>
        
        {activeTab === 'movies' && (
          <div className="space-y-4 pt-2 pb-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text"
                  value={tmdbQuery}
                  onChange={(e) => setTmdbQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchTmdb()}
                  placeholder="Buscar filme, série ou anime..."
                  className="w-full bg-zinc-900/80 border border-zinc-700 text-zinc-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00]/50 outline-none transition-all"
                />
              </div>
              <button 
                onClick={searchTmdb}
                disabled={isSearchingTmdb || !tmdbQuery.trim()}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSearchingTmdb ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
              </button>
            </div>

            {tmdbResults.length > 0 && (
              <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg overflow-hidden">
                {tmdbResults.map((movie) => (
                  <div 
                    key={movie.id}
                    onClick={() => handleSelectMovie(movie)}
                    className="flex items-center gap-3 p-3 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800 last:border-0 transition-colors"
                  >
                    {movie.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt={movie.title || movie.name} className="w-10 h-14 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-14 bg-zinc-800 rounded flex items-center justify-center">
                        <Film className="w-5 h-5 text-zinc-600" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white">{movie.title || movie.name}</h4>
                      <p className="text-xs text-zinc-400">
                        {movie.media_type === 'tv' ? 'Série' : 'Filme'} • {movie.release_date?.substring(0, 4) || movie.first_air_date?.substring(0, 4) || 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedMovie && (
              <div className="space-y-2 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    Selecionado: {selectedMovie.title || selectedMovie.name}
                  </span>
                </div>
                <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Estilo Visual do Banner</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cinematic', label: 'Cinemático Épico' },
                    { id: 'neon', label: 'Neon Cyberpunk' },
                    { id: 'minimalist', label: 'Minimalista Premium' },
                    { id: 'anime', label: 'Ilustração Anime' }
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => handleSelectMovie(selectedMovie, style.id)}
                      className={`py-2 px-3 text-xs font-medium rounded-lg transition-all text-left ${
                        selectedStyle === style.id 
                          ? 'bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/50' 
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="space-y-4 pt-2 pb-2">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1 block">Nome da Marca / Logo</label>
                <input 
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ex: GHTV SERVICES"
                  className="w-full bg-zinc-900/80 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00]/50 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1 block">Preço do Plano (R$)</label>
                  <input 
                    type="text"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    placeholder="Ex: 25,00"
                    className="w-full bg-zinc-900/80 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00]/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1 block">WhatsApp</label>
                  <input 
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full bg-zinc-900/80 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00]/50 outline-none transition-all"
                  />
                </div>
              </div>
              <button
                onClick={handleGenerateMarketingPrompt}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <Wand2 className="w-4 h-4 text-yellow-500" />
                Gerar Prompt de Marketing
              </button>
            </div>
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className="space-y-4 pt-2 pb-2">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1 block">Tópico / Produto</label>
                <input 
                  type="text"
                  value={scriptTopic}
                  onChange={(e) => setScriptTopic(e.target.value)}
                  placeholder="Ex: IPTV, Curso de Inglês, Tênis de Corrida..."
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
                onClick={() => onGenerateScript && onGenerateScript(scriptTopic, scriptPlatform, scriptDuration, scriptObjective)}
                disabled={scriptLoading || !scriptTopic.trim()}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {scriptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-yellow-500" />}
                Gerar Roteiro Profissional
              </button>
            </div>
          </div>
        )}

        {activeTab === 'sports' && gameBatches.length > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-2">
            <div className="flex flex-wrap gap-2">
              {gameBatches.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveBatchIndex(index);
                    generatePromptForBatch(gameBatches[index]);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeBatchIndex === index 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Banner {String(index + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
            <button
              onClick={handleDownloadAllBatches}
              disabled={downloadingAll || loading}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Baixar todos os banners"
            >
              {downloadingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <DownloadCloud className="w-3 h-3" />}
              Baixar Todos
            </button>
          </div>
        )}

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          rows={6}
          className="w-full bg-zinc-900/50 border border-zinc-700 text-zinc-300 rounded-lg p-4 text-sm focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all custom-scrollbar resize-none leading-relaxed"
          placeholder="Descreva seu logotipo premium..."
        />
        
        <div className="space-y-4 pt-2">
          {/* Formato de Saída */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Formato de Saída</label>
            <div className="flex bg-[#1A1A1A] rounded-xl p-1 border border-white/5">
              <button
                onClick={() => setOutputFormat('PNG')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${outputFormat === 'PNG' ? 'bg-[#2A2A2A] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                PNG
              </button>
              <button
                onClick={() => setOutputFormat('JPEG')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${outputFormat === 'JPEG' ? 'bg-[#2A2A2A] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                JPEG
              </button>
            </div>
          </div>

          {/* Fundo Transparente Toggle */}
          <div 
            className="flex items-center justify-between bg-[#1A1A1A] border border-white/5 rounded-xl p-4 cursor-pointer hover:bg-[#222] transition-colors"
            onClick={() => setTransparentBackground(!transparentBackground)}
          >
            <div>
              <h4 className="text-white font-bold text-sm tracking-wide">FUNDO TRANSPARENTE</h4>
              <p className="text-zinc-500 text-xs mt-0.5">Gera imagem sem fundo (ideal para banners)</p>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${transparentBackground ? 'bg-[#FF6B00]' : 'bg-zinc-700'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${transparentBackground ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={onGenerate}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide shadow-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 mt-4
              ${loading 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' 
                : 'bg-[#FF6B00] hover:bg-[#FF8533] text-black hover:shadow-[0_0_20px_rgba(255,107,0,0.3)]'
              }`}
          >
            {loading ? (
               <>Processando...</>
            ) : (
               <>
                 GERAR IMAGEM IA
                 <ArrowRight className="w-5 h-5" />
               </>
            )}
          </button>

          {/* Kwai Button */}
          {onGenerateImageKwai && (
            <button
              onClick={onGenerateImageKwai}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide shadow-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 mt-2 border
                ${loading 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-700' 
                  : 'bg-transparent hover:bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/50 hover:border-[#FF6B00]'
                }`}
            >
              <Film className="w-4 h-4" />
              GERAR IMAGEM KWAI
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Controls;