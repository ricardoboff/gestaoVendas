import React, { useState } from 'react';
import { User } from '../types';
import { updateUserProfile } from '../services/storageService';
import { Save, User as UserIcon, Lock, Mail, Phone, Loader2, Eye, EyeOff } from 'lucide-react';

interface UserProfileProps {
  user: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [email, setEmail] = useState(user.email || '');
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- Máscaras ---
  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/^(\d{2})(\d)/g, '($1) $2') // Coloca parênteses em volta dos dois primeiros dígitos
      .replace(/(\d)(\d{4})$/, '$1-$2') // Coloca hífen entre o quarto e o quinto dígitos
      .substring(0, 15); // Limita tamanho
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(maskPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const success = await updateUserProfile(user.id, {
      email,
      whatsapp,
      password: password.trim() ? password : undefined
    });

    if (success) {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setPassword(''); // Limpa o campo de senha
    } else {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary p-2 rounded-lg text-black">
          <UserIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
          <p className="text-gray-400 text-sm">Gerencie suas informações de acesso</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 max-w-2xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Nome</label>
              <input
                type="text"
                disabled
                value={user.name}
                className="w-full bg-gray-950 border border-gray-800 text-gray-500 rounded-lg p-3 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Usuário (Login)</label>
              <input
                type="text"
                disabled
                value={user.username}
                className="w-full bg-gray-950 border border-gray-800 text-gray-500 rounded-lg p-3 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Informações de Contato</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                   <Mail size={16} /> E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                   <Phone size={16} /> WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={handlePhoneChange}
                  maxLength={15}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lock size={18} className="text-yellow-500" /> Alterar Senha
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Nova Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Deixe em branco para manter a atual"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 focus:ring-primary focus:border-primary outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Preencha apenas se desejar trocar sua senha de acesso.
              </p>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-900' : 'bg-red-900/20 text-red-400 border border-red-900'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-black font-bold px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;