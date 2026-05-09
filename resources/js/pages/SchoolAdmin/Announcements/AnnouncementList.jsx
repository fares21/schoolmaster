// resources/js/pages/SchoolAdmin/Announcements/AnnouncementList.jsx
import React, { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import SchoolAdminLayout from '@/components/layouts/SchoolAdminLayout';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import GlassModal from '@/components/ui/GlassModal';
import {
  MegaphoneIcon,
  PlusIcon,
  BellIcon,
  EnvelopeIcon,
  TelegramIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  UsersIcon,
  CalendarIcon,
  FilterIcon,
  XMarkIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { arSA } from 'date-fns/locale';

// ================== ANNOUNCEMENT CARD ==================
const AnnouncementCard = ({ announcement, onView, onEdit, onDelete, onToggleStatus }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getPriorityBadge = (priority) => {
    const priorities = {
      low: { label: 'عادي', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: BellIcon },
      medium: { label: 'هام', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: BellIcon },
      high: { label: 'مهم جداً', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: ExclamationTriangleIcon },
      urgent: { label: 'عاجل', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: ExclamationTriangleIcon }
    };
    return priorities[priority] || priorities.low;
  };
  
  const getTypeBadge = (type) => {
    const types = {
      school: { label: 'عام', color: 'bg-indigo-500/20 text-indigo-400', icon: MegaphoneIcon },
      class: { label: 'صف', color: 'bg-emerald-500/20 text-emerald-400', icon: AcademicCapIcon },
      parent: { label: 'ولي أمر', color: 'bg-amber-500/20 text-amber-400', icon: UsersIcon },
      system: { label: 'نظام', color: 'bg-purple-500/20 text-purple-400', icon: ShieldCheckIcon }
    };
    return types[type] || types.school;
  };
  
  const priorityBadge = getPriorityBadge(announcement.priority);
  const typeBadge = getTypeBadge(announcement.type);
  const PriorityIcon = priorityBadge.icon;
  const TypeIcon = typeBadge.icon;
  
  const isExpired = announcement.expires_at && isPast(new Date(announcement.expires_at));
  const viewRate = announcement.total_recipients > 0 
    ? Math.round((announcement.views_count / announcement.total_recipients) * 100)
    : 0;
  
  return (
    <div className={`p-4 rounded-xl transition-all duration-200 ${
      announcement.is_active && !isExpired
        ? 'bg-white/5 hover:bg-white/10 border border-white/10'
        : 'bg-white/5 opacity-60 border border-white/5'
    }`}>
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${priorityBadge.color}`}>
              <PriorityIcon className="w-3 h-3 ml-1" />
              {priorityBadge.label}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${typeBadge.color}`}>
              <TypeIcon className="w-3 h-3 ml-1" />
              {typeBadge.label}
            </span>
            {!announcement.is_active && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400">
                <XMarkIcon className="w-3 h-3 ml-1" />
                غير نشط
              </span>
            )}
            {isExpired && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">
                <ClockIcon className="w-3 h-3 ml-1" />
                منتهي
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-1">{announcement.title}</h3>
          
          <p className={`text-gray-400 text-sm ${expanded ? '' : 'line-clamp-2'}`}>
            {announcement.content}
          </p>
          
          {announcement.content.length > 100 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-indigo-400 text-xs mt-1 hover:text-indigo-300 transition-colors"
            >
              {expanded ? 'عرض أقل' : 'عرض المزيد'}
            </button>
          )}
          
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
            <div className="flex items-center">
              <CalendarIcon className="w-3 h-3 ml-1" />
              <span>نشر: {format(new Date(announcement.created_at), 'dd/MM/yyyy hh:mm a')}</span>
            </div>
            {announcement.expires_at && (
              <div className="flex items-center">
                <ClockIcon className="w-3 h-3 ml-1" />
                <span>ينتهي: {format(new Date(announcement.expires_at), 'dd/MM/yyyy')}</span>
              </div>
            )}
            <div className="flex items-center">
              <EyeIcon className="w-3 h-3 ml-1" />
              <span>مشاهدة: {announcement.views_count} / {announcement.total_recipients}</span>
            </div>
            <div className="flex items-center">
              <ChartBarIcon className="w-3 h-3 ml-1" />
              <span>نسبة المشاهدة: {viewRate}%</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => onToggleStatus(announcement)}
            className={`p-2 rounded-lg transition-all ${
              announcement.is_active && !isExpired
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
            }`}
            title={announcement.is_active ? 'تعطيل' : 'تفعيل'}
          >
            {announcement.is_active && !isExpired ? (
              <CheckCircleIcon className="w-4 h-4" />
            ) : (
              <XMarkIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onEdit(announcement)}
            className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all"
            title="تعديل"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(announcement)}
            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            title="حذف"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Channels used */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
        <span className="text-gray-500 text-xs">قنوات الإرسال:</span>
        {announcement.send_web && (
          <span className="flex items-center text-xs text-blue-400">
            <BellIcon className="w-3 h-3 ml-1" />
            الويب
          </span>
        )}
        {announcement.send_telegram && (
          <span className="flex items-center text-xs text-indigo-400">
            <TelegramIcon className="w-3 h-3 ml-1" />
            تليغرام
          </span>
        )}
        {announcement.send_email && (
          <span className="flex items-center text-xs text-emerald-400">
            <EnvelopeIcon className="w-3 h-3 ml-1" />
            البريد
          </span>
        )}
      </div>
    </div>
  );
};

// ================== CREATE ANNOUNCEMENT MODAL ==================
const CreateAnnouncementModal = ({ isOpen, onClose, onSubmit, announcement, classes, isLoading }) => {
  const isEditing = !!announcement;
  const [formData, setFormData] = useState({
    title: announcement?.title || '',
    content: announcement?.content || '',
    type: announcement?.type || 'school',
    priority: announcement?.priority || 'medium',
    target_type: announcement?.target_type || 'all',
    target_ids: announcement?.target_ids || [],
    send_web: announcement?.send_web !== false,
    send_telegram: announcement?.send_telegram || false,
    send_email: announcement?.send_email || false,
    expires_at: announcement?.expires_at || '',
    is_active: announcement?.is_active !== false
  });
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [errors, setErrors] = useState({});
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  const handleAddTarget = () => {
    if (formData.target_type === 'class' && selectedClass) {
      const classItem = classes.find(c => c.id === parseInt(selectedClass));
      if (classItem && !formData.target_ids.some(t => t.id === classItem.id)) {
        setFormData(prev => ({
          ...prev,
          target_ids: [...prev.target_ids, { id: classItem.id, name: classItem.name, type: 'class' }]
        }));
        setSelectedClass('');
      }
    } else if (formData.target_type === 'role' && selectedRole) {
      const roleNames = { teacher: 'المعلمين', student: 'الطلاب', parent: 'أولياء الأمور' };
      if (!formData.target_ids.some(t => t.type === selectedRole)) {
        setFormData(prev => ({
          ...prev,
          target_ids: [...prev.target_ids, { id: selectedRole, name: roleNames[selectedRole], type: 'role' }]
        }));
        setSelectedRole('');
      }
    }
  };
  
  const handleRemoveTarget = (index) => {
    setFormData(prev => ({
      ...prev,
      target_ids: prev.target_ids.filter((_, i) => i !== index)
    }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'العنوان مطلوب';
    if (!formData.content.trim()) newErrors.content = 'المحتوى مطلوب';
    if (formData.type === 'class' && formData.target_ids.length === 0) {
      newErrors.target_ids = 'يجب اختيار صف واحد على الأقل';
    }
    if (formData.type === 'parent' && formData.target_ids.length === 0) {
      newErrors.target_ids = 'يجب اختيار مستلم واحد على الأقل';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  const getTargetTypeLabel = () => {
    switch (formData.type) {
      case 'school': return 'كل المدرسة';
      case 'class': return 'صفوف محددة';
      case 'parent': return 'أولياء أمور محددين';
      default: return 'الكل';
    }
  };
  
  return (
    <GlassModal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? 'تعديل إعلان' : 'إعلان جديد'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-all">
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">العنوان *</label>
            <GlassInput
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="أدخل عنوان الإعلان"
              error={errors.title}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm mb-2">المحتوى *</label>
            <textarea
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="أدخل نص الإعلان..."
              rows="5"
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-all resize-none"
              required
            />
            {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">نوع الإعلان</label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="school">عام (كل المدرسة)</option>
                <option value="class">خاص بالصفوف</option>
                <option value="parent">خاص بأولياء الأمور</option>
                <option value="system">نظام (مدير فقط)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-2">الأولوية</label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="low">عادي</option>
                <option value="medium">هام</option>
                <option value="high">مهم جداً</option>
                <option value="urgent">عاجل</option>
              </select>
            </div>
          </div>
          
          {/* Targeting Section */}
          {formData.type !== 'school' && formData.type !== 'system' && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="block text-gray-300 text-sm mb-3">الاستهداف: {getTargetTypeLabel()}</label>
              
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {formData.type === 'class' && (
                  <>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">اختر صفاً</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <GlassButton type="button" size="sm" onClick={handleAddTarget} disabled={!selectedClass}>
                      <PlusIcon className="w-4 h-4" />
                      إضافة
                    </GlassButton>
                  </>
                )}
                
                {formData.type === 'parent' && (
                  <>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">اختر فئة</option>
                      <option value="teacher">المعلمين</option>
                      <option value="student">الطلاب</option>
                      <option value="parent">أولياء الأمور</option>
                    </select>
                    <GlassButton type="button" size="sm" onClick={handleAddTarget} disabled={!selectedRole}>
                      <PlusIcon className="w-4 h-4" />
                      إضافة
                    </GlassButton>
                  </>
                )}
              </div>
              
              {formData.target_ids.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.target_ids.map((target, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-400">
                      {target.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTarget(index)}
                        className="mr-1 hover:text-white transition-colors"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.target_ids && <p className="text-red-400 text-xs mt-2">{errors.target_ids}</p>}
            </div>
          )}
          
          {/* Channels */}
          <div>
            <label className="block text-gray-300 text-sm mb-3">قنوات الإرسال</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.send_web}
                  onChange={(e) => handleChange('send_web', e.target.checked)}
                  className="ml-2 w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-gray-300 text-sm">إشعار ويب</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.send_telegram}
                  onChange={(e) => handleChange('send_telegram', e.target.checked)}
                  className="ml-2 w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-gray-300 text-sm">تليغرام</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.send_email}
                  onChange={(e) => handleChange('send_email', e.target.checked)}
                  className="ml-2 w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-gray-300 text-sm">بريد إلكتروني</span>
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">تاريخ الانتهاء (اختياري)</label>
              <GlassInput
                type="date"
                value={formData.expires_at}
                onChange={(e) => handleChange('expires_at', e.target.value)}
              />
            </div>
            
            <div className="flex items-center pt-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="ml-2 w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-gray-300 text-sm">نشر الإعلان فوراً</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 space-x-reverse pt-4">
            <GlassButton type="button" variant="outline" onClick={onClose}>
              إلغاء
            </GlassButton>
            <GlassButton type="submit" isLoading={isLoading}>
              {isEditing ? 'حفظ التعديلات' : 'نشر الإعلان'}
            </GlassButton>
          </div>
        </form>
      </div>
    </GlassModal>
  );
};

// ================== DELETE CONFIRMATION MODAL ==================
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, announcementTitle, isLoading }) => {
  return (
    <GlassModal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">تأكيد الحذف</h2>
        <p className="text-gray-300 mb-6">
          هل أنت متأكد من حذف الإعلان "{announcementTitle}"؟
          <br />
          <span className="text-sm text-gray-500">لا يمكن التراجع عن هذا الإجراء.</span>
        </p>
        <div className="flex justify-center space-x-3 space-x-reverse">
          <GlassButton type="button" variant="outline" onClick={onClose}>
            إلغاء
          </GlassButton>
          <GlassButton type="button" variant="danger" onClick={onConfirm} isLoading={isLoading}>
            حذف
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
};

// ================== STATS SUMMARY ==================
const AnnouncementStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <GlassCard className="p-4 text-center">
        <MegaphoneIcon className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
        <p className="text-2xl font-bold text-white">{stats.total}</p>
        <p className="text-gray-400 text-xs">إجمالي الإعلانات</p>
      </GlassCard>
      <GlassCard className="p-4 text-center">
        <EyeIcon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
        <p className="text-2xl font-bold text-white">{stats.active}</p>
        <p className="text-gray-400 text-xs">نشطة حالياً</p>
      </GlassCard>
      <GlassCard className="p-4 text-center">
        <ChartBarIcon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
        <p className="text-2xl font-bold text-white">{stats.avg_view_rate}%</p>
        <p className="text-gray-400 text-xs">متوسط نسبة المشاهدة</p>
      </GlassCard>
      <GlassCard className="p-4 text-center">
        <UserGroupIcon className="w-6 h-6 text-purple-400 mx-auto mb-2" />
        <p className="text-2xl font-bold text-white">{stats.total_recipients}</p>
        <p className="text-gray-400 text-xs">إجمالي المستلمين</p>
      </GlassCard>
    </div>
  );
};

