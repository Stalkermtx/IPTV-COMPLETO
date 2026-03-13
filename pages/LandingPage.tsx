import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Features from '../components/Features';
import { Check, Zap, Shield, Rocket, ArrowRight, Coins } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCtaClick = (planId?: string) => {
    if (user) {
      navigate('/generator');
    } else {
      if (planId) {
        // Redirect to WhatsApp for plan selection
        const message = `Olá, gostaria de assinar o plano ${planId.toUpperCase()} do ConexTV.`;
        const whatsappUrl = `https://wa.me/5565992203318?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      } else {
        navigate('/login');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent opacity-20" />
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-r from-white via-yellow-200 to-yellow-500 bg-clip-text text-transparent">
            Crie Imagens e Vídeos<br />Incríveis com IA
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Transforme suas ideias em realidade com a plataforma de IA mais avançada do mercado.
            Gere imagens em 4K, vídeos animados e muito mais com o ConexTV.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => handleCtaClick()}
              className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full text-lg transition-all transform hover:scale-105 flex items-center gap-2"
            >
              {user ? 'Ir para o Gerador' : 'Começar Agora'}
              <ArrowRight className="w-5 h-5" />
            </button>
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-full text-lg transition-all border border-zinc-800"
              >
                Fazer Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6">
        <Features />
      </div>

      {/* Plans Section */}
      <div className="py-24 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Planos Flexíveis para Você</h2>
            <p className="text-zinc-400">Escolha o plano ideal para suas necessidades criativas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
             {/* Basic Plan */}
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center space-y-6 hover:border-zinc-700 transition-colors">
              <div className="p-4 bg-zinc-800 rounded-full">
                <Shield className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-2xl font-bold">Básico</h3>
              <div className="text-3xl font-bold">Grátis</div>
              <ul className="space-y-3 text-left w-full text-zinc-400 text-sm flex-grow">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Acesso limitado</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Baixa resolução</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Marca d'água</li>
              </ul>
              <button
                onClick={() => handleCtaClick('basic')}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all border border-zinc-700"
              >
                Começar Grátis
              </button>
            </div>

            {/* Credit Plan */}
            <div className="bg-zinc-900/30 border border-blue-500/30 rounded-2xl p-6 flex flex-col items-center space-y-6 hover:border-blue-500/50 transition-colors relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                FLEXÍVEL
              </div>
              <div className="p-4 bg-blue-500/10 rounded-full">
                <Coins className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-blue-400">Créditos</h3>
              <div className="text-3xl font-bold">R$ 15,00<span className="text-sm text-zinc-500 font-normal">/pct</span></div>
              <ul className="space-y-3 text-left w-full text-zinc-400 text-sm flex-grow">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Pague pelo que usar</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Sem validade</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Acesso total</li>
              </ul>
              <button
                onClick={() => handleCtaClick('credits')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
              >
                Comprar Créditos
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-b from-zinc-900 to-black border border-yellow-500/50 rounded-2xl p-6 flex flex-col items-center space-y-6 transform scale-105 shadow-2xl shadow-yellow-500/10 relative z-10">
               <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                MAIS POPULAR
              </div>
              <div className="p-4 bg-yellow-500/20 rounded-full border border-yellow-500/50">
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-bold text-white">Profissional</h3>
              <div className="text-4xl font-bold text-yellow-500">R$ 29,90<span className="text-sm text-zinc-500 font-normal">/mês</span></div>
              <ul className="space-y-3 text-left w-full text-zinc-300 text-sm flex-grow">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> Gerações Ilimitadas</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> Resolução 4K Ultra HD</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> Animações de Vídeo (Veo)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> Uso Comercial Liberado</li>
              </ul>
              <button
                onClick={() => handleCtaClick('pro')}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/20"
              >
                Assinar Agora
              </button>
            </div>

            {/* Reseller Plan */}
            <div className="bg-zinc-900/30 border border-purple-500/30 rounded-2xl p-6 flex flex-col items-center space-y-6 hover:border-purple-500/50 transition-colors">
              <div className="p-4 bg-purple-500/10 rounded-full">
                <Rocket className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-purple-400">Revenda</h3>
              <div className="text-2xl font-bold">Pacotes de Créditos</div>
              <ul className="space-y-3 text-left w-full text-zinc-400 text-sm flex-grow">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> Compre créditos no atacado</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> Revenda e obtenha lucro</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> Ideal para agências</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> Suporte prioritário</li>
              </ul>
              <button
                onClick={() => handleCtaClick('reseller')}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20"
              >
                Seja um Revendedor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-black/50 backdrop-blur-xl py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-zinc-500 text-sm">
            &copy; 2026 <span className="font-bold text-zinc-300">ConexTV.</span> Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
