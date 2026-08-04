'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Brain, 
  Award, 
  Sparkles, 
  BarChart3, 
  Target, 
  TrendingUp,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { StudentSkillsData } from '@/types/classSpace';

interface SkillsDataWidgetProps {
  skillsData: StudentSkillsData[];
  isLoading: boolean;
}

export function SkillsDataWidget({ skillsData, isLoading }: SkillsDataWidgetProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
        <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Aggregate Class Bloom's Taxonomy Averages
  const bloomAvg = {
    remember: Math.round(skillsData.reduce((acc, curr) => acc + curr.bloomLevels.remember, 0) / (skillsData.length || 1)),
    understand: Math.round(skillsData.reduce((acc, curr) => acc + curr.bloomLevels.understand, 0) / (skillsData.length || 1)),
    apply: Math.round(skillsData.reduce((acc, curr) => acc + curr.bloomLevels.apply, 0) / (skillsData.length || 1)),
    analyze: Math.round(skillsData.reduce((acc, curr) => acc + curr.bloomLevels.analyze, 0) / (skillsData.length || 1)),
    evaluate: Math.round(skillsData.reduce((acc, curr) => acc + curr.bloomLevels.evaluate, 0) / (skillsData.length || 1)),
    create: Math.round(skillsData.reduce((acc, curr) => acc + curr.bloomLevels.create, 0) / (skillsData.length || 1)),
  };

  const bloomLevelsList = [
    { name: 'Remember', value: bloomAvg.remember, color: 'bg-indigo-500' },
    { name: 'Understand', value: bloomAvg.understand, color: 'bg-blue-500' },
    { name: 'Apply', value: bloomAvg.apply, color: 'bg-teal-500' },
    { name: 'Analyze', value: bloomAvg.analyze, color: 'bg-amber-500' },
    { name: 'Evaluate', value: bloomAvg.evaluate, color: 'bg-orange-500' },
    { name: 'Create', value: bloomAvg.create, color: 'bg-purple-500' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Brain size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Skills &amp; Bloom&apos;s Taxonomy Competency (Segregated)</h3>
            <p className="text-[11px] text-slate-500 font-medium">Distinct cognitive levels, critical thinking, &amp; STEM mastery</p>
          </div>
        </div>

        <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
          Strictly Decoupled Skills Domain
        </span>
      </div>

      {/* Class Bloom's Taxonomy Cognitive Hierarchy */}
      <div className="mb-6 bg-slate-50 border border-slate-200 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 size={15} className="text-indigo-600" />
            Class Bloom&apos;s Taxonomy Cognitive Hierarchy
          </h4>
          <span className="text-[11px] font-bold text-slate-500">Class Average</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {bloomLevelsList.map((item) => (
            <div key={item.name} className="bg-white border border-slate-200 p-2.5 rounded-lg text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">{item.name}</span>
              <span className="text-base font-black text-slate-900 my-0.5 block">{item.value}%</span>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Student Cognitive Mastery Roster */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Student Skill Competency Profiles
        </h4>

        {skillsData.map((st) => (
          <div key={st.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                  <h5 className="font-bold text-xs text-slate-900">{st.studentName}</h5>
                  <p className="text-[10px] text-slate-500 font-medium">Subject: {st.subject}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Overall Mastery</span>
                  <span className="text-sm font-black text-indigo-600">{st.overallMasteryPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Core Competency Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-bold text-slate-700 pt-2 border-t border-slate-200/60">
              <div className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg flex justify-between">
                <span>Critical Thinking:</span>
                <span className="text-indigo-600 font-extrabold">{st.competencies.criticalThinking}%</span>
              </div>
              <div className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg flex justify-between">
                <span>Problem Solving:</span>
                <span className="text-indigo-600 font-extrabold">{st.competencies.problemSolving}%</span>
              </div>
              <div className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg flex justify-between">
                <span>Collaboration:</span>
                <span className="text-indigo-600 font-extrabold">{st.competencies.collaboration}%</span>
              </div>
              <div className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg flex justify-between">
                <span>Digital Literacy:</span>
                <span className="text-indigo-600 font-extrabold">{st.competencies.digitalLiteracy}%</span>
              </div>
            </div>

            {/* Skill Highlights */}
            <div className="flex flex-col sm:flex-row gap-2 text-[11px] font-medium pt-1">
              <div className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-lg">
                <strong>Top Strength:</strong> {st.topSkill}
              </div>
              <div className="flex-1 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg">
                <strong>Growth Focus:</strong> {st.needsImprovementSkill}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
