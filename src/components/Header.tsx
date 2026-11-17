import React from 'react';
import { Edit3, Github, Home, Lock, LogOut, ShieldCheck, Loader2 } from 'lucide-react';

interface HeaderProps {
  name: string;
  title?: string;
  isDetailView?: boolean;
  projectTitle?: string;
  isOwner?: boolean;
  signedInEmail?: string | null;
  isSavingCloud?: boolean;
  onGoHome?: () => void;
  onOpenEdit?: () => void;
  onOpenDeployGuide?: () => void;
  onOwnerLogin?: () => void;
  onOwnerLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  name,
  title = '',
  isDetailView = false,
  projectTitle = '',
  isOwner = false,
  signedInEmail = null,
  isSavingCloud = false,
  onGoHome,
  onOpenEdit,
  onOpenDeployGuide,
  onOwnerLogin,
  onOwnerLogout,
}) => {
  return (
    <header className="bg-[#24272a] text-white py-6 px-4 border-b border-slate-700/60 sticky top-0 z-30 shadow-md">
      <div className="max-w-6xl mx-auto relative flex flex-col items-center justify-center text-center">
        {/* Right Utility Actions */}
        <div className="sm:absolute sm:right-0 sm:top-0 flex flex-wrap items-center justify-center gap-2 mb-3 sm:mb-0">
          {isOwner ? (
            <>
              {isSavingCloud && (
                <span className="px-2 py-1 text-[11px] font-medium text-blue-200 bg-blue-900/60 border border-blue-500/40 rounded-md flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </span>
              )}

              {onOpenEdit && (
                <button
                  onClick={onOpenEdit}
                  title="Edit text, bio, and projects"
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/60 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Edit Content</span>
                </button>
              )}

              {onOpenDeployGuide && (
                <button
                  onClick={onOpenDeployGuide}
                  title="Step-by-step instructions to publish on GitHub Pages"
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/60 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Deploy to GitHub</span>
                </button>
              )}

              {onOwnerLogout && (
                <button
                  onClick={onOwnerLogout}
                  title={`Signed in as owner (${signedInEmail || ''}). Click to lock & preview as visitor.`}
                  className="px-2.5 py-1.5 text-xs font-medium text-emerald-200 hover:text-white bg-emerald-950/60 hover:bg-slate-700 border border-emerald-700/50 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Owner</span>
                  <LogOut className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </>
          ) : signedInEmail ? (
            onOwnerLogout && (
              <button
                onClick={onOwnerLogout}
                title={`Signed in as ${signedInEmail} (Read-only visitor)`}
                className="px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 rounded-md transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )
          ) : (
            onOwnerLogin && (
              <button
                onClick={onOwnerLogin}
                title="Owner Sign In (Edit Mode)"
                className="px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Owner</span>
              </button>
            )
          )}
        </div>

        {/* Center Main Titles */}
        {isDetailView ? (
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
              {projectTitle}
            </h1>
            <p className="text-sm font-medium text-slate-300 mb-2">
              {name || 'Hubert Łokieć'}
            </p>
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-slate-300 hover:text-white underline underline-offset-4 decoration-slate-400 hover:decoration-white transition-colors"
              >
                <Home className="w-3 h-3" />
                <span>HOME</span>
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-2xl px-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
              {name || 'Hubert Łokieć'}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-300 tracking-wide">
              {title || 'Aerospace & Mechanical Engineer | CFD, CAD & Python Automation'}
            </p>
          </div>
        )}
      </div>
    </header>
  );
};
