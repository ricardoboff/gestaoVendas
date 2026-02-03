import React, { useMemo } from 'react';
import { Customer, TransactionType, Expense } from '../types';
import { Users, TrendingUp, TrendingDown, DollarSign, Receipt } from 'lucide-react';

interface DashboardProps {
  customers: Customer[];
  expenses: Expense[];
  onSelectCustomer: (customer: Customer) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ customers, expenses, onSelectCustomer }) => {
  const stats = useMemo(() => {
    let totalReceivables = 0;
    let totalSales = 0;
    let totalPayments = 0;

    customers.forEach(c => {
      totalReceivables += c.balance;
      c.transactions.forEach(t => {
        if (t.type === TransactionType.SALE) totalSales += t.value;
        else totalPayments += t.value;
      });
    });

    const totalExpenses = expenses.reduce((acc, e) => acc + e.value, 0);

    return { totalReceivables, totalSales, totalPayments, totalExpenses };
  }, [customers, expenses]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Painel Geral</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800 flex flex-col">
          <div className="text-gray-400 text-sm font-medium mb-1 flex items-center gap-2">
            <Users size={16} /> Clientes Ativos
          </div>
          <div className="text-2xl font-bold text-white">{customers.length}</div>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800 flex flex-col">
          <div className="text-rose-400 text-sm font-medium mb-1 flex items-center gap-2">
            <TrendingUp size={16} /> A Receber
          </div>
          <div className="text-2xl font-bold text-rose-500">{formatCurrency(stats.totalReceivables)}</div>
          <div className="text-xs text-gray-500 mt-1">Saldo devedor</div>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800 flex flex-col">
          <div className="text-blue-400 text-sm font-medium mb-1 flex items-center gap-2">
            <DollarSign size={16} /> Total Vendido
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalSales)}</div>
          <div className="text-xs text-gray-500 mt-1">Desde o início</div>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800 flex flex-col">
          <div className="text-emerald-400 text-sm font-medium mb-1 flex items-center gap-2">
            <TrendingDown size={16} /> Total Recebido
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalPayments)}</div>
          <div className="text-xs text-gray-500 mt-1">Desde o início</div>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800 flex flex-col">
          <div className="text-orange-400 text-sm font-medium mb-1 flex items-center gap-2">
            <Receipt size={16} /> Total Despesas
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalExpenses)}</div>
          <div className="text-xs text-gray-500 mt-1">Custos totais</div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Maiores Devedores</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="pb-3 font-medium">Nome</th>
                <th className="pb-3 font-medium">Telefone</th>
                <th className="pb-3 font-medium text-right">Saldo Devedor</th>
              </tr>
            </thead>
            <tbody>
              {customers
                .sort((a, b) => b.balance - a.balance)
                .slice(0, 5)
                .map(customer => (
                  <tr 
                    key={customer.id} 
                    onClick={() => onSelectCustomer(customer)}
                    className="group hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800 last:border-0"
                  >
                    <td className="py-3 font-medium text-gray-200 group-hover:text-white">{customer.name}</td>
                    <td className="py-3 text-gray-500">{customer.phonePrimary}</td>
                    <td className="py-3 text-right font-bold text-rose-500">
                      {formatCurrency(customer.balance)}
                    </td>
                  </tr>
                ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;