import React from 'react';
import { Edit2 } from 'lucide-react';
import { ExperienceItem, EducationItem } from '../types/portfolio';

interface ResumeCardProps {
  experiences: ExperienceItem[];
  education: EducationItem[];
  isOwner?: boolean;
  onOpenEdit?: () => void;
}

export const ResumeCard: React.FC<ResumeCardProps> = ({
  experiences,
  education,
  isOwner = false,
  onOpenEdit,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Resume</h2>
        {isOwner && onOpenEdit && (
          <button
            onClick={onOpenEdit}
            className="text-xs text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Experience Section */}
        {(experiences.length > 0 || isOwner) && (
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Experience
            </h3>

            <div className="space-y-4">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-start justify-between gap-4 text-xs group"
                >
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {exp.organization}
                    </div>
                    <div className="text-slate-600 mt-0.5">{exp.role}</div>
                    {exp.description && (
                      <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {exp.description}
                      </div>
                    )}
                  </div>
                  <div className="text-slate-500 font-mono text-[11px] shrink-0 whitespace-nowrap text-right">
                    {exp.period}
                  </div>
                </div>
              ))}

              {experiences.length === 0 && isOwner && (
                <div className="text-xs text-slate-400 italic">
                  No work experience listed. Add positions via "Edit Content".
                </div>
              )}
            </div>
          </div>
        )}

        {/* Education Section */}
        <div className={experiences.length > 0 || isOwner ? 'pt-3 border-t border-slate-100' : ''}>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Education
          </h3>

          <div className="space-y-4">
            {education.map((edu) => (
              <div
                key={edu.id}
                className="flex items-start justify-between gap-4 text-xs group"
              >
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {edu.degree}
                  </div>
                  <div className="text-slate-600 mt-0.5">{edu.institution}</div>
                  {edu.details && (
                    <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {edu.details}
                    </div>
                  )}
                </div>
                <div className="text-slate-500 font-mono text-[11px] shrink-0 whitespace-nowrap text-right">
                  {edu.period}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
