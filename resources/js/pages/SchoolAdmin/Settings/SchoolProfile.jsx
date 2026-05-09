// resources/js/pages/SchoolAdmin/Settings/SchoolProfile.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import SchoolAdminLayout from '@/components/layouts/SchoolAdminLayout';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import GlassModal from '@/components/ui/GlassModal';
import {
  BuildingOfficeIcon,
  GlobeAltIcon,
  PhotoIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  MapPinIcon,
  CreditCardIcon,
  BellIcon,
  SparklesIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  WalletIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// ================== SECTION HEADER ==================
const SectionHeader = ({ title, description, icon: Icon }) => {
  return (
    <div className="flex items-center space-x-3 space-x-reverse mb-4 pb-3 border-b border-white/10">
      <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
};

// ================== INFO FIELD ==================
const InfoField = ({ label, value, icon: Icon, onEdit, isEditing, editValue, onEditChange, type = 'text' }) => {
  return (
    <div className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <Icon className="w-4 h-4 text-indigo-400 ml-2" />
          <span className="text-gray-400 text-sm">{label}</span>
        </div>
        {onEdit && (
          <button onClick={onEdit} className="text-gray-500 hover:text-indigo-400 transition-colors">
            <PencilIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      {isEditing ? (
        <input
          type={type}
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-all"
          autoFocus
        />
      ) : (
        <p className="text-white font-medium">{value || '—'}</p>
      )}
    </div>
  );
};

// ================== TOGGLE SETTING ==================
const ToggleSetting = ({ label, description, enabled, onToggle }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
      <div>
        <p className="text-white font-medium">{label}</p>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-all ${
          enabled ? 'bg-indigo-500' : 'bg-white/20'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
            enabled ? 'right-1' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
};

// ================== SUBSCRIPTION CARD ==================
const SubscriptionCard = ({ subscription, onUpgrade }) => {
  const plans = {
    basic: { name: 'أساسي', price: '99', color: 'from-slate-500 to-gray-600', limits: { students: 500, teachers: 50, aiBudget: 0.25 } },
    premium: { name: 'بريميوم', price: '199', color: 'from-indigo-500 to-purple-600', limits: { students: 2000, teachers: 200, aiBudget: 0.50 } },
    enterprise: { name: 'مؤسسي', price: '399', color: 'from-amber-500 to-orange-600', limits: { students: 'غير محدود', teachers: 'غير محدود', aiBudget: 1.00 } }
  };
  
  const currentPlan = plans[subscription.plan];
  const usagePercent = (subscription.students_count / (plans[subscription.plan]?.limits.students || 1)) * 100;
  
  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${currentPlan.color} mb-3`}>
            <CreditCardIcon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">{currentPlan.name}</h3>
          <p className="text-gray-400 text-sm">${currentPlan.price}/شهر</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          subscription.status === 'active' 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : subscription.status === 'trial'
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {subscription.status === 'active' ? 'نشط' : subscription.status === 'trial' ? 'تجريبي' : 'منتهي'}
        </div>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">الطلاب المسجلين</span>
          <span className="text-white">{subscription.students_count} / {currentPlan.limits.students}</span>
        </div>
        <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">المعلمين</span>
          <span className="text-white">{subscription.teachers_count} / {currentPlan.limits.teachers}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">ميزانية AI اليومية</span>
          <span className="text-white">${currentPlan.limits.aiBudget}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-3 border-t border-white/10">
        <span className="text-gray-400 text-sm">التجديد: {subscription.renews_at}</span>
        {subscription.plan !== 'enterprise' && (
          <GlassButton size="sm" onClick={onUpgrade}>
            ترقية الباقة
          </GlassButton>
        )}
      </div>
    </GlassCard>
  );
};

// ================== API KEY MODAL ==================
const ApiKeyModal = ({ isOpen, onClose, onSave, initialKey, isLoading }) => {
  const [apiKey, setApiKey] = useState(initialKey || '');
  const [showKey, setShowKey] = useState(false);
  
  return (
    <GlassModal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-4">إعدادات API</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">مفتاح API</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="أدخل مفتاح API"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all pl-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showKey ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1">مطلوب لتكامل الذكاء الاصطناعي</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 space-x-reverse mt-6">
          <GlassButton variant="outline" onClick={onClose}>
            إلغاء
          </GlassButton>
          <GlassButton onClick={() => onSave(apiKey)} isLoading={isLoading}>
            حفظ
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
};

// ================== NOTIFICATION PREVIEW ==================
const NotificationPreview = () => {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/10">
      <p className="text-gray-400 text-sm mb-3">معاينة الإشعار</p>
      <div className="flex items-center space-x-3 space-x-reverse p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <BellIcon className="w-5 h-5 text-indigo-400" />
        <div>
          <p className="text-white text-sm font-medium">تم تسجيل حضور جديد</p>
          <p className="text-gray-400 text-xs">سيتم إرسال هذا الإشعار عند تسجيل حضور الطالب</p>
        </div>
      </div>
    </div>
  );
};

// ================== MAIN SCHOOL PROFILE COMPONENT ==================
export default function SchoolProfile() {
  const { school, settings, subscription } = usePage().props;
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState({});
  const [editValues, setEditValues] = useState({});
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(school.logo_url);
  const fileInputRef = useRef(null);
  
  const tabs = [
    { id: 'profile', label: 'الملف الشخصي', icon: BuildingOfficeIcon },
    { id: 'notifications', label: 'الإشعارات', icon: BellIcon },
    { id: 'ai', label: 'الذكاء الاصطناعي', icon: SparklesIcon },
    { id: 'security', label: 'الأمان', icon: ShieldCheckIcon },
    { id: 'billing', label: 'الفواتير', icon: CreditCardIcon }
  ];
  
  const handleEdit = (field, value) => {
    setIsEditing({ ...isEditing, [field]: true });
    setEditValues({ ...editValues, [field]: value });
  };
  
  const handleSave = (field) => {
    setIsLoading(true);
    router.patch('/school-admin/settings/profile', {
      [field]: editValues[field]
    }, {
      onSuccess: () => {
        setIsEditing({ ...isEditing, [field]: false });
        setIsLoading(false);
      },
      onError: () => {
        setIsLoading(false);
      }
    });
  };
  
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('logo', file);
      
      setIsLoading(true);
      router.post('/school-admin/settings/logo', formData, {
        onSuccess: () => {
          setIsLoading(false);
        },
        onError: () => {
          setIsLoading(false);
        }
      });
    }
  };
  
  const handleToggleSetting = (settingKey, currentValue) => {
    router.patch('/school-admin/settings/toggle', {
      key: settingKey,
      value: !currentValue
    });
  };
  
  const handleSaveApiKey = (apiKey) => {
    setIsLoading(true);
    router.patch('/school-admin/settings/api-key', { api_key: apiKey }, {
      onSuccess: () => {
        setIsApiModalOpen(false);
        setIsLoading(false);
      },
      onError: () => {
        setIsLoading(false);
      }
    });
  };
  
  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Logo Section */}
      <GlassCard className="p-6">
        <SectionHeader title="شعار المدرسة" description="تحديث شعار المدرسة" icon={PhotoIcon} />
        <div className="flex items-center space-x-6 space-x-reverse">
          <div className="relative">
            {logoPreview ? (
              <img src={logoPreview} alt={school.name} className="w-24 h-24 rounded-xl object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <BuildingOfficeIcon className="w-12 h-12 text-white" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-all"
            >
              <PhotoIcon className="w-3 h-3" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-gray-400 text-sm">يُفضل استخدام صورة مربعة بحجم 200x200 بكسل</p>
            <p className="text-gray-500 text-xs">الصيغ المدعومة: JPG, PNG, SVG</p>
          </div>
        </div>
      </GlassCard>
      
      {/* School Info */}
      <GlassCard className="p-6">
        <SectionHeader title="معلومات المدرسة" description="البيانات الأساسية للمدرسة" icon={BuildingOfficeIcon} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField
            label="اسم المدرسة"
            value={school.name}
            icon={BuildingOfficeIcon}
            onEdit={() => handleEdit('name', school.name)}
            isEditing={isEditing.name}
            editValue={editValues.name}
            onEditChange={(v) => setEditValues({ ...editValues, name: v })}
          />
          <InfoField
            label="النطاق الفرعي"
            value={`${school.subdomain}.monadim.online`}
            icon={GlobeAltIcon}
          />
          <InfoField
            label="البريد الإلكتروني"
            value={school.email}
            icon={EnvelopeIcon}
            onEdit={() => handleEdit('email', school.email)}
            isEditing={isEditing.email}
            editValue={editValues.email}
            onEditChange={(v) => setEditValues({ ...editValues, email: v })}
          />
          <InfoField
            label="رقم الهاتف"
            value={school.phone}
            icon={DevicePhoneMobileIcon}
            onEdit={() => handleEdit('phone', school.phone)}
            isEditing={isEditing.phone}
            editValue={editValues.phone}
            onEditChange={(v) => setEditValues({ ...editValues, phone: v })}
          />
          <InfoField
            label="العنوان"
            value={school.address}
            icon={MapPinIcon}
            onEdit={() => handleEdit('address', school.address)}
            isEditing={isEditing.address}
            editValue={editValues.address}
            onEditChange={(v) => setEditValues({ ...editValues, address: v })}
          />
        </div>
        
        {Object.keys(isEditing).some(key => isEditing[key]) && (
          <div className="flex justify-end space-x-3 space-x-reverse mt-4 pt-3 border-t border-white/10">
            {Object.keys(isEditing).map(field => isEditing[field] && (
              <div key={field} className="flex space-x-2 space-x-reverse">
                <GlassButton size="sm" variant="outline" onClick={() => setIsEditing({ ...isEditing, [field]: false })}>
                  إلغاء
                </GlassButton>
                <GlassButton size="sm" onClick={() => handleSave(field)} isLoading={isLoading}>
                  حفظ
                </GlassButton>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
  
  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <SectionHeader title="إعدادات الإشعارات" description="تخصيص رسائل الإشعارات" icon={BellIcon} />
        
        <div className="space-y-3">
          <ToggleSetting
            label="إشعارات الحضور"
            description="إرسال إشعار عند تسجيل حضور أو غياب الطالب"
            enabled={settings.attendance_notifications}
            onToggle={() => handleToggleSetting('attendance_notifications', settings.attendance_notifications)}
          />
          <ToggleSetting
            label="إشعارات الدرجات"
            description="إرسال إشعار عند إضافة أو تعديل درجة"
            enabled={settings.grade_notifications}
            onToggle={() => handleToggleSetting('grade_notifications', settings.grade_notifications)}
          />
          <ToggleSetting
            label="إشعارات الإعلانات"
            description="إرسال إشعار عند نشر إعلان جديد"
            enabled={settings.announcement_notifications}
            onToggle={() => handleToggleSetting('announcement_notifications', settings.announcement_notifications)}
          />
          <ToggleSetting
            label="تليغرام"
            description="إرسال الإشعارات عبر تليغرام"
            enabled={settings.telegram_enabled}
            onToggle={() => handleToggleSetting('telegram_enabled', settings.telegram_enabled)}
          />
          <ToggleSetting
            label="البريد الإلكتروني"
            description="إرسال الإشعارات عبر البريد الإلكتروني"
            enabled={settings.email_enabled}
            onToggle={() => handleToggleSetting('email_enabled', settings.email_enabled)}
          />
        </div>
      </GlassCard>
      
      <NotificationPreview />
    </div>
  );
  
  const renderAITab = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <SectionHeader title="إعدادات الذكاء الاصطناعي" description="تخصيص استخدام المساعد الذكي" icon={SparklesIcon} />
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
            <div>
              <p className="text-white font-medium">الميزانية اليومية</p>
              <p className="text-gray-400 text-sm">الحد الأقصى للإنفاق على AI يومياً</p>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-white">${settings.ai_daily_budget}</span>
              <button className="text-indigo-400 text-sm">تعديل</button>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
            <div>
              <p className="text-white font-medium">مفتاح DeepSeek API</p>
              <p className="text-gray-400 text-sm">مطلوب لتشغيل المساعد الذكي</p>
            </div>
            <GlassButton size="sm" variant="outline" onClick={() => setIsApiModalOpen(true)}>
              {settings.deepseek_api_key ? 'تحديث' : 'إضافة'}
            </GlassButton>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
            <div>
              <p className="text-white font-medium">مفتاح Gemini API</p>
              <p className="text-gray-400 text-sm">احتياطي عند تعذر DeepSeek</p>
            </div>
            <GlassButton size="sm" variant="outline" onClick={() => setIsApiModalOpen(true)}>
              {settings.gemini_api_key ? 'تحديث' : 'إضافة'}
            </GlassButton>
          </div>
          
          <ToggleSetting
            label="تفعيل الذكاء الاصطناعي"
            description="تمكين أو تعطيل المساعد الذكي بالكامل"
            enabled={settings.ai_enabled}
            onToggle={() => handleToggleSetting('ai_enabled', settings.ai_enabled)}
          />
        </div>
      </GlassCard>
      
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">إحصائيات الاستخدام</h3>
            <p className="text-gray-400 text-sm">آخر 30 يوم</p>
          </div>
          <ChartBarIcon className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">إجمالي الطلبات</span>
            <span className="text-white">{settings.ai_stats?.total_requests || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">إجمالي التكلفة</span>
            <span className="text-white">${settings.ai_stats?.total_cost || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">المتوسط اليومي</span>
            <span className="text-white">${settings.ai_stats?.avg_daily_cost || 0}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
  
  const renderSecurityTab = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <SectionHeader title="الأمان" description="إعدادات الأمان والصلاحيات" icon={ShieldCheckIcon} />
        
        <div className="space-y-3">
          <ToggleSetting
            label="المصادقة الثنائية (2FA)"
            description="طلب رمز تحقق إضافي عند تسجيل الدخول"
            enabled={settings.two_factor_enabled}
            onToggle={() => handleToggleSetting('two_factor_enabled', settings.two_factor_enabled)}
          />
          <ToggleSetting
            label="تسجيل الدخول الفردي (SSO)"
            description="السماح بتسجيل الدخول عبر Google/Microsoft"
            enabled={settings.sso_enabled}
            onToggle={() => handleToggleSetting('sso_enabled', settings.sso_enabled)}
          />
          <ToggleSetting
            label="سجل التدقيق"
            description="تسجيل جميع عمليات المستخدمين"
            enabled={settings.audit_log_enabled}
            onToggle={() => handleToggleSetting('audit_log_enabled', settings.audit_log_enabled)}
          />
        </div>
      </GlassCard>
      
      <GlassCard className="p-6">
        <SectionHeader title="جلسات الدخول النشطة" description="الأجهزة المتصلة حالياً" icon={UserGroupIcon} />
        <div className="space-y-3">
          {settings.active_sessions?.map((session, index) => (
            <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-white/5">
              <div>
                <p className="text-white text-sm">{session.device}</p>
                <p className="text-gray-500 text-xs">{session.location} • {session.last_active}</p>
              </div>
              <button className="text-red-400 text-sm">تسجيل خروج</button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
  
  const renderBillingTab = () => (
    <div className="space-y-6">
      <SubscriptionCard subscription={subscription} onUpgrade={() => router.visit('/school-admin/settings/upgrade')} />
      
      <GlassCard className="p-6">
        <SectionHeader title="طرق الدفع" description="بطاقات الائتمان المحفوظة" icon={CreditCardIcon} />
        
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
          <div className="flex items-center space-x-3 space-x-reverse">
            <CreditCardIcon className="w-8 h-8 text-indigo-400" />
            <div>
              <p className="text-white">•••• •••• •••• 4242</p>
              <p className="text-gray-400 text-xs">ينتهي في 12/2026</p>
            </div>
          </div>
          <button className="text-red-400 text-sm">إزالة</button>
        </div>
        
        <GlassButton variant="outline" className="w-full mt-4">
          <PlusIcon className="w-4 h-4 ml-1" />
          إضافة طريقة دفع جديدة
        </GlassButton>
      </GlassCard>
      
      <GlassCard className="p-6">
        <SectionHeader title="الفواتير السابقة" description="سجل الفواتير والمدفوعات" icon={DocumentTextIcon} />
        
        <div className="space-y-2">
          {subscription.invoices?.map((invoice, index) => (
            <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-white/5">
              <div>
                <p className="text-white text-sm">{invoice.date}</p>
                <p className="text-gray-400 text-xs">{invoice.description}</p>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <span className="text-white">${invoice.amount}</span>
                {invoice.status === 'paid' ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-400" />
                )}
                <button className="text-indigo-400 text-sm">تحميل PDF</button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
  
  return (
    <SchoolAdminLayout>
      <Head title="إعدادات المدرسة - مدير المدرسة" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">إعدادات المدرسة</h1>
        <p className="text-gray-400">إدارة ملف المدرسة والإشعارات والذكاء الاصطناعي</p>
      </div>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4 ml-2" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'notifications' && renderNotificationsTab()}
      {activeTab === 'ai' && renderAITab()}
      {activeTab === 'security' && renderSecurityTab()}
      {activeTab === 'billing' && renderBillingTab()}
      
      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        onSave={handleSaveApiKey}
        isLoading={isLoading}
      />
    </SchoolAdminLayout>
  );
}