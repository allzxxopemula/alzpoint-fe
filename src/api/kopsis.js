import api from './axios';

export const login = (credentials) => api.post('/login', credentials);
export const updateAdminProfile = (payload) => api.put('/profile', payload);
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getActivityLogs = (config = {}) => api.get('/activity-logs', config);
export const getProducts = (params) => api.get('/products', { params });
export const getCategories = () => api.get('/categories');
export const createCategory = (payload) => api.post('/categories', payload);
export const deleteCategory = (categoryId) => api.delete(`/categories/${categoryId}`);
export const getDiscounts = () => api.get('/discounts');
export const createDiscount = (payload) => api.post('/discounts', payload);
export const deleteDiscount = (discountId) => api.delete(`/discounts/${discountId}`);
export const getCashiers = () => api.get('/cashiers');
export const createCashier = (payload) => api.post('/cashiers', payload);
export const updateCashier = (userId, payload) => api.put(`/cashiers/${userId}`, payload);
export const deleteCashier = (userId) => api.delete(`/cashiers/${userId}`);
export const createProduct = (payload) => api.post('/products', payload);
export const updateProduct = (productId, payload) => api.put(`/products/${productId}`, payload);
export const deleteProduct = (productId) => api.delete(`/products/${productId}`);
export const createOrder = (payload) => api.post('/orders', payload);
export const getOrders = (params, config = {}) => api.get('/orders', { ...config, params });
export const updateOrderStatus = (orderId, status, payload = {}) =>
  api.patch(`/orders/${orderId}/status`, { status, ...payload });
export const getCustomers = () => api.get('/customers');
export const getSalesReport = (period) => api.get('/reports/sales', { params: { period } });
export const getMonthlyRevenueReport = (year) => api.get('/reports/monthly', { params: { year } });
export const getCooperativeSettings = () => api.get('/settings/cooperative');
export const updateCooperativeSettings = (payload) => api.put('/settings/cooperative', payload);