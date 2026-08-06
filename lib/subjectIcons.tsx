import { BookOpen, Calculator, FlaskConical, Atom, Languages, Globe, Landmark, Palette, Music, Dumbbell, Code, Microscope, PenTool, Compass, GraduationCap, LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  'calculator': Calculator,
  'flask-conical': FlaskConical,
  'atom': Atom,
  'languages': Languages,
  'globe': Globe,
  'landmark': Landmark,
  'palette': Palette,
  'music': Music,
  'dumbbell': Dumbbell,
  'code': Code,
  'microscope': Microscope,
  'pen-tool': PenTool,
  'compass': Compass,
  'graduation-cap': GraduationCap,
};

export function getSubjectIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || BookOpen;
}
