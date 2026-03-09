import { Outlet, Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/auth.store';
import { useLogout } from '../../hooks/useAuth';

export function AppLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Hoş geldiniz, <strong>{user?.name}</strong>
            </span>
            <button
              onClick={logout}
              className="btn-secondary text-xs py-1.5 px-3"
              title="Çıkış Yap"
            >
              <LogOut className="w-3.5 h-3.5" />
              Çıkış Yap
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
