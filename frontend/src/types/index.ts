export type Role = 'ADMIN' | 'MANAGER' | 'STAFF';

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: Pick<User, 'id' | 'email' | 'name' | 'role'>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  taxNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  supplierId?: string;
  unitPrice: number;
  costPrice: number;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  isActive: boolean;
  category?: Pick<Category, 'id' | 'name'>;
  supplier?: Pick<Supplier, 'id' | 'name'>;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  unitPrice?: number;
  totalValue?: number;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  product?: Pick<Product, 'id' | 'name' | 'sku' | 'unit'>;
  user?: Pick<User, 'id' | 'name'>;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Pick<Product, 'id' | 'name' | 'sku' | 'unit'>;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  supplier?: Pick<Supplier, 'id' | 'name'>;
  items?: PurchaseOrderItem[];
  user?: Pick<User, 'id' | 'name'>;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  openOrders: number;
  totalMovements: number;
  lowStockCount: number;
  lowStockProducts: Product[];
  totalStockValue: number;
  recentMovements: StockMovement[];
}
