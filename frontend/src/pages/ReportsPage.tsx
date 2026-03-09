import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { reportsApi } from '../api';
import { PageSpinner } from '../components/ui/Spinner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ReportsPage() {
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['report-stock'],
    queryFn: () => reportsApi.stock().then((r) => r.data.data as Array<{
      name: string; sku: string; category: string | null; currentStock: number; minStockLevel: number; stockValue: number; isLowStock: boolean;
    }>),
  });

  const { data: supplierData, isLoading: supplierLoading } = useQuery({
    queryKey: ['report-suppliers'],
    queryFn: () => reportsApi.suppliers().then((r) => r.data.data as Array<{
      id: string; name: string; totalOrders: number; completedOrders: number; totalSpend: number; activeProducts: number;
    }>),
  });

  if (stockLoading || supplierLoading) return <PageSpinner />;

  const top10Stock = [...(stockData ?? [])]
    .sort((a, b) => b.currentStock - a.currentStock)
    .slice(0, 10);

  const stockValueByCategory: Record<string, number> = {};
  stockData?.forEach((p) => {
    const cat = p.category ?? 'Kategorisiz';
    stockValueByCategory[cat] = (stockValueByCategory[cat] || 0) + p.stockValue;
  });
  const pieData = Object.entries(stockValueByCategory).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

  const totalValue = stockData?.reduce((s, p) => s + p.stockValue, 0) ?? 0;
  const lowStockCount = stockData?.filter((p) => p.isLowStock).length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Raporlar</h1>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Toplam Ürünler</p>
          <p className="text-2xl font-bold">{stockData?.length ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Toplam Stok Değeri</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(totalValue)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Düşük Stoklu Ürünler</p>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}>{lowStockCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Aktif Tedarikçiler</p>
          <p className="text-2xl font-bold">{supplierData?.length ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 by stock level */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Stoğa Göre İlk 10 Ürün</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={top10Stock} margin={{ top: 0, right: 0, bottom: 60, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="currentStock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stock value by category */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Kategoriye Göre Stok Değeri</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value).toFixed(2)} ₺`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm">Veri yok.</p>
          )}
        </div>
      </div>

      {/* Supplier table */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Tedarikçi Performansı</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Tedarikçi</th>
                <th className="px-4 py-2 text-right">Toplam Sipariş</th>
                <th className="px-4 py-2 text-right">Tamamlanan</th>
                <th className="px-4 py-2 text-right">Toplam Harcama</th>
                <th className="px-4 py-2 text-right">Ürünler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {supplierData?.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2 text-right">{s.totalOrders}</td>
                  <td className="px-4 py-2 text-right">{s.completedOrders}</td>
                  <td className="px-4 py-2 text-right">
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(s.totalSpend)}
                  </td>
                  <td className="px-4 py-2 text-right">{s.activeProducts}</td>
                </tr>
              ))}
              {!supplierData?.length && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Veri yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low stock table */}
      {lowStockCount > 0 && (
        <div className="card">
          <h2 className="font-semibold text-red-600 mb-4">Düşük Stoklu Ürünler ({lowStockCount})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Ürün</th>
                  <th className="px-4 py-2 text-left">SKU</th>
                  <th className="px-4 py-2 text-left">Kategori</th>
                  <th className="px-4 py-2 text-right">Mevcut Stok</th>
                  <th className="px-4 py-2 text-right">Min. Seviye</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stockData?.filter((p) => p.isLowStock).map((p) => (
                  <tr key={p.sku} className="bg-red-50/40">
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-2 text-gray-600">{p.category ?? '—'}</td>
                    <td className="px-4 py-2 text-right text-red-600 font-bold">{p.currentStock}</td>
                    <td className="px-4 py-2 text-right">{p.minStockLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
