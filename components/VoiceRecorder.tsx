import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Loader2, Download, Type } from 'lucide-react';
import { generateVoiceover, generateVoiceoverFromText } from '../services/geminiService';

interface VoiceRecorderProps {
  onAudioGenerated: (audioUrl: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onAudioGenerated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'record' | 'text'>('record');
  const [textInput, setTextInput] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data.split(',')[1]);
        };
        reader.onerror = reject;
      });
      
      const generatedAudioUrl = await generateVoiceover(base64String, audioBlob.type);
      setAudioUrl(generatedAudioUrl);
      onAudioGenerated(generatedAudioUrl);
    } catch (err: any) {
      console.error("Error processing audio:", err);
      setError(err.message || "Falha ao gerar vinheta.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateFromText = async () => {
    if (!textInput.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const generatedAudioUrl = await generateVoiceoverFromText(textInput);
      setAudioUrl(generatedAudioUrl);
      onAudioGenerated(generatedAudioUrl);
    } catch (err: any) {
      console.error("Error generating from text:", err);
      setError(err.message || "Falha ao gerar vinheta a partir do texto.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Mic className="w-5 h-5 text-yellow-500" />
            Gerador de Vinheta (IA)
          </h3>
          <p className="text-sm text-zinc-400">Grave sua ideia ou digite o texto para a IA criar uma locução profissional.</p>
        </div>
        
        <div className="flex bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setMode('record')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${mode === 'record' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Mic className="w-3 h-3" />
            Gravar
          </button>
          <button
            onClick={() => setMode('text')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${mode === 'text' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Type className="w-3 h-3" />
            Digitar
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-6 gap-6">
        {mode === 'record' ? (
          <>
            {!isRecording && !isProcessing && (
              <button
                onClick={startRecording}
                className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center hover:bg-red-500/20 transition-all group"
              >
                <Mic className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
              </button>
            )}

            {isRecording && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-red-500 font-medium">Gravando...</span>
                </div>
                <button
                  onClick={stopRecording}
                  className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-all group"
                >
                  <Square className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Digite o texto da sua vinheta aqui... A IA usará uma voz masculina profissional."
              className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-yellow-500/50 resize-none"
              disabled={isProcessing}
            />
            <button
              onClick={handleGenerateFromText}
              disabled={!textInput.trim() || isProcessing}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              Gerar Áudio
            </button>
          </div>
        )}

        {isProcessing && mode === 'record' && (
          <div className="flex flex-col items-center gap-4 text-yellow-500">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="font-medium">A IA está criando sua vinheta...</span>
          </div>
        )}

        {error && (
          <div className="w-full text-red-400 text-sm text-center bg-red-400/10 p-3 rounded-lg border border-red-400/20">
            {error}
          </div>
        )}

        {audioUrl && !isProcessing && !isRecording && (
          <div className="w-full space-y-4 bg-black/40 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-400">Vinheta Gerada com Sucesso!</span>
              <a 
                href={audioUrl} 
                download="vinheta_conextv.wav"
                className="flex items-center gap-2 text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors text-white"
              >
                <Download className="w-3 h-3" />
                Baixar Áudio
              </a>
            </div>
            <audio controls src={audioUrl} className="w-full h-10" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
