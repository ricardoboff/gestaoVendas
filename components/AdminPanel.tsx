import React, { useEffect, useState, useRef } from 'react';
import { User } from '../types';
import { getUsers, deleteUser, exportData, importData, approveUser } from '../services/storageService';
import { Trash2, Shield, User as UserIcon, Download, Upload, Database, Loader2, CheckCircle, AlertTriangle, Copy, ExternalLink } from 'lucide-react';

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
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${name}"?`)) {
      setLoading(true);
      await deleteUser(id);
      await loadUsers();
    }
  };

  const handleApproveUser = async (id: string, name: string) => {
    if (window.confirm(`Deseja aprovar o acesso para "${name}"?`)) {
      setLoading(true);
      await approveUser(id);
      await loadUsers();
    }
  };

  const handleDownloadBackup = async () => {
    setLoading(true);
    const dataStr = await exportData();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ornare_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setLoading(false);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (window.confirm("Isso irá adicionar os dados do backup. Continuar?")) {
        setLoading(true);
        await importData(content);
        alert("Dados restaurados! Recarregando...");
        window.location.reload();
      }
    };
    reader.readAsText(file);
  };

  const pendingUsers = users.filter(u => !u.approved);
  const activeUsers = users.filter(u => u.approved);

  return (
    <div className="space-y-8 relative pb-20">
       {loading && <div className="absolute inset-0 bg-gray-950/50 flex items-center justify-center z-50"><Loader2 className="animate-spin text-primary" size={32} /></div>}

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 px-2">
            <UserIcon size={20} className="text-yellow-500" /> Aprovações Pendentes
          </h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-gray-800">
                  {pendingUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{user.name}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleApproveUser(user.id, user.name)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold mr-2">Aprovar</button>
                        <button onClick={() => handleDeleteUser(user.id, user.name)} className="text-gray-500 hover:text-rose-500 p-1.5"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Active Users */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white px-2">Usuários Ativos</h2>
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-800">
                {activeUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
                      <div>
                        <div className="font-bold text-white">{user.name} {user.id === currentUser.id && <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded ml-1 text-gray-400">VOCÊ</span>}</div>
                        <div className="text-xs text-gray-500">@{user.username} • {user.role}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.id !== currentUser.id && (
                        <button onClick={() => handleDeleteUser(user.id, user.name)} className="text-gray-600 hover:text-rose-500 p-2"><Trash2 size={18}/></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Backup Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Download size={18} className="text-emerald-500"/> Exportar Backup</h3>
          <p className="text-xs text-gray-500 mb-4">Baixe todos os dados de clientes e vendas para segurança.</p>
          <button onClick={handleDownloadBackup} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-bold border border-gray-700 transition-colors">Baixar JSON</button>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Upload size={18} className="text-blue-500"/> Importar Dados</h3>
          <p className="text-xs text-gray-500 mb-4">Restaure dados a partir de um arquivo de backup anterior.</p>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportBackup} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-bold border border-gray-700 transition-colors">Selecionar Arquivo</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;