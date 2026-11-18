export interface LinkItem {
  label: string;
  url: string;
  isPrimary?: boolean;
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  period: string;
  description?: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  period: string;
  details?: string;
}

export interface KeySpec {
  label: string;
  value: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'cad' | 'simulation' | 'photo' | 'chart';
  caption: string;
  previewUrl?: string;
}

export interface ScopeCard {
  id: string;
  title: string;
  badge?: string;
  description: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  items: string[];
}

export interface ProjectData {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  year: string;
  isTeamProject?: boolean;
  teamSize?: number;
  teamDescription?: string;
  myRole?: string;
  myTools?: string[];
  scopeCards?: ScopeCard[];
  description: string;
  links: LinkItem[];
  onshapeUrl?: string;
  keySpecs: KeySpec[];
  keyMetrics?: KeySpec[];
  ndaNote?: string;
  statusLabel?: string;
  buildOrigin?: string;
  languages?: string[];
  contentRevision?: number;
  media: MediaItem[];
  customNotes?: string;
}

export interface ProfileData {
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
  links: {
    linkedin?: string;
    github?: string;
    onshape?: string;
    youtube?: string;
    email?: string;
    cvUrl?: string;
  };
  experiences: ExperienceItem[];
  education: EducationItem[];
  skills?: SkillCategory[];
  projects: ProjectData[];
}
