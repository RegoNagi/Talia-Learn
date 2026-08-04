import React, { useState, useRef, useEffect } from 'react';
import { GitBranch, Star, ChevronDown, Plus, Trash2 } from 'lucide-react';

interface CustomSelectProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-gray-200 text-gray-700 text-sm rounded-lg py-2.5 px-3 outline-none focus:border-orange-500 hover:border-gray-300 transition-colors shadow-none text-start"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full start-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-sm z-50 max-h-48 overflow-y-auto">
          {options.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">No options available</div>
          ) : (
             options.map(opt => (
               <button
                 key={opt.value}
                 type="button"
                 className={`w-full text-start px-3 py-2 text-sm transition-colors hover:bg-orange-50 ${value === opt.value ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-700'}`}
                 onClick={() => {
                   onChange(opt.value);
                   setIsOpen(false);
                 }}
               >
                 {opt.label}
               </button>
             ))
          )}
        </div>
      )}
    </div>
  );
};

interface Rule {
  id: string;
  name: string;
  targetContentId: string;
  scorePercentage: string;
  remedialId: string;
  enrichmentId: string;
  isStrictLock: boolean;
  isExpanded: boolean;
}

interface UnitMasteryBuilderProps {
  language?: 'ar' | 'en';
  availableLessons?: { id: string; title: string }[];
}

