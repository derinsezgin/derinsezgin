import apiClient from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  AuthResponse,
  User,
  Category,
  Supplier,
  Product,
  StockMovement,
  PurchaseOrder,
  DashboardStats,
  Role,
  StockMovementType,
  PurchaseOrderStatus,
} from '../types';

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }),
  me: () => apiClient.get<ApiResponse<User>>('/auth/me'),
};

// Users
export const usersApi = {
  list: (page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<User>>('/users', { params: { page, limit } }),
  get: (id: string) => apiClient.get<ApiResponse<User>>(`/users/${id}`),
  create: (data: { email: string; password: string; name: string; role: Role }) =>
    apiClient.post<ApiResponse<User>>('/users', data),
  update: (id: string, data: Partial<{ name: string; role: Role; isActive: boolean; password: string }>) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/users/${id}`),
};

// Categories
export const categoriesApi = {
  list: () => apiClient.get<ApiResponse<Category[]>>('/categories'),
  get: (id: string) => apiClient.get<ApiResponse<Category>>(`/categories/${id}`),
  create: (data: { name: string; slug: string; description?: string; parentId?: string }) =>
    apiClient.post<ApiResponse<Category>>('/categories', data),
  update: (id: string, data: Partial<{ name: string; slug: string; description: string; parentId: string | null }>) =>
    apiClient.put<ApiResponse<Category>>(`/categories/${id}`, data),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/categories/${id}`),
};

// Suppliers
export const suppliersApi = {
  list: (page = 1, limit = 20, search?: string) =>
    apiClient.get<PaginatedResponse<Supplier>>('/suppliers', { params: { page, limit, search } }),
  get: (id: string) => apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`),
  orders: (id: string, page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<PurchaseOrder>>(`/suppliers/${id}/orders`, { params: { page, limit } }),
  create: (data: Partial<Supplier>) => apiClient.post<ApiResponse<Supplier>>('/suppliers', data),
  update: (id: string, data: Partial<Supplier>) =>
    apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/suppliers/${id}`),
};

// Products
export const productsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; categoryId?: string; supplierId?: string }) =>
    apiClient.get<PaginatedResponse<Product>>('/products', { params: { page: 1, limit: 20, ...params } }),
  lowStock: () => apiClient.get<ApiResponse<Product[]>>('/products/low-stock'),
  get: (id: string) => apiClient.get<ApiResponse<Product>>(`/products/${id}`),
  movements: (id: string, page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<StockMovement>>(`/products/${id}/movements`, { params: { page, limit } }),
  create: (data: Partial<Product>) => apiClient.post<ApiResponse<Product>>('/products', data),
  update: (id: string, data: Partial<Product>) =>
    apiClient.put<ApiResponse<Product>>(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/products/${id}`),
};

// Stock
export const stockApi = {
  movements: (params?: { page?: number; limit?: number; productId?: string; type?: StockMovementType; startDate?: string; endDate?: string }) =>
    apiClient.get<PaginatedResponse<StockMovement>>('/stock/movements', { params }),
  movement: (id: string) => apiClient.get<ApiResponse<StockMovement>>(`/stock/movements/${id}`),
  createMovement: (data: {
    productId: string;
    type: StockMovementType;
    quantity: number;
    unitPrice?: number;
    reference?: string;
    notes?: string;
  }) => apiClient.post<ApiResponse<StockMovement>>('/stock/movements', data),
};

// Purchase Orders
export const purchaseOrdersApi = {
  list: (params?: { page?: number; limit?: number; status?: PurchaseOrderStatus }) =>
    apiClient.get<PaginatedResponse<PurchaseOrder>>('/purchase-orders', { params }),
  get: (id: string) => apiClient.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`),
  create: (data: {
    supplierId: string;
    expectedDate?: string;
    notes?: string;
    items: Array<{ productId: string; orderedQuantity: number; unitPrice: number }>;
  }) => apiClient.post<ApiResponse<PurchaseOrder>>('/purchase-orders', data),
  updateStatus: (id: string, status: PurchaseOrderStatus) =>
    apiClient.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/status`, { status }),
  receive: (id: string, items?: Array<{ productId: string; receivedQuantity: number }>) =>
    apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/receive`, { items }),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/purchase-orders/${id}`),
};

// Reports
export const reportsApi = {
  dashboard: () => apiClient.get<ApiResponse<DashboardStats>>('/reports/dashboard'),
  stock: () => apiClient.get<ApiResponse<unknown[]>>('/reports/stock'),
  movements: (startDate?: string, endDate?: string) =>
    apiClient.get<ApiResponse<unknown>>('/reports/movements', { params: { startDate, endDate } }),
  suppliers: () => apiClient.get<ApiResponse<unknown[]>>('/reports/suppliers'),
  audit: (page = 1, limit = 50) =>
    apiClient.get<PaginatedResponse<unknown>>('/reports/audit', { params: { page, limit } }),
};
