import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Check, X, Truck } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { purchaseOrdersApi, suppliersApi, productsApi } from '../api';
import { PageSpinner, Spinner } from '../components/ui/Spinner';
import { Pagination } from '../components/ui/Pagination';
import type { PurchaseOrder, PurchaseOrderStatus } from '../types';
import { format } from 'date-fns';
import { useAuthStore } from '../store/auth.store';

const statusColors: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'badge-gray',
  SENT: 'badge-blue',
  PARTIAL: 'badge-yellow',
  RECEIVED: 'badge-green',
  CANCELLED: 'badge-red',
};

const createSchema = z.object({
  supplierId: z.string().min(1, 'Supplier required'),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product required'),
    orderedQuantity: z.coerce.number().positive(),
    unitPrice: z.coerce.number().min(0),
  })).min(1, 'Add at least one item'),
});

type CreateForm = z.infer<typeof createSchema>;

export function PurchaseOrdersPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page, filterStatus],
    queryFn: () =>
      purchaseOrdersApi
        .list({ page, limit: 20, status: (filterStatus as PurchaseOrderStatus) || undefined })
        .then((r) => r.data),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => suppliersApi.list(1, 100).then((r) => r.data.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productsApi.list({ limit: 200 }).then((r) => r.data.data),
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { items: [{ productId: '', orderedQuantity: 1, unitPrice: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) =>
      purchaseOrdersApi.create({
        ...data,
        expectedDate: data.expectedDate || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order created');
      setShowModal(false);
      reset();
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      purchaseOrdersApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const receiveMutation = useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.receive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Order received — stock updated');
      setDetailOrder(null);
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error'),
  });

  const statuses: Array<{ value: string; label: string }> = [
    { value: '', label: 'All' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SENT', label: 'Sent' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'RECEIVED', label: 'Received' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        {isAdminOrManager && (
          <button onClick={() => { reset({ items: [{ productId: '', orderedQuantity: 1, unitPrice: 0 }] }); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> New Order
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => { setFilterStatus(s.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filterStatus === s.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {s.label}
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
                <th className="px-4 py-3 text-left">Order #</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left">Order Date</th>
                <th className="px-4 py-3 text-left">Expected</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{o.supplier?.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={statusColors[o.status]}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {format(new Date(o.orderDate), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {o.expectedDate ? format(new Date(o.expectedDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{o.items?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setDetailOrder(o)}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {isAdminOrManager && o.status === 'DRAFT' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: o.id, status: 'SENT' })}
                          className="p-1.5 hover:bg-green-50 rounded text-green-600"
                          title="Mark as Sent"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isAdminOrManager && (o.status === 'SENT' || o.status === 'PARTIAL') && (
                        <button
                          onClick={() => receiveMutation.mutate(o.id)}
                          className="p-1.5 hover:bg-green-50 rounded text-green-600"
                          title="Receive"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isAdminOrManager && (o.status === 'DRAFT' || o.status === 'SENT') && (
                        <button
                          onClick={() => {
                            if (confirm('Cancel this order?')) statusMutation.mutate({ id: o.id, status: 'CANCELLED' });
                          }}
                          className="p-1.5 hover:bg-red-50 rounded text-red-600"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination && (
        <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />
      )}

      {/* Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{detailOrder.orderNumber}</h2>
                <button onClick={() => setDetailOrder(null)} className="p-1.5 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Supplier</p>
                  <p className="font-medium">{detailOrder.supplier?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={statusColors[detailOrder.status]}>{detailOrder.status}</span>
                </div>
                <div>
                  <p className="text-gray-500">Order Date</p>
                  <p>{format(new Date(detailOrder.orderDate), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Expected Date</p>
                  <p>{detailOrder.expectedDate ? format(new Date(detailOrder.expectedDate), 'dd MMM yyyy') : '—'}</p>
                </div>
              </div>
              {detailOrder.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">{detailOrder.notes}</div>
              )}
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">Ordered</th>
                    <th className="px-3 py-2 text-right">Received</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detailOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">{item.product?.name}</td>
                      <td className="px-3 py-2 text-right">{Number(item.orderedQuantity)} {item.product?.unit}</td>
                      <td className="px-3 py-2 text-right">{Number(item.receivedQuantity)} {item.product?.unit}</td>
                      <td className="px-3 py-2 text-right">{Number(item.unitPrice).toFixed(2)} ₺</td>
                      <td className="px-3 py-2 text-right font-medium">{Number(item.totalPrice).toFixed(2)} ₺</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-right font-bold">
                Total: {detailOrder.items?.reduce((s, i) => s + Number(i.totalPrice), 0).toFixed(2)} ₺
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">New Purchase Order</h2>
              <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Supplier *</label>
                    <select {...register('supplierId')} className="input">
                      <option value="">— Select supplier —</option>
                      {suppliers?.filter((s) => s.isActive).map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    {errors.supplierId && <p className="text-xs text-red-600">{errors.supplierId.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Expected Date</label>
                    <input {...register('expectedDate')} type="date" className="input" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea {...register('notes')} className="input" rows={2} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-700">Items *</label>
                    <button
                      type="button"
                      onClick={() => append({ productId: '', orderedQuantity: 1, unitPrice: 0 })}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      + Add item
                    </button>
                  </div>
                  {errors.items?.root && <p className="text-xs text-red-600 mb-1">{errors.items.root.message}</p>}
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <select {...register(`items.${index}.productId`)} className="input text-xs">
                            <option value="">— Product —</option>
                            {products?.map((p) => (
                              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <input
                            {...register(`items.${index}.orderedQuantity`)}
                            type="number"
                            step="0.001"
                            className="input text-xs"
                            placeholder="Qty"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            {...register(`items.${index}.unitPrice`)}
                            type="number"
                            step="0.01"
                            className="input text-xs"
                            placeholder="Unit price"
                          />
                        </div>
                        <div className="col-span-1">
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded w-full"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                    {createMutation.isPending ? <Spinner className="w-4 h-4" /> : null}
                    Create Order
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
