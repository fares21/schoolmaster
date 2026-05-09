// resources/js/pages/SchoolAdmin/Attendance/DailyReport.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import SchoolAdminLayout from '@/components/layouts/SchoolAdminLayout';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import GlassModal from '@/components/ui/GlassModal';
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  ChartBarIcon,
  EyeIcon,
  BellIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PlusIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { format, isToday, isYesterday, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { arSA } from 'date-fns/locale';

// ==================== ATTENDANCE STATUS BADGE ====================
const AttendanceBadge = ({ status, size = 'md' }) => {
  const statuses = {
    present: { label: 'حاضر', icon: CheckCircleIcon, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    absent: { label: 'غائب', icon: XCircleIcon, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    late: { label: 'متأخر', icon: ClockIcon, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    excused: { label: 'بعذر', icon: ShieldCheckIcon, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
  };
  
  const config = statuses[status] || statuses.absent;
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm';
  
  return (
    <span className={`inline-flex items-center rounded-full border ${config.color} ${sizeClasses}`}>
      <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ml-1`} />
      {config.label}
    </span>
  );
};

// ==================== ATTENDANCE SUMMARY CARD ====================
const AttendanceSummary = ({ stats }) => {
  const summaryItems = [
    { label: 'إجمالي الطلاب', value: stats.total_students, icon: UserGroupIcon, color: 'from-slate-500 to-gray-600' },
    { label: 'حاضر اليوم', value: stats.present_today, icon: CheckCircleIcon, color: 'from-emerald-500 to-teal-600' },
    { label: 'غائب اليوم', value: stats.absent_today, icon: XCircleIcon, color: 'from-red-500 to-rose-600' },
    { label: 'متأخرون', value: stats.late_today, icon: ClockIcon, color: 'from-amber-500 to-orange-600' },
    { label: 'نسبة الحضور', value: `${stats.attendance_rate}%`, icon: ChartBarIcon, color: 'from-indigo-500 to-purple-600' },
    { label: 'بإعذار', value: stats.excused_today, icon: ShieldCheckIcon, color: 'from-blue-500 to-cyan-600' }
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {summaryItems.map((item, index) => (
        <GlassCard key={index} className="p-4 text-center">
          <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${item.color} mb-3`}>
            <item.icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-gray-400 text-xs mb-1">{item.label}</p>
          <p className="text-2xl font-bold text-white">{item.value}</p>
        </GlassCard>
      ))}
    </div>
  );
};

// ==================== WEEKLY ATTENDANCE CHART ====================
const WeeklyAttendanceChart = ({ data }) => {
  const maxAttendance = Math.max(...data.map(d => d.attendance_rate), 100);
  
  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">نسبة الحضور الأسبوعية</h3>
      <div className="space-y-4">
        {data.map((day, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-300 text-sm">{day.name}</span>
              <span className="text-white text-sm font-medium">{day.attendance_rate}%</span>
            </div>
            <div className="relative w-full h-8 bg-white/10 rounded-xl overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-xl transition-all duration-500 ${
                  day.attendance_rate >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                  day.attendance_rate >= 75 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                  'bg-gradient-to-r from-red-500 to-rose-500'
                }`}
                style={{ width: `${(day.attendance_rate / maxAttendance) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center px-3">
                <span className="text-white text-xs font-medium z-10">
                  {day.present}/{day.total}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ==================== CLASS ATTENDANCE CARD ====================
const ClassAttendanceCard = ({ classData, onViewClass }) => {
  const getRateColor = (rate) => {
    if (rate >= 90) return 'text-emerald-400';
    if (rate >= 75) return 'text-amber-400';
    return 'text-red-400';
  };
  
  return (
    <div
      onClick={() => onViewClass(classData.id)}
      className="cursor-pointer p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-indigo-500/30"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-white font-semibold">{classData.name}</h4>
          <p className="text-gray-500 text-xs">{classData.total_students} طالب</p>
        </div>
        <div className={`text-2xl font-bold ${getRateColor(classData.attendance_rate)}`}>
          {classData.attendance_rate}%
        </div>
      </div>
      <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full ${
            classData.attendance_rate >= 90 ? 'bg-emerald-500' :
            classData.attendance_rate >= 75 ? 'bg-amber-500' :
            'bg-red-500'
          }`}
          style={{ width: `${classData.attendance_rate}%` }}
        />
      </div>
      <div className="flex justify-between mt-3 text-xs">
        <span className="text-green-400">حاضر: {classData.present}</span>
        <span className="text-red-400">غائب: {classData.absent}</span>
        <span className="text-amber-400">متأخر: {classData.late}</span>
      </div>
    </div>
  );
};

// ==================== STUDENT ATTENDANCE TABLE ====================
const StudentAttendanceTable = ({ students, onMarkAttendance, selectedClass, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('present');
  
  const filteredStudents = useMemo(() => {
    let filtered = [...students];
    
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(s => s.attendance_status === selectedStatus);
    }
    
    return filtered;
  }, [students, searchTerm, selectedStatus]);
  
  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };
  
  const handleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };
  
  const handleBulkMark = () => {
    if (selectedStudents.length > 0) {
      onMarkAttendance(selectedStudents, bulkStatus);
      setSelectedStudents([]);
      setBulkMode(false);
    }
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'bg-emerald-500/20 hover:bg-emerald-500/30';
      case 'absent': return 'bg-red-500/20 hover:bg-red-500/30';
      case 'late': return 'bg-amber-500/20 hover:bg-amber-500/30';
      case 'excused': return 'bg-blue-500/20 hover:bg-blue-500/30';
      default: return 'bg-white/10 hover:bg-white/20';
    }
  };
  
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث باسم الطالب أو الرمز..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 pl-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-all w-64"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">كل الحالات</option>
            <option value="present">حاضر</option>
            <option value="absent">غائب</option>
            <option value="late">متأخر</option>
            <option value="excused">بعذر</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          {bulkMode ? (
            <>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="present">حاضر</option>
                <option value="absent">غائب</option>
                <option value="late">متأخر</option>
                <option value="excused">بعذر</option>
              </select>
              <GlassButton onClick={handleBulkMark} isLoading={isLoading} size="sm">
                <CheckCircleIcon className="w-4 h-4 ml-1" />
                تطبيق على {selectedStudents.length} طالب
              </GlassButton>
              <GlassButton variant="outline" onClick={() => {
                setBulkMode(false);
                setSelectedStudents([]);
              }} size="sm">
                إلغاء
              </GlassButton>
            </>
          ) : (
            <GlassButton variant="outline" onClick={() => setBulkMode(true)} size="sm">
              <UserPlusIcon className="w-4 h-4 ml-1" />
              تسجيل جماعي
            </GlassButton>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              {bulkMode && (
                <th className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">الطالب</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">رمز الطالب</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">الحضور</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">وقت التسجيل</th>
              <th className="px-4 py-3 text-right text-gray-300 font-semibold">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="border-b border-white/10 hover:bg-white/5 transition-all">
                {bulkMode && (
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {student.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{student.full_name}</p>
                      <p className="text-gray-500 text-xs">{student.class_name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">{student.student_code}</td>
                <td className="px-4 py-3">
                  <AttendanceBadge status={student.attendance_status} />
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">{student.recorded_at || 'لم يسجل بعد'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => onMarkAttendance([student.id], 'present')}
                      className={`p-1.5 rounded-lg transition-all ${getStatusColor('present')} ${student.attendance_status === 'present' ? 'ring-1 ring-emerald-500' : ''}`}
                      title="حاضر"
                    >
                      <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => onMarkAttendance([student.id], 'absent')}
                      className={`p-1.5 rounded-lg transition-all ${getStatusColor('absent')} ${student.attendance_status === 'absent' ? 'ring-1 ring-red-500' : ''}`}
                      title="غائب"
                    >
                      <XCircleIcon className="w-4 h-4 text-red-400" />
                    </button>
                    <button
                      onClick={() => onMarkAttendance([student.id], 'late')}
                      className={`p-1.5 rounded-lg transition-all ${getStatusColor('late')} ${student.attendance_status === 'late' ? 'ring-1 ring-amber-500' : ''}`}
                      title="متأخر"
                    >
                      <ClockIcon className="w-4 h-4 text-amber-400" />
                    </button>
                    <button
                      onClick={() => onMarkAttendance([student.id], 'excused')}
                      className={`p-1.5 rounded-lg transition-all ${getStatusColor('excused')} ${student.attendance_status === 'excused' ? 'ring-1 ring-blue-500' : ''}`}
                      title="بعذر"
                    >
                      <ShieldCheckIcon className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">لا توجد طلاب في هذا الصف</p>
        </div>
      )}
    </div>
  );
};

// ==================== MARK ABSENT MODAL ====================
const AbsentNotificationModal = ({ isOpen, onClose, onConfirm, studentName, isLoading }) => {
  const [message, setMessage] = useState('');
  const [notifyParent, setNotifyParent] = useState(true);
  
  return (
    <GlassModal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-center space-x-3 space-x-reverse mb-4">
          <div className="p-2 rounded-full bg-red-500/20">
            <BellIcon className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">تسجيل غياب: {studentName}</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">سبب الغياب (اختياري)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="أدخل سبب الغياب..."
              rows="3"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-all resize-none"
            />
          </div>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300 text-sm">إرسال إشعار لولي الأمر</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={notifyParent}
                onChange={(e) => setNotifyParent(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </div>
          </label>
        </div>
        
        <div className="flex justify-end space-x-3 space-x-reverse mt-6">
          <GlassButton variant="outline" onClick={onClose}>
            إلغاء
          </GlassButton>
          <GlassButton onClick={() => onConfirm(message, notifyParent)} isLoading={isLoading}>
            تأكيد الغياب
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
};

// ==================== MAIN DAILY REPORT COMPONENT ====================
export default function DailyReport() {
  const { classes, students, stats, weeklyData, selectedDate: initialDate } = usePage().props;
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || null);
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [pendingAbsent, setPendingAbsent] = useState({ studentIds: [], studentName: '' });
  
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classStudents = students.filter(s => s.class_id === selectedClassId);
  
  const handleMarkAttendance = (studentIds, status, message = '', notifyParent = true) => {
    setIsLoading(true);
    
    const data = {
      student_ids: studentIds,
      status,
      date: selectedDate,
      class_id: selectedClassId,
      message: status === 'absent' ? message : null,
      notify_parent: status === 'absent' ? notifyParent : false
    };
    
    router.post('/school-admin/attendance/mark', data, {
      onSuccess: () => {
        setIsLoading(false);
        setShowAbsentModal(false);
        setPendingAbsent({ studentIds: [], studentName: '' });
        
        // Refresh the page data
        router.reload({ only: ['students', 'stats'] });
      },
      onError: (errors) => {
        console.error(errors);
        setIsLoading(false);
      }
    });
  };
  
  const handleBulkMarkAttendance = (studentIds, status) => {
    if (status === 'absent' && studentIds.length === 1) {
      const student = classStudents.find(s => s.id === studentIds[0]);
      setPendingAbsent({
        studentIds,
        studentName: student?.full_name || 'الطالب'
      });
      setShowAbsentModal(true);
    } else {
      handleMarkAttendance(studentIds, status);
    }
  };
  
  const handleExport = () => {
    window.location.href = `/school-admin/attendance/export?date=${selectedDate}&class_id=${selectedClassId}`;
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };
  
  const isTodayDate = isToday(new Date(selectedDate));
  const dateDisplay = format(new Date(selectedDate), 'EEEE، d MMMM yyyy', { locale: arSA });
  
  return (
    <SchoolAdminLayout>
      <Head title="تقرير الحضور اليومي - مدير المدرسة" />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">تقرير الحضور اليومي</h1>
            <p className="text-gray-400">تسجيل ومتابعة حضور وغياب الطلاب</p>
          </div>
          <div className="flex space-x-3 space-x-reverse">
            <GlassButton variant="outline" onClick={handleExport}>
              <DocumentArrowDownIcon className="w-5 h-5 ml-2" />
              تصدير
            </GlassButton>
            <GlassButton variant="outline" onClick={handlePrint}>
              <PrinterIcon className="w-5 h-5 ml-2" />
              طباعة
            </GlassButton>
          </div>
        </div>
      </div>
      
      {/* Date Selector */}
      <GlassCard className="p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              <ChevronRightIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => changeDate(1)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              <ChevronLeftIcon className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center space-x-2 space-x-reverse">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            {isTodayDate && (
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm">
                اليوم
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <label className="text-gray-300">اختر الصف:</label>
            <select
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(parseInt(e.target.value))}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
            >
              {classes.map(classItem => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.academic_year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>
      
      {/* Attendance Summary Cards */}
      <AttendanceSummary stats={stats} />
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Chart */}
        <div className="lg:col-span-2">
          <WeeklyAttendanceChart data={weeklyData} />
        </div>
        
        {/* Classes Summary */}
        <div>
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">نسب الحضور حسب الصف</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {classes.map(classItem => (
                <ClassAttendanceCard
                  key={classItem.id}
                  classData={classItem}
                  onViewClass={(id) => setSelectedClassId(id)}
                />
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
      
      {/* Student Attendance Table */}
      <GlassCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">
              {selectedClass?.name} - {dateDisplay}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {classStudents.length} طالب مسجل في هذا الصف
            </p>
          </div>
          <GlassButton
            variant="outline"
            onClick={() => router.reload()}
            isLoading={isLoading}
          >
            <ArrowPathIcon className="w-4 h-4 ml-1" />
            تحديث
          </GlassButton>
        </div>
        
        <StudentAttendanceTable
          students={classStudents}
          onMarkAttendance={handleBulkMarkAttendance}
          selectedClass={selectedClassId}
          isLoading={isLoading}
        />
      </GlassCard>
      
      {/* Absent Notification Modal */}
      <AbsentNotificationModal
        isOpen={showAbsentModal}
        onClose={() => {
          setShowAbsentModal(false);
          setPendingAbsent({ studentIds: [], studentName: '' });
        }}
        onConfirm={(message, notifyParent) => {
          handleMarkAttendance(pendingAbsent.studentIds, 'absent', message, notifyParent);
        }}
        studentName={pendingAbsent.studentName}
        isLoading={isLoading}
      />
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
      `}</style>
    </SchoolAdminLayout>
  );
}