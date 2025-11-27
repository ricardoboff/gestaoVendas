import React, { useEffect, useState, useRef } from 'react';
import { User } from '../types';
import { getUsers, deleteUser, exportData, importData } from '../services/storageService';
import { Trash2, Shield, User as UserIcon, Download, Upload, Database, Loader2 } from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === currentUser.id) {
      alert("Você não pode excluir seu próprio usuário.");
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o usuário "${name}"? Esta ação não pode ser desfeita.`)) {
      setLoading(true);
      const success = await deleteUser(id);
      if (success) {
        alert("Usuário excluído com sucesso.");
        await loadUsers();
      } else {
        alert("Erro ao excluir usuário.");
        setLoading(false);
      }
    }
  };

  const handleDownloadBackup = async () => {
    setLoading(true);
    const dataStr = await exportData();
    setLoading(false);
    
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ornare_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (window.confirm("ATENÇÃO: Importar um backup irá ADICIONAR os clientes ao banco de dados. Deseja continuar?")) {
          setLoading(true);
          const success = await importData(content);
          if (success) {
            alert("Dados restaurados com sucesso! A página será recarregada.");
            window.location.reload();
          } else {
            alert("Erro ao importar arquivo.");
            setLoading(false);
          }
        }
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 relative">
       {loading && <div className="absolute inset-0 bg-gray-950/50 flex items-center justify-center z-50"><Loader2 className="animate-spin text-primary" size={32} /></div>}

      {/* User Management Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-black">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gestão de Usuários</h1>
            <p className="text-gray-400 text-sm">Painel Administrativo</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-950">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-400">Nome</th>
                  <th className="px-6 py-4 font-medium text-gray-400">Usuário (Login)</th>
                  <th className="px-6 py-4 font-medium text-gray-400">Permissão</th>
                  <th className="px-6 py-4 font-medium text-gray-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 text-white font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                        <UserIcon size={16} />
                      </div>
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{user.username}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-900/30 text-purple-300 border border-purple-900/50' 
                          : 'bg-gray-700/30 text-gray-300 border border-gray-700/50'
                      }`}>
                        {user.role === 'admin' ? 'Administrador' : 'Vendedor'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={user.id === currentUser.id}
                        className={`p-2 rounded-lg transition-colors ${
                          user.id === currentUser.id 
                            ? 'text-gray-700 cursor-not-allowed' 
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-900/10'
                        }`}
                        title={user.id === currentUser.id ? "Você não pode se excluir" : "Excluir Usuário"}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Data Backup Section */}
      <div className="space-y-6 pt-6 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Segurança de Dados</h2>
            <p className="text-gray-400 text-sm">Backup e Restauração</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Download size={20} className="text-emerald-500" />
                Fazer Backup
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Baixe um arquivo contendo todos os clientes, vendas e usuários cadastrados. Guarde este arquivo em local seguro.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                Baixar Dados (JSON)
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Upload size={20} className="text-blue-500" />
                Restaurar Backup
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Recupere seus dados enviando um arquivo de backup anterior. 
                <span className="text-red-400 block mt-1">Cuidado: Isso substituirá todos os dados atuais.</span>
              </p>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleImportBackup}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Upload size={18} />
                Carregar Arquivo
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminPanel;