import React, { useState } from 'react';
import { Wrench, Edit2, Plus, Trash2, Check } from 'lucide-react';
import { SkillCategory } from '../types/portfolio';

interface SkillsCardProps {
  skills: SkillCategory[];
  isOwner?: boolean;
  onUpdateSkills?: (updated: SkillCategory[]) => void;
}

export const SkillsCard: React.FC<SkillsCardProps> = ({
  skills,
  isOwner = false,
  onUpdateSkills,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Array<{ id: string; category: string; itemsText: string }>>([]);

  if (!isOwner && (!skills || skills.length === 0)) {
    return null;
  }

  const handleStartEdit = () => {
    setDraft(
      (skills || []).map((cat) => ({
        id: cat.id,
        category: cat.category,
        itemsText: (cat.items || []).join(', '),
      }))
    );
    setIsEditing(true);
  };

  const handleAddCategory = () => {
    setDraft((prev) => [
      ...prev,
      { id: `skill-${Date.now()}`, category: 'New Category', itemsText: '' },
    ]);
  };

  const handleSave = () => {
    if (!onUpdateSkills) return;
    const cleaned: SkillCategory[] = draft
      .map((row) => ({
        id: row.id,
        category: row.category.trim(),
        items: row.itemsText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      }))
      .filter((row) => row.category.length > 0 && row.items.length > 0);

    onUpdateSkills(cleaned);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between mb-3.5 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Core Skills &amp; Tech Stack
          </h2>
        </div>

        {isOwner && onUpdateSkills && !isEditing && (
          <button
            onClick={handleStartEdit}
            className="text-xs text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {isOwner && isEditing ? (
        <div className="space-y-3 text-xs">
          {draft.map((row, idx) => (
            <div
              key={row.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={row.category}
                  onChange={(e) => {
                    const next = [...draft];
                    next[idx] = { ...next[idx], category: e.target.value };
                    setDraft(next);
                  }}
                  placeholder="Category (e.g. CFD & Aerodynamics)"
                  className="flex-1 text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setDraft(draft.filter((_, i) => i !== idx))}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  title="Remove category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <input
                  type="text"
                  value={row.itemsText}
                  onChange={(e) => {
                    const next = [...draft];
                    next[idx] = { ...next[idx], itemsText: e.target.value };
                    setDraft(next);
                  }}
                  placeholder="Comma-separated tools (e.g. ANSYS Fluent, XFLR5, Fusion 360)"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Separate items with commas (,)
                </span>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleAddCategory}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Skills</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {(skills || []).map((cat) => (
            <div key={cat.id} className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {cat.category}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-[11px] font-medium text-slate-800 bg-slate-100 border border-slate-200/90 rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
