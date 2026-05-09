// resources/js/pages/SchoolAdmin/Users/StudentsList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import SchoolAdminLayout from '@/components/layouts/SchoolAdminLayout';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import GlassModal from '@/components/ui/GlassModal';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
  PhotoIcon,
  AcademicCapIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// ==================== STUDENT TABLE ROW COMPONENT ====================
const StudentTableRow = ({ student, index, onEdit, onDelete, onView }) => {
  const getStatusBadge = (status) => {
    const statuses = {
      active: { label: 'نشط', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      inactive: { label: 'غير نشط', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      graduated: { label: 'متخرج', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      transferred: { label: 'منقول', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
    };
    return statuses[status] || statuses.active;
  };

  const statusStyle = getStatusBadge(student.status);

  return (
    <tr className="border-b border-white/10 hover:bg-white/5 transition-all duration-200 group">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {student.full_name.charAt(0)}
          </div>
          <div>
            <p className="text-white font-medium">{student.full_name}</p>
            <p className="text-gray-500 text-xs">{student.student_code}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-300">{student.class?.name || '-'}</td>
      <td className="px-4 py-3 text-gray-300">{student.grade_average}%</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs border ${statusStyle.color}`}>
          {statusStyle.label}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-400 text-sm">{student.parent_name || '-'}</td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => onView(student)}
            className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
            title="عرض التفاصيل"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(student)}
            className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all"
            title="تعديل"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(student)}
            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            title="حذف"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ==================== PAGINATION COMPONENT ====================
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5;
    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    let end = Math.min(totalPages, start + showPages - 1);
    
    if (end - start < showPages - 1) {
      start = Math.max(1, end - showPages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-gray-400 text-sm">
        صفحة {currentPage} من {totalPages}
      </p>
      <div className="flex items-center space-x-2 space-x-reverse">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all ${
            currentPage === 1
              ? 'bg-white/5 text-gray-600 cursor-not-allowed'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
        
        {getPageNumbers().map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-lg transition-all ${
              currentPage === page
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? 'bg-white/5 text-gray-600 cursor-not-allowed'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ==================== ADD/EDIT STUDENT MODAL ====================
const StudentFormModal = ({ isOpen, onClose, student, onSubmit, classes, isLoading }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    student_code: '',
    class_id: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    address: '',
    birth_date: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });
  
  const [errors, setErrors] = useState({});
  const isEditing = !!student;
  
  useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name || '',
        student_code: student.student_code || '',
        class_id: student.class_id || '',
        parent_name: student.parent_name || '',
        parent_phone: student.parent_phone || '',
        parent_email: student.parent_email || '',
        address: student.address || '',
        birth_date: student.birth_date || '',
        enrollment_date: student.enrollment_date || new Date().toISOString().split('T')[0],
        status: student.status || 'active'
      });
    } else {
      setFormData({
        full_name: '',
        student_code: '',
        class_id: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        address: '',
        birth_date: '',
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active'
      });
    }
    setErrors({});
  }, [student, isOpen]);
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'الاسم الكامل مطلوب';
    if (!formData.student_code.trim()) newErrors.student_code = 'رمز الطالب مطلوب';
    if (!formData.class_id) newErrors.class_id = 'الصف الدراسي مطلوب';
    if (formData.parent_phone && !/^[0-9]{10,15}$/.test(formData.parent_phone)) {
      newErrors.parent_phone = 'رقم الهاتف غير صحيح';
    }
    if (formData.parent_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent_email)) {
      newErrors.parent_email = 'البريد الإلكتروني غير صحيح';
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
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  return (
    <GlassModal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-all">
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">الاسم الكامل *</label>
              <GlassInput
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="أدخل الاسم الكامل"
                error={errors.full_name}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-2">رمز الطالب *</label>
              <GlassInput
                value={formData.student_code}
                onChange={(e) => handleChange('student_code', e.target.value)}
                placeholder="مثال: STU-2024-001"
                error={errors.student_code}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-2">الصف الدراسي *</label>
              <select
                value={formData.class_id}
                onChange={(e) => handleChange('class_id', e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
                required
              >
                <option value="">اختر الصف</option>
                {classes.map(classItem => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name} - {classItem.academic_year}
                  </option>
                ))}
              </select>
              {errors.class_id && <p className="text-red-400 text-xs mt-1">{errors.class_id}</p>}
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-2">تاريخ الميلاد</label>
              <GlassInput
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-2">تاريخ التسجيل</label>
              <GlassInput
                type="date"
                value={formData.enrollment_date}
                onChange={(e) => handleChange('enrollment_date', e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-2">الحالة</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="graduated">متخرج</option>
                <option value="transferred">منقول</option>
              </select>
            </div>
          </div>
          
          <div className="border-t border-white/10 my-4 pt-4">
            <h3 className="text-lg font-semibold text-white mb-4">معلومات ولي الأمر</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">اسم ولي الأمر</label>
                <GlassInput
                  value={formData.parent_name}
                  onChange={(e) => handleChange('parent_name', e.target.value)}
                  placeholder="أدخل اسم ولي الأمر"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-2">رقم الهاتف</label>
                <GlassInput
                  value={formData.parent_phone}
                  onChange={(e) => handleChange('parent_phone', e.target.value)}
                  placeholder="مثال: 0512345678"
                  error={errors.parent_phone}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-2">البريد الإلكتروني</label>
                <GlassInput
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => handleChange('parent_email', e.target.value)}
                  placeholder="parent@example.com"
                  error={errors.parent_email}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-300 text-sm mb-2">العنوان</label>
                <GlassInput
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="أدخل العنوان"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 space-x-reverse pt-4">
            <GlassButton type="button" variant="outline" onClick={onClose}>
              إلغاء
            </GlassButton>
            <GlassButton type="submit" isLoading={isLoading}>
              {isEditing ? 'حفظ التعديلات' : 'إضافة الطالب'}
            </GlassButton>
          </div>
        </form>
      </div>
    </GlassModal>
  );
};

// ==================== DELETE CONFIRMATION MODAL ====================
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, studentName, isLoading }) => {
  return (
    <GlassModal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">تأكيد الحذف</h2>
        <p className="text-gray-300 mb-6">
          هل أنت متأكد من حذف الطالب <span className="text-red-400 font-semibold">{studentName}</span>؟
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

// ==================== IMPORT STUDENTS MODAL ====================
const ImportModal = ({ isOpen, onClose, onImport, isLoading }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.type === 'text/csv')) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('الرجاء اختيار ملف Excel أو CSV صالح');
    }
  };
  
  const handleImport = () => {
    if (file) {
      onImport(file);
    }
  };
  
  return (
    <GlassModal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">استيراد طلاب من Excel</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-all">
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center mb-4">
          <ArrowUpTrayIcon className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-2">اسحب وأفلت ملف Excel هنا أو</p>
          <label className="cursor-pointer">
            <span className="text-indigo-400 hover:text-indigo-300">اختر ملف من جهازك</span>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
          </label>
          {file && (
            <p className="text-green-400 text-sm mt-2">✓ {file.name}</p>
          )}
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>
        
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <p className="text-gray-400 text-sm mb-2">📄 تنسيق الملف المطلوب:</p>
          <ul className="text-gray-500 text-xs space-y-1">
            <li>• العمود A: الاسم الكامل (مطلوب)</li>
            <li>• العمود B: رمز الطالب (مطلوب)</li>
            <li>• العمود C: اسم الصف (مطلوب)</li>
            <li>• العمود D: اسم ولي الأمر</li>
            <li>• العمود E: رقم هاتف ولي الأمر</li>
          </ul>
          <GlassButton size="sm" variant="outline" className="mt-3">
            <DocumentArrowDownIcon className="w-4 h-4 ml-2" />
            تحميل نموذج Excel
          </GlassButton>
        </div>
        
        <div className="flex justify-end space-x-3 space-x-reverse">
          <GlassButton type="button" variant="outline" onClick={onClose}>
            إلغاء
          </GlassButton>
          <GlassButton type="button" onClick={handleImport} isLoading={isLoading} disabled={!file}>
            استيراد
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
};

// ==================== MAIN STUDENTS LIST COMPONENT ====================
export default function StudentsList() {
  const { students, classes, filters: initialFilters, pagination } = usePage().props;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(pagination?.current_page || 1);
  
  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    let filtered = [...students];
    
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedClass) {
      filtered = filtered.filter(s => s.class_id === parseInt(selectedClass));
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(s => s.status === selectedStatus);
    }
    
    return filtered;
  }, [students, searchTerm, selectedClass, selectedStatus]);
  
  const handleAddStudent = (formData) => {
    setIsLoading(true);
    router.post('/school-admin/students', formData, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        setIsLoading(false);
      },
      onError: (errors) => {
        console.error(errors);
        setIsLoading(false);
      }
    });
  };
  
  const handleEditStudent = (formData) => {
    setIsLoading(true);
    router.put(`/school-admin/students/${selectedStudent.id}`, formData, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setSelectedStudent(null);
        setIsLoading(false);
      },
      onError: (errors) => {
        console.error(errors);
        setIsLoading(false);
      }
    });
  };
  
  const handleDeleteStudent = () => {
    setIsLoading(true);
    router.delete(`/school-admin/students/${selectedStudent.id}`, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setSelectedStudent(null);
        setIsLoading(false);
      },
      onError: (errors) => {
        console.error(errors);
        setIsLoading(false);
      }
    });
  };
  
  const handleImportStudents = (file) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    router.post('/school-admin/students/import', formData, {
      onSuccess: () => {
        setIsImportModalOpen(false);
        setIsLoading(false);
      },
      onError: (errors) => {
        console.error(errors);
        setIsLoading(false);
      }
    });
  };
  
  const handleExport = () => {
    window.location.href = '/school-admin/students/export?format=excel';
  };
  
  const handleViewStudent = (student) => {
    router.visit(`/school-admin/students/${student.id}`);
  };
  
  return (
    <SchoolAdminLayout>
      <Head title="إدارة الطلاب - مدير المدرسة" />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">إدارة الطلاب</h1>
            <p className="text-gray-400">إدارة جميع الطلاب المسجلين في المدرسة</p>
          </div>
          <div className="flex space-x-3 space-x-reverse">
            <GlassButton variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <ArrowUpTrayIcon className="w-5 h-5 ml-2" />
              استيراد
            </GlassButton>
            <GlassButton variant="outline" onClick={handleExport}>
              <ArrowDownTrayIcon className="w-5 h-5 ml-2" />
              تصدير
            </GlassButton>
            <GlassButton onClick={() => setIsAddModalOpen(true)}>
              <PlusIcon className="w-5 h-5 ml-2" />
              إضافة طالب
            </GlassButton>
          </div>
        </div>
      </div>
      
      {/* Filters Section */}
      <GlassCard className="p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <GlassInput
              placeholder="بحث بالاسم أو رمز الطالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
            />
          </div>
          
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">كل الصفوف</option>
            {classes.map(classItem => (
              <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
            ))}
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="graduated">متخرج</option>
            <option value="transferred">منقول</option>
          </select>
          
          <GlassButton variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedClass('');
            setSelectedStatus('');
          }}>
            <FunnelIcon className="w-5 h-5 ml-2" />
            مسح التصفية
          </GlassButton>
        </div>
      </GlassCard>
      
      {/* Students Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-right text-gray-300 font-semibold">الطالب</th>
                <th className="px-4 py-3 text-right text-gray-300 font-semibold">الصف</th>
                <th className="px-4 py-3 text-right text-gray-300 font-semibold">المعدل</th>
                <th className="px-4 py-3 text-right text-gray-300 font-semibold">الحالة</th>
                <th className="px-4 py-3 text-right text-gray-300 font-semibold">ولي الأمر</th>
                <th className="px-4 py-3 text-right text-gray-300 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <StudentTableRow
                    key={student.id}
                    student={student}
                    index={index}
                    onEdit={(s) => {
                      setSelectedStudent(s);
                      setIsEditModalOpen(true);
                    }}
                    onDelete={(s) => {
                      setSelectedStudent(s);
                      setIsDeleteModalOpen(true);
                    }}
                    onView={handleViewStudent}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <UserGroupIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">لا توجد طلاب مطابقين للبحث</p>
                    <GlassButton variant="outline" className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                      <PlusIcon className="w-4 h-4 ml-2" />
                      إضافة طالب جديد
                    </GlassButton>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredStudents.length > 0 && (
          <div className="px-4 py-3 border-t border-white/10">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredStudents.length / 15)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </GlassCard>
      
      {/* Modals */}
      <StudentFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        student={null}
        onSubmit={handleAddStudent}
        classes={classes}
        isLoading={isLoading}
      />
      
      <StudentFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSubmit={handleEditStudent}
        classes={classes}
        isLoading={isLoading}
      />
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleDeleteStudent}
        studentName={selectedStudent?.full_name}
        isLoading={isLoading}
      />
      
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportStudents}
        isLoading={isLoading}
      />
    </SchoolAdminLayout>
  );
}