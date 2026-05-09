// resources/js/pages/SchoolAdmin/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import SchoolAdminLayout from '@/components/layouts/SchoolAdminLayout';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import {
  UsersIcon,
  AcademicCapIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BellIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { arSA } from 'date-fns/locale';

// ==================== STATISTICS CARD COMPONENT ====================
const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, subtitle }) => {
  const isPositive = trend === 'up';
  
  return (
    <GlassCard className="p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
          {trendValue && (
            <div className={`flex items-center mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? (
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
              )}
              <span className="text-sm">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} shadow-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </GlassCard>
  );
};

// ==================== ATTENDANCE CHART COMPONENT ====================
const AttendanceChart = ({ data }) => {
  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">نسبة الحضور اليومي</h3>
          <p className="text-gray-400 text-sm mt-1">آخر 7 أيام</p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <GlassButton size="sm" variant="outline">هذا الأسبوع</GlassButton>
          <GlassButton size="sm" variant="outline">هذا الشهر</GlassButton>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              color: '#f1f5f9'
            }}
          />
          <Area
            type="monotone"
            dataKey="attendance"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#attendanceGradient)"
          />
          <Area
            type="monotone"
            dataKey="absent"
            stroke="#ef4444"
            strokeWidth={2}
            fill="none"
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};

// ==================== GRADES DISTRIBUTION CHART ====================
const GradesDistributionChart = ({ data }) => {
  const COLORS = ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#ef4444'];
  
  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">توزيع الدرجات</h3>
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
          />
        </PieChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};

// ==================== AI USAGE CHART ====================
const AIUsageChart = ({ data }) => {
  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">استهلاك الذكاء الاصطناعي</h3>
          <p className="text-gray-400 text-sm mt-1">الاستخدام اليومي (توكينز)</p>
        </div>
        <SparklesIcon className="w-6 h-6 text-indigo-400" />
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px'
            }}
          />
          <Bar dataKey="tokens" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.tokens > 450 ? '#ef4444' : '#8b5cf6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
        <p className="text-sm text-red-400 flex items-center">
          <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
          الميزانية اليومية المتبقية: 0.23$ من 0.50$ (46% مستهلك)
        </p>
      </div>
    </GlassCard>
  );
};

// ==================== RECENT ACTIVITIES ====================
const RecentActivities = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch(type) {
      case 'attendance': return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'alert': return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />;
      case 'announcement': return <BellIcon className="w-5 h-5 text-blue-400" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };
  
  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">آخر النشاطات</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 space-x-reverse p-3 rounded-xl hover:bg-white/5 transition-all">
            <div className="flex-shrink-0">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1">
              <p className="text-white text-sm">{activity.message}</p>
              <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
            </div>
            {activity.action && (
              <GlassButton size="sm" variant="outline" className="text-xs">
                عرض
              </GlassButton>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ==================== QUICK ACTIONS ====================
const QuickActions = () => {
  const actions = [
    { icon: CheckCircleIcon, label: 'تسجيل حضور', color: 'from-green-500 to-emerald-600', href: '/school-admin/attendance/mark' },
    { icon: BellIcon, label: 'إعلان جديد', color: 'from-blue-500 to-indigo-600', href: '/school-admin/announcements/create' },
    { icon: UsersIcon, label: 'إضافة مستخدم', color: 'from-purple-500 to-pink-600', href: '/school-admin/users/add' },
    { icon: ChartBarIcon, label: 'تقرير جديد', color: 'from-orange-500 to-red-600', href: '/school-admin/reports/generate' },
    { icon: SparklesIcon, label: 'مساعد AI', color: 'from-indigo-500 to-purple-600', href: '/school-admin/ai/chat' },
    { icon: AcademicCapIcon, label: 'إدارة الفصول', color: 'from-teal-500 to-cyan-600', href: '/school-admin/classes' },
  ];
  
  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">إجراءات سريعة</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => router.visit(action.href)}
            className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${action.color} p-4 text-right transition-all duration-300 hover:scale-105 hover:shadow-xl`}
          >
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <action.icon className="w-6 h-6 text-white mb-2" />
            <p className="text-white text-sm font-medium">{action.label}</p>
          </button>
        ))}
      </div>
    </GlassCard>
  );
};

