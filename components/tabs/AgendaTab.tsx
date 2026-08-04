'use client';

import React from 'react';
import { 
  AlertCircle, 
  BookOpen, 
  Clock, 
  FileText, 
  Radio, 
  Users,
  Bus,
  FileCheck
} from 'lucide-react';

interface AgendaTabProps {
  language: 'ar' | 'en';
}

export function AgendaTab({ language }: AgendaTabProps) {
  // Dictionary arrays mapped by language
  const content = {
    ar: {
      title: "مسار الأنشطة",
      subtitle: "مرحباً بك، أليكس. إليك ما ينتظرك في رحلتك التعليمية.",
      liveBadge: "مباشر",
      sections: [
        {
          id: 'overdue',
          title: 'الماضي / متأخر',
          items: [
            {
              id: 'o1',
              title: 'واجب الرياضيات: المعادلات التربيعية',
              course: 'الجبر المتقدم',
              time: 'متأخر منذ يومين',
              icon: FileText,
              type: 'overdue'
            },
            {
              id: 'o2',
              title: 'اختبار قصير لم يتم التقديم عليه',
              course: 'الفيزياء 101',
              time: 'انتهى وقته أمس',
              icon: AlertCircle,
              type: 'overdue'
            }
          ]
        },
        {
          id: 'today',
          title: 'اليوم',
          items: [
            {
              id: 't1',
              title: 'بث مباشر: الكيمياء العضوية',
              course: 'الكيمياء',
              time: 'الآن',
              icon: Radio,
              type: 'live'
            },
            {
              id: 't2',
              title: 'تسليم مشروع التاريخ',
              course: 'تاريخ العالم',
              time: 'اليوم، 11:59 مساءً',
              icon: FileCheck,
              type: 'today'
            },
            {
              id: 't3',
              title: 'ساعات مكتبية مع د. سارة',
              course: 'دعم أكاديمي',
              time: 'اليوم، 2:00 مساءً - 4:00 مساءً',
              icon: Users,
              type: 'today'
            }
          ]
        },
        {
          id: 'tomorrow',
          title: 'غداً',
          items: [
            {
              id: 'tm1',
              title: 'محاضرة ضيف: الذكاء الاصطناعي في الطب',
              course: 'ندوة عامة',
              time: 'غداً، 10:00 صباحاً',
              icon: Users,
              type: 'tomorrow'
            },
            {
              id: 'tm2',
              title: 'مواد تحضيرية للوحدة الجديدة',
              course: 'الأدب الإنجليزي',
              time: 'يُفضل إكمالها قبل محاضرة الثلاثاء',
              icon: BookOpen,
              type: 'tomorrow'
            }
          ]
        },
        {
          id: 'nextWeek',
          title: 'الأسبوع القادم',
          items: [
            {
              id: 'nw1',
              title: 'امتحان منتصف الفصل',
              course: 'الفيزياء 101',
              time: '15 أكتوبر 2026، 9:00 صباحاً',
              icon: FileText,
              type: 'upcoming'
            },
            {
              id: 'nw2',
              title: 'الموعد النهائي للتسجيل في الرحلة الميدانية',
              course: 'الأنشطة اللامنهجية',
              time: '18 أكتوبر 2026، 11:59 مساءً',
              icon: Bus,
              type: 'upcoming'
            }
          ]
        }
      ]
    },
    en: {
      title: "Activity Stream",
      subtitle: "Welcome back, here's what's waiting for you in your learning journey.",
      liveBadge: "LIVE",
      sections: [
        {
          id: 'overdue',
          title: 'Past / Overdue',
          items: [
            {
              id: 'o1',
              title: 'Math Assignment: Quadratic Equations',
              course: 'Advanced Algebra',
              time: '2 days overdue',
              icon: FileText,
              type: 'overdue'
            },
            {
              id: 'o2',
              title: 'Short Quiz Not Submitted',
              course: 'Physics 101',
              time: 'Ended yesterday',
              icon: AlertCircle,
              type: 'overdue'
            }
          ]
        },
        {
          id: 'today',
          title: 'Today',
          items: [
            {
              id: 't1',
              title: 'Live Broadcast: Organic Chemistry',
              course: 'Chemistry',
              time: 'Now',
              icon: Radio,
              type: 'live'
            },
            {
              id: 't2',
              title: 'History Project Submission',
              course: 'World History',
              time: 'Today 11:59 PM',
              icon: FileCheck,
              type: 'today'
            },
            {
              id: 't3',
              title: 'Office Hours with Dr. Sarah',
              course: 'Academic Support',
              time: 'Today 2:00 PM - 4:00 PM',
              icon: Users,
              type: 'today'
            }
          ]
        },
        {
          id: 'tomorrow',
          title: 'Tomorrow',
          items: [
            {
              id: 'tm1',
              title: 'Guest Lecture: AI in Medicine',
              course: 'General Seminar',
              time: 'Tomorrow 10:00 AM',
              icon: Users,
              type: 'tomorrow'
            },
            {
              id: 'tm2',
              title: 'Preparation material for a new module',
              course: 'English Literature',
              time: 'Best completed before Tuesday lecture',
              icon: BookOpen,
              type: 'tomorrow'
            }
          ]
        },
        {
          id: 'nextWeek',
          title: 'Next Week',
          items: [
            {
              id: 'nw1',
              title: 'Mid-term exam',
              course: 'Physics 101',
              time: 'October 15, 2026, 9:00 AM',
              icon: FileText,
              type: 'upcoming'
            },
            {
              id: 'nw2',
              title: 'Field trip registration deadline',
              course: 'Extracurricular Activities',
              time: 'October 18, 2026, 11:59 PM',
              icon: Bus,
              type: 'upcoming'
            }
          ]
        }
      ]
    }
  };

  const currentContent = content[language];
  const isRtl = language === 'ar';

  return (
    <div className="w-full h-full bg-gray-50/50" dir={isRtl ? "rtl" : "ltr"} style={{ fontFamily: "'Cairo', sans-serif" }}>
      <div className="max-w-[1200px] mx-auto w-full p-8">
        <header className={`mb-10 ${isRtl ? 'text-right' : 'text-left'}`}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentContent.title}</h1>
          <p className="text-gray-500 text-lg">{currentContent.subtitle}</p>
        </header>

        <div className={`space-y-12 ${isRtl ? 'text-right' : 'text-left'}`}>
          {currentContent.sections.map((section) => (
            <section key={section.id}>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-start gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                {section.title}
              </h2>
              
              <div className="flex flex-col gap-4">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  let cardStyles = "bg-white border-gray-200 shadow-none";
                  let iconBoxStyles = "bg-orange-50 text-orange-600";
                  let iconStyles = "text-orange-600";

                  if (item.type === 'overdue') {
                    cardStyles = "bg-red-50/30 border-red-100 shadow-none";
                    iconBoxStyles = "bg-red-50/50 text-red-600";
                    iconStyles = "text-red-500";
                  } else if (item.type === 'today' || item.type === 'live') {
                    cardStyles = `bg-white border-y ${isRtl ? 'border-l border-y-gray-200 border-l-gray-200 border-r-4 border-r-orange-500' : 'border-r border-y-gray-200 border-r-gray-200 border-l-4 border-l-orange-500'} shadow-none`;
                  } else if (item.type === 'tomorrow' || item.type === 'upcoming') {
                    iconBoxStyles = "bg-gray-50 text-gray-400";
                    iconStyles = "text-gray-400";
                  }

                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-5 rounded-2xl border transition-colors cursor-pointer hover:border-orange-300 ${cardStyles}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBoxStyles}`}>
                          <Icon size={24} className={iconStyles} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                            {item.type === 'live' && (
                              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-50 text-red-600 text-xs font-bold tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                {currentContent.liveBadge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                            <span className="flex items-center gap-1.5">
                              <BookOpen size={14} className="text-gray-400" />
                              {item.course}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} className="text-gray-400" />
                              {item.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
