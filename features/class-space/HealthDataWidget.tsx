'use client';

import React from 'react';
import Image from 'next/image';
import { 
  HeartPulse, 
  Moon, 
  Activity, 
  CalendarCheck, 
  AlertTriangle, 
  Smile, 
  Frown, 
  Meh, 
  Zap,
  ShieldAlert
} from 'lucide-react';
import { StudentHealthData } from '@/types/classSpace';

interface HealthDataWidgetProps {
  healthData: StudentHealthData[];
  isLoading: boolean;
}

export function HealthDataWidget({ healthData, isLoading }: HealthDataWidgetProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
        <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Summary Metrics
  const avgAttendance = Math.round(
    healthData.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / (healthData.length || 1)
  );
  const avgSleep = (
    healthData.reduce((acc, curr) => acc + curr.sleepHoursAverage, 0) / (healthData.length || 1)
  ).toFixed(1);
  const avgActivity = Math.round(
    healthData.reduce((acc, curr) => acc + curr.physicalActivityMinutes, 0) / (healthData.length || 1)
  );

  const totalAlerts = healthData.reduce((acc, curr) => acc + (curr.alerts?.length || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
            <HeartPulse size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Health & Wellbeing Metrics (Segregated)</h3>
            <p className="text-[11px] text-slate-500 font-medium">Distinct student attendance, sleep hygiene, & activity tracker</p>
          </div>
        </div>

        <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
          Strictly Decoupled Health Domain
        </span>
      </div>

      {/* Top Health KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold mb-1">
            <CalendarCheck size={16} />
            <span>Avg Attendance</span>
          </div>
          <span className="text-xl font-black text-slate-900">{avgAttendance}%</span>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">High consistency rate</p>
        </div>

        <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50">
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold mb-1">
            <Moon size={16} />
            <span>Avg Sleep</span>
          </div>
          <span className="text-xl font-black text-slate-900">{avgSleep} hrs/night</span>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Target: 8.0+ hrs</p>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold mb-1">
            <Activity size={16} />
            <span>Physical Activity</span>
          </div>
          <span className="text-xl font-black text-slate-900">{avgActivity} mins/day</span>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Sports & exercise</p>
        </div>

        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
          <div className="flex items-center gap-2 text-rose-700 text-xs font-bold mb-1">
            <ShieldAlert size={16} />
            <span>Health Risk Alerts</span>
          </div>
          <span className="text-xl font-black text-rose-600">{totalAlerts} Flagged</span>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Requires check-in</p>
        </div>
      </div>

      {/* Student Roster Health List */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Class Health & Wellbeing Roster
        </h4>

        {healthData.map((st) => (
          <div
            key={st.id}
            className={`p-3.5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              st.alerts && st.alerts.length > 0
                ? 'bg-amber-50/60 border-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 relative overflow-hidden shrink-0 border border-slate-300">
                <Image
                  src={st.avatar}
                  alt={st.studentName}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-bold text-xs text-slate-900">{st.studentName}</h5>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                    st.moodStatus === 'Happy'
                      ? 'bg-emerald-100 text-emerald-800'
                      : st.moodStatus === 'Focused'
                      ? 'bg-indigo-100 text-indigo-800'
                      : st.moodStatus === 'Tired'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    Mood: {st.moodStatus}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium mt-1">
                  <span>Attendance: <strong>{st.attendancePercentage}%</strong></span>
                  <span>Sleep: <strong>{st.sleepHoursAverage} hrs</strong></span>
                  <span>Activity: <strong>{st.physicalActivityMinutes}m</strong></span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-black text-slate-800">
                Wellbeing Score: <span className={st.wellbeingScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}>{st.wellbeingScore}/100</span>
              </div>
              {st.alerts && st.alerts.length > 0 && (
                <div className="text-[10px] font-bold text-rose-600 flex items-center justify-end gap-1 mt-0.5">
                  <AlertTriangle size={11} />
                  <span>{st.alerts[0]}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