// ==================== TOP STUDENTS ====================
const TopStudents = ({ students }) => {
  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">أفضل الطلاب هذا الشهر</h3>
      <div className="space-y-4">
        {students.map((student, index) => (
          <div key={student.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                index === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                index === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                'bg-indigo-500/20 text-indigo-400'
              }`}>
                {index + 1}
              </div>
              <div>
                <p className="text-white font-medium">{student.name}</p>
                <p className="text-gray-500 text-xs">الصف {student.class}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-green-400 font-bold">{student.average}%</p>
              <p className="text-gray-500 text-xs">المعدل</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ==================== MAIN DASHBOARD COMPONENT ====================
export default function SchoolAdminDashboard() {
  const { school, stats, recentActivities, attendanceData, gradesData, aiUsageData, topStudents } = usePage().props;
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formatDate = (date) => {
    return format(date, 'EEEE، d MMMM yyyy', { locale: arSA });
  };
  
  return (
    <SchoolAdminLayout>
      <Head title="لوحة التحكم - مدير المدرسة" />
      
      {/* Welcome Section with Glassmorphism Hero */}
      <div className="mb-8">
        <GlassCard className="p-8 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                مرحباً بك، {school.admin_name}
              </h1>
              <p className="text-gray-300 text-lg">
                {school.name} | {formatDate(currentTime)}
              </p>
              <div className="flex items-center mt-4 space-x-2 space-x-reverse">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm border border-emerald-500/30">
                  {school.subscription_plan === 'premium' ? '📦 باقة بريميوم' : '📦 باقة أساسية'}
                </span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm border border-blue-500/30">
                  {school.subscription_status === 'active' ? '✅ اشتراك نشط' : '⚠️ اشتراك منتهي'}
                </span>
              </div>
            </div>
            <div className="text-left hidden lg:block">
              <div className="flex items-center space-x-2 space-x-reverse">
                <ClockIcon className="w-5 h-5 text-indigo-400" />
                <p className="text-gray-300">{format(currentTime, 'hh:mm:ss a')}</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
      
      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي الطلاب"
          value={stats.total_students}
          icon={UsersIcon}
          trend="up"
          trendValue="+12% عن الشهر الماضي"
          color="from-blue-500 to-cyan-600"
          subtitle={`${stats.new_students_this_month} طالب جديد هذا الشهر`}
        />
        <StatCard
          title="إجمالي المعلمين"
          value={stats.total_teachers}
          icon={AcademicCapIcon}
          trend="up"
          trendValue="+3 معلمين جدد"
          color="from-emerald-500 to-teal-600"
        />
        <StatCard
          title="نسبة الحضور اليوم"
          value={`${stats.today_attendance}%`}
          icon={CalendarIcon}
          trend={stats.attendance_trend > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(stats.attendance_trend)}% عن الأمس`}
          color="from-purple-500 to-indigo-600"
          subtitle={`${stats.present_today} من ${stats.total_students} طالب`}
        />
        <StatCard
          title="استهلاك AI اليوم"
          value={`${stats.ai_usage_today}%`}
          icon={SparklesIcon}
          trend="down"
          trendValue="-8% عن الأمس"
          color="from-orange-500 to-red-600"
          subtitle={`${stats.ai_remaining_budget} متبقي من الميزانية`}
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Attendance Chart - Takes 2/3 of the grid */}
        <div className="lg:col-span-2">
          <AttendanceChart data={attendanceData} />
        </div>
        
        {/* Grades Distribution - Takes 1/3 of the grid */}
        <div>
          <GradesDistributionChart data={gradesData} />
        </div>
      </div>
      
      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* AI Usage Chart */}
        <div className="lg:col-span-2">
          <AIUsageChart data={aiUsageData} />
        </div>
        
        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>
      
      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <RecentActivities activities={recentActivities} />
        
        {/* Top Students */}
        <TopStudents students={topStudents} />
      </div>
      
      {/* AI Assistant Floating Button (Only for School Admin) */}
      <div className="fixed bottom-8 left-8 z-50">
        <button
          onClick={() => router.visit('/school-admin/ai/chat')}
          className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-110"
        >
          <SparklesIcon className="w-8 h-8 text-white" />
          <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-20 group-hover:opacity-30" />
        </button>
      </div>
    </SchoolAdminLayout>
  );
}