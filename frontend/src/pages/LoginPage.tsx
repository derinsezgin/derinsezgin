import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';
import { useAuthStore } from '../store/auth.store';
import { Spinner } from '../components/ui/Spinner';

const schema = z.object({
  email: z.string().email('Geçersiz e-posta'),
  password: z.string().min(1, 'Şifre gerekli'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const token = useAuthStore((s) => s.token);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (token) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Stok Yönetim Sistemi</h1>
        <p className="text-sm text-gray-500 mb-6">Hesabınıza giriş yapın</p>

        <form onSubmit={handleSubmit((data) => login.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              {...register('email')}
              type="email"
              className="input"
              placeholder="admin@inventory.com"
              autoComplete="email"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input
              {...register('password')}
              type="password"
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="btn-primary w-full"
          >
            {login.isPending ? <Spinner className="w-4 h-4" /> : null}
            Giriş Yap
          </button>
        </form>

        <p className="mt-4 text-xs text-center text-gray-400">
          Varsayılan: admin@inventory.com / admin123
        </p>
      </div>
    </div>
  );
}
