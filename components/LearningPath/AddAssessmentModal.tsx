'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AddAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitTitle: string;
  classId?: string;
  subject?: string;
  grade?: string;
  unitId?: string | null;
  assessmentType?: 'quiz' | 'assignment';
}

export function AddAssessmentModal({ isOpen, onClose, unitTitle, classId, subject, grade, unitId, assessmentType = 'assignment' }: AddAssessmentModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      const params = new URLSearchParams();
      params.set('type', assessmentType);
      if (classId) params.set('classId', classId);
      if (subject) params.set('subject', subject);
      if (grade) params.set('grade', grade);
      if (unitId) params.set('unitId', unitId);
      if (typeof window !== 'undefined') params.set('from', encodeURIComponent(window.location.pathname + window.location.search));
      router.push(`/assessment-builder?${params.toString()}`);
      onClose();
    }
  }, [isOpen, router, onClose, classId, subject, grade, unitId, assessmentType]);

  return null;
}
