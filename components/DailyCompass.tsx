'use client';

import { User, Task } from '@/types/course';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, Calendar, AlertTriangle, AlertOctagon } from 'lucide-react';
import Image from 'next/image';

export interface ActionAlert {
  id: string;
  type: 'critical' | 'overdue';
  message: string;
}

interface DailyCompassProps {
  user: User;
  tasks: Task[];
  alerts?: ActionAlert[];
}

export function DailyCompass({ user, tasks, alerts = [] }: DailyCompassProps) {
  // Filter tasks for "Teacher's Action List" vs "Student's To-Do"
  // For this demo, we'll assume the passed 'tasks' are relevant to the user's role.
  
  const isTeacher = user.role === 'teacher';

  return (
    <aside className="w-80 bg-white border-l border-slate-100 h-full flex flex-col shrink-0 z-30 shadow-sm">
      {/* User Profile Header */}
      <div className="p-6 border-b border-slate-50">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-12 h-12">
            <Image 
              src={user.avatarUrl} 
              alt={user.name} 
              fill
              className="rounded-full object-cover border-2 border-white shadow-md"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{user.name}</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{user.role}</p>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
          <div className="text-center flex-1 border-r border-slate-200">
            <span className="block text-lg font-bold text-indigo-600">{user.level}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Level</span>
          </div>
          <div className="text-center flex-1">
            <span className="block text-lg font-bold text-amber-500">{user.coins}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Coins</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        
        {/* Module 5: Action Alerts (Teacher Only) */}
        {isTeacher && alerts.length > 0 && (
          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle size={14} /> Action Alerts
            </h4>
            <div className="space-y-3">
              {alerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-xl border flex items-start gap-3 shadow-sm
                    ${alert.type === 'critical' 
                      ? 'bg-orange-50 border-orange-100 text-orange-800' 
                      : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}
                >
                  <div className={`mt-0.5 shrink-0 ${alert.type === 'critical' ? 'text-orange-500' : 'text-rose-500'}`}>
                    {alert.type === 'critical' ? <AlertTriangle size={16} /> : <AlertOctagon size={16} />}
                  </div>
                  <p className="text-xs font-medium leading-snug">{alert.message}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Priority Tasks */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isTeacher ? "Teacher's Action List" : "Your Focus Today"}
            </h4>
            <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {tasks.filter(t => !t.completed).length} Pending
            </span>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <motion.div 
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group p-4 rounded-2xl border transition-all hover:shadow-md cursor-pointer relative overflow-hidden
                  ${task.priority === 'high' ? 'bg-white border-l-4 border-l-rose-400 border-slate-100' : 
                    task.priority === 'medium' ? 'bg-white border-l-4 border-l-amber-400 border-slate-100' : 
                    'bg-white border-slate-100'}
                `}
              >
                <div className="flex items-start gap-3 relative z-10">
                  <button className={`mt-0.5 shrink-0 transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'}`}>
                    <CheckCircle2 size={20} className={task.completed ? 'fill-emerald-100' : ''} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h5 className={`font-bold text-sm truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {task.title}
                    </h5>
                    <div className="flex items-center gap-3 mt-2">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                        ${task.type === 'quiz' ? 'bg-purple-50 text-purple-600' :
                          task.type === 'reading' ? 'bg-blue-50 text-blue-600' :
                          task.type === 'grading' ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-100 text-slate-500'}
                       `}>
                         {task.type.replace('_', ' ')}
                       </span>
                       {task.dueDate && (
                         <span className={`flex items-center gap-1 text-[10px] font-medium ${new Date(task.dueDate) < new Date() ? 'text-rose-500' : 'text-slate-400'}`}>
                           <Clock size={10} />
                           {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                         </span>
                       )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Coming Up (Student Only) */}
        {!isTeacher && (
          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Coming Up
            </h4>
            
            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <Calendar size={20} />
                </div>
                <div>
                  <h5 className="font-bold text-indigo-900 text-sm">Mid-Term Review</h5>
                  <p className="text-xs text-indigo-600">Friday, 2:00 PM</p>
                </div>
              </div>
              <button className="w-full mt-2 bg-white text-indigo-600 text-xs font-bold py-2 rounded-xl hover:bg-indigo-100 transition-colors">
                View Details
              </button>
            </div>
          </section>
        )}

      </div>
    </aside>
  );
}
