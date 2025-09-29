"use client";
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { FiSearch, FiX, FiChevronLeft, FiChevronRight, FiPackage, FiUser, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import { getAllOrders, updateOrderStatus, OrderItem } from '@/services/orders';
import authService from '@/services/auth';
import Image from 'next/image';

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  date: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  status: 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  items: OrderItem[];
  itemsCount: number;
  paymentMethod: string;
  orderType: string;
  description: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

const statusColors: Record<AdminOrder['status'], string> = {
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-800"
};

const statusLabels: Record<AdminOrder['status'], string> = {
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  completed: "Completed"
};

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminOrder['status'] | 'all'>("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<AdminOrder['status']>('confirmed');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const testAuth = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/orders/test-auth`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Auth test response status:', response.status);
      const result = await response.json();
      console.log('Auth test result:', result);
      
      return response.ok;
    } catch (error) {
      console.error('Auth test failed:', error);
      return false;
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Check authentication
      const currentUser = authService.getCurrentUser();
      const token = authService.getToken();
      
      console.log('Current user:', currentUser);
      console.log('Token exists:', !!token);
      
      if (!currentUser || !token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }
      
      if (currentUser.role !== 'admin') {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      
      // Test authentication first
      const authOk = await testAuth();
      if (!authOk) {
        setError('Authentication failed. Please log in again.');
        setLoading(false);
        return;
      }
      
      const result = await getAllOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
        page: pagination.currentPage,
        limit: 20
      });
  // Filter out orders with statuses that shouldn't be visible in admin UI
  // (pending, completed, cancelled)
  const fetched = result.orders || [];
  const hiddenStatuses = new Set(['pending', 'completed', 'cancelled']);
  const visibleOrders = (fetched as any[]).filter(o => !hiddenStatuses.has(o?.status));
  setOrders(visibleOrders as AdminOrder[]);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, pagination.currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    try {
      if (!selectedOrder.id) {
        throw new Error('Order ID is required');
      }
      await updateOrderStatus(selectedOrder.id, newStatus);
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id ? { ...order, status: newStatus } : order
      ));
      setSelectedOrder({ ...selectedOrder, status: newStatus });
      setShowStatusModal(false);
      setSuccessMessage('Order status updated successfully!');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };



  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && orders.length === 0) {
    return (
      <ProtectedRoute role="admin">
        <div className="flex h-screen bg-gray-50">
          <div className="fixed inset-y-0 left-0 w-64">
            <Sidebar role="admin" />
          </div>
          <main className="flex-1 ml-64 p-8 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading orders...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute role="admin">
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="fixed inset-y-0 left-0 w-64">
          <Sidebar role="admin" />
        </div>
        <main className="flex-1 ml-64 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Modern Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiPackage className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                      Order Management
                    </h1>
                    <p className="text-gray-600 text-lg flex items-center space-x-2">
                      <span>Manage and track all customer orders</span>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-white/20">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">
                      {orders.length} Total Orders
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Search and Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search orders, customers, or order numbers..."
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white/50 transition-all duration-200"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FiSearch className="w-4 h-4 text-blue-600" />
                    </div>
                    <select
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white/50 text-gray-700 font-medium transition-all duration-200"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as AdminOrder['status'] | 'all')}
                    >
                      <option value="all">All Status</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Confirmed</span>
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Shipped</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Delivered</span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                  {error.includes('Authentication') && (
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium transition-colors duration-200"
                    >
                      Go to Login
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200/50">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <FiPackage className="w-4 h-4" />
                          <span>Order ID</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <FiUser className="w-4 h-4" />
                          <span>Customer</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Date</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
                          </svg>
                          <span>Total</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Status</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span>Items</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200/50">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors duration-200 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              order.status === 'confirmed' ? 'bg-blue-500' :
                              order.status === 'shipped' ? 'bg-purple-500' :
                              order.status === 'delivered' ? 'bg-green-500' :
                              order.status === 'completed' ? 'bg-gray-500' :
                              'bg-red-500'
                            }`}></div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{order.orderNumber}</p>
                              <p className="text-xs text-gray-500">ID: {order.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                              <FiUser className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[150px]">{order.customerEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{formatDate(order.date)}</div>
                          <div className="text-xs text-gray-400">Order Date</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">Rs.{order.total.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{order.itemsCount} items</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]} border`}> 
                            {statusLabels[order.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-600">{order.itemsCount}</span>
                            </div>
                            <span className="text-sm text-gray-600">items</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2"
                            aria-label="View order"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 flex items-center justify-between border-t border-gray-200/50">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Showing <span className="font-semibold text-gray-900">{((pagination.currentPage - 1) * 20) + 1}</span> to{' '}
                        <span className="font-semibold text-gray-900">
                          {Math.min(pagination.currentPage * 20, pagination.totalOrders)}
                        </span>{' '}
                        of <span className="font-semibold text-gray-900">{pagination.totalOrders}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={!pagination.hasPrevPage}
                          className="relative inline-flex items-center px-3 py-2 rounded-l-xl border-2 border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <FiChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={!pagination.hasNextPage}
                          className="relative inline-flex items-center px-3 py-2 rounded-r-xl border-2 border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <FiChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
              <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                          <FiPackage className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                            Order Details
                          </h2>
                          <p className="text-gray-600 text-lg">#{selectedOrder.orderNumber}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                      >
                        <FiX className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Order Information */}
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200/50">
                          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <FiPackage className="w-5 h-5 text-blue-600" />
                            </div>
                            Order Information
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Order Number:</span>
                              <span className="font-medium">{selectedOrder.orderNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Order Date:</span>
                              <span className="font-medium">{formatDate(selectedOrder.date)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Order Type:</span>
                              <span className="font-medium capitalize">{selectedOrder.orderType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Payment Method:</span>
                              <span className="font-medium">{selectedOrder.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[selectedOrder.status]}`}>
                                {statusLabels[selectedOrder.status]}
                              </span>
                            </div>
                            {selectedOrder.trackingNumber && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tracking Number:</span>
                                <span className="font-medium">{selectedOrder.trackingNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl p-6 border border-gray-200/50">
                          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                              <FiUser className="w-5 h-5 text-green-600" />
                            </div>
                            Customer Information
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="font-medium">{selectedOrder.customerName}</span>
                            </div>
                            <div className="flex items-center">
                              <FiMail className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-gray-600">{selectedOrder.customerEmail}</span>
                            </div>
                            <div className="flex items-center">
                              <FiPhone className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-gray-600">{selectedOrder.customerPhone}</span>
                            </div>
                            <div className="flex items-start">
                              <FiMapPin className="w-4 h-4 text-gray-400 mr-2 mt-1" />
                              <span className="text-gray-600">{selectedOrder.customerAddress}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl p-6 border border-gray-200/50">
                          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            Order Items ({selectedOrder.itemsCount})
                          </h3>
                          <div className="space-y-3">
                            {selectedOrder.items.map((item, index) => (
                              <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                               <Image
                                  src={
                                    item.image && item.image.trim()
                                      ? item.image.startsWith('http')
                                        ? item.image.replace(/\\/g, '/')
                                        : item.image.startsWith('/')
                                          ? item.image.replace(/\\/g, '/')
                                          : `http://localhost:8000/${item.image.replace(/\\/g, '/')}`
                                      : '/images/doc1.webp'
                                  }
                                  alt={item.name}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 object-cover rounded-lg border"
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                  <p className="text-sm text-gray-500">Rs.{item.price.toFixed(2)} each</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-gray-900">Rs.{(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl p-6 border border-gray-200/50">
                          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            Order Summary
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="font-medium">Rs.{selectedOrder.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Shipping:</span>
                              <span className="font-medium">Rs.{selectedOrder.shipping.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tax:</span>
                              <span className="font-medium">Rs.{selectedOrder.tax.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between">
                              <span className="text-lg font-semibold text-gray-900">Total:</span>
                              <span className="text-lg font-semibold text-gray-900">Rs.{selectedOrder.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200/50">
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold transition-all duration-200"
                      >
                        Close
                      </button>
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                        onClick={() => {
                          setNewStatus(selectedOrder.status);
                          setShowStatusModal(true);
                        }}
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Update Status Modal */}
            {showStatusModal && selectedOrder && (
              <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Update Order Status</h2>
                      <p className="text-gray-600">Order #{selectedOrder.orderNumber}</p>
                    </div>
                    
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Select new status:</label>
                      <select
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white/50 text-gray-700 font-medium transition-all duration-200"
                        value={newStatus}
                        onChange={e => setNewStatus(e.target.value as AdminOrder['status'])}
                      >
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                    
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShowStatusModal(false)}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateStatus}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 text-lg font-bold backdrop-blur-sm border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>{successMessage}</span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 