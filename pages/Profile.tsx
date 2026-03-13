import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Save, ArrowLeft, Mail, Phone, Lock, AlertTriangle } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, updateUser, changePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState(user?.name || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  
  const isSetupMode = searchParams.get('mode') === 'setup' || user?.mustChangePassword;

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setWhatsapp(user.whatsapp || '');
    }
  }, [user]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSetupMode) {
      if (!newPassword || !confirmPassword) {
        alert("Por favor, defina uma nova senha.");
        return;
      }
      if (newPassword !== confirmPassword) {
        alert("As senhas não coincidem.");
        return;
      }
      if (newPassword.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres.");
        return;
      }
      changePassword(newPassword);
    }

    updateUser(user.id, { name, whatsapp });
    setSuccess(true);
    
    if (isSetupMode) {
      alert("Cadastro atualizado com sucesso!");
      navigate('/subscription');
    } else {
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          {!isSetupMode && (
            <button 
              onClick={() => navigate('/generator')}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-2xl font-bold">{isSetupMode ? 'Complete seu Cadastro' : 'Meu Perfil'}</h1>
        </div>

        {isSetupMode && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-200">
              Por segurança, você precisa definir uma nova senha e atualizar seus dados antes de continuar.
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all"
                placeholder="Seu nome"
                required={isSetupMode}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all"
                placeholder="5565999999999"
                required={isSetupMode}
              />
            </div>
            <p className="text-xs text-zinc-600">Inclua o código do país e DDD (ex: 5565...)</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Email (Não editável)</label>
            <div className="relative opacity-50">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-zinc-400 cursor-not-allowed"
              />
            </div>
          </div>

          {isSetupMode && (
            <>
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all"
                    placeholder="Repita a senha"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSetupMode ? 'Salvar e Continuar' : 'Salvar Alterações'}
          </button>

          {success && !isSetupMode && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm text-center animate-fade-in">
              Perfil atualizado com sucesso!
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
