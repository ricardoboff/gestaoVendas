import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, KeyRound, ExternalLink, Save } from 'lucide-react';
import { analyzeLedgerImage, setStoredApiKey } from '../services/geminiService';
import { TransactionType } from '../types';

interface ScannerModalProps {
  onClose: () => void;
  onScanComplete: (items: { date: string; description: string; value: number; type: TransactionType }[]) => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onScanComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessImage = async (base64String: string) => {
    setIsProcessing(true);
    setError(null);
    setNeedsApiKey(false);

    try {
      const scannedItems = await analyzeLedgerImage(base64String);
      
      const mappedItems = scannedItems.map(item => ({
        date: item.date,
        description: item.description,
        value: item.value,
        type: item.type === 'sale' ? TransactionType.SALE : TransactionType.PAYMENT
      }));

      onScanComplete(mappedItems);
      onClose();
    } catch (err: any) {
      if (err.message === "MISSING_KEY" || err.message === "INVALID_KEY") {
        setNeedsApiKey(true);
        setError(err.message === "INVALID_KEY" ? "Chave de API inválida. Verifique e tente novamente." : null);
      } else {
        setError(err instanceof Error ? err.message : "Erro desconhecido ao processar imagem.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      await handleProcessImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveKey = () => {
    if (!tempApiKey.trim()) return;
    setStoredApiKey(tempApiKey.trim());
    setNeedsApiKey(false);
    setTempApiKey('');
    // O usuário precisará selecionar a imagem novamente ou podemos guardar o blob,
    // mas por segurança e simplicidade, pedimos para selecionar novamente a imagem.
    alert("Chave salva! Tente enviar a imagem novamente.");
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 relative border border-gray-800">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Camera className="text-primary" />
          Digitalizar Caderno
        </h2>

        {needsApiKey ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
             <div className="bg-indigo-900/30 border border-indigo-500/50 p-4 rounded-lg">
                <h3 className="text-indigo-200 font-semibold mb-2 flex items-center gap-2">
                   <KeyRound size={18} /> Configuração Necessária
                </h3>
                <p className="text-sm text-gray-300 mb-3">
                   Para usar a Inteligência Artificial, você precisa de uma chave gratuita do Google Gemini.
                </p>
                <ol className="list-decimal list-inside text-xs text-gray-400 space-y-1 mb-4">
                   <li>Acesse <a href="https://aistudiocdn.google.com/app/apikey" target="_blank" className="text-primary hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink size={10}/></a></li>
                   <li>Crie uma API Key</li>
                   <li>Cole a chave abaixo</li>
                </ol>
                
                <input 
                   type="password" 
                   placeholder="Cole sua API Key aqui..."
                   className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                   value={tempApiKey}
                   onChange={e => setTempApiKey(e.target.value)}
                />
                <button 
                   onClick={handleSaveKey}
                   className="mt-3 w-full bg-primary text-black font-bold py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                   <Save size={16} /> Salvar Chave
                </button>
             </div>
             {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-6 text-sm">
              Tire uma foto ou faça upload da página do caderno. A IA irá extrair as datas, descrições e valores automaticamente.
            </p>

            {error && (
              <div className="bg-red-900/20 text-red-400 p-3 rounded-lg mb-4 text-sm border border-red-900/50">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center justify-center gap-3 w-full bg-primary text-black py-4 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" /> Processando Imagem...
                  </>
                ) : (
                  <>
                    <Camera size={24} />
                    Tirar Foto / Carregar
                  </>
                )}
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500 text-center">
              Dica: Certifique-se de que a caligrafia esteja legível e a foto bem iluminada.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScannerModal;