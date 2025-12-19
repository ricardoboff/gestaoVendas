
import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { getExpenses, saveExpense, deleteExpense } from '../services/storageService';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  X, 
  Loader2,
  Filter,
  ArrowUpRight
} from 'lucide-react';

const ExpensePanel: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentModal, setPaymentModal] = useState<Expense | null>(null);

  const [formData, setFormData] = useState({
    category: 'Fornecedor',
    description: '',
    value: '',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const [paymentData, setPaymentData] = useState({
    paidDate: new Date().toISOString().split('T')[0],
    paidValue: ''
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    const data = await getExpenses();
    setExpenses(data);
    setLoading(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await saveExpense({
      category: formData.category,
      description: formData.description,
      value: parseFloat(formData.value),
      dueDate: formData.dueDate
    });
    setFormData({ ...formData, description: '', value: '' });
    setShowAddForm(false);
    await loadExpenses();
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal) return;
    setLoading(true);
    await saveExpense({
      id: paymentModal.id,
      paidDate: paymentData.paidDate,
      paidValue: parseFloat(paymentData.paidValue)
    });
    setPaymentModal(null);
    await loadExpenses();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja excluir esta despesa?")) {
      setLoading(true);
      await deleteExpense(id);
      await loadExpenses();
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (date: string) => {
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  };

  const categories = ["Fornecedor", "Aluguel", "Marketing", "Energia/Água", "Internet", "Impostos", "Outros"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Despesas & Débitos</h1>
          <p className="text-gray-400 text-sm">Controle de saídas e pagamentos da empresa</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-primary text-black font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          Nova Despesa
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Pendente</div>
          <div className="text-2xl font-bold text-rose-500">
            {formatCurrency(expenses.filter(e => e.status !== 'PAID').reduce((acc, e) => acc + e.value, 0))}
          </div>
        </div>
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Pago (Mês)</div>
          <div className="text-2xl font-bold text-emerald-500">
            {formatCurrency(expenses.filter(e => e.status === 'PAID').reduce((acc, e) => acc + (e.paidValue || 0), 0))}
          </div>
        </div>
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <div className="text-gray-500 text-xs font-bold uppercase mb-1">Próximo Vencimento</div>
          <div className="text-xl font-bold text-white">
            {expenses.find(e => e.status !== 'PAID')?.dueDate ? formatDate(expenses.find(e => e.status !== 'PAID')!.dueDate) : '--/--/----'}
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl max-w-2xl mx-auto relative">
          <button onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
            <X size={20} />
          </button>
          <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
            <ArrowUpRight className="text-rose-500" /> Registrar Nova Conta
          </h2>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Categoria</label>
                <select 
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg p-2.5 border"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Vencimento</label>
                <input 
                  type="date" 
                  required
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg p-2.5 border"
                  value={formData.dueDate}
                  onChange={e => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Descrição / Fornecedor</label>
              <input 
                type="text" 
                required
                placeholder="Ex: Pagamento parcela fornecedor Joias"
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg p-2.5 border"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Valor (R$)</label>
              <input 
                type="number" 
                step="0.01"
                required
                placeholder="0,00"
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg p-2.5 border text-lg font-bold"
                value={formData.value}
                onChange={e => setFormData({...formData, value: e.target.value})}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex justify-center items-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Lançar Despesa'}
            </button>
          </form>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-950">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-400">Vencimento</th>
                <th className="px-6 py-4 font-medium text-gray-400">Categoria</th>
                <th className="px-6 py-4 font-medium text-gray-400">Descrição</th>
                <th className="px-6 py-4 font-medium text-gray-400 text-right">Valor</th>
                <th className="px-6 py-4 font-medium text-gray-400 text-center">Status</th>
                <th className="px-6 py-4 font-medium text-gray-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {expenses.map(expense => (
                <tr key={expense.id} className="hover:bg-gray-800 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" />
                      <span className={expense.status === 'OVERDUE' ? 'text-rose-500 font-bold' : 'text-gray-300'}>
                        {formatDate(expense.dueDate)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-400 text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{expense.description}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-white font-bold">{formatCurrency(expense.value)}</div>
                    {expense.paidValue && (
                      <div className="text-emerald-500 text-[10px]">Pago: {formatCurrency(expense.paidValue)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {expense.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 text-xs border border-emerald-900/50">
                        <CheckCircle size={10} /> Pago
                      </span>
                    ) : expense.status === 'OVERDUE' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-900/30 text-rose-400 text-xs border border-rose-900/50 animate-pulse">
                        <AlertCircle size={10} /> Atrasado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400 text-xs border border-yellow-900/50">
                        <Clock size={10} /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {expense.status !== 'PAID' && (
                        <button 
                          onClick={() => {
                            setPaymentModal(expense);
                            setPaymentData({ paidDate: new Date().toISOString().split('T')[0], paidValue: expense.value.toString() });
                          }}
                          className="p-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                          title="Informar Pagamento"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-gray-500 hover:text-rose-500 hover:bg-rose-900/20 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhuma despesa registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-sm w-full relative">
            <h3 className="text-lg font-bold text-white mb-2">Confirmar Pagamento</h3>
            <p className="text-gray-400 text-sm mb-6">{paymentModal.description}</p>
            
            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data do Pagamento</label>
                <input 
                  type="date" 
                  required
                  className="w-full bg-gray-800 border-gray-700 text-white rounded p-2 border"
                  value={paymentData.paidDate}
                  onChange={e => setPaymentData({...paymentData, paidDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Valor Pago (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  className="w-full bg-gray-800 border-gray-700 text-white rounded p-2 border font-bold"
                  value={paymentData.paidValue}
                  onChange={e => setPaymentData({...paymentData, paidValue: e.target.value})}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setPaymentModal(null)} className="flex-1 px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensePanel;
