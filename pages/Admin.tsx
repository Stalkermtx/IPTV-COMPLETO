import React, { useState, useEffect } from 'react';
import { useAuth, User, PlanType, MessageTemplate } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, Activity, Search, Edit2, Trash2, CheckCircle, XCircle, Save, MessageSquare, Send, Plus, Copy, LayoutDashboard, Settings, UserCog, Megaphone, Image as ImageIcon, ExternalLink, Link } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { encryptData, decryptData } from '../services/evolutionService';

const Admin: React.FC = () => {
  const { users, updateUserStatus, updateUser, deleteUser, plans, updatePlan, templates, saveTemplate, deleteTemplate, generations } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'marketing' | 'generations' | 'integrations'>('dashboard');
  const navigate = useNavigate();

  // Evolution API State
  const [evolutionUrl, setEvolutionUrl] = useState('');
  const [evolutionKey, setEvolutionKey] = useState('');
  const [savingEvolution, setSavingEvolution] = useState(false);

  useEffect(() => {
    if (activeTab === 'integrations') {
      const fetchSettings = async () => {
        try {
          const docRef = doc(db, 'settings', 'evolution');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setEvolutionUrl(decryptData(data.url || ''));
            setEvolutionKey(decryptData(data.apiKey || ''));
          }
        } catch (error) {
          console.error("Error fetching evolution settings:", error);
        }
      };
      fetchSettings();
    }
  }, [activeTab]);

  const handleSaveEvolution = async () => {
    setSavingEvolution(true);
    try {
      await setDoc(doc(db, 'settings', 'evolution'), {
        url: encryptData(evolutionUrl),
        apiKey: encryptData(evolutionKey),
        updatedAt: new Date().toISOString()
      });
      alert('Configurações da Evolution API salvas com sucesso!');
    } catch (error) {
      console.error("Error saving evolution settings:", error);
      alert('Erro ao salvar configurações.');
    } finally {
      setSavingEvolution(false);
    }
  };

  // Activation State
  const [activatingUser, setActivatingUser] = useState<User | null>(null);
  const [selectedPlanForActivation, setSelectedPlanForActivation] = useState<PlanType>('pro');

  // Create User State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserWhatsapp, setNewUserWhatsapp] = useState('');
  const [newUserPlan, setNewUserPlan] = useState<PlanType>('pro');
  const { createUser } = useAuth();

  // Marketing State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.id.includes(searchTerm) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStatusChange = (userId: string, newStatus: 'active' | 'inactive' | 'expired') => {
    if (newStatus === 'active') {
      const user = users.find(u => u.id === userId);
      if (user) {
        setActivatingUser(user);
        setSelectedPlanForActivation(user.planId || 'pro');
      }
    } else {
      updateUserStatus(userId, newStatus);
    }
  };

  const confirmActivation = () => {
    if (activatingUser) {
      updateUserStatus(activatingUser.id, 'active', selectedPlanForActivation);
      setActivatingUser(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      deleteUser(userId);
    }
  };

  const handleCreateUser = () => {
    if (!newUserEmail || !newUserName || !newUserPassword) {
      alert("Nome, Email e Senha são obrigatórios.");
      return;
    }
    
    const success = createUser(newUserEmail, newUserPassword, newUserName, newUserWhatsapp, newUserPlan);
    
    if (success) {
      setShowCreateUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('123456');
      setNewUserWhatsapp('');
      setNewUserPlan('pro');
      alert(`Usuário criado com sucesso! Senha definida: ${newUserPassword}`);
    }
  };

  const handlePlanUpdate = (planId: PlanType, field: string, value: any) => {
    updatePlan(planId, { [field]: value });
  };

  const handleUserUpdate = (userId: string, field: string, value: any) => {
    updateUser(userId, { [field]: value });
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      if (!editingTemplate.name || !editingTemplate.content) {
        alert("Nome e conteúdo são obrigatórios.");
        return;
      }
      saveTemplate(editingTemplate);
      setEditingTemplate(null);
    }
  };

  const handleSendMessages = async () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) {
      alert("Selecione um template.");
      return;
    }
    if (selectedUserIds.length === 0) {
      alert("Selecione pelo menos um usuário.");
      return;
    }

    setSending(true);
    setSendProgress(0);

    const usersToSend = users.filter(u => selectedUserIds.includes(u.id));
    
    for (let i = 0; i < usersToSend.length; i++) {
      const user = usersToSend[i];
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay to avoid spam flags

      // Replace variables
      let message = template.content
        .replace(/{name}/g, user.name || 'Cliente')
        .replace(/{username}/g, user.email)
        .replace(/{plan_price}/g, plans.find(p => p.id === user.planId)?.price || 'Grátis')
        .replace(/{expires_at}/g, user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : 'N/A')
        .replace(/{pay_url}/g, `https://conextv.com/pay/${user.id}`); // Mock URL

      // In a real app, this would call a WhatsApp API
      // Here we just log or could open a window
      console.log(`Sending to ${user.whatsapp || user.email}:`, message);
      
      setSendProgress(((i + 1) / usersToSend.length) * 100);
    }

    setSending(false);
    alert("Envio em massa concluído!");
    setSelectedUserIds([]);
  };

  const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex items-center gap-4 hover:border-zinc-700 transition-all shadow-lg shadow-black/20">
      <div className={`p-4 rounded-xl bg-${color}-500/10`}>
        <Icon className={`w-8 h-8 text-${color}-500`} />
      </div>
      <div>
        <p className="text-sm text-zinc-400 font-medium uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
      </div>
    </div>
  );

  const NavTab = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        activeTab === id 
          ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' 
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
            <p className="text-zinc-500 mt-1">Gerencie usuários, planos e marketing em um só lugar.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/generator')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-zinc-800/20 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Ir para o Gerador
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 bg-zinc-900/30 p-1.5 rounded-xl border border-zinc-800/50 w-fit backdrop-blur-sm">
          <NavTab id="dashboard" label="Dashboard Geral" icon={LayoutDashboard} />
          <NavTab id="marketing" label="Marketing & Envios" icon={Megaphone} />
          <NavTab id="generations" label="Histórico de Gerações" icon={ImageIcon} />
          <NavTab id="integrations" label="Integrações API" icon={Link} />
        </div>

        {/* INTEGRATIONS TAB */}
        {activeTab === 'integrations' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                  <Link className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Evolution API</h2>
                  <p className="text-zinc-400 text-sm">Configure a API do WhatsApp para campanhas</p>
                </div>
              </div>

              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">URL da Evolution API</label>
                  <input
                    type="url"
                    value={evolutionUrl}
                    onChange={(e) => setEvolutionUrl(e.target.value)}
                    placeholder="https://api.suaevolution.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Global API Key</label>
                  <input
                    type="password"
                    value={evolutionKey}
                    onChange={(e) => setEvolutionKey(e.target.value)}
                    placeholder="Sua Global API Key"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    * Estas informações são criptografadas no banco de dados para sua segurança.
                  </p>
                </div>
                <button
                  onClick={handleSaveEvolution}
                  disabled={savingEvolution}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingEvolution ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD TAB (Contains Stats, Plans, and Users) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-fade-in">
            
            {/* 1. Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="Total de Usuários" 
                value={users.length} 
                icon={Users} 
                color="blue" 
              />
              <StatCard 
                title="Assinaturas Ativas" 
                value={users.filter(u => u.subscriptionStatus === 'active').length} 
                icon={CreditCard} 
                color="green" 
              />
              <StatCard 
                title="Receita Mensal (Est.)" 
                value={`R$ ${users.filter(u => u.subscriptionStatus === 'active').length * 29.90}`} 
                icon={Activity} 
                color="yellow" 
              />
            </div>

            {/* 2. Plans Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="p-2 bg-zinc-800 rounded-lg">
                  <Settings className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Gerenciamento de Planos</h2>
                  <p className="text-sm text-zinc-500">Configure os preços e limites.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div key={plan.id} className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-6 hover:border-zinc-700 transition-all relative overflow-hidden group">
                    {plan.id === 'pro' && (
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                        Mais Popular
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-lg ${
                        plan.id === 'basic' ? 'bg-zinc-800' : 
                        plan.id === 'pro' ? 'bg-yellow-500/20' : 'bg-purple-500/20'
                      }`}>
                        <CreditCard className={`w-6 h-6 ${
                           plan.id === 'basic' ? 'text-zinc-400' : 
                           plan.id === 'pro' ? 'text-yellow-500' : 'text-purple-500'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg capitalize text-white">{plan.id}</h3>
                        <span className="text-xs text-zinc-500 uppercase tracking-wider">ID: {plan.id}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Nome de Exibição</label>
                        <input 
                          type="text" 
                          value={plan.name}
                          onChange={(e) => handlePlanUpdate(plan.id, 'name', e.target.value)}
                          className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Preço</label>
                        <input 
                          type="text" 
                          value={plan.price}
                          onChange={(e) => handlePlanUpdate(plan.id, 'price', e.target.value)}
                          className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all"
                        />
                      </div>

                      {plan.id === 'basic' && (
                         <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Limite de Uso</label>
                          <input 
                            type="number" 
                            value={plan.maxUsage || 0}
                            onChange={(e) => handlePlanUpdate(plan.id, 'maxUsage', parseInt(e.target.value))}
                            className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all"
                          />
                        </div>
                      )}

                      {plan.id === 'credits' && (
                         <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Quantidade de Créditos</label>
                          <input 
                            type="number" 
                            value={plan.credits || 0}
                            onChange={(e) => handlePlanUpdate(plan.id, 'credits', parseInt(e.target.value))}
                            className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all"
                          />
                        </div>
                      )}

                      {plan.id === 'enterprise' && (
                         <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">WhatsApp de Vendas</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={plan.contactWhatsapp || ''}
                              onChange={(e) => handlePlanUpdate(plan.id, 'contactWhatsapp', e.target.value)}
                              className="w-full bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all"
                              placeholder="6599..."
                            />
                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Users Section */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-800 rounded-lg">
                    <UserCog className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Gerenciamento de Usuários</h2>
                    <p className="text-sm text-zinc-500">Controle de acesso e assinaturas.</p>
                  </div>
                </div>
                
                <div className="bg-zinc-900/50 border border-zinc-800 p-2 rounded-lg flex items-center gap-3 w-full md:w-auto">
                  <Search className="w-4 h-4 text-zinc-500 ml-2" />
                  <input
                    type="text"
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none text-white placeholder-zinc-500 focus:ring-0 w-full md:w-64 outline-none text-sm"
                  />
                </div>
                
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-900/20"
                >
                  <Plus className="w-4 h-4" />
                  Novo Usuário
                </button>
              </div>
              
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden shadow-xl shadow-black/20 backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-zinc-900/80 text-zinc-200 uppercase text-xs font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-5">Usuário</th>
                        <th className="px-6 py-5">Contato (WhatsApp)</th>
                        <th className="px-6 py-5">Senha</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-6 py-5">Expira em</th>
                        <th className="px-6 py-5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors group">
                          <td className="px-6 py-4 font-medium text-white">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                                {user.email.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <input 
                                  type="text"
                                  value={user.name || ''}
                                  onChange={(e) => handleUserUpdate(user.id, 'name', e.target.value)}
                                  placeholder="Nome do Cliente"
                                  className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-yellow-500 p-0 text-sm font-medium text-white placeholder-zinc-600 focus:ring-0 w-full transition-colors"
                                />
                                <div className="text-xs text-zinc-500 mt-0.5">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1.5 border border-zinc-800/50 w-fit">
                              <span className="text-zinc-500 text-xs">WA</span>
                              <input 
                                type="text"
                                value={user.whatsapp || ''}
                                onChange={(e) => handleUserUpdate(user.id, 'whatsapp', e.target.value)}
                                placeholder="55..."
                                className="bg-transparent border-none p-0 text-xs w-28 focus:ring-0 text-zinc-300 placeholder-zinc-700"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1.5 border border-zinc-800/50 w-fit">
                              <span className="text-zinc-500 text-xs">PW</span>
                              <input 
                                type="text"
                                value={user.password || ''}
                                onChange={(e) => handleUserUpdate(user.id, 'password', e.target.value)}
                                placeholder="Nova senha"
                                className="bg-transparent border-none p-0 text-xs w-24 focus:ring-0 text-zinc-300 placeholder-zinc-700"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize border ${
                              user.subscriptionStatus === 'active' 
                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                : user.subscriptionStatus === 'expired'
                                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                user.subscriptionStatus === 'active' ? 'bg-green-400' : user.subscriptionStatus === 'expired' ? 'bg-orange-400' : 'bg-red-400'
                              }`}></span>
                              {user.subscriptionStatus === 'active' ? 'Ativo' : user.subscriptionStatus === 'expired' ? 'Expirado' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">
                            {user.subscriptionExpiresAt 
                              ? new Date(user.subscriptionExpiresAt).toLocaleDateString() 
                              : <span className="text-zinc-600">-</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {user.subscriptionStatus === 'active' ? (
                                <button 
                                  onClick={() => handleStatusChange(user.id, 'inactive')}
                                  className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-lg transition-colors"
                                  title="Desativar Assinatura"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleStatusChange(user.id, 'active')}
                                  className="p-2 hover:bg-green-500/10 text-zinc-400 hover:text-green-500 rounded-lg transition-colors"
                                  title={user.subscriptionStatus === 'expired' ? "Reativar Assinatura" : "Ativar Assinatura"}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-lg transition-colors"
                                title="Excluir Usuário"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* MARKETING TAB */}
        {activeTab === 'marketing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            {/* Left: Template Manager */}
            <div className="space-y-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Templates de Mensagem</h2>
                    <p className="text-xs text-zinc-500">Gerencie os modelos de envio.</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setEditingTemplate(t);
                          setSelectedTemplateId(t.id);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap border transition-all flex items-center gap-2 ${
                          selectedTemplateId === t.id 
                            ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                    {templates.length < 4 && (
                      <button
                        onClick={() => {
                          const newT = { id: Date.now().toString(), name: 'Novo Template', content: '' };
                          setEditingTemplate(newT);
                          setSelectedTemplateId(newT.id);
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap border border-dashed border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 flex items-center gap-2 transition-all"
                      >
                        <Plus className="w-3 h-3" /> Novo
                      </button>
                    )}
                  </div>

                  {editingTemplate && (
                    <div className="space-y-4 bg-black/20 p-6 rounded-xl border border-zinc-800/50 animate-fade-in">
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase font-semibold">Nome do Template</label>
                        <input
                          type="text"
                          value={editingTemplate.name}
                          onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:border-yellow-500 outline-none transition-all"
                          placeholder="Ex: Cobrança Mensal"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase font-semibold">Conteúdo</label>
                        <textarea
                          value={editingTemplate.content}
                          onChange={(e) => setEditingTemplate({...editingTemplate, content: e.target.value})}
                          className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:border-yellow-500 outline-none font-mono leading-relaxed resize-none transition-all"
                          placeholder="Digite sua mensagem aqui..."
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                        <span className="text-xs text-zinc-500 w-full mb-1 uppercase font-bold">Variáveis Disponíveis:</span>
                        {['{name}', '{username}', '{plan_price}', '{expires_at}', '{pay_url}'].map(variable => (
                          <button 
                            key={variable}
                            onClick={() => {
                              // Simple append for now, ideally insert at cursor
                              setEditingTemplate({...editingTemplate, content: editingTemplate.content + variable})
                            }}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-mono text-zinc-300 transition-colors"
                            title="Clique para adicionar"
                          >
                            {variable}
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        {templates.find(t => t.id === editingTemplate.id) && (
                           <button 
                            onClick={() => {
                              if(confirm('Tem certeza que deseja deletar este template?')) {
                                deleteTemplate(editingTemplate.id);
                                setEditingTemplate(null);
                                setSelectedTemplateId('');
                              }
                            }}
                            className="px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Deletar
                          </button>
                        )}
                        <button 
                          onClick={handleSaveTemplate}
                          className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-yellow-500/20 transition-all"
                        >
                          <Save className="w-4 h-4" /> Salvar Template
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Sender */}
            <div className="space-y-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Send className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Envio em Massa</h2>
                    <p className="text-xs text-zinc-500">Selecione usuários para enviar.</p>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col border border-zinc-800 rounded-xl bg-black/20">
                  <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    <table className="w-full text-left text-sm text-zinc-400">
                      <thead className="bg-zinc-900 text-zinc-200 uppercase text-xs font-medium sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 w-10 bg-zinc-900">
                            <input 
                              type="checkbox" 
                              checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                              onChange={handleSelectAllUsers}
                              className="rounded border-zinc-700 bg-zinc-800 text-yellow-500 focus:ring-yellow-500/50 cursor-pointer"
                            />
                          </th>
                          <th className="px-4 py-3 bg-zinc-900">Usuário</th>
                          <th className="px-4 py-3 bg-zinc-900">WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {filteredUsers.map(user => (
                          <tr 
                            key={user.id} 
                            className={`hover:bg-zinc-800/30 transition-colors cursor-pointer ${selectedUserIds.includes(user.id) ? 'bg-yellow-500/5' : ''}`}
                            onClick={() => toggleUserSelection(user.id)}
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={selectedUserIds.includes(user.id)}
                                onChange={() => toggleUserSelection(user.id)}
                                className="rounded border-zinc-700 bg-zinc-800 text-yellow-500 focus:ring-yellow-500/50 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 text-white font-medium">{user.name || user.email}</td>
                            <td className="px-4 py-3 font-mono text-xs text-zinc-500">{user.whatsapp || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {sending && (
                    <div className="space-y-2 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                      <div className="flex justify-between text-xs text-zinc-400 font-medium uppercase">
                        <span>Enviando mensagens...</span>
                        <span>{Math.round(sendProgress)}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-green-500 h-full transition-all duration-300 ease-out relative"
                          style={{ width: `${sendProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSendMessages}
                    disabled={sending || selectedUserIds.length === 0 || !selectedTemplateId}
                    className={`w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${
                      sending || selectedUserIds.length === 0 || !selectedTemplateId
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/20'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                    {sending ? 'Enviando...' : `Enviar para ${selectedUserIds.length} Usuários`}
                  </button>
                  <p className="text-[10px] text-zinc-600 text-center uppercase tracking-wider">
                    Intervalo de segurança de 1.5s entre envios
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GENERATIONS TAB */}
        {activeTab === 'generations' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Histórico de Gerações</h2>
                  <p className="text-sm text-zinc-500">Visualize todos os prompts e imagens geradas pelos usuários.</p>
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 p-2 rounded-lg flex items-center gap-3">
                <Search className="w-4 h-4 text-zinc-500 ml-2" />
                <input
                  type="text"
                  placeholder="Buscar por prompt ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none text-white placeholder-zinc-500 focus:ring-0 w-64 outline-none text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generations
                .filter(gen => 
                  gen.prompt.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  gen.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((gen) => (
                <div key={gen.id} className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group">
                  <div className="aspect-video bg-black relative overflow-hidden">
                    <img 
                      src={gen.imageUrl} 
                      alt={gen.prompt} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a 
                        href={gen.imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver Original
                      </a>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-zinc-300 font-mono border border-white/10">
                      {new Date(gen.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                        {gen.userEmail.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs text-zinc-400 truncate">{gen.userEmail}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Prompt</p>
                      <p className="text-sm text-zinc-300 line-clamp-3 italic">"{gen.prompt}"</p>
                    </div>
                    <div className="pt-3 border-t border-zinc-800/50 flex justify-between items-center">
                      <span className="text-[10px] text-zinc-600 font-mono">{gen.model}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(gen.prompt)}
                        className="text-zinc-500 hover:text-white transition-colors"
                        title="Copiar Prompt"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {generations.length === 0 && (
              <div className="text-center py-20 text-zinc-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma geração registrada ainda.</p>
              </div>
            )}
          </div>
        )}

      </div>
      
      <footer className="w-full border-t border-white/5 bg-black/50 backdrop-blur-xl py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-zinc-500 text-sm">
            &copy; 2026 <span className="font-bold text-zinc-300">ConexTV.</span> Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-6 shadow-2xl">
            <div>
              <h3 className="text-xl font-bold text-white">Criar Novo Usuário</h3>
              <p className="text-zinc-400 text-sm mt-1">
                Preencha os dados para criar um novo acesso.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Nome</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 outline-none transition-all"
                  placeholder="Nome do Cliente"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 outline-none transition-all"
                  placeholder="cliente@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Senha Inicial</label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 outline-none transition-all"
                  placeholder="Senha"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase font-semibold">WhatsApp</label>
                <input
                  type="text"
                  value={newUserWhatsapp}
                  onChange={(e) => setNewUserWhatsapp(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 outline-none transition-all"
                  placeholder="55..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Plano Inicial</label>
                <select
                  value={newUserPlan}
                  onChange={(e) => setNewUserPlan(e.target.value as PlanType)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 outline-none transition-all appearance-none"
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name} - {plan.price}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button 
                onClick={() => setShowCreateUserModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateUser}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-green-900/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar Usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activation Modal */}
      {activatingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-6 shadow-2xl">
            <div>
              <h3 className="text-xl font-bold text-white">Ativar Usuário</h3>
              <p className="text-zinc-400 text-sm mt-1">
                Selecione o plano para ativar o usuário <span className="text-white font-medium">{activatingUser.name || activatingUser.email}</span>.
              </p>
              <p className="text-xs text-zinc-500 mt-2 bg-zinc-800/50 p-2 rounded border border-zinc-800">
                A assinatura será válida por 30 dias a partir de hoje.
              </p>
            </div>
            
            <div className="space-y-3">
              <label className="text-xs text-zinc-500 uppercase font-semibold">Selecione o Plano</label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
                {plans.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanForActivation(plan.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left group ${
                      selectedPlanForActivation === plan.id
                        ? 'bg-yellow-500/10 border-yellow-500'
                        : 'bg-zinc-800/30 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <div>
                      <span className={`font-medium block ${selectedPlanForActivation === plan.id ? 'text-yellow-500' : 'text-zinc-300 group-hover:text-white'}`}>
                        {plan.name}
                      </span>
                      <span className="text-xs text-zinc-500">{plan.features[0]}</span>
                    </div>
                    <span className={`text-sm font-bold ${selectedPlanForActivation === plan.id ? 'text-yellow-500' : 'text-zinc-400'}`}>
                      {plan.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button 
                onClick={() => setActivatingUser(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmActivation}
                className="px-6 py-2 bg-green-500 hover:bg-green-400 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-green-500/20 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar Ativação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
