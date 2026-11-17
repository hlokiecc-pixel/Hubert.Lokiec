import React from 'react';
import { ArrowRight, Box, Layers, Cpu, Flame, Plus, Camera } from 'lucide-react';
import { ProjectData } from '../types/portfolio';
import { compressImage } from '../utils/imageCompressor';

interface ProjectsGridProps {
  projects: ProjectData[];
  isOwner?: boolean;
  onSelectProject: (projectId: string) => void;
  onOpenEdit?: () => void;
  onUpdateProjectThumbnail?: (projectId: string, imageUrl: string) => void;
}

export const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  isOwner = false,
  onSelectProject,
  onOpenEdit,
  onUpdateProjectThumbnail,
}) => {
  // Group projects by category
  const categories = Array.from(new Set(projects.map((p) => p.category)));

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('aero') || cat.includes('plane') || cat.includes('space')) {
      return <Layers className="w-4 h-4 text-blue-600" />;
    }
    if (cat.includes('ai') || cat.includes('software') || cat.includes('code')) {
      return <Cpu className="w-4 h-4 text-indigo-600" />;
    }
    if (cat.includes('combustion') || cat.includes('cfd') || cat.includes('fluid') || cat.includes('tji')) {
      return <Flame className="w-4 h-4 text-amber-600" />;
    }
    return <Box className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Projects</h2>
        {isOwner && onOpenEdit && (
          <button
            onClick={onOpenEdit}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add / Edit Projects</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {categories.map((category) => {
          const categoryProjects = projects.filter((p) => p.category === category);
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                {getCategoryIcon(category)}
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {category}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoryProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className="border border-slate-200 rounded-lg overflow-hidden bg-white hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    {/* Visual Preview Frame */}
                    <div className="relative aspect-[16/10] bg-slate-900 border-b border-slate-200 flex items-center justify-center overflow-hidden p-3 select-none">
                      {project.media[0]?.previewUrl ? (
                        <img
                          src={project.media[0].previewUrl}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 relative">
                          {/* Geometric CAD Wireframe Motif */}
                          <div className="absolute inset-0 opacity-20">
                            <svg width="100%" height="100%">
                              <defs>
                                <pattern id={`grid-${project.id}`} width="16" height="16" patternUnits="userSpaceOnUse">
                                  <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#60a5fa" strokeWidth="0.5" />
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill={`url(#grid-${project.id})`} />
                            </svg>
                          </div>

                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-1.5 z-10">
                            {getCategoryIcon(project.category)}
                          </div>
                          <span className="text-[11px] font-mono text-slate-300 font-semibold z-10 truncate max-w-[90%]">
                            {project.title.split('[')[0].trim()}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 z-10">
                            {project.isTeamProject ? `Team of ${project.teamSize || 4}` : 'Independent Research'}
                          </span>
                        </div>
                      )}

                      {/* Category / Project Badge */}
                      {project.isTeamProject ? (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-900/85 text-slate-200 rounded text-[10px] font-mono font-medium tracking-wide">
                          M.Sc. Team
                        </div>
                      ) : null}

                      {/* Quick Change / Upload Photo Button ONLY for Owner */}
                      {isOwner && onUpdateProjectThumbnail && (
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 hover:bg-black text-white rounded text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer z-20 shadow-xs backdrop-blur-xs"
                          title="Upload project photo / thumbnail"
                        >
                          <Camera className="w-3 h-3 text-white" />
                          <span>{project.media[0]?.previewUrl ? 'Change Photo' : 'Upload Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file && onUpdateProjectThumbnail) {
                                try {
                                  const base64 = await compressImage(file, 1400, 0.82);
                                  onUpdateProjectThumbnail(project.id, base64);
                                } catch (err) {
                                  console.error('Error compressing image:', err);
                                }
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Card Content Text */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {project.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {project.subtitle || project.description || 'Click to view project details, CAD models, and specifications.'}
                        </p>

                        {project.myTools && project.myTools.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.myTools.slice(0, 3).map((tool, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-1.5 py-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200/80 rounded"
                              >
                                {tool}
                              </span>
                            ))}
                            {project.myTools.length > 3 && (
                              <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                                +{project.myTools.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {project.keyMetrics && project.keyMetrics.length > 0 && project.keyMetrics[0].value && (
                          <div className="mt-2 px-2 py-1 bg-blue-50/70 border border-blue-100 rounded text-[10px] text-blue-900 flex items-center justify-between gap-2">
                            <span className="text-blue-700 font-medium truncate">
                              {project.keyMetrics[0].label}
                            </span>
                            <span className="font-mono font-bold shrink-0">
                              {project.keyMetrics[0].value}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quiet Unboxed Metadata */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          {project.isTeamProject ? (
                            <span className="text-slate-700 font-medium">Team of {project.teamSize}</span>
                          ) : (
                            <span className="text-slate-600">Individual</span>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-slate-600">{project.year}</span>
                        </div>

                        <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 font-medium text-[11px]">
                          <span>Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
