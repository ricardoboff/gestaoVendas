import React, { useState, useEffect } from 'react';
import { Customer, TransactionType } from '../types';
import { Search, UserPlus, ChevronRight, Trash2, X, Loader2, Flag, Mic, MicOff } from 'lucide-react';
import { saveCustomer, deleteCustomer } from '../services/storageService';

interface CustomerListProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onUpdate: () => void;
}

// Componente auxiliar para entrada de voz
const VoiceInput: React.FC<{
  onResult: (text: string) => void;
  isMasked?: boolean;
}> = ({ onResult, isMasked }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.lang = 'pt-BR';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (event: any) => {
        let transcript = event.results[0][0].transcript;
        // Se for campo mascarado (números), tenta limpar um pouco o texto
        if (isMasked) {
           transcript = transcript.replace(/[^0-9]/g, '');
        }
        onResult(transcript);
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error("Erro no reconhecimento de voz", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [onResult, isMasked]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault(); // Evita submit do form
    if (!recognition) {
      alert("Seu navegador não suporta comando de voz.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  if (!recognition) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all ${
        isListening 
          ? 'text-red-500 bg-red-900/20 animate-pulse' 
          : 'text-gray-500 hover:text-primary'
      }`}
      title="Preencher com voz"
    >
      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
    </button>
  );
};

const CustomerList: React.FC<CustomerListProps> = ({ customers, onSelectCustomer, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cpfError, setCpfError] = useState('');
  
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '', phonePrimary: '', cpf: '', address: '', notes: ''
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cpf?.includes(searchTerm) ||
    c.phonePrimary.includes(searchTerm)
  );

  // --- Máscaras e Validação ---

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15);
  };

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '') 
      .replace(/(\d{3})(\d)/, '$1.$2') 
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1'); 
  };

  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '') return true; 
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) 
      sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) 
      sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCustomer({ ...newCustomer, phonePrimary: maskPhone(e.target.value) });
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCustomer({ ...newCustomer, cpf: maskCPF(e.target.value) });
    setCpfError(''); 
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newCustomer.cpf && !validateCPF(newCustomer.cpf)) {
      setCpfError('CPF Inválido');
      return;
    }

    if (!newCustomer.name || !newCustomer.phonePrimary) return;
    
    setLoading(true);
    const customer: Customer = {
      id: '', 
      name: newCustomer.name,
      phonePrimary: newCustomer.phonePrimary,
      cpf: newCustomer.cpf,
      address: newCustomer.address,
      notes: newCustomer.notes,
      transactions: [],
      balance: 0
    };

    await saveCustomer(customer);
    setLoading(false);
    setShowAddForm(false);
    setNewCustomer({ name: '', phonePrimary: '', cpf: '', address: '', notes: '' });
    setCpfError('');
    onUpdate();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      const success = await deleteCustomer(id);
      if (success) {
        alert("Cliente excluído.");
        onUpdate();
      } else {
        alert("Não foi possível excluir o cliente.");
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Lógica para verificar atraso (> 60 dias)
  const getOverdueInfo = (customer: Customer): { isOverdue: boolean, days: number } => {
    if (customer.balance <= 0.10) return { isOverdue: false, days: 0 };
    if (!customer.transactions || customer.transactions.length === 0) return { isOverdue: false, days: 0 };

    const sortedTrans = [...customer.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const lastSale = sortedTrans.find(t => t.type === TransactionType.SALE);
    if (!lastSale) return { isOverdue: false, days: 0 };

    const lastPaymentAfterSale = sortedTrans.find(t => 
      t.type === TransactionType.PAYMENT && 
      new Date(t.date) > new Date(lastSale.date)
    );

    let referenceDate = new Date(lastSale.date);
    if (lastPaymentAfterSale) {
      referenceDate = new Date(lastPaymentAfterSale.date);
    }

    const today = new Date();
    const diffTime = Math.abs(today.getTime() - referenceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { isOverdue: diffDays > 60, days: diffDays };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-primary text-black font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <UserPlus size={18} />
          Novo Cliente
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou telefone..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-3.5 text-gray-500" size={20} />
      </div>

      {showAddForm && (
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 max-w-2xl mx-auto mb-6 relative">
          <button 
             onClick={() => setShowAddForm(false)} 
             className="absolute top-4 right-4 text-gray-500 hover:text-white"
          >
             <X size={20} />
          </button>
          <h2 className="text-xl font-bold mb-6 text-white">Novo Cliente</h2>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 pr-10 border"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                />
                <VoiceInput onResult={(text) => setNewCustomer(prev => ({ ...prev, name: text }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Telefone Principal *</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="(00) 00000-0000"
                    className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 pr-10 border"
                    value={newCustomer.phonePrimary}
                    onChange={handlePhoneChange}
                    maxLength={15}
                  />
                  <VoiceInput isMasked onResult={(text) => setNewCustomer(prev => ({ ...prev, phonePrimary: maskPhone(text) }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">CPF</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    className={`w-full bg-gray-800 border text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 pr-10 ${cpfError ? 'border-red-500' : 'border-gray-700'}`}
                    value={newCustomer.cpf}
                    onChange={handleCPFChange}
                    maxLength={14}
                  />
                  <VoiceInput isMasked onResult={(text) => setNewCustomer(prev => ({ ...prev, cpf: maskCPF(text) }))} />
                </div>
                {cpfError && <p className="text-red-500 text-xs mt-1">{cpfError}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Endereço</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 pr-10 border"
                  value={newCustomer.address}
                  onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                />
                <VoiceInput onResult={(text) => setNewCustomer(prev => ({ ...prev, address: text }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Observações / Preferências</label>
              <div className="relative">
                <textarea
                  rows={3}
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 pr-10 border"
                  placeholder="Ex: Gosta de brincos dourados..."
                  value={newCustomer.notes}
                  onChange={e => setNewCustomer({...newCustomer, notes: e.target.value})}
                />
                <VoiceInput onResult={(text) => setNewCustomer(prev => ({ ...prev, notes: prev.notes ? prev.notes + ' ' + text : text }))} />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors flex justify-center"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Salvar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 overflow-hidden">
        <ul className="divide-y divide-gray-800">
          {filteredCustomers.map(customer => {
            const { isOverdue, days } = getOverdueInfo(customer);
            
            return (
              <li 
                key={customer.id} 
                onClick={() => onSelectCustomer(customer)}
                className="p-4 hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-100">{customer.name}</h3>
                    {isOverdue && (
                      <div title={`Pagamento atrasado há ${days} dias`}>
                        <Flag size={16} className="text-red-500 fill-red-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{customer.phonePrimary}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase font-medium">Saldo</div>
                    <div className={`font-bold ${customer.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {formatCurrency(customer.balance)}
                    </div>
                  </div>
                  
                  {(Math.abs(customer.balance) < 0.10 || customer.transactions.length === 0) && (
                     <button 
                      onClick={(e) => handleDelete(e, customer.id)}
                      className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                      title="Excluir cliente"
                     >
                       <Trash2 size={18} />
                     </button>
                  )}

                  <ChevronRight size={20} className="text-gray-600" />
                </div>
              </li>
            );
          })}
          {filteredCustomers.length === 0 && (
            <li className="p-8 text-center text-gray-500">
              Nenhum cliente encontrado.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CustomerList;