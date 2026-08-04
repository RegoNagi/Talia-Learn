'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Option {
  id: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  label?: React.ReactNode;
}

export function MultiSelectDropdown({
  options,
  selectedIds,
  onChange,
  placeholder = 'Select...',
  label,
}: MultiSelectDropdownProps) {
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

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <div className="mb-2">
          {label}
        </div>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`min-h-[52px] w-full px-4 py-2 bg-white border rounded-xl text-left transition-all shadow-sm cursor-pointer flex items-center justify-between gap-2 ${
          isOpen ? 'ring-2 ring-violet-400 border-violet-400' : 'border-slate-200 hover:border-violet-300'
        }`}
      >
        <div className="flex flex-wrap gap-2 flex-1 items-center">
          {selectedOptions.length === 0 ? (
            <span className="text-slate-400 font-medium py-1">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.id}
                className="bg-violet-100 text-violet-700 text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1"
              >
                {opt.label}
                <button
                  onClick={(e) => handleRemove(e, opt.id)}
                  className="hover:bg-violet-200 rounded-full p-0.5 transition-colors text-violet-600 hover:text-violet-800"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          size={18}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border border-violet-100 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar"
          >
            <ul className="py-2">
              {options.map((opt) => {
                const isSelected = selectedIds.includes(opt.id);
                return (
                  <li
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className="px-4 py-2.5 hover:bg-violet-50 cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-violet-900' : 'text-slate-700'}`}>
                      {opt.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