// ================== MAIN ANNOUNCEMENT LIST COMPONENT ==================
export default function AnnouncementList() {
  const { announcements, classes, stats, filters: initialFilters } = usePage().props;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const filteredAnnouncements = useMemo(() => {
    let filtered = [...announcements];
    
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType) {
      filtered = filtered.filter(a => a.type === filterType);
    }
    
    if (filterPriority) {
      filtered = filtered.filter(a => a.priority === filterPriority);
    }
    
    if (filterStatus) {
      if (filterStatus === 'active') {
        filtered = filtered.filter(a => a.is_active);
      } else if (filterStatus === 'inactive') {
        filtered = filtered.filter(a => !a.is_active);
      } else if (filterStatus === 'expired') {
        filtered = filtered.filter(a => a.expires_at && isPast(new Date(a.expires_at)));
      }
    }
    
    return filtered;
  }, [announcements, searchTerm, filterType, filterPriority, filterStatus]);
  
  const handleCreateAnnouncement = (formData) => {
    setIsLoading(true);
    router.post('/school-admin/announcements', formData, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setIsLoading(false);
      },
      onError: (errors) => {
        console.error(errors);
        setIsLoading(false);
      }
    });
  };
  
  const handleEditAnnouncement = (formData) => {
    setIsLoading(true);
    router.put(`/school-admin/announcements/${selectedAnnouncement.id}`, formData, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setSelectedAnnouncement(null);
        setIsLoading(false);
      },
      onError: (errors) => {
        console.error(errors);
        setIsLoading(false);
      }
    });
  };
  
  const handleDeleteAnnouncement = () => {
    setIsLoading(true);
    router.delete(`/school-admin/announcements/${selectedAnnouncement.id}`, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setSelectedAnnouncement(null);
        setIsLoading(false);
      },
      onError: (errors) => {
        console.error(errors);
        setIsLoading(false);
      }
    });
  };
  
  const handleToggleStatus = (announcement) => {
    router.patch(`/school-admin/announcements/${announcement.id}/toggle`, {}, {
      onSuccess: () => {
        router.reload();
      }
    });
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterPriority('');
    setFilterStatus('');
  };
  
  return (
    <SchoolAdminLayout>
      <Head title="الإعلانات - مدير المدرسة" />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <MegaphoneIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">الإعلانات</h1>
                <p className="text-gray-400">إدارة إعلانات المدرسة والتواصل مع الجميع</p>
              </div>
            </div>
          </div>
          
          <GlassButton onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon className="w-5 h-5 ml-2" />
            إعلان جديد
          </GlassButton>
        </div>
      </div>
      
      {/* Stats */}
      <AnnouncementStats stats={stats} />
      
      {/* Filters */}
      <GlassCard className="p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <GlassInput
              placeholder="بحث في الإعلانات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<DocumentTextIcon className="w-5 h-5 text-gray-400" />}
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">كل الأنواع</option>
            <option value="school">عام</option>
            <option value="class">خاص بالصفوف</option>
            <option value="parent">أولياء الأمور</option>
            <option value="system">نظام</option>
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">كل الأولويات</option>
            <option value="low">عادي</option>
            <option value="medium">هام</option>
            <option value="high">مهم جداً</option>
            <option value="urgent">عاجل</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="expired">منتهي</option>
          </select>
          
          {(searchTerm || filterType || filterPriority || filterStatus) && (
            <GlassButton variant="outline" onClick={clearFilters}>
              <XMarkIcon className="w-4 h-4 ml-1" />
              مسح
            </GlassButton>
          )}
        </div>
      </GlassCard>
      
      {/* Announcements List */}
      <div className="space-y-3">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onView={(a) => router.visit(`/school-admin/announcements/${a.id}`)}
              onEdit={(a) => {
                setSelectedAnnouncement(a);
                setIsEditModalOpen(true);
              }}
              onDelete={(a) => {
                setSelectedAnnouncement(a);
                setIsDeleteModalOpen(true);
              }}
              onToggleStatus={handleToggleStatus}
            />
          ))
        ) : (
          <GlassCard className="p-12 text-center">
            <MegaphoneIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">لا توجد إعلانات مطابقة للبحث</p>
            <GlassButton variant="outline" className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
              <PlusIcon className="w-4 h-4 ml-1" />
              إنشاء أول إعلان
            </GlassButton>
          </GlassCard>
        )}
      </div>
      
      {/* Modals */}
      <CreateAnnouncementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAnnouncement}
        announcement={null}
        classes={classes}
        isLoading={isLoading}
      />
      
      <CreateAnnouncementModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        onSubmit={handleEditAnnouncement}
        announcement={selectedAnnouncement}
        classes={classes}
        isLoading={isLoading}
      />
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        onConfirm={handleDeleteAnnouncement}
        announcementTitle={selectedAnnouncement?.title}
        isLoading={isLoading}
      />
    </SchoolAdminLayout>
  );
}