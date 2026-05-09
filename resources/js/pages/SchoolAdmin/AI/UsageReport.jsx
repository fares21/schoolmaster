// resources/js/pages/SchoolAdmin/AI/UsageReport.jsx
import React, { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import SchoolAdminLayout from '@/components/layouts/SchoolAdminLayout';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import {
  SparklesIcon,
  ChartBarIcon,
  CalendarIcon,
  WalletIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { arSA } from 'date-fns/locale';

// ================== TOKEN FORMATTER ==================
const formatTokens = (tokens) => {
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(1)}M`;
};

const formatCost = (cost) => {
  return `$${cost.toFixed(4)}`;
};

// ================== STATS CARD ==================
const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, subtitle }) => {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
          {trendValue && (
            <div className={`flex items-center mt-2 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {trend === 'up' ? (
                <TrendingUpIcon className="w-3 h-3 ml-1" />
              ) : (
                <TrendingDownIcon className="w-3 h-3 ml-1" />
              )}
              <span className="text-xs">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </GlassCard>
  );
};

// ================== DAILY USAGE CHART ==================
const DailyUsageChart = ({ data }) => {
  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">الاستخدام اليومي</h3>
          <p className="text-gray-400 text-sm mt-1">عدد التوكينز المستهلكة يومياً</p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="text-xs text-gray-400">آخر 30 يوم</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => format(new Date(value), 'dd/MM')}
          />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              color: '#f1f5f9'
            }}
            labelFormatter={(label) => format(new Date(label), 'EEEE d MMMM yyyy', { locale: arSA })}
            formatter={(value, name) => {
              if (name === 'tokens') return [formatTokens(value), 'التوكينز'];
              if (name === 'cost') return [formatCost(value), 'التكلفة'];
              return [value, name];
            }}
          />
          <Area
            type="monotone"
            dataKey="tokens"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#dailyGradient)"
            name="tokens"
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};

// ================== COST BREAKDOWN PIE ==================
const CostBreakdownPie = ({ data }) => {
  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];
  
  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">توزيع التكلفة حسب النموذج</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px'
            }}
            formatter={(value) => formatCost(value)}
          />
        </PieChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};

// ================== HOURLY DISTRIBUTION ==================
const HourlyDistribution = ({ data }) => {
  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">توزيع الاستخدام حسب الساعة</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="hour" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px'
            }}
            formatter={(value) => [formatTokens(value), 'التوكينز']}
          />
          <Bar dataKey="tokens" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.tokens > 5000 ? '#ef4444' : entry.tokens > 2500 ? '#f59e0b' : '#8b5cf6'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};

