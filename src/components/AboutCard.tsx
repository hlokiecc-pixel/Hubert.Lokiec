import React, { useState } from 'react';
import { ExternalLink, Edit2, Copy, Check, Mail, FileDown } from 'lucide-react';
import { ProfileData } from '../types/portfolio';
import { PhotoPlaceholder } from './PhotoPlaceholder';

interface AboutCardProps {
  profile: ProfileData;
  isOwner?: boolean;
  onUpdateAvatar?: (url: string) => void;
  onOpenEdit?: () => void;
}

export const AboutCard: React.FC<AboutCardProps> = ({
  profile,
  isOwner = false,
  onUpdateAvatar,
  onOpenEdit,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const hasAnyLinks = Boolean(
    profile.links.linkedin ||
      profile.links.github ||
      profile.links.onshape ||
      profile.links.youtube ||
      profile.links.email ||
      profile.links.cvUrl
  );

  const handleCopyEmail = () => {
    if (!profile.links.email) return;
    navigator.clipboard.writeText(profile.links.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">About me</h2>
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

      {/* Bio + Photo Split */}
      <div className="flex flex-col-reverse sm:flex-row gap-4 items-start justify-between">
        {/* Left Side: Bio text */}
        <div className="flex-1 space-y-3">
          {profile.bio && profile.bio.trim().length > 0 ? (
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          ) : isOwner ? (
            <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-500 text-xs leading-relaxed">
              <span className="font-semibold text-slate-700 block mb-1">Your Personal Story (Blank)</span>
              You can write your introduction, your studies, technical passions, and what drives you. Click{' '}
              <button
                onClick={onOpenEdit}
                className="text-blue-600 font-semibold hover:underline"
              >
                Edit Content
              </button>{' '}
              to write it down directly.
            </div>
          ) : null}

          {/* Links Section */}
          {(hasAnyLinks || isOwner) && (
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-900">Links &amp; Contact:</h3>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {profile.links.linkedin && (
                  <li className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-900">LinkedIn:</span>
                    <a
                      href={profile.links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                )}

                {profile.links.github && (
                  <li className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-900">GitHub:</span>
                    <a
                      href={profile.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Repositories</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                )}

                {profile.links.onshape && (
                  <li className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-900">Onshape:</span>
                    <a
                      href={profile.links.onshape}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>CAD Portfolio</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                )}

                {profile.links.youtube && (
                  <li className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-900">YouTube:</span>
                    <a
                      href={profile.links.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Channel</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                )}

                {profile.links.email && (
                  <li className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-slate-900">Email:</span>
                    <span className="font-mono text-slate-800 select-all">
                      {profile.links.email}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded inline-flex items-center gap-1 transition-colors"
                      title="Copy email address"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <a
                      href={`mailto:${profile.links.email}`}
                      title="Open in default mail app"
                      className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                    </a>
                  </li>
                )}

                {!hasAnyLinks && isOwner && (
                  <li className="text-[11px] text-slate-400 italic">
                    No links added yet. Add LinkedIn, GitHub, Email, or CV URL via "Edit Content".
                  </li>
                )}
              </ul>

              {profile.links.cvUrl && (
                <div className="pt-1">
                  <a
                    href={profile.links.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-300" />
                    <span>Download CV (PDF)</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Portrait Headshot */}
        {(profile.avatarUrl || isOwner) && (
          <div className="w-28 sm:w-32 shrink-0">
            <PhotoPlaceholder
              label="Your Portrait Photo"
              aspectRatio="square"
              currentUrl={profile.avatarUrl}
              readOnly={!isOwner}
              onImageSelected={isOwner ? onUpdateAvatar : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
};
