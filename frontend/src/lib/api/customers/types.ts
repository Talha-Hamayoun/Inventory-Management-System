export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ListCustomersResponse = {
  success: boolean;
  data: Customer[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  message?: string;
};

export type CustomerDetailResponse = {
  success: boolean;
  data: Customer;
  message?: string;
};
