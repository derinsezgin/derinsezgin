import { useQuery } from '@tanstack/react-query';
import { Package, Tags, Truck, ShoppingCart, AlertTriangle, TrendingDown } from 'lucide-react';
import { reportsApi } from '../api';
import { PageSpinner } from '../components/ui/Spinner';
import type { DashboardStats } from '../types';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsApi.dashboard().then((r) => r.data.data as DashboardStats),
    refetchInterval: 60_000,
  });

  if (isLoading) return <PageSpinner />;

  const stats = data!;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gösterge Paneli</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aktif Ürünler" value={stats.activeProducts} icon={Package} color="bg-blue-500" />
        <StatCard label="Kategoriler" value={stats.totalCategories} icon={Tags} color="bg-purple-500" />
        <StatCard label="Aktif Tedarikçiler" value={stats.totalSuppliers} icon={Truck} color="bg-green-500" />
        <StatCard label="Açık Siparişler" value={stats.openOrders} icon={ShoppingCart} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-gray-900">
              Düşük Stok ({stats.lowStockCount})
            </h2>
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-500">Tüm ürünlerin stoğu yeterli.</p>
          ) : (
            <div className="space-y-2">
              {stats.lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="badge-red">
                      {Number(p.currentStock)} {p.unit}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">min: {Number(p.minStockLevel)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Movements */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Son Hareketler</h2>
          </div>
          {stats.recentMovements.length === 0 ? (
            <p className="text-sm text-gray-500">Son hareket bulunmuyor.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.product?.name}</p>
                    <p className="text-xs text-gray-500">{m.user?.name} tarafından</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={
                        m.type === 'IN'
                          ? 'badge-green'
                          : m.type === 'OUT'
                          ? 'badge-red'
                          : 'badge-yellow'
                      }
                    >
                      {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : '~'}
                      {Number(m.quantity)} {m.product?.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <p className="text-sm text-gray-500">
          Toplam stok değeri:{' '}
          <strong className="text-gray-900">
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
              Number(stats.totalStockValue)
            )}
          </strong>
        </p>
      </div>
    </div>
  );
}
