'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Option {
  id: string;
  label: string;
}

interface SingleSelectDropdownProps {
  options: Option[];
  selectedId: string | null;
  onChange: (selectedId: string) => void;
  placeholder?: string;
  label?: React.ReactNode;
}

export function SingleSelectDropdown({
  options,
  selectedId,
  onChange,
  placeholder = 'Select...',
  label,
}: SingleSelectDropdownProps) {
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
    onChange(id);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.id === selectedId);

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
          {!selectedOption ? (
            <span className="text-slate-400 font-medium py-1">{placeholder}</span>
          ) : (
            <span className="text-slate-800 font-medium py-1">
              {selectedOption.label}
            </span>
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
            className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden"
          >
            <ul className="max-h-60 overflow-y-auto custom-scrollbar py-2">
              {options.map((opt) => {
                const isSelected = selectedId === opt.id;
                return (
                  <li
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={`px-4 py-2 cursor-pointer transition-colors text-slate-700 flex items-center justify-between ${
                      isSelected ? 'bg-violet-50 text-violet-700 font-semibold' : 'hover:bg-violet-50 hover:text-violet-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={16} className="text-violet-600" />}
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
