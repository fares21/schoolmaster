// resources/js/pages/Teacher/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import TeacherLayout from '@/components/layouts/TeacherLayout';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import {
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  BookOpenIcon,
  UsersIcon,
  PlusIcon,
  EyeIcon,
  BellIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

// ================== STATISTICS CARD ==================
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </GlassCard>
  );
};

// ================== TODAYS SCHEDULE ==================
const TodaysSchedule = ({ classes, onMarkAttendance }) => {
  const [expandedClass, setExpandedClass] = useState(null);
  
  const getStatusColor = (status) => {
    if (status === 'completed') return 'border-emerald-500/30 bg-emerald-500/10';
    if (status === 'in-progress') return 'border-amber-500/30 bg-amber-500/10';
    return 'border-indigo-500/30 bg-indigo-500/10';
  };
  
  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">جدول اليوم</h3>
          <p className="text-gray-400 text-sm">حصص اليوم {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        <CalendarIcon className="w-6 h-6 text-indigo-400" />
      </div>
      
      <div className="space-y-3">
        {classes.map((classItem) => (
          <div
            key={classItem.id}
            className={`border rounded-xl transition-all ${getStatusColor(classItem.status)}`}
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpandedClass(expandedClass === classItem.id ? null : classItem.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-semibold">{classItem.name}</p>
                  <p className="text-gray-400 text-sm">{classItem.subject} • {classItem.time}</p>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <span className="text-xs text-gray-400">{classItem.students_count} طالب</span>
                  {classItem.status === 'completed' && (
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                  )}
                  {classItem.status === 'in-progress' && (
                    <ClockIcon className="w-5 h-5 text-amber-400 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
            
            {expandedClass === classItem.id && (
              <div className="border-t border-white/10 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{classItem.present_count || 0}</p>
                      <p className="text-gray-400 text-xs">حاضر</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{classItem.absent_count || 0}</p>
                      <p className="text-gray-400 text-xs">غائب</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{classItem.late_count || 0}</p>
                      <p className="text-gray-400 text-xs">متأخر</p>
                    </div>
                  </div>
                  <GlassButton size="sm" onClick={() => onMarkAttendance(classItem)}>
                    <CheckCircleIcon className="w-4 h-4 ml-1" />
                    تسجيل حضور
                  </GlassButton>
                </div>
                <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${classItem.attendance_rate || 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ================== QUICK ACTIONS ==================
const QuickActions = () => {
  const actions = [
    { icon: CheckCircleIcon, label: 'تسجيل حضور', color: 'from-emerald-500 to-teal-600', href: '/teacher/attendance' },
    { icon: ChartBarIcon, label: 'إدخال درجات', color: 'from-blue-500 to-indigo-600', href: '/teacher/grades' },
    { icon: UserGroupIcon, label: 'قائمة الطلاب', color: 'from-purple-500 to-pink-600', href: '/teacher/students' },
    { icon: CalendarIcon, label: 'جدول الحصص', color: 'from-amber-500 to-orange-600', href: '/teacher/schedule' },
    { icon: BellIcon, label: 'إعلان للطلاب', color: 'from-rose-500 to-red-600', href: '/teacher/announcements' }
  ];
  
  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-4">إجراءات سريعة</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => router.visit(action.href)}
            className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${action.color} p-3 text-right transition-all duration-300 hover:scale-105`}
          >
            <action.icon className="w-5 h-5 text-white mb-1" />
            <p className="text-white text-sm font-medium">{action.label}</p>
          </button>
        ))}
      </div>
    </GlassCard>
  );
};

// ================== RECENT ACTIVITIES ==================
const RecentActivities = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch(type) {
      case 'attendance': return <CheckCircleIcon className="w-4 h-4 text-emerald-400" />;
      case 'grade': return <ChartBarIcon className="w-4 h-4 text-blue-400" />;
      case 'announcement': return <BellIcon className="w-4 h-4 text-amber-400" />;
      default: return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };
  
  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-4">آخر النشاطات</h3>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center space-x-3 space-x-reverse p-2 rounded-lg hover:bg-white/5 transition-all">
            {getActivityIcon(activity.type)}
            <div className="flex-1">
              <p className="text-white text-sm">{activity.message}</p>
              <p className="text-gray-500 text-xs">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ================== STUDENTS_GRADE_OVERVIEW ==================
const StudentsGradeOverview = ({ students }) => {
  const [selectedClass, setSelectedClass] = useState('all');
  
  const filteredStudents = selectedClass === 'all' 
    ? students 
    : students.filter(s => s.class_id === parseInt(selectedClass));
  
  const classes = [...new Map(students.map(s => [s.class_id, { id: s.class_id, name: s.class_name }])).values()];
  
  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">نتائج الطلاب</h3>
          <p className="text-gray-400 text-sm">آخر التقييمات</p>
        </div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="all">كل الصفوف</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
        {filteredStudents.map((student) => (
          <div key={student.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {student.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-medium">{student.name}</p>
                <p className="text-gray-500 text-xs">{student.class_name}</p>
              </div>
            </div>
            <div className="text-left">
              <p className={`font-bold ${student.average >= 70 ? 'text-emerald-400' : student.average >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {student.average}%
              </p>
              <p className="text-gray-500 text-xs">المعدل</p>
            </div>
            <button
              onClick={() => router.visit(`/teacher/grades/student/${student.id}`)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              <EyeIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
      
      <GlassButton variant="outline" className="w-full mt-4" onClick={() => router.visit('/teacher/grades')}>
        <PlusIcon className="w-4 h-4 ml-1" />
        إضافة درجات جديدة
      </GlassButton>
    </GlassCard>
  );
};

// ================== UPCOMING_TASKS ==================
const UpcomingTasks = ({ tasks }) => {
  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-4">المهام القادمة</h3>
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <div>
              <p className="text-white font-medium">{task.title}</p>
              <p className="text-gray-400 text-sm">{task.class_name} • {task.due_date}</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs ${
              task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
              task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {task.priority === 'high' ? 'عاجل' : task.priority === 'medium' ? 'هام' : 'عادي'}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ================== MAIN TEACHER DASHBOARD ==================
export default function TeacherDashboard() {
  const { teacher, stats, todaySchedule, recentActivities, studentsGrades, upcomingTasks } = usePage().props;
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  const formatDate = (date) => {
    return date.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const handleMarkAttendance = (classItem) => {
    router.visit(`/teacher/attendance/class/${classItem.id}`);
  };
  
  return (
    <TeacherLayout>
      <Head title="لوحة التحكم - معلم" />
      
      {/* Welcome Section */}
      <div className="mb-8">
        <GlassCard className="p-6 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                مرحباً، {teacher.name}
              </h1>
              <p className="text-gray-300">
                {formatDate(currentTime)} • {teacher.subject}
              </p>
            </div>
            <div className="text-left hidden lg:block">
              <div className="flex items-center space-x-2 space-x-reverse">
                <AcademicCapIcon className="w-5 h-5 text-indigo-400" />
                <p className="text-gray-300">معلم {teacher.subject}</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="الطلاب"
          value={stats.total_students}
          icon={UsersIcon}
          color="from-blue-500 to-cyan-600"
          subtitle={`في ${stats.total_classes} صف`}
        />
        <StatCard
          title="المواد"
          value={stats.total_subjects}
          icon={BookOpenIcon}
          color="from-emerald-500 to-teal-600"
        />
        <StatCard
          title="حضور اليوم"
          value={`${stats.today_attendance}%`}
          icon={CheckCircleIcon}
          color="from-purple-500 to-indigo-600"
          subtitle={`${stats.present_today} من ${stats.total_students_today}`}
        />
        <StatCard
          title="المعدل العام"
          value={`${stats.class_average}%`}
          icon={ChartBarIcon}
          color="from-amber-500 to-orange-600"
        />
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Today's Schedule - Takes 2/3 */}
        <div className="lg:col-span-2">
          <TodaysSchedule classes={todaySchedule} onMarkAttendance={handleMarkAttendance} />
        </div>
        
        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>
      
      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students Grades Overview */}
        <div className="lg:col-span-2">
          <StudentsGradeOverview students={studentsGrades} />
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <RecentActivities activities={recentActivities} />
          <UpcomingTasks tasks={upcomingTasks} />
        </div>
      </div>
    </TeacherLayout>
  );
}