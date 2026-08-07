import React from 'react';
import { 
  FileCheck, 
  FileText, 
  Video,
  Calendar,
  CheckCircle,
  FileSearch,
  BarChart,
  Activity,
  MessageSquare,
  CalendarClock,
  Edit3
} from 'lucide-react';

interface TeacherCourseActivityStreamProps {
  language: 'ar' | 'en';
}

export function TeacherCourseActivityStream({ language }: TeacherCourseActivityStreamProps) {
  const isRtl = language === 'ar';

  const content = {
    ar: {
      header: {
        title: "مسار أنشطة الكيمياء",
        subtitle: "الفصل الأول الثانوي • نظرة عامة على أداء الطلاب"
      },
      sections: [
        {
          id: 'action_needed',
          title: 'بحاجة لإجراء',
          type: 'past',
          items: [
            {
              id: 'a1',
              title: "واجب: الروابط الكيميائية",
              datetime: "مستحق: الأمس، 11:59 مساءً",
              status: "25/30 سلموا • 5 بانتظار التصحيح",
              actionLabel: "تصحيح",
              icon: FileCheck,
              actionIcon: CheckCircle,
              type: 'needs_action'
            },
            {
              id: 'a2',
              title: "تقرير مختبر: المعايرة",
              datetime: "مستحق: منذ يومين",
              status: "28/30 سلموا • 12 بانتظار التصحيح",
              actionLabel: "مراجعة",
              icon: FileSearch,
              actionIcon: FileSearch,
              type: 'needs_action'
            },
            {
              id: 'a3',
              title: "اختبار قصير: الأحماض والقواعد",
              datetime: "انتهى: اليوم، 08:00 صباحاً",
              status: "متوسط الدرجات: 76% • يحتاج مراجعة",
              actionLabel: "تحليل",
              icon: BarChart,
              actionIcon: BarChart,
              type: 'needs_action'
            }
          ]
        },
        {
          id: 'active_now',
          title: 'جاري الآن',
          type: 'present',
          items: [
            {
              id: 'p1',
              title: "اختبار قصير: الجدول الدوري",
              datetime: "الآن",
              status: "18 طالب يختبرون الآن • متوسط الدرجات المؤقت 82%",
              actionLabel: "مراقبة",
              icon: FileText,
              actionIcon: Activity,
              type: 'active_live',
              badge: "مباشر"
            },
            {
              id: 'p2',
              title: "بث مباشر: حل أسئلة الفصل",
              datetime: "الآن",
              status: "الحضور: 28/30 طالب",
              actionLabel: "انضمام للكاميرا",
              icon: Video,
              actionIcon: Video,
              type: 'active'
            },
            {
              id: 'p3',
              title: "نقاش: نقاشات النظائر",
              datetime: "الآن",
              status: "45 رسالة جديدة",
              actionLabel: "إشراف",
              icon: MessageSquare,
              actionIcon: MessageSquare,
              type: 'active'
            }
          ]
        },
        {
          id: 'scheduled',
          title: 'مجدول',
          type: 'future',
          items: [
            {
              id: 'f1',
              title: "محاضرة مسجلة: التفاعلات الحرارية",
              datetime: "تُنشر تلقائياً: غداً 08:00 صباحاً",
              status: "مجدول",
              actionLabel: "تعديل الموعد",
              icon: Calendar,
              actionIcon: CalendarClock,
              type: 'scheduled'
            },
            {
              id: 'f2',
              title: "امتحان منتصف الفصل",
              datetime: "الأحد القادم، 10:00 صباحاً",
              status: "مسودة محفوظة • لم يتم النشر",
              actionLabel: "تعديل",
              icon: Calendar,
              actionIcon: Edit3,
              type: 'scheduled'
            }
          ]
        }
      ]
    },
    en: {
      header: {
        title: "Chemistry Activity Stream",
        subtitle: "1st Secondary • Students Performance Overview"
      },
      sections: [
        {
          id: 'action_needed',
          title: 'Needs Action',
          type: 'past',
          items: [
            {
              id: 'a1',
              title: "Assignment: Chemical Bonds",
              datetime: "Due: Yesterday, 11:59 PM",
              status: "25/30 Submitted • 5 Need Grading",
              actionLabel: "Grade",
              icon: FileCheck,
              actionIcon: CheckCircle,
              type: 'needs_action'
            },
            {
              id: 'a2',
              title: "Lab Report: Titration",
              datetime: "Due: 2 Days ago",
              status: "28/30 Submitted • 12 Need Grading",
              actionLabel: "Review",
              icon: FileSearch,
              actionIcon: FileSearch,
              type: 'needs_action'
            },
            {
              id: 'a3',
              title: "Quiz: Acids and Bases",
              datetime: "Ended: Today, 08:00 AM",
              status: "Avg Score: 76% • Needs Review",
              actionLabel: "Analyze",
              icon: BarChart,
              actionIcon: BarChart,
              type: 'needs_action'
            }
          ]
        },
        {
          id: 'active_now',
          title: 'Active Now',
          type: 'present',
          items: [
            {
              id: 'p1',
              title: "Quiz: Periodic Table",
              datetime: "Now",
              status: "18 Active • Current Avg: 82%",
              actionLabel: "Monitor",
              icon: FileText,
              actionIcon: Activity,
              type: 'active_live',
              badge: "LIVE"
            },
            {
              id: 'p2',
              title: "Live Stream: Chapter Q&A",
              datetime: "Now",
              status: "Attendance: 28/30",
              actionLabel: "Join Camera",
              icon: Video,
              actionIcon: Video,
              type: 'active'
            },
            {
              id: 'p3',
              title: "Discussion: Isotope Debates",
              datetime: "Now",
              status: "45 New Messages",
              actionLabel: "Moderate",
              icon: MessageSquare,
              actionIcon: MessageSquare,
              type: 'active'
            }
          ]
        },
        {
          id: 'scheduled',
          title: 'Scheduled',
          type: 'future',
          items: [
            {
              id: 'f1',
              title: "Recorded Lecture: Thermal Reactions",
              datetime: "Auto-publishes: Tomorrow 08:00 AM",
              status: "Scheduled",
              actionLabel: "Reschedule",
              icon: Calendar,
              actionIcon: CalendarClock,
              type: 'scheduled'
            },
            {
              id: 'f2',
              title: "Midterm Exam",
              datetime: "Next Sunday, 10:00 AM",
              status: "Draft Saved • Not Published",
              actionLabel: "Edit",
              icon: Calendar,
              actionIcon: Edit3,
              type: 'scheduled'
            }
          ]
        }
      ]
    }
  };

  const currentContent = content[language];

  return (
    <div className="w-full h-full bg-gray-50/50" dir={isRtl ? "rtl" : "ltr"} style={{ fontFamily: "'Cairo', sans-serif" }}>
      <div className="max-w-[1200px] mx-auto w-full p-8">
        <header className={`mb-10 ${isRtl ? 'text-right' : 'text-left'}`}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentContent.header.title}</h1>
          <p className="text-gray-500 text-lg">{currentContent.header.subtitle}</p>
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
                  const ActionIcon = item.actionIcon;
                  let cardStyles = "bg-white border-gray-200 shadow-none";
                  let iconBoxStyles = "bg-orange-50 text-orange-600";
                  let iconStyles = "text-orange-600";
                  let actionBtnStyles = "bg-orange-50 text-orange-600 hover:bg-orange-100";

                  if (item.type === 'needs_action') {
                    cardStyles = "bg-red-50/30 border-red-100 shadow-none";
                    iconBoxStyles = "bg-red-50/50 text-red-600";
                    iconStyles = "text-red-500";
                    actionBtnStyles = "bg-white text-red-600 border border-red-200 hover:bg-red-50";
                  } else if (item.type === 'active' || item.type === 'active_live') {
                    cardStyles = `bg-white border-y ${isRtl ? 'border-l border-y-gray-200 border-l-gray-200 border-r-4 border-r-orange-500' : 'border-r border-y-gray-200 border-r-gray-200 border-l-4 border-l-orange-500'} shadow-none`;
                  } else if (item.type === 'scheduled') {
                    iconBoxStyles = "bg-gray-50 text-gray-400";
                    iconStyles = "text-gray-400";
                    actionBtnStyles = "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200";
                  }

                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-5 rounded-2xl border transition-colors ${cardStyles}`}
                    >
                      <div className="flex items-center gap-5 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBoxStyles}`}>
                          <Icon size={24} className={iconStyles} />
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                            {item.badge && (
                              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-50 text-red-600 text-xs font-bold tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 font-medium mb-1">
                            {item.datetime}
                          </div>
                          <div className="bg-gray-100 text-gray-700 text-[11px] font-bold px-3 py-1 rounded-full w-fit mt-1">
                            {item.status}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
                        <button className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${actionBtnStyles}`}>
                          <span>{item.actionLabel}</span>
                          <ActionIcon className="w-4 h-4" strokeWidth={2.5} />
                        </button>
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
