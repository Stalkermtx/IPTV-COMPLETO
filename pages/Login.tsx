import React, { useState, useEffect } from 'react';
import { useAuth, PlanType } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, Lock, Mail, ArrowRight, MessageSquare, CheckCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { login, signup, users } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignup(true);
    }
  }, [searchParams]);

  const handleTestLogin = async () => {
    setEmail('teste@conextv.com');
    setPassword('teste123'); // Firebase requires 6 chars
    const success = await login('teste@conextv.com', 'teste123');
    if (success) {
      navigate('/subscription');
    } else {
      alert('Erro ao iniciar sessão de teste. O usuário pode não estar carregado ainda.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    if (!email || !password) return;

    if (isSignup) {
      if (!name || !whatsapp) {
        alert("Preencha todos os campos.");
        return;
      }
      
      if (typeof signup !== 'function') {
        console.error("Signup function is not available in AuthContext");
        alert("Erro interno: Função de cadastro indisponível. Tente recarregar a página.");
        return;
      }

      // Pass planParam to signup if available
      console.log("Attempting signup with:", { email, name, whatsapp, planParam });
      try {
        const success = await signup(email, password, name, whatsapp, planParam as PlanType | undefined);
        
        if (success) {
          console.log("Signup successful");
          if (planParam) {
            setShowPlanModal(true);
          } else {
            setSuccessMessage("Conta criada com sucesso! Faça login para continuar.");
            setIsSignup(false);
            setPassword('');
          }
        } else {
          console.log("Signup failed");
        }
      } catch (error) {
        console.error("Signup error:", error);
        alert("Erro ao criar conta. Tente novamente.");
      }
    } else {
      // Simulate login
      if (email === 'admin@conextv.com') {
        if (password === 'Elaine1285*add' || password === '10203040') {
          // Pass the password that AuthContext expects for the admin user
          const success = await login(email, '10203040');
          if (success) {
            navigate('/admin');
          } else {
            alert('Erro ao iniciar sessão do administrador.');
          }
        } else {
          alert('Senha incorreta para administrador');
        }
      } else {
        const success = await login(email, password);
        if (success) {
          const normalizedEmail = email.trim().toLowerCase();
          
          if (normalizedEmail === 'hiagovic@gmail.com' || normalizedEmail === 'admin@conextv.com') {
            navigate('/admin');
            return;
          }
          
          const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
          
          if (user?.mustChangePassword) {
            navigate('/profile?mode=setup');
          } else {
            navigate('/subscription');
          }
        }
      }
    }
  };

  if (showPlanModal) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Conta Criada com Sucesso!</h2>
            <p className="text-zinc-400">
              Para ativar seu plano <strong>{planParam?.toUpperCase()}</strong>, entre em contato com o administrador via WhatsApp.
            </p>
          </div>
          
          <div className="bg-black/40 p-4 rounded-xl border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase font-bold mb-1">WhatsApp do Admin</p>
            <p className="text-xl font-mono text-white">65 99220-3318</p>
          </div>

          <button
            onClick={() => {
              window.open(`https://wa.me/5565992203318?text=Olá, acabei de criar minha conta no ConexTV e gostaria de ativar o plano ${planParam}.`, '_blank');
              setShowPlanModal(false);
              setIsSignup(false);
              setPassword('');
              setSuccessMessage("Conta criada com sucesso! Faça login para continuar.");
            }}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-900/20"
          >
            Falar no WhatsApp
          </button>
          
          <button
            onClick={() => {
              setShowPlanModal(false);
              setIsSignup(false);
              setPassword('');
              setSuccessMessage("Conta criada com sucesso! Faça login para continuar.");
            }}
            className="text-zinc-500 text-sm hover:text-white transition-colors"
          >
            Pular por enquanto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl my-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20 mb-4">
            <Zap className="w-6 h-6 text-black fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{isSignup ? 'Criar Conta' : 'Bem-vindo ao ConexTV'}</h1>
          <p className="text-zinc-400 text-sm">{isSignup ? 'Preencha os dados abaixo para começar' : 'Faça login para acessar o Gerador de Logo'}</p>
        </div>

        {successMessage && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-green-400 text-sm">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all"
                  placeholder="Seu Nome"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">WhatsApp</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all"
                  placeholder="55..."
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
          >
            {isSignup ? 'Criar Conta' : 'Entrar'}
            <ArrowRight className="w-4 h-4" />
          </button>

          {!isSignup && (
            <button
              type="button"
              onClick={handleTestLogin}
              className="w-full py-3 bg-zinc-800 text-white font-bold rounded-lg hover:bg-zinc-700 transition-all border border-zinc-700 flex items-center justify-center gap-2 mt-2"
            >
              Acesso de Teste (1 Clique)
            </button>
          )}
        </form>

        <div className="mt-6 text-center text-xs text-zinc-600">
          <p>
            {isSignup ? 'Já tem uma conta?' : 'Não tem uma conta?'} 
            <span 
              onClick={() => setIsSignup(!isSignup)}
              className="text-yellow-500 cursor-pointer hover:underline ml-1"
            >
              {isSignup ? 'Faça Login' : 'Cadastre-se'}
            </span>
          </p>
        </div>
      </div>
      
      <footer className="w-full text-center py-4 mt-auto">
        <p className="text-zinc-600 text-xs">
          &copy; 2026 <span className="font-bold text-zinc-500">ConexTV.</span> Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
};

export default Login;
