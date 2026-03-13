import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QrCode, Users, Send, Clock, CheckCircle, AlertCircle, Loader2, Image as ImageIcon, Film, Calendar, Repeat, MessageSquare, LogOut } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface HistoryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  timestamp: number;
}

interface WhatsAppCampaignProps {
  history: HistoryItem[];
}

const WhatsAppCampaign: React.FC<WhatsAppCampaignProps> = ({ history }) => {
  const { user } = useAuth();
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connection State
  const [connectionState, setConnectionState] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [qrCode, setQrCode] = useState<string | null>(null);

  // Campaign State
  const [contacts, setContacts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<HistoryItem | null>(null);
  const [caption, setCaption] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(10);
  const [targetType, setTargetType] = useState<'groups' | 'contacts'>('groups');
  
  // Scheduling State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringMinutes, setRecurringMinutes] = useState(30);
  
  // Sending State
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendLogs, setSendLogs] = useState<{ target: string; status: 'success' | 'error'; message?: string; timestamp?: string }[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);

  const isConnectedRef = React.useRef(false);

  const checkConnection = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      
      if (data.connected) {
        setConnectionState('CONNECTED');
        setQrCode(null);
        if (!isConnectedRef.current) {
          isConnectedRef.current = true;
          loadContactsAndGroups();
        }
      } else if (data.qrCode) {
        setConnectionState('CONNECTING');
        setQrCode(data.qrCode);
        isConnectedRef.current = false;
      } else {
        setConnectionState('DISCONNECTED');
        setQrCode(null);
        isConnectedRef.current = false;
      }
    } catch (err) {
      console.error("Error checking status:", err);
      setConnectionState('DISCONNECTED');
      isConnectedRef.current = false;
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/whatsapp/logout', { method: 'POST' });
      setConnectionState('DISCONNECTED');
      setQrCode(null);
      setContacts([]);
      setGroups([]);
      isConnectedRef.current = false;
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleConnect = async () => {
    setConnectionState('CONNECTING');
    setError(null);
    // The backend handles QR generation automatically when disconnected.
    // The polling in useEffect will pick it up.
  };

  const loadContactsAndGroups = async () => {
    try {
      const [groupsRes, contactsRes] = await Promise.all([
        fetch('/api/whatsapp/groups'),
        fetch('/api/whatsapp/contacts')
      ]);
      
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
      }
      
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData);
      }
    } catch (err) {
      console.error("Error loading contacts/groups:", err);
    }
  };

  const toggleTarget = (id: string) => {
    setSelectedTargets(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const executeSend = async (targets: string[], media: HistoryItem | null, text: string) => {
    setIsSending(true);
    setSendProgress(0);
    setSendLogs([]);

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      try {
        const res = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: target,
            message: text,
            mediaUrl: media?.url
          })
        });
        
        if (!res.ok) throw new Error("Failed to send");

        setSendLogs(prev => [...prev, {
          target,
          status: 'success',
          timestamp: new Date().toLocaleTimeString()
        }]);
      } catch (err: any) {
        setSendLogs(prev => [...prev, {
          target,
          status: 'error',
          message: err.message,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }

      setSendProgress(((i + 1) / targets.length) * 100);

      if (i < targets.length - 1 && delaySeconds > 0) {
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }
    }

    setIsSending(false);
  };

  const activeCampaignsRef = React.useRef<any[]>([]);
  useEffect(() => {
    activeCampaignsRef.current = activeCampaigns;
  }, [activeCampaigns]);

  const startCampaign = async () => {
    if (selectedTargets.length === 0) return;
    if (!selectedMedia && !caption.trim()) {
      alert("Selecione uma mídia ou digite uma mensagem.");
      return;
    }
    
    if (isScheduled && scheduledTime) {
      const scheduleDate = new Date(scheduledTime);
      const now = new Date();
      let delayMs = scheduleDate.getTime() - now.getTime();
      
      if (delayMs < 0) {
        alert("O horário programado deve ser no futuro.");
        return;
      }

      const campaignId = Math.random().toString(36).substring(7);
      const newCampaign = {
        id: campaignId,
        targets: [...selectedTargets],
        media: selectedMedia,
        text: caption,
        scheduledTime: scheduleDate.toLocaleString(),
        isRecurring,
        recurringMinutes
      };
      
      setActiveCampaigns(prev => [...prev, newCampaign]);
      alert("Campanha programada com sucesso! Mantenha esta aba aberta.");

      const runCampaign = async () => {
        // Check if campaign was cancelled
        if (!activeCampaignsRef.current.find(c => c.id === campaignId)) {
          return;
        }

        await executeSend(newCampaign.targets, newCampaign.media, newCampaign.text);
        
        // Check again after sending in case it was cancelled during send
        if (!activeCampaignsRef.current.find(c => c.id === campaignId)) {
          return;
        }

        if (newCampaign.isRecurring) {
          const nextRun = new Date(Date.now() + newCampaign.recurringMinutes * 60000);
          setSendLogs(prev => [...prev, { target: 'SISTEMA', status: 'success', message: `Próximo envio programado para ${nextRun.toLocaleTimeString()}` }]);
          setTimeout(runCampaign, newCampaign.recurringMinutes * 60000);
        } else {
          setActiveCampaigns(prev => prev.filter(c => c.id !== campaignId));
        }
      };

      setTimeout(runCampaign, delayMs);
    } else {
      await executeSend(selectedTargets, selectedMedia, caption);
    }
  };

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (error && connectionState === 'DISCONNECTED') {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Erro de Configuração</h2>
        <p className="text-zinc-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-green-500" />
              Campanhas de WhatsApp
            </h2>
            <p className="text-sm text-zinc-400">Envie suas criações diretamente para seus contatos e grupos.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full ${
              connectionState === 'CONNECTED' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
              'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${connectionState === 'CONNECTED' ? 'bg-green-500' : 'bg-zinc-500'}`} />
              {connectionState === 'CONNECTED' ? 'Conectado' : 'Desconectado'}
            </span>
            {connectionState === 'CONNECTED' && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Desconectar
              </button>
            )}
          </div>
        </div>

        {connectionState === 'DISCONNECTED' && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-xl bg-black/20">
            <QrCode className="w-16 h-16 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Conecte seu WhatsApp</h3>
            <p className="text-zinc-400 text-center max-w-md mb-6">
              Para enviar campanhas, você precisa conectar seu WhatsApp lendo o QR Code gerado pelo sistema.
            </p>
            <button
              onClick={handleConnect}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Gerar QR Code
            </button>
          </div>
        )}

        {connectionState === 'CONNECTING' && qrCode && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-xl bg-black/20">
            <h3 className="text-lg font-medium text-white mb-4">Escaneie o QR Code</h3>
            <div className="bg-white p-4 rounded-xl mb-4">
              <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
            </div>
            <p className="text-zinc-400 text-center max-w-md flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Aguardando conexão...
            </p>
          </div>
        )}

        {connectionState === 'CONNECTED' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Setup */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-yellow-500" />
                  1. Selecione a Mídia (Opcional)
                </h3>
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-black/20 rounded-xl border border-zinc-800">
                  {history.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => setSelectedMedia(selectedMedia?.id === item.id ? null : item)}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedMedia?.id === item.id ? 'border-green-500 scale-95' : 'border-transparent hover:border-zinc-600'
                      }`}
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} className="w-full h-full object-cover" />
                      ) : (
                        <video src={item.url} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute top-1 right-1 bg-black/60 rounded px-1">
                        {item.type === 'video' ? <Film className="w-3 h-3 text-white" /> : <ImageIcon className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <p className="col-span-3 text-center text-zinc-500 py-4 text-sm">Nenhuma mídia no histórico.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-3">2. Mensagem (Obrigatório se não houver mídia)</h3>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escreva a mensagem da sua campanha..."
                  className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-green-500 resize-none"
                />
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  3. Configurações de Envio
                </h3>
                
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Delay entre envios (segundos)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 text-sm"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Recomendado: 10-30s para evitar banimento.</p>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 text-green-500 focus:ring-green-500/20 bg-zinc-900"
                    />
                    <span className="text-sm text-zinc-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Programar Envio
                    </span>
                  </label>

                  {isScheduled && (
                    <div className="space-y-3 pl-6">
                      <input
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 text-sm"
                      />
                      
                      <label className="flex items-center gap-2 cursor-pointer mt-2">
                        <input
                          type="checkbox"
                          checked={isRecurring}
                          onChange={(e) => setIsRecurring(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-700 text-green-500 focus:ring-green-500/20 bg-zinc-900"
                        />
                        <span className="text-sm text-zinc-300 flex items-center gap-2">
                          <Repeat className="w-4 h-4" />
                          Repetir Envio
                        </span>
                      </label>

                      {isRecurring && (
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Repetir a cada (minutos)</label>
                          <input
                            type="number"
                            min="30"
                            step="30"
                            value={recurringMinutes}
                            onChange={(e) => setRecurringMinutes(Math.max(30, Number(e.target.value)))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 text-sm"
                          />
                          <p className="text-[10px] text-zinc-500 mt-1">Mínimo de 30 minutos para evitar banimento.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Targets & Send */}
            <div className="space-y-6 flex flex-col">
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-yellow-500" />
                    4. Selecione os Destinos
                  </h3>
                  <div className="flex bg-zinc-900 rounded-lg p-1">
                    <button
                      onClick={() => setTargetType('groups')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${targetType === 'groups' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Grupos
                    </button>
                    <button
                      onClick={() => setTargetType('contacts')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${targetType === 'contacts' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Contatos
                    </button>
                  </div>
                </div>
                
                <div className="bg-black/20 border border-zinc-800 rounded-xl p-2 h-64 overflow-y-auto">
                  {(targetType === 'groups' ? groups : contacts).length > 0 ? (
                    <div className="space-y-1">
                      {(targetType === 'groups' ? groups : contacts).map(target => (
                        <label key={target.id || target.remoteJid} className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedTargets.includes(target.id || target.remoteJid)}
                            onChange={() => toggleTarget(target.id || target.remoteJid)}
                            className="w-4 h-4 rounded border-zinc-700 text-green-500 focus:ring-green-500/20 bg-zinc-900"
                          />
                          <span className="text-sm text-zinc-300 truncate">
                            {targetType === 'groups' 
                              ? (target.subject || target.name || target.id) 
                              : (target.pushName || target.name || (target.id || target.remoteJid)?.split('@')[0])}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                      <p className="text-sm">Nenhum {targetType === 'groups' ? 'grupo' : 'contato'} encontrado.</p>
                      <button onClick={() => loadContactsAndGroups()} className="text-xs text-green-500 mt-2 hover:underline">
                        Atualizar Lista
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-zinc-400">
                    Destinos selecionados: <strong className="text-white">{selectedTargets.length}</strong>
                  </span>
                  <span className="text-sm text-zinc-400">
                    Tempo estimado: <strong className="text-white">{Math.ceil((selectedTargets.length * delaySeconds) / 60)} min</strong>
                  </span>
                </div>

                {isSending ? (
                  <div className="space-y-3">
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${sendProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-zinc-400 animate-pulse">
                      Enviando campanha... Não feche esta página.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={startCampaign}
                    disabled={(!selectedMedia && !caption.trim()) || selectedTargets.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    <Send className="w-5 h-5" />
                    {isScheduled ? 'Programar Disparo' : 'Iniciar Disparo'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Campaigns */}
      {activeCampaigns.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            Campanhas Programadas
          </h3>
          <div className="space-y-3">
            {activeCampaigns.map(campaign => (
              <div key={campaign.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    {campaign.targets.length} destinos
                    {campaign.isRecurring && <span className="ml-2 text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">A cada {campaign.recurringMinutes} min</span>}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Programado para: {campaign.scheduledTime}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveCampaigns(prev => prev.filter(c => c.id !== campaign.id))}
                  className="text-xs text-red-500 hover:text-red-400 px-3 py-1.5 bg-red-500/10 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      {sendLogs.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-white mb-4">Logs de Envio</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sendLogs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {log.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-zinc-400">
                  {log.timestamp && <span className="text-zinc-500 mr-2">[{log.timestamp}]</span>}
                  {log.target}: <span className={log.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                    {log.status === 'success' ? 'Enviado' : `Erro - ${log.message}`}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppCampaign;
