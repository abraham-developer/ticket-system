import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{user?.full_name}</h1>
                <p className="text-slate-400">{user?.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900/50 p-6 rounded-xl border border-purple-500/20">
              <p className="text-slate-400 text-sm">Rol</p>
              <p className="text-2xl font-bold text-white capitalize">{user?.role}</p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-xl border border-purple-500/20">
              <p className="text-slate-400 text-sm">Estado</p>
              <p className="text-2xl font-bold text-green-400">
                {user?.is_active ? 'Activo' : 'Inactivo'}
              </p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-xl border border-purple-500/20">
              <p className="text-slate-400 text-sm">Miembro desde</p>
              <p className="text-lg font-bold text-white">
                {new Date(user?.created_at || '').toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-slate-400">
            <p>¡Bienvenido al Sistema de Tickets! 🎉</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}