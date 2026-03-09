import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { categoriesApi } from '../api';
import { PageSpinner, Spinner } from '../components/ui/Spinner';
import type { Category } from '../types';

const schema = z.object({
  name: z.string().min(1, 'İsim gerekli'),
  slug: z.string().min(1, 'Slug gerekli').regex(/^[a-z0-9-]+$/, 'Sadece küçük harf, rakam ve tire kullanın'),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function CategoryRow({ cat, depth, onEdit, onDelete }: {
  cat: Category;
  depth: number;
  onEdit: (c: Category) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-1" style={{ paddingLeft: depth * 20 }}>
            {depth > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            <span className="font-medium text-gray-900">{cat.name}</span>
          </div>
          <p className="text-xs text-gray-400 pl-4" style={{ paddingLeft: (depth * 20) + 16 }}>{cat.slug}</p>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{cat.description ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-gray-400">{cat.children?.length ?? 0} alt kategori</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => onEdit(cat)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(cat.id, cat.name)} className="p-1.5 hover:bg-red-50 rounded text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {cat.children?.map((child) => (
        <CategoryRow key={child.id} cat={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
}

export function CategoriesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => categoriesApi.create({ ...data, parentId: data.parentId || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Oluşturuldu'); closeModal(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormData> }) =>
      categoriesApi.update(id, { ...data, parentId: data.parentId || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Güncellendi'); closeModal(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Silindi'); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error'),
  });

  function openCreate() { setEditing(null); reset({}); setShowModal(true); }
  function openEdit(c: Category) { setEditing(c); reset({ name: c.name, slug: c.slug, description: c.description ?? '', parentId: c.parentId ?? '' }); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditing(null); reset(); }

  function handleDelete(id: string, name: string) {
    if (confirm(`"${name}" kategorisi silinsin mi?`)) deleteMutation.mutate(id);
  }

  function onSubmit(data: FormData) {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  }

  // Flat list for parent select (excluding editing item)
  function flatCategories(cats: Category[], depth = 0): Array<{ id: string; name: string; depth: number }> {
    return cats.flatMap((c) => [
      { id: c.id, name: c.name, depth },
      ...(c.children ? flatCategories(c.children, depth + 1) : []),
    ]);
  }

  const allFlat = categories ? flatCategories(categories) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kategoriler</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Kategori Ekle
        </button>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">İsim / Slug</th>
                <th className="px-4 py-3 text-left">Açıklama</th>
                <th className="px-4 py-3 text-left">Alt Kategoriler</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories?.map((c) => (
                <CategoryRow key={c.id} cat={c} depth={0} onEdit={openEdit} onDelete={handleDelete} />
              ))}
              {!categories?.length && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Henüz kategori yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editing ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                  <input {...register('name')} className="input" />
                  {errors.name && <p className="text-xs text-red-600 mt-0.5">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Slug *</label>
                  <input {...register('slug')} className="input" placeholder="e.g. electronics" />
                  {errors.slug && <p className="text-xs text-red-600 mt-0.5">{errors.slug.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea {...register('description')} className="input" rows={2} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Parent Category</label>
                  <select {...register('parentId')} className="input">
                    <option value="">— None (top-level) —</option>
                    {allFlat.filter((c) => c.id !== editing?.id).map((c) => (
                      <option key={c.id} value={c.id}>
                        {'  '.repeat(c.depth)}{c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">İptal</button>
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary flex-1">
                    {(createMutation.isPending || updateMutation.isPending) ? <Spinner className="w-4 h-4" /> : null}
                    {editing ? 'Güncelle' : 'Oluştur'}
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
