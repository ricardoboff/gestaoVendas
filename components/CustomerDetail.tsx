import React, { useState } from 'react';
import { Customer, Transaction, TransactionType } from '../types';
import { ArrowLeft, Plus, Save, Trash2, Camera, Phone, MapPin, FileText, ExternalLink, Pencil, X, Loader2 } from 'lucide-react';
import ScannerModal from './ScannerModal';
import { createTransaction, saveCustomer, deleteCustomer, updateTransaction, deleteTransaction } from '../services/storageService';

interface CustomerDetailProps {
  customer: Customer;
  onBack: () => void;
  onUpdate: () => void;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer, onBack, onUpdate }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State for editing customer details
  const [editForm, setEditForm] = useState<Partial<Customer>>({
    name: customer.name,
    phonePrimary: customer.phonePrimary,
    cpf: customer.cpf || '',
    address: customer.address || '',
    notes: customer.notes || ''
  });

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [newTrans, setNewTrans] = useState({
    description: '',
    value: '',
    date: getLocalDateString(),
    type: TransactionType.SALE
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    let parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateString;
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrans.description || !newTrans.value) return;

    setLoading(true);
    await createTransaction(
      customer.id,
      newTrans.description,
      parseFloat(newTrans.value.replace(',', '.')),
      newTrans.type,
      newTrans.date
    );
    
    setLoading(false);
    setNewTrans(prev => ({ ...prev, description: '', value: '' }));
    onUpdate();
  };

  const handleScanComplete = async (items: { date: string; description: string; value: number; type: TransactionType }[]) => {
    setLoading(true);
    for (const item of items) {
      await createTransaction(customer.id, item.description, item.value, item.type, item.date);
    }
    setLoading(false);
    onUpdate();
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name || !editForm.phonePrimary) return;
    setLoading(true);

    const updatedCustomer: Customer = {
      ...customer,
      name: editForm.name,
      phonePrimary: editForm.phonePrimary,
      cpf: editForm.cpf,
      address: editForm.address,
      notes: editForm.notes
    };

    await saveCustomer(updatedCustomer);
    setLoading(false);
    setIsEditing(false);
    onUpdate();
  };

  const handleEditTransaction = (t: Transaction) => {
    setEditingTransaction({ ...t });
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    setLoading(true);

    const success = await updateTransaction(customer.id, editingTransaction);
    setLoading(false);
    
    if (success) {
      setEditingTransaction(null);
      onUpdate();
    } else {
      alert("Erro ao atualizar o lançamento.");
    }
  };

  const handleDeleteTransaction = async (tId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este lançamento?")) {
      setLoading(true);
      const success = await deleteTransaction(customer.id, tId);
      setLoading(false);
      
      if (success) {
        onUpdate();
      } else {
        alert("Erro ao excluir o lançamento.");
      }
    }
  };

  const currentBalance = Math.abs(customer.balance);
  const isBalanceZero = currentBalance < 0.10 || customer.transactions.length === 0;

  const handleDeleteCustomer = async () => {
    if (!isBalanceZero) {
      alert(`O saldo do cliente deve estar zerado para excluir.\nSaldo atual: ${formatCurrency(customer.balance)}`);
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${customer.name}? Todo o histórico será perdido e esta ação é irreversível.`)) {
      setLoading(true);
      const success = await deleteCustomer(customer.id);
      setLoading(false);
      
      if (success) {
        alert("Cliente excluído com sucesso.");
        setTimeout(() => {
           onUpdate(); 
        }, 50);
      } else {
        alert("Erro ao excluir cliente.");
      }
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const openMaps = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  // Edit Transaction Modal
  const EditTransactionModal = () => {
    if (!editingTransaction) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-800 relative">
          {loading && <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center rounded-xl z-10"><Loader2 className="animate-spin text-primary"/></div>}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Editar Lançamento</h3>
            <button onClick={() => setEditingTransaction(null)} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSaveTransaction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Data</label>
              <input
                type="date"
                required
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg p-2.5 border"
                value={editingTransaction.date}
                onChange={e => setEditingTransaction({...editingTransaction, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
              <input
                type="text"
                required
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg p-2.5 border"
                value={editingTransaction.description}
                onChange={e => setEditingTransaction({...editingTransaction, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Valor</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg p-2.5 border"
                value={editingTransaction.value}
                onChange={e => setEditingTransaction({...editingTransaction, value: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
              <select
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg p-2.5 border"
                value={editingTransaction.type}
                onChange={e => setEditingTransaction({...editingTransaction, type: e.target.value as TransactionType})}
              >
                <option value={TransactionType.SALE}>Venda (Débito)</option>
                <option value={TransactionType.PAYMENT}>Pagamento (Crédito)</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-gray-200"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
         <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800 max-w-3xl mx-auto relative">
          {loading && <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center rounded-xl z-10"><Loader2 className="animate-spin text-primary"/></div>}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Editar Cliente</h2>
            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleUpdateCustomer} className="space-y-4">
            {/* Same form as before */}
             <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 border"
                value={editForm.name}
                onChange={e => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Telefone Principal *</label>
                <input
                  type="tel"
                  required
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 border"
                  value={editForm.phonePrimary}
                  onChange={e => setEditForm({...editForm, phonePrimary: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">CPF</label>
                <input
                  type="text"
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 border"
                  value={editForm.cpf}
                  onChange={e => setEditForm({...editForm, cpf: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Endereço</label>
              <input
                type="text"
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 border"
                value={editForm.address}
                onChange={e => setEditForm({...editForm, address: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Observações / Preferências</label>
              <textarea
                rows={3}
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 border"
                value={editForm.notes}
                onChange={e => setEditForm({...editForm, notes: e.target.value})}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} /> Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {loading && <div className="absolute inset-0 bg-gray-950/50 flex items-center justify-center z-50"><Loader2 className="animate-spin text-primary" size={32} /></div>}
      
      <button 
        onClick={onBack}
        className="flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} className="mr-1" /> Voltar para Lista
      </button>

      {/* Customer Header Info */}
      <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6 relative">
         <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
            title="Editar Cadastro"
         >
            <Pencil size={20} />
         </button>

        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
          <div className="flex-1 pr-10">
            <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
            <div className="flex flex-col gap-2 mt-3 text-sm text-gray-400">
              
              <button 
                onClick={() => openWhatsApp(customer.phonePrimary)}
                className="flex items-center gap-2 hover:text-green-500 transition-colors w-fit"
                title="Abrir WhatsApp"
              >
                <Phone size={16} /> 
                <span className="font-medium">{customer.phonePrimary}</span>
                <ExternalLink size={12} className="opacity-50" />
              </button>

              {customer.cpf && <span>CPF: {customer.cpf}</span>}
              
              {customer.address && (
                <button 
                   onClick={() => openMaps(customer.address!)}
                   className="flex items-center gap-2 hover:text-blue-400 transition-colors w-fit text-left"
                   title="Ver no Google Maps"
                >
                  <MapPin size={16} className="shrink-0" /> 
                  <span>{customer.address}</span>
                  <ExternalLink size={12} className="opacity-50 shrink-0" />
                </button>
              )}
            </div>
            {customer.notes && (
               <div className="mt-4 p-3 bg-yellow-900/20 text-yellow-300 text-sm rounded-lg flex gap-2 items-start border border-yellow-900/50">
                  <FileText size={16} className="mt-0.5 shrink-0" />
                  <p>{customer.notes}</p>
               </div>
            )}
          </div>
          <div className="text-right bg-gray-950 p-4 rounded-lg min-w-[150px] self-start mt-4 md:mt-0 border border-gray-800">
            <div className="text-sm text-gray-500">Saldo Devedor</div>
            <div className={`text-3xl font-bold ${customer.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {formatCurrency(customer.balance)}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-800 pt-4 mt-2">
          <button 
            onClick={() => setShowScanner(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Camera size={18} />
            Digitalizar Caderno
          </button>
        </div>
      </div>

      {/* Manual Entry Form */}
      <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Adicionar Movimentação Manual</h3>
        <form onSubmit={handleManualAdd} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1">Data</label>
            <input 
              type="date" 
              required
              value={newTrans.date}
              onChange={e => setNewTrans({...newTrans, date: e.target.value})}
              className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-gray-400 mb-1">Descrição</label>
            <input 
              type="text" 
              placeholder="Ex: Brinco ouro"
              required
              value={newTrans.description}
              onChange={e => setNewTrans({...newTrans, description: e.target.value})}
              className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1">Tipo</label>
            <select
              value={newTrans.type}
              onChange={e => setNewTrans({...newTrans, type: e.target.value as TransactionType})}
              className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
            >
              <option value={TransactionType.SALE}>Venda (Débito)</option>
              <option value={TransactionType.PAYMENT}>Pagamento (Crédito)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1">Valor (R$)</label>
            <input 
              type="number"
              step="0.01"
              placeholder="0,00"
              required
              value={newTrans.value}
              onChange={e => setNewTrans({...newTrans, value: e.target.value})}
              className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
            />
          </div>
          <div className="md:col-span-2">
            <button 
              type="submit"
              className="w-full bg-white text-black font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
            >
              <Plus size={18} /> Adicionar
            </button>
          </div>
        </form>
      </div>

      {/* Ledger Table */}
      <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-950">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-400">Data</th>
                <th className="px-6 py-4 font-medium text-gray-400">Descrição</th>
                <th className="px-6 py-4 font-medium text-gray-400 text-right">Valor</th>
                <th className="px-6 py-4 font-medium text-gray-400 text-center">Tipo</th>
                <th className="px-6 py-4 font-medium text-gray-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[...customer.transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                <tr key={t.id} className="hover:bg-gray-800 transition-colors group">
                  <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="px-6 py-4 text-white">{t.description}</td>
                  <td className="px-6 py-4 text-white font-medium text-right">{formatCurrency(t.value)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      t.type === TransactionType.SALE 
                        ? 'bg-rose-900/30 text-rose-300' 
                        : 'bg-emerald-900/30 text-emerald-300'
                    }`}>
                      {t.type === TransactionType.SALE ? 'Venda' : 'Pagamento'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditTransaction(t)}
                        className="p-1 text-gray-500 hover:text-white"
                        title="Editar Lançamento"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="p-1 text-gray-500 hover:text-red-500"
                        title="Excluir Lançamento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {customer.transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Zone */}
      <div className="flex justify-end pt-8 pb-4">
        <button
          onClick={handleDeleteCustomer}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isBalanceZero 
              ? 'text-red-500 hover:bg-red-900/20 border border-red-900/50' 
              : 'text-gray-600 border border-gray-800 cursor-not-allowed'
          }`}
          title={!isBalanceZero ? "O saldo deve ser 0 para excluir" : "Excluir Cliente"}
        >
          <Trash2 size={16} />
          Excluir Cliente
        </button>
      </div>

      {showScanner && (
        <ScannerModal 
          onClose={() => setShowScanner(false)} 
          onScanComplete={handleScanComplete} 
        />
      )}

      {/* Render Modal if Editing */}
      <EditTransactionModal />
    </div>
  );
};

export default CustomerDetail;