import React, { useState } from 'react';
// Importa a configuração que criamos no arquivo firebase.ts na raiz da pasta src
import { auth } from '../firebase'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';

export default function Auth() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Função para Login ou Cadastro com Email/Senha
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita recarregar a página
    setError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      // Traduz alguns erros comuns do Firebase (opcional)
      let msg = err.message;
      if (msg.includes("auth/invalid-email")) msg = "Email inválido.";
      if (msg.includes("auth/user-not-found")) msg = "Usuário não encontrado.";
      if (msg.includes("auth/wrong-password")) msg = "Senha incorreta.";
      if (msg.includes("auth/email-already-in-use")) msg = "Este email já está cadastrado.";
      if (msg.includes("auth/weak-password")) msg = "A senha deve ter pelo menos 6 caracteres.";
      
      setError(msg);
    }
  };

  // Função para Login com Google
  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError("Erro no Google: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl">
        
        {/* Título Estilizado */}
        <h1 className="text-3xl font-black text-center text-white mb-2 tracking-tighter">
          JUJUTSU <span className="text-purple-600">RPG</span>
        </h1>
        <p className="text-center text-slate-400 mb-8 text-sm">
          {isRegistering ? 'Crie sua conta de Feiticeiro' : 'Acesse seu Grimório'}
        </p>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-900/30 text-red-400 p-3 rounded mb-4 text-sm border border-red-900 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 font-bold uppercase ml-1">Email</label>
            <input 
              type="email" 
              className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-purple-500 outline-none transition mt-1"
              placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="text-xs text-slate-500 font-bold uppercase ml-1">Senha</label>
            <input 
              type="password" 
              className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-purple-500 outline-none transition mt-1"
              placeholder="******"
              value={password} onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded transition shadow-lg shadow-purple-900/20 mt-2"
          >
            {isRegistering ? 'CADASTRAR' : 'ENTRAR'}
          </button>
        </form>

        {/* Divisor */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-slate-500">Ou entre com</span>
          </div>
        </div>

        {/* Botão Google */}
        <button 
          onClick={handleGoogle} 
          className="w-full bg-white text-slate-900 font-bold py-3 rounded hover:bg-slate-200 transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12.5S6.42 23 12.1 23c5.83 0 8.84-4.34 8.84-10.38c0-.58-.04-1.1-.14-1.52z"/>
          </svg>
          Google
        </button>

        {/* Alternar entre Login/Cadastro */}
        <p className="mt-6 text-center text-slate-500 text-sm">
          {isRegistering ? 'Já tem conta?' : 'Novo por aqui?'}
          <button 
            onClick={() => setIsRegistering(!isRegistering)} 
            className="ml-2 text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
          >
            {isRegistering ? 'Fazer Login' : 'Criar Conta'}
          </button>
        </p>
      </div>
    </div>
  );
}