'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { tradingAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface Order {
  orderId: string;
  symbol: string;
  quantity: number;
  price: number;
  orderType: 'MARKET' | 'LIMIT';
  transactionType: 'BUY' | 'SELL';
  product: 'CNC' | 'MIS' | 'NRML';
  validity: 'DAY' | 'IOC';
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';
  placedAt: string;
  executedAt?: string;
  executedPrice?: number;
  executedQuantity?: number;
  rejectionReason?: string;
}

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'executed' | 'cancelled'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Load orders on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // For now, simulate orders since backend might not be fully implemented
      const mockOrders: Order[] = [
        {
          orderId: 'ORD001',
          symbol: 'RELIANCE',
          quantity: 10,
          price: 2545.30,
          orderType: 'LIMIT',
          transactionType: 'BUY',
          product: 'CNC',
          validity: 'DAY',
          status: 'EXECUTED',
          placedAt: '2024-01-10T10:30:00Z',
          executedAt: '2024-01-10T10:31:15Z',
          executedPrice: 2543.75,
          executedQuantity: 10
        },
        {
          orderId: 'ORD002',
          symbol: 'TCS',
          quantity: 5,
          price: 3850.00,
          orderType: 'MARKET',
          transactionType: 'BUY',
          product: 'CNC',
          validity: 'DAY',
          status: 'PENDING',
          placedAt: '2024-01-10T14:15:00Z'
        },
        {
          orderId: 'ORD003',
          symbol: 'INFY',
          quantity: 15,
          price: 1450.00,
          orderType: 'LIMIT',
          transactionType: 'SELL',
          product: 'CNC',
          validity: 'DAY',
          status: 'CANCELLED',
          placedAt: '2024-01-09T11:45:00Z'
        },
        {
          orderId: 'ORD004',
          symbol: 'HDFCBANK',
          quantity: 8,
          price: 1680.00,
          orderType: 'LIMIT',
          transactionType: 'BUY',
          product: 'MIS',
          validity: 'DAY',
          status: 'REJECTED',
          placedAt: '2024-01-09T09:30:00Z',
          rejectionReason: 'Insufficient funds'
        },
        {
          orderId: 'ORD005',
          symbol: 'ICICIBANK',
          quantity: 12,
          price: 1125.00,
          orderType: 'MARKET',
          transactionType: 'SELL',
          product: 'CNC',
          validity: 'IOC',
          status: 'EXECUTED',
          placedAt: '2024-01-08T15:20:00Z',
          executedAt: '2024-01-08T15:20:30Z',
          executedPrice: 1124.55,
          executedQuantity: 12
        }
      ];

      setOrders(mockOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      setError(null);
      
      // Simulate cancel order API call
      const response = await tradingAPI.cancelOrder(orderId);
      
      if (response.success) {
        setOrders(orders.map(order => 
          order.orderId === orderId 
            ? { ...order, status: 'CANCELLED' as const }
            : order
        ));
      } else {
        setError(response.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError('Failed to cancel order. Please try again.');
    }
  };

  const modifyOrder = (orderId: string) => {
    router.push(`/trading?orderId=${orderId}`);
  };

  const filterOrders = (orders: Order[]) => {
    switch (activeTab) {
      case 'active':
        return orders.filter(order => order.status === 'PENDING');
      case 'executed':
        return orders.filter(order => order.status === 'EXECUTED');
      case 'cancelled':
        return orders.filter(order => ['CANCELLED', 'REJECTED'].includes(order.status));
      default:
        return orders;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'EXECUTED':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-blue-600 bg-blue-100';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-100';
      case 'REJECTED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  const filteredOrders = filterOrders(orders);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                ← Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Order Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push('/trading')}>
                Place New Order
              </Button>
              <Button variant="outline" onClick={() => router.push('/marketplace')}>
                Marketplace
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'all', label: 'All Orders', count: orders.length },
                { id: 'active', label: 'Active', count: orders.filter(o => o.status === 'PENDING').length },
                { id: 'executed', label: 'Executed', count: orders.filter(o => o.status === 'EXECUTED').length },
                { id: 'cancelled', label: 'Cancelled/Rejected', count: orders.filter(o => ['CANCELLED', 'REJECTED'].includes(o.status)).length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Orders Table */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'all' ? 'You haven\'t placed any orders yet.' : `No ${activeTab} orders found.`}
              </p>
              <div className="mt-6">
                <Button onClick={() => router.push('/trading')}>
                  Place Your First Order
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <li key={order.orderId}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">{order.symbol}</p>
                              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                order.transactionType === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {order.transactionType}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <span>
                                {order.quantity} shares @ {formatCurrency(order.price)} ({order.orderType})
                              </span>
                              <span className="mx-2">•</span>
                              <span>{order.product}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {order.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => modifyOrder(order.orderId)}
                              >
                                Modify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => cancelOrder(order.orderId)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Placed At</p>
                          <p className="font-medium">{formatDateTime(order.placedAt)}</p>
                        </div>
                        
                        {order.executedAt && (
                          <div>
                            <p className="text-gray-500">Executed At</p>
                            <p className="font-medium">{formatDateTime(order.executedAt)}</p>
                          </div>
                        )}
                        
                        {order.executedPrice && (
                          <div>
                            <p className="text-gray-500">Executed Price</p>
                            <p className="font-medium">{formatCurrency(order.executedPrice)}</p>
                          </div>
                        )}
                        
                        {order.rejectionReason && (
                          <div className="col-span-full">
                            <p className="text-gray-500">Rejection Reason</p>
                            <p className="font-medium text-red-600">{order.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center text-sm">
                        <span className="text-gray-500">Order ID: {order.orderId}</span>
                        <span className="font-medium">
                          Total: {formatCurrency((order.executedPrice || order.price) * (order.executedQuantity || order.quantity))}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
