'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AddAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (assessment: { title: string; type: 'quiz' | 'assignment' | 'project'; category: string; source: 'custom' }) => void;
  unitTitle: string;
}

export function AddAssessmentModal({ isOpen, onClose, onAdd, unitTitle }: AddAssessmentModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      router.push('/assessment-builder');
      onClose();
    }
  }, [isOpen, router, onClose]);

  return null;
}
