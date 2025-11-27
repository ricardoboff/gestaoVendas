import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Check } from 'lucide-react';
import { analyzeLedgerImage } from '../services/geminiService';
import { TransactionType } from '../types';

interface ScannerModalProps {
  onClose: () => void;
  onScanComplete: (items: { date: string; description: string; value: number; type: TransactionType }[]) => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onScanComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const scannedItems = await analyzeLedgerImage(base64String);
        
        // Map backend types to frontend Enum
        const mappedItems = scannedItems.map(item => ({
          date: item.date,
          description: item.description,
          value: item.value,
          type: item.type === 'sale' ? TransactionType.SALE : TransactionType.PAYMENT
        }));

        onScanComplete(mappedItems);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido ao processar imagem.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
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
      </div>
    </div>
  );
};

export default ScannerModal;