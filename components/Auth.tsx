import React, { useState } from 'react';
import { User } from '../types';
import { loginUser, registerUser } from '../services/storageService';
import { Diamond, Loader2, MessageCircle, Mail, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isPending, setIsPending] = useState(false); // Estado para mostrar tela de "Pendente"
  const [showPassword, setShowPassword] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin contact info
  const ADMIN_WHATSAPP = '556984030262';
  const ADMIN_EMAIL = 'ricardoboff@gmail.com';

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
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name || !username || !password || !email || !whatsapp) {
          setError('Preencha todos os campos.');
          setLoading(false);
          return;
        }
        const success = await registerUser(name, username, password, email, whatsapp);
        if (success) {
          setIsPending(true); // Mostra tela de sucesso/notificação
          setError('');
        } else {
          setError('Usuário já existe.');
        }
      } else {
        const result = await loginUser(username, password);
        if (result.user) {
          onLogin(result.user);
        } else if (result.error === 'PENDING_APPROVAL') {
          setError('Seu cadastro está aguardando aprovação do administrador.');
        } else {
          setError('Usuário ou senha inválidos.');
        }
      }
    } catch (e) {
      setError('Ocorreu um erro. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyWhatsapp = () => {
    const message = `Olá Ricardo, acabei de me cadastrar no sistema Ornare. Meu nome é ${name} e meu usuário é ${username}. Aguardo aprovação.`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleNotifyEmail = () => {
    const subject = `Novo Cadastro Ornare: ${name}`;
    const body = `Olá Ricardo,\n\nAcabei de me cadastrar no sistema Ornare.\nNome: ${name}\nUsuário: ${username}\nEmail: ${email}\nWhatsapp: ${whatsapp}\n\nAguardo aprovação.`;
    window.open(`mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-800 text-center">
          <div className="bg-yellow-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldLockIcon />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Cadastro Realizado!</h2>
          <p className="text-gray-400 mb-6">
            Por questões de segurança, seu acesso precisa ser liberado pelo administrador. Notifique-o para agilizar o processo.
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={handleNotifyWhatsapp}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} /> Avisar no WhatsApp
            </button>
            <button 
              onClick={handleNotifyEmail}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 border border-gray-700"
            >
              <Mail size={20} /> Avisar por E-mail
            </button>
          </div>

          <button 
            onClick={() => { setIsPending(false); setIsRegister(false); }}
            className="mt-6 text-primary hover:underline text-sm"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-800">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-3 rounded-full mb-4 text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <Diamond size={32} />
          </div>
          <h1 className="text-5xl font-script text-primary mb-1">Ornare</h1>
          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-gray-400 font-semibold">Semijoias e Prata</p>
        </div>

        <h2 className="text-lg font-semibold text-gray-200 mb-4 text-center">
          {isRegister ? 'Solicitar Acesso' : 'Acesso ao Sistema'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-3 border placeholder-gray-500"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
                <input
                  type="email"
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-3 border placeholder-gray-500"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-3 border placeholder-gray-500"
                  value={whatsapp}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Usuário (Login)</label>
            <input
              type="text"
              className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-3 border placeholder-gray-500"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-3 border placeholder-gray-500 pr-10"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegister ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-gray-400 hover:text-white hover:underline font-medium transition-colors"
          >
            {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Solicitar Acesso'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ShieldLockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="M12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/><path d="M12 13v4"/></svg>
);

export default Auth;