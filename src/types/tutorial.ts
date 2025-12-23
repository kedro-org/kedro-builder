import type { LucideIcon } from 'lucide-react';

export interface TutorialStep {
  id: number;
  title: string;
  content: string;
  buttonText: string;
  icon: LucideIcon | string; // Can be LucideIcon component or SVG path
}