export const UnitMasteryBuilder: React.FC<UnitMasteryBuilderProps> = ({ 
  language = 'ar',
  availableLessons = []
}) => {
  const isRtl = language === 'ar';
  
  const [rules, setRules] = useState<Rule[]>([]);

  const t = {
    ar: {
      hideUntil: "توجيه مسار الطالب بناءً على أدائه في:",
      withScore: "النسبة المستهدفة للمرور:",
      selectContent: "اختر المحتوى السابق...",
      remedialTitle: "مسار التمكين (إذا كانت الدرجة أقل من المطلوبة)",
      routeRemedial: "توجيه إلى محتوى التمكين...",
      enrichmentTitle: "مسار التميز (إذا تم تحقيق النسبة المستهدفة)",
      routeEnrichment: "توجيه إلى محتوى التميز...",
      strictLock: "إغلاق إلزامي للمحتوى القادم",
      strictLockDesc: "لن يتمكن الطالب من تخطي هذا الدرس دون تحقيق النسبة.",
      font: "font-['Cairo']",
      percentageSymbol: "%",
      addRule: "إضافة قاعدة إتقان جديدة",
      deleteRule: "حذف القاعدة",
      noRules: "لم يتم تكوين قواعد المسارات بعد.",
      targetPlaceholder: "80",
      ruleNamePlaceholder: "اسم القاعدة (مثال: تقييم الأسبوع الأول)"
    },
    en: {
      hideUntil: "Route student path based on performance in:",
      withScore: "Target score for mastery:",
      selectContent: "Select previous content...",
      remedialTitle: "Empowerment Path (If score is below target)",
      routeRemedial: "Route to empowerment content...",
      enrichmentTitle: "Excellence Path (If target score is met or exceeded)",
      routeEnrichment: "Route to excellence content...",
      strictLock: "Strict Lock for upcoming content",
      strictLockDesc: "Students cannot bypass this item without achieving the required score.",
      font: "font-sans",
      percentageSymbol: "%",
      addRule: "Add New Mastery Rule",
      deleteRule: "Delete Rule",
      noRules: "No mastery rules configured yet.",
      targetPlaceholder: "80",
      ruleNamePlaceholder: "Rule Name (e.g., Week 1 Assessment)"
    }
  };

  const currentText = t[language] || t.ar;
  const contentOptions = availableLessons.map(l => ({ label: l.title, value: l.id }));

  const addRule = () => {
    setRules([...rules, {
      id: Math.random().toString(36).substring(2, 9),
      name: '',
      targetContentId: '',
      scorePercentage: '',
      remedialId: '',
      enrichmentId: '',
      isStrictLock: false,
      isExpanded: true
    }]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const updateRule = (id: string, field: keyof Rule, value: any) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  return (
    <div 
      className={`rounded-xl border border-gray-200 bg-white shadow-none ${currentText.font} overflow-hidden`} 
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {rules.length === 0 ? (
        <div className="p-8 text-center bg-gray-50/50">
          <p className="text-sm text-gray-500 mb-4">{currentText.noRules}</p>
          <button 
            type="button" 
            onClick={addRule}
            className="inline-flex items-center gap-2 px-4 py-2 border border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg text-sm font-bold transition-colors shadow-none"
          >
            <Plus className="w-4 h-4" />
            {currentText.addRule}
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {rules.map((rule, idx) => (
            <div key={rule.id} className="flex flex-col">
              {/* Accordion Header */}
              <button 
                type="button"
                onClick={() => updateRule(rule.id, 'isExpanded', !rule.isExpanded)}
                className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors w-full text-start shadow-none"
              >
                <input
                  value={rule.name}
                  onChange={(e) => updateRule(rule.id, 'name', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={currentText.ruleNamePlaceholder}
                  className="bg-transparent font-bold text-gray-700 focus:outline-none focus:border-b focus:border-orange-500 w-1/2 transition-colors shadow-none"
                />
                
                <div className="flex items-center gap-4">
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRule(rule.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors bg-transparent border-none p-1 rounded-md hover:bg-red-50 shadow-none cursor-pointer"
                    title={currentText.deleteRule}
                  >
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${rule.isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Accordion Body */}
              {rule.isExpanded && (
                <div className="px-5 pb-5 flex flex-col gap-6">
              {/* 1. Trigger */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-gray-700">{currentText.hideUntil}</span>
                
                <div className="flex-1 min-w-[200px]">
                  <CustomSelect 
                    options={contentOptions}
                    value={rule.targetContentId}
                    onChange={(val) => updateRule(rule.id, 'targetContentId', val)}
                    placeholder={currentText.selectContent}
                  />
                </div>
                
                <span className="text-sm font-bold text-gray-700">{currentText.withScore}</span>
                
                <div className="relative w-24 shrink-0">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={rule.scorePercentage}
                    onChange={(e) => updateRule(rule.id, 'scorePercentage', e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-sm rounded-lg py-2.5 px-3 pe-8 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors hover:border-gray-300 shadow-none text-center"
                    placeholder={currentText.targetPlaceholder}
                  />
                  <span className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 text-sm font-medium pointer-events-none">
                    {currentText.percentageSymbol}
                  </span>
                </div>
              </div>

              {/* 2. Routing Paths */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Remedial Path */}
                <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 shadow-none flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-3">
                    <GitBranch className="text-orange-500 w-5 h-5 shrink-0" />
                    <span className="text-sm font-bold text-orange-700">{currentText.remedialTitle}</span>
                  </div>
                  <CustomSelect 
                    options={contentOptions}
                    value={rule.remedialId}
                    onChange={(val) => updateRule(rule.id, 'remedialId', val)}
                    placeholder={currentText.routeRemedial}
                  />
                </div>

                {/* Enrichment Path */}
                <div className="p-4 rounded-xl border border-green-200 bg-green-50/50 shadow-none flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="text-green-600 w-5 h-5 shrink-0" />
                    <span className="text-sm font-bold text-gray-700">{currentText.enrichmentTitle}</span>
                  </div>
                  <CustomSelect 
                    options={contentOptions}
                    value={rule.enrichmentId}
                    onChange={(val) => updateRule(rule.id, 'enrichmentId', val)}
                    placeholder={currentText.routeEnrichment}
                  />
                </div>
              </div>

              {/* 3. Strict Lock */}
              <div className="pt-2">
                <label className="flex items-start justify-between group cursor-pointer shadow-none">
                  <div className="flex flex-col gap-0.5 max-w-[85%]">
                    <span className="text-sm font-bold text-gray-700">{currentText.strictLock}</span>
                    <span className="text-xs text-gray-400 mt-1 block leading-tight">{currentText.strictLockDesc}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => updateRule(rule.id, 'isStrictLock', !rule.isStrictLock)}
                    className={`w-8 h-4 rounded-full relative transition-colors shrink-0 mt-0.5 shadow-none ${rule.isStrictLock ? 'bg-orange-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 start-0.5 w-3 h-3 bg-white rounded-full shadow-none transition-transform ${rule.isStrictLock ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                  </button>
                </label>
              </div>
                </div>
              )}
            </div>
          ))}

          {/* Add New Rule Button (when rules > 0) */}
          <div className="p-4 bg-gray-50/50 flex justify-center">
             <button 
                type="button" 
                onClick={addRule}
                className="inline-flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg text-sm font-bold transition-colors shadow-none"
             >
                <Plus className="w-4 h-4" />
                {currentText.addRule}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