// ================== TOP USERS TABLE ==================
const TopUsersTable = ({ users }) => {
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="px-6 py-4 border-b border-white/10">
        <h3 className="text-xl font-bold text-white">أكثر المستخدمين استخداماً لـ AI</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">المستخدم</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">عدد الطلبات</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">إجمالي التوكينز</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">التكلفة</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">متوسط الطلب</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-all">
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-400/20 text-gray-300' :
                      index === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-white">{user.total_requests}</td>
                <td className="px-4 py-3 text-white">{formatTokens(user.total_tokens)}</td>
                <td className="px-4 py-3 text-amber-400">{formatCost(user.total_cost)}</td>
                <td className="px-4 py-3 text-gray-400">{formatTokens(Math.round(user.avg_tokens_per_request))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

// ================== RECENT REQUESTS TABLE ==================
const RecentRequestsTable = ({ requests, onViewDetails }) => {
  const getStatusBadge = (status) => {
    if (status === 'success') {
      return <span className="flex items-center text-green-400 text-xs"><CheckCircleIcon className="w-3 h-3 ml-1" />ناجح</span>;
    }
    return <span className="flex items-center text-red-400 text-xs"><ExclamationTriangleIcon className="w-3 h-3 ml-1" />فشل</span>;
  };
  
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="px-6 py-4 border-b border-white/10">
        <h3 className="text-xl font-bold text-white">آخر طلبات AI</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">الوقت</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">المستخدم</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">السؤال (مختصر)</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">التوكينز</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">التكلفة</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">النموذج</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">الحالة</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-b border-white/10 hover:bg-white/5 transition-all">
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {format(new Date(request.created_at), 'hh:mm a dd/MM')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300 text-sm">{request.user_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300 text-sm max-w-[200px] truncate">
                  {request.prompt.substring(0, 50)}...
                </td>
                <td className="px-4 py-3 text-white text-sm">{formatTokens(request.total_tokens)}</td>
                <td className="px-4 py-3 text-amber-400 text-sm">{formatCost(request.cost)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    request.model === 'deepseek' 
                      ? 'bg-indigo-500/20 text-indigo-400' 
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {request.model === 'deepseek' ? 'DeepSeek' : 'Gemini'}
                  </span>
                </td>
                <td className="px-4 py-3">{getStatusBadge(request.status)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onViewDetails(request)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                    title="عرض التفاصيل"
                  >
                    <EyeIcon className="w-4 h-4 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

// ================== REQUEST DETAILS MODAL ==================
const RequestDetailsModal = ({ isOpen, onClose, request }) => {
  if (!request) return null;
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all ${isOpen ? 'visible' : 'invisible'}`}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <GlassCard className="relative z-10 w-full max-w-2xl mx-4 p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">تفاصيل طلب AI</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-all">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-white/5">
            <p className="text-gray-400 text-sm mb-1">السؤال</p>
            <p className="text-white">{request.prompt}</p>
          </div>
          
          <div className="p-3 rounded-xl bg-white/5">
            <p className="text-gray-400 text-sm mb-1">الإجابة</p>
            <p className="text-white whitespace-pre-wrap">{request.response}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-gray-400 text-xs">التاريخ والوقت</p>
              <p className="text-white text-sm">{format(new Date(request.created_at), 'EEEE d MMMM yyyy hh:mm a', { locale: arSA })}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-gray-400 text-xs">المستخدم</p>
              <p className="text-white text-sm">{request.user_name}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-gray-400 text-xs">توكينز الإدخال</p>
              <p className="text-white text-sm">{formatTokens(request.prompt_tokens)}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-gray-400 text-xs">توكينز الإخراج</p>
              <p className="text-white text-sm">{formatTokens(request.completion_tokens)}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-gray-400 text-xs">إجمالي التوكينز</p>
              <p className="text-white text-sm">{formatTokens(request.total_tokens)}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-gray-400 text-xs">التكلفة</p>
              <p className="text-amber-400 text-sm">{formatCost(request.cost)}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-gray-400 text-xs">النموذج المستخدم</p>
              <p className="text-white text-sm">{request.model === 'deepseek' ? 'DeepSeek' : 'Google Gemini'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-gray-400 text-xs">زمن الاستجابة</p>
              <p className="text-white text-sm">{request.response_time}ms</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

// ================== DATE RANGE SELECTOR ==================
const DateRangeSelector = ({ startDate, endDate, onStartChange, onEndChange, onApply }) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center space-x-2 space-x-reverse">
        <CalendarIcon className="w-5 h-5 text-indigo-400" />
        <span className="text-gray-300 text-sm">من:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div className="flex items-center space-x-2 space-x-reverse">
        <span className="text-gray-300 text-sm">إلى:</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>
      <GlassButton size="sm" onClick={onApply}>
        تطبيق
      </GlassButton>
    </div>
  );
};

// ================== MAIN USAGE REPORT COMPONENT ==================
export default function UsageReport() {
  const { dailyData, hourlyData, modelBreakdown, topUsers, recentRequests, summary } = usePage().props;
  const [startDate, setStartDate] = useState(startOfMonth(new Date()).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };
  
  const handleExport = () => {
    window.location.href = `/school-admin/ai/export?start_date=${startDate}&end_date=${endDate}`;
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleApplyDateRange = () => {
    router.reload({ 
      data: { start_date: startDate, end_date: endDate },
      only: ['dailyData', 'hourlyData', 'topUsers', 'recentRequests', 'summary']
    });
  };
  
  return (
    <SchoolAdminLayout>
      <Head title="تقارير استخدام AI - مدير المدرسة" />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">تقارير استخدام AI</h1>
                <p className="text-gray-400">تحليل استهلاك الذكاء الاصطناعي والتكاليف</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 space-x-reverse">
            <GlassButton variant="outline" onClick={handleExport}>
              <DocumentArrowDownIcon className="w-4 h-4 ml-1" />
              تصدير
            </GlassButton>
            <GlassButton variant="outline" onClick={handlePrint}>
              <PrinterIcon className="w-4 h-4 ml-1" />
              طباعة
            </GlassButton>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="إجمالي الطلبات"
          value={summary.total_requests}
          icon={SparklesIcon}
          trend={summary.requests_trend > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(summary.requests_trend)}% عن الشهر الماضي`}
          color="from-indigo-500 to-purple-600"
        />
        <StatCard
          title="إجمالي التوكينز"
          value={formatTokens(summary.total_tokens)}
          icon={ChartBarIcon}
          color="from-emerald-500 to-teal-600"
        />
        <StatCard
          title="إجمالي التكلفة"
          value={formatCost(summary.total_cost)}
          icon={WalletIcon}
          color="from-amber-500 to-orange-600"
        />
        <StatCard
          title="متوسط التكلفة لكل طلب"
          value={formatCost(summary.avg_cost_per_request)}
          icon={TrendingUpIcon}
          color="from-rose-500 to-pink-600"
        />
      </div>
      
      {/* Date Range Selector */}
      <GlassCard className="p-4 mb-6">
        <DateRangeSelector
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          onApply={handleApplyDateRange}
        />
      </GlassCard>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DailyUsageChart data={dailyData} />
        <CostBreakdownPie data={modelBreakdown} />
      </div>
      
      {/* Hourly Distribution */}
      <div className="mb-6">
        <HourlyDistribution data={hourlyData} />
      </div>
      
      {/* Top Users */}
      <div className="mb-6">
        <TopUsersTable users={topUsers} />
      </div>
      
      {/* Recent Requests */}
      <div>
        <RecentRequestsTable requests={recentRequests} onViewDetails={handleViewDetails} />
      </div>
      
      {/* Request Details Modal */}
      <RequestDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
      
      <style jsx>{`
        @media print {
          .no-print {
            display: none;
          }
        }
      `}</style>
    </SchoolAdminLayout>
  );
}