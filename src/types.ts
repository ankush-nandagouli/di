export type NavSection = 'home' | 'innovations' | 'roadmap' | 'contact';

export interface Milestone {
  id: string;
  quarter: string;
  year: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
}

export interface InnovationPillar {
  id: string;
  title: string;
  tagline: string;
  description: string;
  details: string[];
  iconName: string; // Lucide icon name matching
  colorAccent: string; // Tailwind glow color
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
