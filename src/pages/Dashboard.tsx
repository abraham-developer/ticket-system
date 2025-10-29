// src/pages/Dashboard.tsx - VERSIÓN ACTUALIZADA CON NAVEGACIÓN
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User, Settings, Clock, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';
import TicketList from '../components/TicketList';
import SLADashboard from '../components/SLADashboard';
import SLAAlertMonitor from '../components/SLAAlertMonitor';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentView, setCurrentView] = useState<'tickets' | 'sla'>('tickets');

  console.log('📊 Dashboard rendering - user:', user);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setShowMobileMenu(false);
  };

  const handleViewChange = (view: 'tickets' | 'sla') => {
    setCurrentView(view);
    setShowMobileMenu(false);
  };

  if (!user) {
    console.log('⚠️ No user in Dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header con Navegación */}
      <div className="bg-slate-800/90 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Título */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-white" />
                )}
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Sistema de Tickets
              </h1>
            </div>

            {/* Navegación Desktop */}
            <nav className="hidden md:flex items-center gap-2">
              <button
                onClick={() => handleViewChange('tickets')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'tickets'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Tickets</span>
              </button>

              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => handleViewChange('sla')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentView === 'sla'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Métricas SLA</span>
                  </button>

                  <button
                    onClick={() => handleNavigation('/sla-management')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      location.pathname === '/sla-management'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Config. SLA</span>
                  </button>
                </>
              )}
            </nav>

            {/* Usuario y Logout */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden sm:flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-semibold text-white">
                    {user.full_name || user.email}
                  </div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </div>
                {user.role === 'admin' && (
                  <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                    Admin
                  </span>
                )}
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>

          {/* Menú Mobile */}
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-700 py-2"
            >
              <button
                onClick={() => handleViewChange('tickets')}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  currentView === 'tickets'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Tickets</span>
              </button>

              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => handleViewChange('sla')}
                    className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                      currentView === 'sla'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Métricas SLA</span>
                  </button>

                  <button
                    onClick={() => handleNavigation('/sla-management')}
                    className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === '/sla-management'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configuración de SLA</span>
                  </button>
                </>
              )}

              {/* Info de usuario en mobile */}
              <div className="mt-4 pt-4 border-t border-slate-700 px-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">
                      {user.full_name || user.email}
                    </div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </div>
                  {user.role === 'admin' && (
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Contenido Principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto p-4 md:p-8 space-y-6"
      >
        {/* Vista de Tickets */}
        {currentView === 'tickets' && (
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-purple-500/20">
            <TicketList />
          </div>
        )}

        {/* Vista de Métricas SLA */}
        {currentView === 'sla' && user.role === 'admin' && (
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-purple-500/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-7 h-7 text-purple-400" />
              Métricas de SLA
            </h2>
            <SLADashboard />
          </div>
        )}
      </motion.div>

      {/* Monitor de Alertas SLA (flotante) */}
      <SLAAlertMonitor enabled={true} intervalSeconds={60} />
    </div>
  );
}