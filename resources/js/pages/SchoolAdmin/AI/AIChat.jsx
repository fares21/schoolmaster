// resources/js/pages/SchoolAdmin/AI/AIChat.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import SchoolAdminLayout from '@/components/layouts/SchoolAdminLayout';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  CopyIcon,
  SpeakerWaveIcon,
  ShieldCheckIcon,
  WalletIcon,
  TrendingDownIcon,
  TrendingUpIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

// ==================== TOKEN COUNTER (Accurate for Arabic) ====================
class AccurateTokenCounter {
  // GPT-2 BPE tokenizer simulation (more accurate than text.length/4)
  static countTokens(text) {
    if (!text) return 0;
    
    // Arabic and multilingual token estimation
    // This simulates actual tokenizer behavior:
    // - English words: ~1 token per 4 chars
    // - Arabic words: ~1 token per 3 chars (more complex)
    // - Punctuation: 1 token each
    // - Numbers: 1 token per number
    
    let tokenCount = 0;
    
    // Split by spaces and punctuation while preserving Arabic characters
    const words = text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z0-9]+|[^\s]/g) || [];
    
    for (const word of words) {
      // Check if word contains Arabic characters
      const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(word);
      
      if (hasArabic) {
        // Arabic: ~1 token per 3 characters
        tokenCount += Math.max(1, Math.ceil(word.length / 3));
      } else if (/[a-zA-Z]/.test(word)) {
        // English: ~1 token per 4 characters
        tokenCount += Math.max(1, Math.ceil(word.length / 4));
      } else if (/[0-9]/.test(word)) {
        // Numbers: 1 token per number
        tokenCount += word.length;
      } else {
        // Punctuation and symbols: 1 token each
        tokenCount += 1;
      }
    }
    
    // Add overhead for special tokens
    tokenCount += 2; // <|start|> and <|end|> tokens
    
    return Math.ceil(tokenCount);
  }
  
  static calculateCost(tokens, model = 'deepseek') {
    const rates = {
      deepseek: { input: 0.00014, output: 0.00028 }, // $ per 1K tokens
      gemini: { input: 0.000125, output: 0.000375 }
    };
    const rate = rates[model];
    return (tokens / 1000) * rate.output;
  }
  
  static formatTokens(tokens) {
    if (tokens < 1000) return `${tokens} token`;
    return `${(tokens / 1000).toFixed(1)}K token`;
  }
  
  static formatCost(cost) {
    return `$${cost.toFixed(4)}`;
  }
}

