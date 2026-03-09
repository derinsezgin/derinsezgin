import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, UserX, UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { usersApi } from '../api';
import { PageSpinner, Spinner } from '../components/ui/Spinner';
import { Pagination } from '../components/ui/Pagination';
import type { User, Role } from '../types';
import { format } from 'date-fns';

const createSchema = z.object({
  email: z.string().email('Geçersiz e-posta'),
  password: z.string().min(6, 'En az 6 karakter'),
  name: z.string().min(1, 'İsim gerekli'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).default('STAFF'),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).optional(),
  password: z.string().min(6).optional().or(z.literal('')),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

const roleColors: Record<Role, string> = {
  ADMIN: 'badge-red',
  MANAGER: 'badge-blue',
  STAFF: 'badge-gray',
};

export function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => usersApi.list(page, 20).then((r) => r.data),
  });

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema), defaultValues: { role: 'STAFF' } });
  const updateForm = useForm<UpdateForm>({ resolver: zodResolver(updateSchema) });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => usersApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Kullanıcı oluşturuldu'); closeModal(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateForm }) =>
      usersApi.update(id, { ...data, password: data.password || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Güncellendi'); closeModal(); },
    onError: () => toast.error('Güncelleme başarısız'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.update(id, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Güncellendi'); },
  });

  function openCreate() { setEditing(null); createForm.reset({ role: 'STAFF' }); setShowModal(true); }
  function openEdit(u: User) { setEditing(u); updateForm.reset({ name: u.name, role: u.role }); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditing(null); createForm.reset(); updateForm.reset(); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kullanıcılar</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Kullanıcı Ekle
        </button>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">İsim / E-posta</th>
                <th className="px-4 py-3 text-center">Rol</th>
                <th className="px-4 py-3 text-center">Durum</th>
                <th className="px-4 py-3 text-left">Oluşturma Tarihi</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={roleColors[u.role]}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={u.isActive ? 'badge-green' : 'badge-gray'}>
                      {u.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {format(new Date(u.createdAt), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate({ id: u.id, isActive: !u.isActive })}
                        className={`p-1.5 rounded ${u.isActive ? 'hover:bg-red-50 text-red-600' : 'hover:bg-green-50 text-green-600'}`}
                        title={u.isActive ? 'Pasife Al' : 'Aktif Et'}
                      >
                        {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination && (
        <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editing ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}</h2>
              {!editing ? (
                <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input {...createForm.register('name')} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                    <input {...createForm.register('email')} type="email" className="input" />
                    {createForm.formState.errors.email && <p className="text-xs text-red-600">{createForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                    <input {...createForm.register('password')} type="password" className="input" />
                    {createForm.formState.errors.password && <p className="text-xs text-red-600">{createForm.formState.errors.password.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rol</label>
                    <select {...createForm.register('role')} className="input">
                      <option value="STAFF">Staff</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="btn-secondary flex-1">İptal</button>
                    <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                      {createMutation.isPending ? <Spinner className="w-4 h-4" /> : null} Create
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={updateForm.handleSubmit((d) => updateMutation.mutate({ id: editing.id, data: d }))} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input {...updateForm.register('name')} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rol</label>
                    <select {...updateForm.register('role')} className="input">
                      <option value="STAFF">Staff</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Yeni Şifre (değiştirmek istemiyorsanız boş bırakın)</label>
                    <input {...updateForm.register('password')} type="password" className="input" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="btn-secondary flex-1">İptal</button>
                    <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1">
                      {updateMutation.isPending ? <Spinner className="w-4 h-4" /> : null} Update
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
