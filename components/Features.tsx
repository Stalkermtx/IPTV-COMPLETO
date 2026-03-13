import React from 'react';
import { Zap, Star, Sparkles, LayoutTemplate, Presentation, Image as ImageIcon, Palette, ShoppingBag, Gamepad2, Check } from 'lucide-react';

const Features: React.FC = () => {
  return (
    <div className="space-y-24 py-12">
      
      {/* Section 1: Choose Your AI Image Editor */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Escolha Seu Editor de Imagem IA</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Selecione o modelo de IA perfeito para o seu fluxo de trabalho criativo. Cada modelo oferece pontos fortes únicos para diferentes tarefas de edição de imagem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Nano Banana Card */}
          <div className="bg-[#1a1500] border border-yellow-900/30 rounded-2xl p-8 flex flex-col space-y-6 hover:border-yellow-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-black fill-current" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Editor de Imagem IA Nano Banana</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Edição de imagem com IA ultra-rápida e qualidade excepcional. Perfeito para iterações rápidas e criação de conteúdo em grande volume.
              </p>
            </div>
            <ul className="space-y-3 pt-4">
              {[
                'Velocidade de geração ultra-rápida',
                'Texto para imagem e edição de imagem',
                'Processamento econômico'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-yellow-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Flux Kontext Card */}
          <div className="bg-[#1a0b1a] border border-purple-900/30 rounded-2xl p-8 flex flex-col space-y-6 hover:border-purple-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
              <Star className="w-6 h-6 text-white fill-current" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Editor de Imagem IA Flux Kontext</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Geração de imagem com IA avançada com detalhes superiores e qualidade artística. Ideal para trabalho criativo profissional.
              </p>
            </div>
            <ul className="space-y-3 pt-4">
              {[
                'Qualidade de imagem premium',
                'Controle artístico avançado',
                'Múltiplas variantes de modelo'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-purple-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Section 2: What is an AI Image Editor? */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white">O que é um Editor de Imagem IA?</h2>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-8 text-zinc-400 leading-relaxed text-center">
          <p>
            Um Editor de Imagem IA é uma ferramenta criativa poderosa que utiliza inteligência artificial para gerar, transformar e aprimorar imagens. Ao contrário dos editores de imagem tradicionais que dependem apenas de ajustes manuais, os editores de imagem com IA usam modelos avançados de aprendizado de máquina para entender e manipular conteúdo visual de forma inteligente. Essas ferramentas podem criar imagens inteiramente novas a partir de descrições de texto, aplicar estilos artísticos, melhorar a qualidade da foto e realizar tarefas de edição complexas que tradicionalmente exigiriam habilidades especializadas.
          </p>
          <p>
            Nossa plataforma oferece dois modelos de edição de imagem com IA de ponta: Nano Banana para processamento ultra-rápido e resultados econômicos, e Flux Kontext para qualidade premium e controle artístico avançado. Ambos os modelos se destacam na compreensão de prompts em linguagem natural e entradas visuais, permitindo que você dê vida à sua visão criativa com o mínimo de esforço. Seja criando conteúdo para redes sociais, projetando gráficos profissionais ou explorando possibilidades artísticas, nosso Editor de Imagem IA fornece as ferramentas que você precisa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-2">Tecnologia IA Avançada</h3>
            <p className="text-sm text-zinc-400">
              Redes neurais de última geração treinadas em milhões de imagens para entender composição, estilo e princípios artísticos.
            </p>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-2">Fluxo de Trabalho Intuitivo</h3>
            <p className="text-sm text-zinc-400">
              Simplesmente descreva o que você quer em linguagem natural e veja a IA transformar suas palavras em conteúdo visual deslumbrante.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: AI Image Editor Use Cases */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Casos de Uso do Editor de Imagem IA</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Descubra como profissionais e criadores usam nosso Editor de Imagem IA para otimizar seus fluxos de trabalho criativos e produzir conteúdo visual impressionante.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: <LayoutTemplate className="w-6 h-6 text-yellow-500" />,
              title: "Conteúdo para Redes Sociais",
              desc: "Gere posts, stories e thumbnails atraentes instantaneamente com nosso editor de imagem IA. Perfeito para influenciadores e profissionais de marketing."
            },
            {
              icon: <Presentation className="w-6 h-6 text-yellow-500" />,
              title: "Apresentações de Negócios",
              desc: "Crie ilustrações profissionais, infográficos e arte conceitual para apresentações e pitch decks usando geração de imagem com IA."
            },
            {
              icon: <ImageIcon className="w-6 h-6 text-purple-500" />,
              title: "Aprimoramento de Fotos",
              desc: "Transforme e aprimore fotos existentes com transferência de estilo, upscaling e efeitos artísticos impulsionados por IA para resultados profissionais."
            },
            {
              icon: <Palette className="w-6 h-6 text-purple-500" />,
              title: "Criação de Arte Digital",
              desc: "Explore possibilidades artísticas criando múltiplas variações e interpretações de conceitos com ferramentas de edição de imagem com IA."
            },
            {
              icon: <ShoppingBag className="w-6 h-6 text-yellow-500" />,
              title: "Gráficos para E-commerce",
              desc: "Gere fundos de produtos, imagens de estilo de vida e gráficos promocionais para lojas online com geração de imagem com IA."
            },
            {
              icon: <Gamepad2 className="w-6 h-6 text-purple-500" />,
              title: "Desenvolvimento de Jogos",
              desc: "Crie ativos de jogos, conceitos de personagens e arte de ambiente rapidamente usando a tecnologia de editor de imagem IA."
            }
          ].map((useCase, i) => (
            <div key={i} className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl hover:bg-zinc-900/50 transition-colors">
              <div className="mb-4">{useCase.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{useCase.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {useCase.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Features;
