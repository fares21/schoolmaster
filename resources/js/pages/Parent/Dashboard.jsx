// resources/js/pages/Parent/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import ParentLayout from '@/components/layouts/ParentLayout';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import {
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  BookOpenIcon,
  EyeIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  EnvelopeIcon,
  UserCircleIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// ================== CHILD SELECTOR ==================
const ChildSelector = ({ children, selectedChild, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedChildData = children.find(c => c.id === selectedChild);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 space-x-reverse px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
      >
        <UserCircleIcon className="w-5 h-5 text-indigo-400" />
        <span className="text-white font-medium">{selectedChildData?.name}</span>
        <span className="text-gray-400 text-sm">({selectedChildData?.class_name})</span>
        <ChevronLeftIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-gray-800 border border-white/10 shadow-xl z-10 overflow-hidden">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => {
                onSelect(child.id);
                setIsOpen(false);
              }}
              className={`w-full text-right px-4 py-3 transition-all ${
                selectedChild === child.id
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <p className="font-medium">{child.name}</p>
              <p className="text-xs text-gray-400">{child.class_name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ================== STATISTICS CARD ==================
const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 ${trend.isUp ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isUp ? (
                <ArrowTrendingUpIcon className="w-3 h-3 ml-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-3 h-3 ml-1" />
              )}
              <span className="text-xs">{trend.value}</span>
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

// ================== SUBJECT PERFORMANCE ==================
const SubjectPerformance = ({ subjects, childName }) => {
  const getGradeColor = (grade) => {
    if (grade >= 90) return 'text-emerald-400';
    if (grade >= 75) return 'text-blue-400';
    if (grade >= 60) return 'text-amber-400';
    return 'text-red-400';
  };
  
  const getProgressColor = (grade) => {
    if (grade >= 90) return 'bg-emerald-500';
    if (grade >= 75) return 'bg-blue-500';
    if (grade >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  const totalAverage = subjects.length > 0 
    ? Math.round(subjects.reduce((sum, s) => sum + s.grade, 0) / subjects.length)
    : 0;
  
  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">أداء {childName} في المواد</h3>
          <p className="text-gray-400 text-sm">الدرجات والتقدم</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{totalAverage}%</p>
          <p className="text-gray-400 text-xs">المعدل العام</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.id}>
            <div className="flex justify-between items-center mb-1">
              <div>
                <p className="text-white font-medium">{subject.name}</p>
                <p className="text-gray-500 text-xs">المعلم: {subject.teacher_name}</p>
              </div>
              <div className={`text-xl font-bold ${getGradeColor(subject.grade)}`}>
                {subject.grade}%
              </div>
            </div>
            <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-full ${getProgressColor(subject.grade)}`}
                style={{ width: `${subject.grade}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>آخر اختبار: {subject.last_test}</span>
              <span>{subject.total_tests} اختبار</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ================== ATTENDANCE_RECORD ==================
const AttendanceRecord = ({ records, childName }) => {
  const [viewMode, setViewMode] = useState('month');
  
  const getAttendanceColor = (status) => {
    switch(status) {
      case 'present': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'absent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'late': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'excused': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };
  
  const getAttendanceText = (status) => {
    switch(status) {
      case 'present': return 'حاضر';
      case 'absent': return 'غائب';
      case 'late': return 'متأخر';
      case 'excused': return 'بعذر';
      default: return '—';
    }
  };
  
  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;
  
  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">سجل حضور {childName}</h3>
          <p className="text-gray-400 text-sm">آخر {records.length} يوم</p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded-lg text-sm transition-all ${
              viewMode === 'week' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400'
            }`}
          >
            أسبوع
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded-lg text-sm transition-all ${
              viewMode === 'month' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400'
            }`}
          >
            شهر
          </button>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-white/5">
          <p className="text-2xl font-bold text-white">{presentCount}</p>
          <p className="text-gray-400 text-xs">حاضر</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/5">
          <p className="text-2xl font-bold text-red-400">{absentCount}</p>
          <p className="text-gray-400 text-xs">غائب</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/5">
          <p className="text-2xl font-bold text-amber-400">{lateCount}</p>
          <p className="text-gray-400 text-xs">متأخر</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/5">
          <p className="text-2xl font-bold text-emerald-400">{attendanceRate}%</p>
          <p className="text-gray-400 text-xs">نسبة الحضور</p>
        </div>
      </div>
      
      {/* Records Timeline */}
      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {records.map((record, index) => (
          <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
            <div className="flex items-center space-x-3 space-x-reverse">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <span className="text-white text-sm">{record.date}</span>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <span className="text-gray-400 text-sm">{record.subject}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs border ${getAttendanceColor(record.status)}`}>
                {getAttendanceText(record.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ================== RECENT GRADES ==================
const RecentGrades = ({ grades, childName }) => {
  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-4">آخر درجات {childName}</h3>
      
      <div className="space-y-3">
        {grades.map((grade, index) => (
          <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-white/5">
            <div>
              <p className="text-white font-medium">{grade.subject}</p>
              <p className="text-gray-400 text-xs">{grade.test_name} • {grade.date}</p>
            </div>
            <div className={`text-xl font-bold ${
              grade.score >= 70 ? 'text-emerald-400' : grade.score >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {grade.score}%
            </div>
          </div>
        ))}
      </div>
      
      <GlassButton variant="outline" className="w-full mt-4">
        <EyeIcon className="w-4 h-4 ml-1" />
        عرض جميع الدرجات
      </GlassButton>
    </GlassCard>
  );
};

// ================== WEEKLY SCHEDULE ==================
const WeeklySchedule = ({ schedule, childName }) => {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const [selectedDay, setSelectedDay] = useState(days[0]);
  
  const getDaySchedule = () => {
    return schedule[selectedDay] || [];
  };
  
  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-4">جدول حصص {childName}</h3>
      
      {/* Day Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl transition-all ${
              selectedDay === day
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {day}
          </button>
        ))}
      </div>
      
      {/* Schedule for Selected Day */}
      <div className="space-y-3">
        {getDaySchedule().length > 0 ? (
          getDaySchedule().map((class_, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <BookOpenIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{class_.subject}</p>
                  <p className="text-gray-400 text-sm">{class_.teacher} • {class_.room}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-white">{class_.time}</p>
                <p className="text-gray-400 text-xs">{class_.period}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">لا توجد حصص في هذا اليوم</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

// ================== ANNOUNCEMENTS ==================
const ParentAnnouncements = ({ announcements }) => {
  const [expanded, setExpanded] = useState(null);
  
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return 'border-red-500/30 bg-red-500/10';
      case 'high': return 'border-orange-500/30 bg-orange-500/10';
      case 'medium': return 'border-blue-500/30 bg-blue-500/10';
      default: return 'border-gray-500/30 bg-gray-500/10';
    }
  };
  
  const getPriorityText = (priority) => {
    switch(priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'مهم';
      case 'medium': return 'هام';
      default: return 'عادي';
    }
  };
  
  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">الإعلانات</h3>
          <p className="text-gray-400 text-sm">آخر الإعلانات المهمة</p>
        </div>
        <BellIcon className="w-6 h-6 text-indigo-400" />
      </div>
      
      <div className="space-y-3">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`border rounded-xl transition-all ${getPriorityColor(announcement.priority)}`}
          >
            <div
              className="p-3 cursor-pointer"
              onClick={() => setExpanded(expanded === announcement.id ? null : announcement.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">{announcement.title}</p>
                  <p className="text-gray-400 text-sm">{announcement.date}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                  {getPriorityText(announcement.priority)}
                </span>
              </div>
            </div>
            
            {expanded === announcement.id && (
              <div className="border-t border-white/10 p-3">
                <p className="text-gray-300 text-sm">{announcement.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ================== CONTACT_TEACHER ==================
const ContactTeacher = ({ teachers }) => {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const handleSendMessage = () => {
    if (!message.trim() || !selectedTeacher) return;
    setIsSending(true);
    
    // Simulate sending - will connect to actual API
    setTimeout(() => {
      setIsSending(false);
      setMessage('');
      setSelectedTeacher(null);
    }, 1000);
  };
  
  return (
    <GlassCard className="p-6">
      <div className="flex items-center space-x-3 space-x-reverse mb-4">
        <ChatBubbleLeftRightIcon className="w-6 h-6 text-indigo-400" />
        <h3 className="text-xl font-bold text-white">التواصل مع المعلمين</h3>
      </div>
      
      <select
        value={selectedTeacher || ''}
        onChange={(e) => setSelectedTeacher(parseInt(e.target.value))}
        className="w-full px-4 py-2 mb-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
      >
        <option value="">اختر المعلم</option>
        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.name} - {teacher.subject}
          </option>
        ))}
      </select>
      
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="اكتب رسالتك هنا..."
        rows="3"
        className="w-full px-4 py-2 mb-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-all resize-none"
      />
      
      <GlassButton
        onClick={handleSendMessage}
        disabled={!selectedTeacher || !message.trim() || isSending}
        className="w-full"
        isLoading={isSending}
      >
        <EnvelopeIcon className="w-4 h-4 ml-1" />
        إرسال رسالة
      </GlassButton>
    </GlassCard>
  );
};

// ================== ACHIEVEMENTS ==================
const ParentAchievements = ({ achievements, childName }) => {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center space-x-3 space-x-reverse mb-4">
        <TrophyIcon className="w-6 h-6 text-amber-400" />
        <h3 className="text-xl font-bold text-white">إنجازات {childName}</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {achievements.map((achievement, index) => (
          <div key={index} className="flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <TrophyIcon className="w-4 h-4 text-amber-400 ml-1" />
            <span className="text-white text-sm">{achievement}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ================== MAIN PARENT DASHBOARD ==================
export default function ParentDashboard() {
  const { parent, children, selectedChildId, childData, subjects, attendance, recentGrades, schedule, announcements, achievements, teachers } = usePage().props;
  const [selectedChild, setSelectedChild] = useState(selectedChildId || (children[0]?.id || null));
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    if (selectedChild && selectedChild !== selectedChildId) {
      router.reload({ data: { child_id: selectedChild }, only: ['childData', 'subjects', 'attendance', 'recentGrades', 'schedule', 'achievements'] });
    }
  }, [selectedChild]);
  
  const formatDate = (date) => {
    return date.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const currentChild = children.find(c => c.id === selectedChild);
  const childName = currentChild?.name || 'الابن';
  
  return (
    <ParentLayout>
      <Head title="لوحة التحكم - ولي أمر" />
      
      {/* Welcome Section */}
      <div className="mb-8">
        <GlassCard className="p-6 bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-red-600/20">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="flex items-center space-x-3 space-x-reverse mb-2">
                <UserGroupIcon className="w-10 h-10 text-amber-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    مرحباً، {parent.name}
                  </h1>
                  <p className="text-gray-300">
                    ولي أمر • {children.length} {children.length === 1 ? 'ابن' : 'أبناء'} في المدرسة
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-sm mt-2">
                {formatDate(currentTime)}
              </p>
            </div>
            
            <ChildSelector
              children={children}
              selectedChild={selectedChild}
              onSelect={setSelectedChild}
            />
          </div>
        </GlassCard>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="المعدل العام"
          value={`${childData?.total_average || 0}%`}
          icon={ChartBarIcon}
          color="from-indigo-500 to-purple-600"
          trend={{ isUp: childData?.average_trend > 0, value: `${Math.abs(childData?.average_trend || 0)}% عن الفصل الماضي` }}
        />
        <StatCard
          title="نسبة الحضور"
          value={`${childData?.attendance_rate || 0}%`}
          icon={CheckCircleIcon}
          color="from-emerald-500 to-teal-600"
        />
        <StatCard
          title="المواد المسجلة"
          value={subjects?.length || 0}
          icon={BookOpenIcon}
          color="from-blue-500 to-cyan-600"
        />
        <StatCard
          title="الترتيب في الصف"
          value={`#${childData?.rank || '-'}`}
          icon={TrophyIcon}
          color="from-amber-500 to-orange-600"
          subtitle={`من ${childData?.total_in_class || 0} طالب`}
        />
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Subject Performance - Takes 2/3 */}
        <div className="lg:col-span-2">
          <SubjectPerformance subjects={subjects || []} childName={childName} />
        </div>
        
        {/* Weekly Schedule */}
        <div>
          <WeeklySchedule schedule={schedule || {}} childName={childName} />
        </div>
      </div>
      
      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Record */}
        <div>
          <AttendanceRecord records={attendance || []} childName={childName} />
        </div>
        
        {/* Recent Grades */}
        <div>
          <RecentGrades grades={recentGrades || []} childName={childName} />
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <ParentAnnouncements announcements={announcements || []} />
          <ContactTeacher teachers={teachers || []} />
          <ParentAchievements achievements={achievements || []} childName={childName} />
        </div>
      </div>
    </ParentLayout>
  );
}