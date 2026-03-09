import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ArrowLeftRight,
  ShoppingCart,
  BarChart2,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/auth.store';

const navItems = [
  { to: '/', label: 'Gösterge Paneli', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/products', label: 'Ürünler', icon: Package, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/categories', label: 'Kategoriler', icon: Tags, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/suppliers', label: 'Tedarikçiler', icon: Truck, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/stock', label: 'Stok', icon: ArrowLeftRight, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/purchase-orders', label: 'Satın Alma', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/reports', label: 'Raporlar', icon: BarChart2, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/users', label: 'Kullanıcılar', icon: Users, roles: ['ADMIN'] },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-10">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <AlertTriangle className="w-7 h-7 text-blue-400" />
        <span className="text-lg font-bold tracking-tight">Stok Yönetimi</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems
          .filter((item) => user && item.roles.includes(user.role))
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <div className="text-xs text-gray-500 truncate">{user?.email}</div>
        <div className="text-xs font-medium text-gray-400">{user?.role}</div>
      </div>
    </aside>
  );
}
