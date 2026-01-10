import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { ArrowLeft, LogOut, Edit2, Check, X } from 'lucide-react';

type Props = {
  user: User;
  onBack: () => void;
};

export default function UserProfile({ user, onBack }: Props) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(displayName);
  const [isSaving, setIsSaving] = useState(false);

  // Load display name from Firestore
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const savedName = userData.displayName || user.displayName || '';
          setDisplayName(savedName);
          setTempName(savedName);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do usuário:', err);
      }
    };
    loadUserData();
  }, [user.uid, user.displayName]);

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      alert('O nome de usuário não pode estar vazio');
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { displayName: tempName.trim() }, { merge: true });
      setDisplayName(tempName.trim());
      setIsEditing(false);
    } catch (err) {
      console.error('Erro ao salvar nome:', err);
      alert('Erro ao salvar nome de usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setTempName(displayName);
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    if (confirm('Deseja realmente deslogar?')) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Erro ao deslogar:', err);
        alert('Erro ao deslogar.');
      }
    }
  };

  const firstLetter = (displayName || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold uppercase tracking-wider mb-6 transition-colors duration-100"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-white mb-8 text-center">
            PERFIL DE <span className="text-curse-500">USUÁRIO</span>
          </h1>

          {/* Profile Picture */}
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-700 bg-slate-800 flex items-center justify-center">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-5xl">{firstLetter}</span>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-6">
            {/* Email */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Email
              </label>
              <div className="text-white font-medium">{user.email}</div>
            </div>

            {/* Display Name */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Nome de Usuário
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-curse-500 focus:outline-none"
                    placeholder="Seu nome de usuário"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSaving}
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors duration-100 disabled:opacity-50"
                    title="Salvar"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors duration-100 disabled:opacity-50"
                    title="Cancelar"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-white font-medium">{displayName || 'Sem nome definido'}</div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-slate-400 hover:text-curse-400 transition-colors duration-100"
                    title="Editar nome"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* UID (read-only) */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                ID do Usuário
              </label>
              <div className="text-slate-400 font-mono text-sm break-all">{user.uid}</div>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <button
              onClick={handleSignOut}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors duration-100 flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
            >
              <LogOut size={20} /> Deslogar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
