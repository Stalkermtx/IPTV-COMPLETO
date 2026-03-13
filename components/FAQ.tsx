import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "O que é o Gerador de Logos ConexTV?",
    answer: "O ConexTV é uma plataforma de Inteligência Artificial especializada na criação de logotipos premium e ultra-realistas para marcas de IPTV, tecnologia e streaming. Nossa IA é treinada para produzir designs com acabamento metálico, efeitos de neon e estética futurista de alta qualidade."
  },
  {
    question: "Como funciona a criação de Intros Animadas?",
    answer: "Após gerar seu logotipo estático, você pode transformar sua arte em um vídeo de introdução de 5 segundos com apenas um clique. Nossa tecnologia 'Image-to-Video' anima os elementos do seu logo, adicionando brilhos, movimentos de câmera e efeitos cinematográficos automaticamente, ou seguindo um roteiro personalizado que você definir."
  },
  {
    question: "Qual a diferença entre o plano Grátis e o Pro?",
    answer: "O plano Grátis é ideal para testes: permite gerar até 3 imagens com marca d'água e resolução padrão. O plano Pro desbloqueia todo o potencial: gerações ilimitadas, resolução 4K Ultra HD, remoção da marca d'água, prioridade no processamento e licença de uso comercial."
  },
  {
    question: "Posso usar as imagens e vídeos comercialmente?",
    answer: "Sim! Assinantes do plano Pro detêm todos os direitos comerciais sobre os ativos gerados. Você pode usar seu logotipo e intro em seu site, aplicativo, redes sociais e materiais de marketing sem restrições. Usuários do plano Grátis podem usar apenas para fins pessoais ou de teste."
  },
  {
    question: "Quais formatos de arquivo são fornecidos?",
    answer: "As imagens são geradas em formato PNG de alta fidelidade. Os vídeos são entregues em formato MP4, otimizados para compatibilidade com todas as plataformas de edição e redes sociais. Você pode escolher entre diversas proporções (16:9, 9:16, 1:1) para se adequar ao YouTube, Instagram, TikTok, etc."
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-16 mb-8">
      <div className="flex items-center justify-center gap-3 mb-8">
        <HelpCircle className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-white text-center">Perguntas Frequentes</h2>
      </div>
      
      <div className="space-y-4">
        {faqData.map((item, index) => (
          <div 
            key={index} 
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-zinc-700"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
            >
              <span className="text-base font-medium text-zinc-100 pr-8">
                {item.question}
              </span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0" />
              )}
            </button>
            
            <div 
              className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === index ? 'max-h-48 opacity-100 pb-6' : 'max-h-0 opacity-0'
              }`}
            >
              <p className="text-zinc-400 text-sm leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
