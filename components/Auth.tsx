import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Auth() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // State for password setup modal after Google login
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State for password reset
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const ensureUserDoc = async (uid: string, email?: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, { savedCharacters: [], email: email || null, hasPassword: false }, { merge: true });
      } else {
        // Ensure email is present (merge)
        await setDoc(userRef, { email: email || null }, { merge: true });
      }
    } catch (err) {
      console.error('Erro criando/verificando documento de usuário', err);
    }
  };

  const checkIfPasswordExists = async (uid: string): Promise<boolean> => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        return data.hasPassword === true;
      }
      return false;
    } catch (err) {
      console.error('Erro verificando senha', err);
      return false;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Mark password as set when creating account with email/password
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, { 
          savedCharacters: [], 
          email: userCredential.user.email || null, 
          hasPassword: true 
        }, { merge: true });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserDoc(userCredential.user.uid, userCredential.user.email || undefined);
      }
    } catch (err: any) {
      setError("Erro: " + (err.message || err));
    }
  };

  const handleGoogle = async () => {
    try {
      setError('');
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureUserDoc(result.user.uid, result.user.email || undefined);
      
      // Check if user already has a password set
      const hasPassword = await checkIfPasswordExists(result.user.uid);
      
      if (!hasPassword) {
        // User needs to set up password
        setGoogleUser(result.user);
        setShowPasswordSetup(true);
      }
      // If hasPassword is true, user is already logged in and can use email/password or Google
    } catch (err: any) {
      setError("Erro Google: " + (err.message || err));
    }
  };

  const handlePasswordSetup = async () => {
    if (!googleUser || !googleUser.email) {
      setError("Erro: usuário não encontrado");
      return;
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    try {
      setError('');
      
      // Link email/password credential to Google account
      const emailCredential = EmailAuthProvider.credential(googleUser.email, newPassword);
      await linkWithCredential(googleUser, emailCredential);
      
      // Mark password as set in Firestore
      const userRef = doc(db, 'users', googleUser.uid);
      await setDoc(userRef, { hasPassword: true }, { merge: true });
      
      // Close modal and reset state
      setShowPasswordSetup(false);
      setGoogleUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("Este email já está em uso com outra conta");
      } else if (err.code === 'auth/credential-already-in-use') {
        setError("Esta senha já está vinculada a outra conta");
      } else {
        setError("Erro ao definir senha: " + (err.message || err));
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      setError("Por favor, insira um e-mail válido");
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      setSuccessMessage(`E-mail de recuperação enviado para ${resetEmail}`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError("Não encontramos uma conta com este e-mail");
      } else if (err.code === 'auth/invalid-email') {
        setError("E-mail inválido");
      } else {
        setError("Erro ao enviar e-mail: " + (err.message || err));
      }
    }
  };

  // Close password setup if user logs out
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setShowPasswordSetup(false);
        setGoogleUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl">
        <h1 className="text-3xl font-black text-center text-white mb-2">JUJUTSU <span className="text-purple-600">RPG</span></h1>
        <p className="text-center text-slate-400 mb-8 text-sm">
          {isRegistering ? 'Crie sua conta de Feiticeiro' : 'Acesse sua Ficha'}
        </p>

        {error && <div className="bg-red-900/30 text-red-400 p-3 rounded mb-4 text-sm border border-red-900">{error}</div>}
        {successMessage && <div className="bg-emerald-900/30 text-emerald-400 p-3 rounded mb-4 text-sm border border-emerald-900">{successMessage}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-purple-500 outline-none transition-colors duration-100"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Senha" 
            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-purple-500 outline-none transition-colors duration-100"
            value={password} onChange={e => setPassword(e.target.value)}
          />
          
          {!isRegistering && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setResetEmail(email); // Pre-fill with current email if any
                }}
                className="text-xs text-purple-400 hover:text-purple-300 underline transition-colors duration-100"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}
          
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded transition-colors duration-100 shadow-lg shadow-purple-900/20">
            {isRegistering ? 'CADASTRAR' : 'ENTRAR'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Ou continue com</span></div>
        </div>

        <button onClick={handleGoogle} className="w-full bg-white text-slate-900 font-bold py-3 rounded hover:bg-slate-200 transition-colors duration-100 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12.5S6.42 23 12.1 23c5.83 0 8.84-4.34 8.84-10.38c0-.58-.04-1.1-.14-1.52z"/></svg>
          Google
        </button>

        <p className="mt-6 text-center text-slate-500 text-sm">
          {isRegistering ? 'Já tem conta?' : 'Novo por aqui?'}
          <button onClick={() => setIsRegistering(!isRegistering)} className="ml-2 text-purple-400 hover:text-purple-300 font-bold underline transition-colors duration-100">
            {isRegistering ? 'Fazer Login' : 'Criar Conta'}
          </button>
        </p>
      </div>

      {/* Password Setup Modal */}
      {showPasswordSetup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-black text-center text-white mb-2">Definir Senha</h2>
            <p className="text-center text-slate-400 mb-6 text-sm">
              Crie uma senha para poder fazer login também com email/senha
            </p>

            {error && <div className="bg-red-900/30 text-red-400 p-3 rounded mb-4 text-sm border border-red-900">{error}</div>}

            <div className="space-y-4">
              <input 
                type="password" 
                placeholder="Nova Senha (mínimo 6 caracteres)" 
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-purple-500 outline-none transition-colors duration-100"
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)}
                autoFocus
              />
              <input 
                type="password" 
                placeholder="Confirmar Senha" 
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-purple-500 outline-none transition-colors duration-100"
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSetup();
                  }
                }}
              />
              
              <button 
                onClick={handlePasswordSetup}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded transition-colors duration-100 shadow-lg shadow-purple-900/20"
              >
                DEFINIR SENHA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetSent(false);
                setResetEmail('');
                setError('');
                setSuccessMessage('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors duration-100"
            >
              ✕
            </button>

            <h2 className="text-2xl font-black text-center text-white mb-2">Recuperar Senha</h2>
            {!resetSent ? (
              <>
                <p className="text-center text-slate-400 mb-6 text-sm">
                  Digite seu e-mail para receber um código de redefinição de senha
                </p>

                {error && <div className="bg-red-900/30 text-red-400 p-3 rounded mb-4 text-sm border border-red-900">{error}</div>}

                <div className="space-y-4">
                  <input 
                    type="email" 
                    placeholder="Seu e-mail" 
                    className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-purple-500 outline-none transition-colors duration-100"
                    value={resetEmail} 
                    onChange={e => setResetEmail(e.target.value)}
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleForgotPassword();
                      }
                    }}
                  />
                  
                  <button 
                    onClick={handleForgotPassword}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded transition-colors duration-100 shadow-lg shadow-purple-900/20"
                  >
                    ENVIAR CÓDIGO
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center space-y-4">
                  <div className="bg-emerald-900/30 text-emerald-400 p-4 rounded mb-4 text-sm border border-emerald-900">
                    ✓ E-mail enviado com sucesso!
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Enviamos um e-mail para <strong className="text-white">{resetEmail}</strong> com um link para redefinir sua senha.
                  </p>
                  <p className="text-slate-400 text-xs">
                    Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                  </p>
                  <p className="text-slate-500 text-xs">
                    Não recebeu o e-mail? Verifique sua pasta de spam.
                  </p>
                  <button 
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSent(false);
                      setResetEmail('');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded transition-colors duration-100 border border-slate-700 mt-4"
                  >
                    FECHAR
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