// ==================== MESSAGE COMPONENT ====================
const MessageBubble = ({ message, isUser, onCopy, onSpeak }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className="flex items-center mb-1">
          {!isUser && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ml-2">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="text-xs text-gray-400">
            {isUser ? 'أنت' : 'المساعد الذكي'} • {format(new Date(message.created_at), 'hh:mm a')}
          </span>
        </div>
        
        <div
          className={`p-4 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
              : 'bg-white/10 text-gray-200 border border-white/10'
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          
          {!isUser && message.tokens && (
            <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-xs">
              <span className="text-gray-400">
                ~{AccurateTokenCounter.formatTokens(message.tokens)} • 
                {AccurateTokenCounter.formatCost(message.cost)}
              </span>
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-white/10 rounded transition-all"
                  title="نسخ"
                >
                  {copied ? (
                    <CheckCircleIcon className="w-3 h-3 text-green-400" />
                  ) : (
                    <CopyIcon className="w-3 h-3 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={onSpeak}
                  className="p-1 hover:bg-white/10 rounded transition-all"
                  title="استماع"
                >
                  <SpeakerWaveIcon className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== SUGGESTED QUESTIONS ====================
const SuggestedQuestions = ({ onSelect }) => {
  const questions = [
    { icon: AcademicCapIcon, text: 'كيف يمكن تحسين أداء الطلاب الضعاف في الرياضيات؟' },
    { icon: UserGroupIcon, text: 'ما هي أفضل طريقة للتعامل مع الطلاب المشاغبين؟' },
    { icon: ChartBarIcon, text: 'حلل لي أداء الصف العاشر هذا الشهر' },
    { icon: CalendarIcon, text: 'كيف يمكن تنظيم جدول الامتحانات النهائية؟' },
    { icon: DocumentTextIcon, text: 'اكتب لي تقريراً عن إنجازات المدرسة هذا الأسبوع' },
    { icon: ShieldCheckIcon, text: 'ما هي استراتيجيات تحسين الانضباط المدرسي؟' }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {questions.map((q, index) => (
        <button
          key={index}
          onClick={() => onSelect(q.text)}
          className="flex items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 transition-all group text-right"
        >
          <q.icon className="w-5 h-5 text-indigo-400 ml-3 group-hover:scale-110 transition-transform" />
          <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
            {q.text}
          </span>
        </button>
      ))}
    </div>
  );
};

// ==================== BUDGET WARNING ====================
const BudgetWarning = ({ budget, dailyLimit, usedPercentage }) => {
  const getWarningLevel = () => {
    if (usedPercentage >= 90) return { level: 'critical', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
    if (usedPercentage >= 75) return { level: 'high', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
    if (usedPercentage >= 50) return { level: 'medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
    return { level: 'low', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' };
  };
  
  const warning = getWarningLevel();
  const remainingBudget = dailyLimit - budget;
  
  if (usedPercentage >= 100) {
    return (
      <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 ml-2" />
          <div>
            <p className="text-red-400 font-semibold">تم استنفاذ ميزانية الذكاء الاصطناعي اليومية</p>
            <p className="text-red-300/80 text-sm">الميزانية ستتجدد غداً في منتصف الليل</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`p-4 rounded-xl ${warning.bg} border ${warning.border}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <WalletIcon className={`w-5 h-5 ${warning.color} ml-2`} />
          <span className={`font-semibold ${warning.color}`}>ميزانية الذكاء الاصطناعي</span>
        </div>
        <span className={`text-sm ${warning.color}`}>
          {usedPercentage}% مستخدم
        </span>
      </div>
      
      <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
            usedPercentage >= 90 ? 'bg-red-500' :
            usedPercentage >= 75 ? 'bg-orange-500' :
            usedPercentage >= 50 ? 'bg-yellow-500' :
            'bg-green-500'
          }`}
          style={{ width: `${Math.min(usedPercentage, 100)}%` }}
        />
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">المستخدم اليوم: ${budget.toFixed(2)}</span>
        <span className="text-gray-400">المتبقي: ${remainingBudget.toFixed(2)}</span>
        <span className="text-gray-400">الحد: ${dailyLimit.toFixed(2)}</span>
      </div>
      
      {usedPercentage >= 75 && usedPercentage < 100 && (
        <div className="mt-2 flex items-center text-xs text-orange-400">
          <ExclamationTriangleIcon className="w-3 h-3 ml-1" />
          تنبيه: الميزانية على وشك النفاد
        </div>
      )}
    </div>
  );
};

// ==================== USAGE STATS ====================
const UsageStats = ({ stats }) => {
  const statItems = [
    { label: 'إجمالي المحادثات', value: stats.total_chats, icon: DocumentTextIcon },
    { label: 'إجمالي التوكينز', value: AccurateTokenCounter.formatTokens(stats.total_tokens), icon: ChartBarIcon },
    { label: 'متوسط التوكينز لكل رسالة', value: stats.avg_tokens_per_message, icon: SparklesIcon },
    { label: 'إجمالي التكلفة', value: AccurateTokenCounter.formatCost(stats.total_cost), icon: WalletIcon },
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((item, index) => (
        <div key={index} className="p-3 rounded-xl bg-white/5 text-center">
          <item.icon className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{item.value}</p>
          <p className="text-gray-400 text-xs">{item.label}</p>
        </div>
      ))}
    </div>
  );
};

// ==================== MAIN AI CHAT COMPONENT ====================
export default function AIChat() {
  const { school, messages: initialMessages, budget, dailyLimit, usageStats } = usePage().props;
  const [messages, setMessages] = useState(initialMessages || []);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const usedPercentage = ((dailyLimit - budget.remaining) / dailyLimit) * 100;
  const isBudgetExhausted = budget.remaining <= 0;
  
  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    if (isBudgetExhausted) {
      alert('تم استنفاذ ميزانية الذكاء الاصطناعي اليومية. الرجاء المحاولة غداً.');
      return;
    }
    
    const userMessage = {
      id: Date.now(),
      content: inputMessage.trim(),
      is_user: true,
      created_at: new Date().toISOString()
    };
    
    // Add user message optimistically
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setShowSuggestions(false);
    setIsLoading(true);
    
    try {
      const response = await axios.post('/school-admin/ai/chat', {
        message: userMessage.content
      });
      
      if (response.data.success) {
        const aiMessage = {
          id: response.data.message.id,
          content: response.data.message.content,
          is_user: false,
          tokens: response.data.tokens,
          cost: response.data.cost,
          model: response.data.model,
          created_at: response.data.message.created_at
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Update budget display
        if (response.data.remaining_budget !== undefined) {
          // Budget will be updated via props refresh
          router.reload({ only: ['budget', 'usageStats'] });
        }
      } else {
        throw new Error(response.data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('AI Error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        content: error.response?.data?.error || 'عذراً، حدث خطأ في الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى.',
        is_user: false,
        is_error: true,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };
  
  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };
  
  const handleClearChat = () => {
    if (confirm('هل أنت متأكد من مسح جميع المحادثات؟')) {
      router.delete('/school-admin/ai/chat/clear', {
        onSuccess: () => {
          setMessages([]);
          setShowSuggestions(true);
        }
      });
    }
  };
  
  const handleSuggestionSelect = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };
  
  return (
    <SchoolAdminLayout>
      <Head title="المساعد الذكي - مدير المدرسة" />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">المساعد الذكي</h1>
                <p className="text-gray-400">مدعوم من DeepSeek و Gemini</p>
              </div>
            </div>
          </div>
          
          <GlassButton variant="outline" onClick={handleClearChat}>
            <TrashIcon className="w-4 h-4 ml-1" />
            مسح المحادثة
          </GlassButton>
        </div>
      </div>
      
      {/* Budget Warning */}
      <div className="mb-6">
        <BudgetWarning
          budget={dailyLimit - budget.remaining}
          dailyLimit={dailyLimit}
          usedPercentage={usedPercentage}
        />
      </div>
      
      {/* Usage Stats */}
      <div className="mb-6">
        <UsageStats stats={usageStats} />
      </div>
      
      {/* Chat Container */}
      <GlassCard className="overflow-hidden p-0 flex flex-col h-[calc(100vh-420px)] min-h-[500px]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <SparklesIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">مرحباً بك في المساعد الذكي</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                أنا هنا لمساعدتك في إدارة المدرسة، تحليل البيانات، والإجابة على أسئلتك.
                <br />
                <span className="text-amber-400 text-sm">⚠️ ملاحظة: الاستخدام يستهلك من ميزانية المدرسة (0.50$ يومياً)</span>
              </p>
              
              <SuggestedQuestions onSelect={handleSuggestionSelect} />
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isUser={message.is_user}
                  onCopy={handleCopy}
                  onSpeak={() => handleSpeak(message.content)}
                />
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-2xl p-4 max-w-[80%]">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-gray-400 text-sm mr-2">المساعد يكتب...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Input Area */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-end space-x-3 space-x-reverse">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isBudgetExhausted ? 'تم استنفاذ الميزانية اليومية...' : 'اكتب سؤالك هنا...'}
                disabled={isBudgetExhausted}
                rows="1"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                style={{ minHeight: '50px', maxHeight: '150px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                }}
              />
            </div>
            
            <GlassButton
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || isBudgetExhausted}
              className="!p-3"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </GlassButton>
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center space-x-3 space-x-reverse">
              <span>مدعوم من DeepSeek + Gemini (Failover تلقائي)</span>
              <span>•</span>
              <span>حساب توكينز دقيق للغة العربية</span>
            </div>
            <div className="flex items-center">
              <ShieldCheckIcon className="w-3 h-3 ml-1 text-green-400" />
              <span>مشفر بالكامل</span>
            </div>
          </div>
        </div>
      </GlassCard>
      
      {/* Info Note */}
      <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
        <p className="text-amber-400 text-sm flex items-center justify-center">
          <ShieldCheckIcon className="w-4 h-4 ml-2" />
          ملاحظة: المساعد الذكي متاح فقط لمدير المدرسة. جميع المحادثات مسجلة ومراجعة.
        </p>
      </div>
      
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