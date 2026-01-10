import React from 'react';
import type { User } from 'firebase/auth';

type Props = { 
  user: User | null;
  onProfileClick: () => void;
};

export default function UserMenu({ user, onProfileClick }: Props) {
  if (!user) return null;

  // Get first letter for avatar fallback
  const firstLetter = (user.displayName || user.email || 'U').charAt(0).toUpperCase();

  return (
    <button
      onClick={onProfileClick}
      className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-700 hover:border-curse-500 transition-all duration-100 bg-slate-800 flex items-center justify-center"
      title="Ver perfil"
    >
      {user.photoURL ? (
        <img src={user.photoURL} alt="Perfil" className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-bold text-sm">{firstLetter}</span>
      )}
    </button>
  );
}
