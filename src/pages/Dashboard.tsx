import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import TicketList from '../components/TicketList';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  console.log('📊 Dashboard rendering - user:', user);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (!user) {
    console.log('⚠️ No user in Dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header del Usuario */}
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white">
                  {user.full_name || user.email}
                </h1>
                <p className="text-slate-400 text-sm">{user.email}</p>
              </div>
              {user.role === 'admin' && (
  <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full ml-2">
    Admin
  </span>
)}
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm md:text-base"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Lista de Tickets */}
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-purple-500/20">
          <TicketList />
        </div>
      </motion.div>
    </div>
  );
}