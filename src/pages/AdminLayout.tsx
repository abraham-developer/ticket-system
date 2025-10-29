// src/pages/AdminLayout.tsx
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User,  ArrowLeft } from 'lucide-react';
import SLAAlertMonitor from '../components/SLAAlertMonitor';

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
 

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/90 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Navegación */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Administración
              </h1>
            </div>

            {/* Usuario */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-semibold text-white">
                    {user.full_name || user.email}
                  </div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto p-4 md:p-8"
      >
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-purple-500/20">
          <Outlet />
        </div>
      </motion.div>

      {/* Monitor de Alertas */}
      <SLAAlertMonitor enabled={true} intervalSeconds={60} />
    </div>
  );
}