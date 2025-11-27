import React, { useState } from 'react';
import { Customer } from '../types';
import { Search, UserPlus, ChevronRight, Trash2, X, Loader2 } from 'lucide-react';
import { saveCustomer, deleteCustomer } from '../services/storageService';

interface CustomerListProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onUpdate: () => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, onSelectCustomer, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '', phonePrimary: '', cpf: '', address: '', notes: ''
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cpf?.includes(searchTerm) ||
    c.phonePrimary.includes(searchTerm)
  );

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phonePrimary) return;
    
    setLoading(true);
    const customer: Customer = {
      // ID será gerado pelo Firebase se não enviado, mas aqui iniciamos
      // o objeto sem ID e o service cuida disso
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
              <input
                type="text"
                required
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 border"
                value={newCustomer.name}
                onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Telefone Principal *</label>
                <input
                  type="tel"
                  required
                  placeholder="(00) 00000-0000"
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 border"
                  value={newCustomer.phonePrimary}
                  onChange={e => setNewCustomer({...newCustomer, phonePrimary: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">CPF</label>
                <input
                  type="text"
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 border"
                  value={newCustomer.cpf}
                  onChange={e => setNewCustomer({...newCustomer, cpf: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Endereço</label>
              <input
                type="text"
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 border"
                value={newCustomer.address}
                onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Observações / Preferências</label>
              <textarea
                rows={3}
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2.5 border"
                placeholder="Ex: Gosta de brincos dourados..."
                value={newCustomer.notes}
                onChange={e => setNewCustomer({...newCustomer, notes: e.target.value})}
              />
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
          {filteredCustomers.map(customer => (
            <li 
              key={customer.id} 
              onClick={() => onSelectCustomer(customer)}
              className="p-4 hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-100">{customer.name}</h3>
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
          ))}
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