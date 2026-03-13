import React, { useState } from 'react';
import { useAuth, PlanType } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Shield, Rocket, Coins, MessageSquare } from 'lucide-react';

const Subscription: React.FC = () => {
  const { subscribe, user, plans } = useAuth();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  const enterprisePlan = plans.find(p => p.id === 'enterprise');
  const whatsappNumber = enterprisePlan?.contactWhatsapp || '65992203318';
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Quero%20Saber%20Mais%20Sobre%20o%20Gerador%20ConexTV%20Pro.`;

  const handleSubscribe = (planId: PlanType) => {
    if (planId === 'basic') {
      subscribe('basic');
      navigate('/generator');
    } else {
      setSelectedPlan(planId);
      setShowPaymentModal(true);
    }
  };

  if (user?.subscriptionStatus === 'active') {
    navigate('/generator');
    return null;
  }

  if (showPaymentModal && selectedPlan) {
    const planName = plans.find(p => p.id === selectedPlan)?.name;
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Ativar Plano {planName}</h2>
            <p className="text-zinc-400">
              Para ativar seu plano, entre em contato com o administrador via WhatsApp para realizar o pagamento.
            </p>
          </div>
          
          <div className="bg-black/40 p-4 rounded-xl border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase font-bold mb-1">WhatsApp do Admin</p>
            <p className="text-xl font-mono text-white">65 99220-3318</p>
          </div>

          <button
            onClick={() => {
              window.open(`https://wa.me/5565992203318?text=Olá, gostaria de ativar o plano ${planName} na minha conta (${user?.email}).`, '_blank');
            }}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-900/20"
          >
            Falar no WhatsApp
          </button>
          
          <button
            onClick={() => setShowPaymentModal(false)}
            className="text-zinc-500 text-sm hover:text-white transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative">
      <div className="flex-grow flex flex-col items-center justify-center p-8 pb-24">
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Desbloqueie o Poder do ConexTV Pro</h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Gere logotipos ilimitados em 4K, animações de vídeo e tenha acesso prioritário aos nossos modelos de IA mais avançados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Plan */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center space-y-6 hover:bg-zinc-900/50 transition-all duration-300">
              <div className="p-4 bg-zinc-800 rounded-full">
                <Shield className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold">Básico</h3>
              <div className="text-3xl font-bold">Grátis</div>
              <ul className="space-y-3 text-left w-full text-zinc-400 text-sm flex-grow">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Acesso limitado</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Baixa resolução</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Marca d'água</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 3 imagens de teste</li>
              </ul>
              <button 
                onClick={() => handleSubscribe('basic')}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors"
              >
                Começar Grátis
              </button>
            </div>

            {/* Credits Plan */}
            <div className="bg-zinc-900/30 border border-blue-500/30 rounded-2xl p-6 flex flex-col items-center space-y-6 hover:bg-zinc-900/50 transition-all duration-300 relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                FLEXÍVEL
              </div>
              <div className="p-4 bg-blue-500/10 rounded-full">
                <Coins className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold">Créditos</h3>
              <div className="text-3xl font-bold text-blue-400">R$ 19,90</div>
              <ul className="space-y-3 text-left w-full text-zinc-400 text-sm flex-grow">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> 40 Créditos</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Válido por 30 dias</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> 1 Crédito = 1 Imagem</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Sem marca d'água</li>
              </ul>
              <button 
                onClick={() => handleSubscribe('credits')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20"
              >
                Comprar Créditos
              </button>
            </div>

            {/* Pro Plan (Highlighted) */}
            <div className="bg-gradient-to-b from-zinc-900 to-black border border-yellow-500/50 rounded-2xl p-6 flex flex-col items-center space-y-6 transform scale-105 shadow-2xl shadow-yellow-500/10 relative overflow-hidden z-10">
              <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                MAIS POPULAR
              </div>
              <div className="p-4 bg-yellow-500/20 rounded-full border border-yellow-500/50">
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-bold text-white">Profissional</h3>
              <div className="text-4xl font-bold text-yellow-500">R$ 29,90<span className="text-lg text-zinc-500 font-normal">/mês</span></div>
              <ul className="space-y-3 text-left w-full text-zinc-300 text-sm flex-grow">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> Gerações Ilimitadas</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> Resolução 4K Ultra HD</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> Animações de Vídeo (Veo)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> Uso Comercial Liberado</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500" /> Suporte Prioritário</li>
              </ul>
              <button 
                onClick={() => handleSubscribe('pro')}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/20"
              >
                Assinar Agora
              </button>
              <p className="text-xs text-zinc-500 mt-2">Cobrança automática a cada 30 dias. Cancele quando quiser.</p>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center space-y-6 hover:bg-zinc-900/50 transition-all duration-300">
              <div className="p-4 bg-purple-500/10 rounded-full">
                <Rocket className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold">Empresarial</h3>
              <div className="text-3xl font-bold">Consulte</div>
              <ul className="space-y-3 text-left w-full text-zinc-400 text-sm flex-grow">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> API Dedicada</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> Modelos Customizados</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> SLA Garantido</li>
              </ul>
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center"
              >
                Falar com Vendas
              </a>
            </div>
          </div>
        </div>
      </div>
      
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

export default Subscription;
