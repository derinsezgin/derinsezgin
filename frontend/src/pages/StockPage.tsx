import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, RefreshCw, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { stockApi, productsApi } from '../api';
import { PageSpinner, Spinner } from '../components/ui/Spinner';
import { Pagination } from '../components/ui/Pagination';
import type { StockMovementType } from '../types';
import { format } from 'date-fns';

const movementSchema = z.object({
  productId: z.string().min(1, 'Product required'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN']),
  quantity: z.coerce.number().positive('Must be positive'),
  unitPrice: z.coerce.number().min(0).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type MovementForm = z.infer<typeof movementSchema>;

const typeColors: Record<StockMovementType, string> = {
  IN: 'badge-green',
  OUT: 'badge-red',
  ADJUSTMENT: 'badge-yellow',
  RETURN: 'badge-blue',
};

const typeIcons: Record<StockMovementType, React.ElementType> = {
  IN: ArrowDown,
  OUT: ArrowUp,
  ADJUSTMENT: RefreshCw,
  RETURN: ArrowDown,
};

export function StockPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements', page, filterType],
    queryFn: () =>
      stockApi.movements({ page, limit: 20, type: (filterType as StockMovementType) || undefined }).then((r) => r.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products-for-stock', productSearch],
    queryFn: () => productsApi.list({ limit: 50, search: productSearch || undefined }).then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: { type: 'IN' },
  });

  const createMovement = useMutation({
    mutationFn: (data: MovementForm) =>
      stockApi.createMovement({
        ...data,
        unitPrice: data.unitPrice || undefined,
        reference: data.reference || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Movement recorded');
      setShowModal(false);
      reset();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error';
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock Movements</h1>
        <button onClick={() => { reset({ type: 'IN' }); setShowModal(true); }} className="btn-primary">
          Record Movement
        </button>
      </div>

      <div className="flex gap-2">
        {(['', 'IN', 'OUT', 'ADJUSTMENT', 'RETURN'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setFilterType(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filterType === t
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-left">By</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data.map((m) => {
                const Icon = typeIcons[m.type as StockMovementType];
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{m.product?.name}</p>
                      <p className="text-xs text-gray-400">{m.product?.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={typeColors[m.type as StockMovementType]}>
                        <Icon className="w-3 h-3 inline mr-1" />
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {Number(m.quantity)} {m.product?.unit}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{m.reference ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{m.user?.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {format(new Date(m.createdAt), 'dd MMM yyyy HH:mm')}
                    </td>
                  </tr>
                );
              })}
              {!data?.data.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No movements found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination && (
        <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">Record Stock Movement</h2>
              <form onSubmit={handleSubmit((d) => createMovement.mutate(d))} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Product *</label>
                  <div className="mb-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        className="input pl-9"
                        placeholder="Search product..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <select {...register('productId')} className="input">
                    <option value="">— Select product —</option>
                    {products?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — Stock: {Number(p.currentStock)} {p.unit}
                      </option>
                    ))}
                  </select>
                  {errors.productId && <p className="text-xs text-red-600 mt-0.5">{errors.productId.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                    <select {...register('type')} className="input">
                      <option value="IN">IN</option>
                      <option value="OUT">OUT</option>
                      <option value="ADJUSTMENT">ADJUSTMENT</option>
                      <option value="RETURN">RETURN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {watch('type') === 'ADJUSTMENT' ? 'New Stock Quantity (absolute) *' : 'Quantity *'}
                    </label>
                    <input {...register('quantity')} type="number" step="0.001" min="0" className="input" />
                    {errors.quantity && <p className="text-xs text-red-600 mt-0.5">{errors.quantity.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                    <input {...register('unitPrice')} type="number" step="0.01" className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Reference</label>
                    <input {...register('reference')} className="input" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea {...register('notes')} className="input" rows={2} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={createMovement.isPending} className="btn-primary flex-1">
                    {createMovement.isPending ? <Spinner className="w-4 h-4" /> : null}
                    Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
