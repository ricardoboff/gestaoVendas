import React, { useState } from 'react';
import { User } from '../types';
import { loginUser, registerUser } from '../services/storageService';
import { Diamond, Loader2 } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name || !username || !password) {
          setError('Preencha todos os campos.');
          setLoading(false);
          return;
        }
        const success = await registerUser(name, username, password);
        if (success) {
          setIsRegister(false);
          setError('');
          alert('Cadastro realizado! Faça login.');
        } else {
          setError('Usuário já existe.');
        }
      } else {
        const user = await loginUser(username, password);
        if (user) {
          onLogin(user);
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

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-800">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-primary p-3 rounded-full mb-4 text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <Diamond size={32} />
          </div>
          <h1 className="text-5xl font-script text-primary mb-1">Ornare</h1>
          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-gray-400 font-semibold">Semijoias e Prata</p>
        </div>

        <h2 className="text-lg font-semibold text-gray-200 mb-4 text-center">
          {isRegister ? 'Criar Nova Conta' : 'Acesso ao Sistema'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
              <input
                type="text"
                className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-3 border placeholder-gray-500"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Usuário</label>
            <input
              type="text"
              className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-3 border placeholder-gray-500"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
            <input
              type="password"
              className="w-full bg-gray-800 border-gray-700 text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary p-3 border placeholder-gray-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegister ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-gray-400 hover:text-white hover:underline font-medium transition-colors"
          >
            {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;