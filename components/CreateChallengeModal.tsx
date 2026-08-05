'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Sparkles, RefreshCw, Pencil } from 'lucide-react';

import { MultiSelectDropdown, Option } from './MultiSelectDropdown';
import { SingleSelectDropdown } from './SingleSelectDropdown';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish?: (challenge: { title: string; xp: number; task: string }) => void;
}

export function CreateChallengeModal({ isOpen, onClose, onPublish }: CreateChallengeModalProps) {
  const [view, setView] = useState<'split' | 'ai'>('split');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResults, setAiResults] = useState<any[] | null>(null);
  
  // AI Configurator State
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const MODULE_OPTIONS: Option[] = [
    { id: 'm1', label: 'Unit 1: Linear Algebra Basics' },
    { id: 'm2', label: 'Unit 2: Matrix Transformations' },
    { id: 'm3', label: 'Unit 3: Vector Spaces' },
  ];

  const SOURCE_OPTIONS: Option[] = [
    { id: 's1', label: 'Video: Intro to Vectors' },
    { id: 's2', label: 'PDF: Matrix Sheet' },
    { id: 's3', label: 'Quiz: Eigenvalues' },
  ];

  const OUTCOME_OPTIONS: Option[] = [
    { id: 'o1', label: 'Apply 2D transformations' },
    { id: 'o2', label: 'Calculate Eigenvalues' },
    { id: 'o3', label: 'Understand Vector Spaces' },
  ];

  const DIFFICULTY_OPTIONS: Option[] = [
    { id: 'd1', label: 'Easy' },
    { id: 'd2', label: 'Intermediate' },
    { id: 'd3', label: 'Hard' },
    { id: 'd4', label: 'Insane' },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setAiResults([
        {
          id: 1,
          title: 'The Eigenvector Real-World Hunt',
          xp: 50,
          task: 'Find an example of Eigenvectors in computer graphics and share a 2-min voice note.',
        },
        {
          id: 2,
          title: 'Matrix Transformation Challenge',
          xp: 75,
          task: 'Create a visual representation of a 2D matrix transformation and explain it to the class.',
        },
        {
          id: 3,
          title: 'Eigenvalue Calculation Race',
          xp: 100,
          task: 'Solve the provided set of 5 eigenvalue problems. First 3 correct submissions get bonus XP!',
        },
      ]);
    }, 2500);
  };

  const handleRegenerateSingle = (id: number) => {
    // Simulate regenerating a single card
    setAiResults(prev => prev?.map(r => {
      if (r.id === id) {
        return {
          ...r,
          title: r.title + ' (Regenerated)',
          task: 'This is a newly generated task based on your request. Please review and edit as needed.',
        };
      }
      return r;
    }) || null);
  };

  const handleEditResult = (id: number, field: string, value: string | number) => {
    setAiResults(prev => prev?.map(r => r.id === id ? { ...r, [field]: value } : r) || null);
  };

  const resetModal = () => {
    setView('split');
    setIsGenerating(false);
    setAiResults(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetModal, 300); // Reset after animation
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Launch a New Challenge</h2>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-8 overflow-y-auto">
              <AnimatePresence mode="wait">
                {view === 'split' && (
                  <motion.div
                    key="split"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {/* Card A: Manual Creator */}
                    <button
                      className="group flex flex-col items-start p-8 bg-white border-2 border-slate-100 rounded-2xl hover:border-orange-500 hover:shadow-lg transition-all duration-300 text-left"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Target className="text-orange-500" size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Craft Manually</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        Design your own custom challenge, set specific rules, and allocate XP rewards.
                      </p>
                    </button>

                    {/* Card B: Cravta AI Magic */}
                    <button
                      onClick={() => setView('ai')}
                      className="group flex flex-col items-start p-8 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 border-2 border-violet-100 rounded-2xl hover:border-violet-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all duration-300 text-left relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-400/10 rounded-full blur-3xl group-hover:bg-violet-400/20 transition-colors duration-500" />
                      
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10">
                        <Sparkles className="text-violet-600 animate-pulse" size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2 relative z-10">Generate with Cravta AI</h3>
                      <p className="text-slate-500 text-sm leading-relaxed relative z-10">
                        Let AI analyze your recent materials and automatically generate engaging challenges in seconds.
                      </p>
                    </button>
                  </motion.div>
                )}

                {view === 'ai' && (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex flex-col"
                  >
                    {!aiResults && !isGenerating && (
                      <div className="max-w-xl mx-auto w-full space-y-8 py-4">
                        <div className="text-center space-y-2">
                          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Sparkles className="text-violet-600" size={32} />
                          </div>
                          <h3 className="text-2xl font-bold text-slate-800">AI Challenge Configurator</h3>
                          <p className="text-slate-500">Provide context to generate targeted, engaging challenges.</p>
                        </div>

                        <div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <MultiSelectDropdown
                            options={MODULE_OPTIONS}
                            selectedIds={selectedModules}
                            onChange={setSelectedModules}
                            placeholder="Select modules..."
                            label={
                              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                <Sparkles size={14} className="text-violet-500" />
                                1. Select Module
                              </div>
                            }
                          />

                          <MultiSelectDropdown
                            options={SOURCE_OPTIONS}
                            selectedIds={selectedSources}
                            onChange={setSelectedSources}
                            placeholder="Select sources..."
                            label={
                              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                <Sparkles size={14} className="text-violet-500" />
                                2. Select Source/Object
                              </div>
                            }
                          />

                          <MultiSelectDropdown
                            options={OUTCOME_OPTIONS}
                            selectedIds={selectedOutcomes}
                            onChange={setSelectedOutcomes}
                            placeholder="Select learning outcomes..."
                            label={
                              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                <Sparkles size={14} className="text-violet-500" />
                                3. Select Learning Outcomes
                              </div>
                            }
                          />

                          <SingleSelectDropdown
                            options={DIFFICULTY_OPTIONS}
                            selectedId={selectedDifficulty}
                            onChange={setSelectedDifficulty}
                            placeholder="Select difficulty..."
                            label={
                              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                <Sparkles size={14} className="text-violet-500" />
                                4. Select Challenge Difficulty
                              </div>
                            }
                          />
                        </div>

                        <button
                          onClick={handleGenerate}
                          className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                          <Sparkles size={20} />
                          ✨ Generate Challenges
                        </button>
                      </div>
                    )}

                    {isGenerating && (
                      <div className="py-16 flex flex-col items-center justify-center space-y-6">
                        <div className="relative w-24 h-24">
                          <div className="absolute inset-0 border-4 border-violet-100 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-violet-600 rounded-full border-t-transparent animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="text-violet-600 animate-pulse" size={32} />
                          </div>
                        </div>
                        <p className="text-slate-600 font-medium animate-pulse text-lg">Crafting personalized challenges...</p>
                        
                        <div className="w-full max-w-2xl space-y-4 mt-8">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="w-full h-32 bg-slate-50 rounded-xl relative overflow-hidden border border-slate-100">
                              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiResults && !isGenerating && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between bg-violet-50 p-4 rounded-xl border border-violet-100">
                          <div>
                            <h3 className="text-lg font-bold text-violet-900 flex items-center gap-2">
                              <Sparkles size={18} className="text-violet-600" />
                              Review & Edit Challenges
                            </h3>
                            <p className="text-sm text-violet-700 mt-1">Click any text or XP value to edit before publishing.</p>
                          </div>
                          <button 
                            onClick={resetModal}
                            className="text-sm font-medium text-violet-700 hover:text-violet-800 bg-white border border-violet-200 hover:bg-violet-50 px-4 py-2 rounded-lg transition-colors shadow-sm"
                          >
                            Start Over
                          </button>
                        </div>

                        <div className="space-y-4">
                          {aiResults.map((result, idx) => (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              key={result.id}
                              className="bg-white border border-violet-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative group"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="text"
                                      value={result.title}
                                      onChange={(e) => handleEditResult(result.id, 'title', e.target.value)}
                                      className="border-b border-dashed border-transparent bg-transparent cursor-pointer font-bold text-lg text-slate-800 w-full transition-colors hover:bg-slate-50 hover:border-slate-300 focus:bg-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none rounded-t-sm px-2 py-1 -ml-2"
                                    />
                                    <div className="flex items-center gap-1 shrink-0 group/xp relative">
                                      <input
                                        type="number"
                                        value={result.xp}
                                        onChange={(e) => handleEditResult(result.id, 'xp', parseInt(e.target.value) || 0)}
                                        className="appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-orange-50 border border-orange-200 text-orange-600 font-bold text-center w-16 px-2 py-1 rounded-md cursor-pointer transition-all hover:bg-orange-100 hover:border-orange-300 hover:shadow-sm focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500 outline-none"
                                      />
                                      <span className="text-xs font-bold text-orange-600">XP</span>
                                      <Pencil size={12} className="text-orange-400 absolute -right-4 opacity-0 group-hover/xp:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                  </div>
                                  <textarea
                                    value={result.task}
                                    onChange={(e) => handleEditResult(result.id, 'task', e.target.value)}
                                    className="border border-dashed border-transparent bg-transparent cursor-pointer text-slate-600 w-full resize-none transition-colors hover:bg-slate-50 hover:border-slate-300 rounded-md focus:bg-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none p-2 -ml-2"
                                    rows={2}
                                  />
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-50">
                                <button 
                                  onClick={() => handleRegenerateSingle(result.id)}
                                  className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors group/regen relative"
                                  title="Regenerate this challenge"
                                >
                                  <RefreshCw size={18} className="group-hover/regen:rotate-180 transition-transform duration-500" />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (onPublish) {
                                      onPublish({ title: result.title, xp: result.xp, task: result.task });
                                    }
                                    handleClose();
                                  }}
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-2 rounded-xl shadow-sm transition-colors"
                                >
                                  Publish Challenge
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

