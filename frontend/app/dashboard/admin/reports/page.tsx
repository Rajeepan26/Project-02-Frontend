"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

type SummaryItem = { totalAmount: number; count: number };
type SummaryResponse = {
  success: boolean;
  summaryByType: Record<string, SummaryItem>;
  summaryByMethod: Record<string, SummaryItem>;
  totals: { totalRevenue: number; totalCount: number };
};

type MonthlyItem = { month: number; totalAmount: number; count: number };
type MonthlyResponse = { success: boolean; year: number; paymentType: string; monthly: MonthlyItem[] };

export default function ReportPage() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<{ startDate: string; endDate: string }>({ startDate: '', endDate: '' });
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [monthly, setMonthly] = useState<MonthlyResponse | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (range.startDate) params.append('startDate', range.startDate);
      if (range.endDate) params.append('endDate', range.endDate);
      const res = await fetch(`http://localhost:8000/api/payments/summary?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load report');
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMonthly = async () => {
    try {
      const params = new URLSearchParams();
      params.set('year', String(year));
      params.set('paymentType', typeFilter);
      const res = await fetch(`http://localhost:8000/api/payments/summary/monthly?${params.toString()}`);
      const json: MonthlyResponse = await res.json();
      if (!res.ok || !json.success) throw new Error((json as { message?: string }).message || 'Failed to load monthly revenue');
      setMonthly(json);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMonthly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, typeFilter]);

  const typeCards = useMemo(() => {
    if (!data) return [] as Array<{ key: string; value: SummaryItem; color: string; icon: React.ReactNode }>;
    const palette = {
      pos: 'from-emerald-400 to-emerald-600',
      online: 'from-sky-400 to-sky-600',
      prescription: 'from-indigo-400 to-indigo-600',
      consultation: 'from-fuchsia-400 to-fuchsia-600',
      unknown: 'from-slate-400 to-slate-600',
    } as Record<string, string>;
    const icon = (
      <svg className="w-6 h-6 opacity-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3m6 0a3 3 0 00-3-3m0 0V4m0 7v9" />
      </svg>
    );
    return Object.entries(data.summaryByType).map(([k, v]) => ({ key: k, value: v, color: palette[k] || palette.unknown, icon }));
  }, [data]);

  return (
    <ProtectedRoute role="admin">
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Sidebar role="admin" />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Modern Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                Revenue Reports
              </h1>
              <p className="text-gray-600 text-lg">Track and analyze your revenue performance</p>
            </div>

            {/* Modern Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                 <div className="flex-1">
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                   <div className="relative">
                     <input 
                       type="date" 
                       className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/50 cursor-pointer" 
                       value={range.startDate} 
                       onChange={e => setRange(r => ({ ...r, startDate: e.target.value }))} 
                     />
                   </div>
                 </div>
                 <div className="flex-1">
                   <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                   <div className="relative">
                     <input 
                       type="date" 
                       className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/50 cursor-pointer" 
                       value={range.endDate} 
                       onChange={e => setRange(r => ({ ...r, endDate: e.target.value }))} 
                     />
                   </div>
                 </div>
                <button 
                  onClick={fetchSummary} 
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Apply Filter
                </button>
              </div>
            </div>

            {/* Modern Totals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-lg font-medium mb-2">Total Revenue</p>
                    <p className="text-4xl font-bold">LKR {Number(data?.totals.totalRevenue || 0).toLocaleString()}</p>
                    <div className="flex items-center mt-2 text-blue-200">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">All time</span>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 15l3-3 4 4 5-6"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-600 font-semibold">Transactions</p>
                  <div className="bg-green-100 rounded-full p-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-4xl font-bold text-gray-800 mb-2">{Number(data?.totals.totalCount || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total payments processed</p>
              </div>
            </div>

            {/* Modern Monthly Revenue Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Monthly Revenue</h2>
                  <p className="text-gray-600">Track revenue trends over time</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <select 
                      className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm" 
                      value={typeFilter} 
                      onChange={e => setTypeFilter(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="pos">POS</option>
                      <option value="online">Online</option>
                      <option value="prescription">Prescription</option>
                      <option value="consultation">Consultation</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="relative">
                    <select 
                      className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm" 
                      value={year} 
                      onChange={e => setYear(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 6 }).map((_, i) => {
                        const y = currentYear - i;
                        return <option key={y} value={y}>{y}</option>;
                      })}
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {monthly ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <MonthlyBarChart data={monthly.monthly} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading chart...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modern Revenue Breakdown Cards */}
            <div className="mb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Revenue Breakdown</h2>
                <p className="text-gray-600">Revenue distribution by payment type</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 font-medium">Loading revenue data...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="col-span-full text-center py-12">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                      <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-600 font-medium">{error}</p>
                    </div>
                  </div>
                ) : typeCards.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-gray-600 font-medium">No revenue data available</p>
                    </div>
                  </div>
                ) : (
                  typeCards.map(card => (
                    <div key={card.key} className={`group relative overflow-hidden rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br ${card.color}`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-bold capitalize tracking-wide">{card.key}</span>
                          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 group-hover:bg-white/30 transition-colors duration-300">
                            {card.icon}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold">LKR {card.value.totalAmount.toLocaleString()}</div>
                          <div className="flex items-center text-white/90">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">{card.value.count} payments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modern Payment Method Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200/50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-xl p-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Payment Methods</h2>
                    <p className="text-gray-600 text-sm">Revenue breakdown by payment method</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="text-left px-8 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                      <th className="text-right px-8 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Count</th>
                      <th className="text-right px-8 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {Object.entries(data?.summaryByMethod || {}).map(([method, val]) => (
                      <tr key={method} className="hover:bg-gray-50/50 transition-colors duration-200">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              method === 'Card_payment' ? 'bg-blue-500' :
                              method === 'Card' ? 'bg-green-500' :
                              method === 'Cash' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="font-medium text-gray-800 capitalize">{method || 'unknown'}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {val.count.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <span className="text-lg font-bold text-gray-800">LKR {val.totalAmount.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Modern SVG Bar Chart component (no external deps)
function MonthlyBarChart({ data }: { data: MonthlyItem[] }) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const max = Math.max(1, ...data.map(d => d.totalAmount));
  const height = 240;
  const barWidth = 40;
  const gap = 20;
  const width = data.length * (barWidth + gap) + gap;
  const scale = (v: number) => (v / max) * (height - 40);

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height + 60} className="text-slate-500">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line 
            key={i}
            x1={0} 
            y1={height - (ratio * (height - 40))} 
            x2={width} 
            y2={height - (ratio * (height - 40))} 
            stroke="#E5E7EB" 
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.5"
          />
        ))}
        
        {/* Axis line */}
        <line x1={0} y1={height} x2={width} y2={height} stroke="#374151" strokeWidth="2" />
        
        {data.map((d, i) => {
          const h = scale(d.totalAmount);
          const x = gap + i * (barWidth + gap);
          const y = height - h;
          const isZero = d.totalAmount === 0;
          
          return (
            <g key={i} className="group">
              {/* Bar with gradient */}
              <defs>
                <linearGradient id={`gradient-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isZero ? "#E5E7EB" : "#3B82F6"} />
                  <stop offset="100%" stopColor={isZero ? "#D1D5DB" : "#1D4ED8"} />
                </linearGradient>
              </defs>
              
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={h || 2} 
                rx={8} 
                fill={`url(#gradient-${i})`}
                className="group-hover:opacity-80 transition-opacity duration-200"
              />
              
              {/* Month label */}
              <text 
                x={x + barWidth / 2} 
                y={height + 20} 
                textAnchor="middle" 
                fontSize="12" 
                fontWeight="500"
                className="fill-gray-600"
              >
                {months[i]}
              </text>
              
              {/* Value label */}
              {!isZero && (
                <text 
                  x={x + barWidth / 2} 
                  y={y - 8} 
                  textAnchor="middle" 
                  fontSize="11" 
                  fontWeight="600"
                  className="fill-gray-700"
                >
                  {d.totalAmount.toLocaleString()}
                </text>
              )}
              
              {/* Hover effect */}
              <rect 
                x={x - 4} 
                y={0} 
                width={barWidth + 8} 
                height={height + 60} 
                fill="transparent"
                className="group-hover:fill-blue-50/30 transition-colors duration-200"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}