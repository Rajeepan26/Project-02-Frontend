/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useEffect, useState } from 'react';
import { getOrdersByStatus, updateOrderStatus } from '@/services/orders';
import { Card, CardContent } from '@/components/ui/card';
import { FaClipboardList, FaUser, FaMapMarkerAlt, FaPhone, FaTruck, FaCheckCircle, FaExclamationTriangle, FaRoute, FaFilter, FaSearch } from 'react-icons/fa';

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  name: string;
  address: string;
  phone: string;
  status: string;
}

export default function AssignedOrderPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; orderNumber: string; currentStatus: string; newStatus: string } | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
  const data = await getOrdersByStatus('confirmed,shipped');
        setOrders(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    setSelectedOrder({
      id: orderId,
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      newStatus: newStatus
    });
    setShowConfirmModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedOrder) return;
    
    try {
      await updateOrderStatus(selectedOrder.id, selectedOrder.newStatus);
      if (selectedOrder.newStatus === 'delivered') {
        setOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
      } else {
        setOrders(prev => prev.map(order => order.id === selectedOrder.id ? { ...order, status: selectedOrder.newStatus } : order));
      }
      setShowConfirmModal(false);
      setSelectedOrder(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const cancelStatusChange = () => {
    setShowConfirmModal(false);
    setSelectedOrder(null);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      // no 'pending' status for delivery
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      // no 'pending' status for delivery
      case 'confirmed':
        return <FaCheckCircle className="w-4 h-4 text-blue-600" />;
      case 'shipped':
        return <FaTruck className="w-4 h-4" />;
      case 'delivered':
        return <FaCheckCircle className="w-4 h-4" />;
      default:
        return <FaExclamationTriangle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (status: string) => {
    switch (status) {
      // no 'pending' status for delivery
      case 'shipped':
        return 'bg-blue-500';
      case 'delivered':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute role="delivery">
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
          <Sidebar role="delivery" />
          <main className="flex-1 ml-64 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute role="delivery">
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 relative overflow-hidden">
        {/* Professional Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white/30 to-gray-50/50"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-slate-200/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gray-200/20 rounded-full filter blur-3xl"></div>
        
        <Sidebar role="delivery" />
        
        <main className="flex-1 ml-64 p-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Professional Header Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
                    <FaClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-1">Assigned Orders</h1>
                    <p className="text-slate-600 flex items-center space-x-2">
                      <span>Manage your delivery assignments</span>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
                    <FaRoute className="text-slate-600" />
                    <span className="text-sm font-medium text-slate-900">
                      {filteredOrders.length} Orders
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Filters and Search */}
            <Card className="mb-6 border-0 shadow-xl bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search orders, customers, or addresses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent bg-slate-50"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaFilter className="text-slate-600 w-4 h-4" />
                            <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent bg-slate-50 text-slate-700"
                      >
        <option value="all">All Orders</option>
  {/* Pending removed */}
        <option value="confirmed">Confirmed</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
                            </select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Pending removed */}
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">Shipped</span>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">Delivered</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Orders Display */}
            {error ? (
              <Card className="border-0 shadow-xl bg-white">
                <CardContent className="p-8">
                  <div className="text-center">
                    <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Error Loading Orders</h3>
                    <p className="text-slate-600">{error}</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredOrders.length === 0 ? (
              <Card className="border-0 shadow-xl bg-white">
                <CardContent className="p-8">
                  <div className="text-center">
                    <FaClipboardList className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Orders Found</h3>
                    <p className="text-slate-600">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'No orders match your current filters.' 
                        : 'No orders are currently assigned to you.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl bg-white">
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-[1100px] divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                              <FaClipboardList className="w-4 h-4" />
                              <span>Order Details</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                              <FaUser className="w-4 h-4" />
                              <span>Customer</span>
                            </div>
                          </th>
                          <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                              <FaMapMarkerAlt className="w-4 h-4" />
                              <span>Delivery Address</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                              <FaPhone className="w-4 h-4" />
                              <span>Contact</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                              <FaTruck className="w-4 h-4" />
                              <span>Status</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 ${getPriorityColor(order.status)} rounded-full flex-shrink-0`}></div>
                                <div>
                                  <div className="text-sm font-bold text-slate-900">{order.orderNumber}</div>
                                  <div className="text-xs text-slate-500">Order ID: {order.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-slate-900">{order.name}</div>
                              <div className="text-xs text-slate-500">Customer</div>
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate">
                              <div className="text-sm text-slate-700" title={order.address}>
                                {order.address}
                              </div>
                              <div className="text-xs text-slate-500">Delivery Location</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-700">{order.phone}</div>
                              <div className="text-xs text-slate-500">Phone Number</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                <span className="text-xs font-semibold uppercase tracking-wide">
                                  {order.status === 'shipped' ? 'Shipped' : order.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap min-w-[140px]">
                              <div className="flex items-center space-x-2">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent bg-white text-slate-700 text-sm font-medium shadow-sm hover:border-slate-300 transition-colors"
                                >
                                  {/* Pending removed */}
                                  <option value="confirmed">Confirmed </option>
                                  <option value="shipped">Shipped </option>
                                  <option value="delivered">Delivered </option>
                                </select>
                              </div>
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                  
                  {/* Table Footer with Summary */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <div className="flex items-center space-x-4">
                        <span>Showing {filteredOrders.length} of {orders.length} orders</span>
                        <div className="flex items-center space-x-2">
                          {/* Pending count removed */}
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{filteredOrders.filter(o => o.status === 'shipped').length} Shipped</span>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span>{filteredOrders.filter(o => o.status === 'delivered').length} Delivered</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        Last updated: {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Status Change Confirmation Modal */}
      {showConfirmModal && selectedOrder && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaExclamationTriangle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Confirm Status Change</h3>
                  <p className="text-sm text-slate-600">Order #{selectedOrder.orderNumber}</p>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-slate-700 mb-4">
                  Are you sure you want to change the status from{' '}
                  <span className="font-semibold text-slate-900 capitalize">{selectedOrder.currentStatus}</span> to{' '}
                  <span className="font-semibold text-blue-600 capitalize">{selectedOrder.newStatus}</span>?
                </p>
                
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Current Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.currentStatus)}`}>
                      {selectedOrder.currentStatus.charAt(0).toUpperCase() + selectedOrder.currentStatus.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-slate-600">New Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.newStatus)}`}>
                      {selectedOrder.newStatus.charAt(0).toUpperCase() + selectedOrder.newStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={cancelStatusChange}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusChange}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <FaCheckCircle className="w-4 h-4" />
                  <span>Confirm Change</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
} 