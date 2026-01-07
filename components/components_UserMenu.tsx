import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import type { User } from 'firebase/auth';

type Props = {
  user: User | null;
};

export default function UserMenu({ user }: Props) {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Erro ao deslogar:', err);
      alert('Erro ao deslogar.');
    }
  };

  if (!user) {
    return null;
  }

  const nameOrEmail = user.displayName || user.email || 'Usuário';

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-slate-300 font-medium hidden sm:block">
        {nameOrEmail}
      </div>
      <button
        onClick={handleSignOut}
        className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white p-2 rounded-lg border border-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
        title="Deslogar"
      >
        Deslogar
      </button>
    </div>
  );
}