'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AddAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (assessment: { title: string; type: 'quiz' | 'assignment' | 'project'; category: string; source: 'custom' }) => void;
  unitTitle: string;
  classId?: string;
  subject?: string;
  unitId?: string | null;
}

export function AddAssessmentModal({ isOpen, onClose, unitTitle, classId, subject, unitId }: AddAssessmentModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      const params = new URLSearchParams();
      if (classId) params.set('classId', classId);
      if (subject) params.set('subject', subject);
      if (unitId) params.set('unitId', unitId);
      if (typeof window !== 'undefined') params.set('from', encodeURIComponent(window.location.pathname + window.location.search));
      router.push(`/assessment-builder?${params.toString()}`);
      onClose();
    }
  }, [isOpen, router, onClose, classId, subject, unitId]);

  return null;
}
