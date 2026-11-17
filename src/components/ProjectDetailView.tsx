import React, { useState, useRef } from 'react';
import {
  ExternalLink,
  Users,
  Edit3,
  Camera,
  Plus,
  Trash2,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Check,
  CheckCircle2,
  UploadCloud,
  FileText,
  Box,
  Copy,
  SlidersHorizontal,
  List,
  AlignLeft,
  ArrowUp,
  ArrowDown,
  Sparkles,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { ProjectData, MediaItem, ScopeCard, KeySpec } from '../types/portfolio';
import { compressImage } from '../utils/imageCompressor';
import {
  ScopeBulletItem,
  hasBulletLines,
  parseDescriptionToBullets,
  smartSplitParagraphToBullets,
  bulletsToDescription,
  parseScopeRenderBlocks,
  splitHeadingAndBody,
} from '../utils/scopeFormatter';

interface ProjectDetailViewProps {
  project: ProjectData;
  isOwner?: boolean;
  onUpdateProject?: (updated: ProjectData) => void;
  onOpenEdit?: () => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  isOwner = false,
  onUpdateProject,
  onOpenEdit,
}) => {
  const isAircraftProject = project.id.includes('aircraft') || project.id.includes('plane');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Onshape 3D Model Link states
  const [onshapeInput, setOnshapeInput] = useState(project.onshapeUrl || '');
  const [copiedOnshape, setCopiedOnshape] = useState(false);

  // Link management state
  const [isEditingLinks, setIsEditingLinks] = useState(false);

  // Technical Specifications editing state
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [specsList, setSpecsList] = useState<KeySpec[]>([]);

  // Optional Key Metrics & Results editing state
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [metricsList, setMetricsList] = useState<KeySpec[]>([]);

  // Optional NDA / Confidentiality note editing state
  const [isEditingNda, setIsEditingNda] = useState(false);
  const [ndaDraft, setNdaDraft] = useState('');

  // In-line editing states
  const [editingScopeId, setEditingScopeId] = useState<string | null>(null);
  const [scopeEditMode, setScopeEditMode] = useState<'bullets' | 'text'>('bullets');
  const [scopeBullets, setScopeBullets] = useState<ScopeBulletItem[]>([{ heading: '', body: '' }]);
  const [scopeForm, setScopeForm] = useState<{ title: string; badge: string; description: string }>({
    title: '',
    badge: '',
    description: '',
  });

  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [mediaForm, setMediaForm] = useState<{ title: string; caption: string }>({
    title: '',
    caption: '',
  });

  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Normalize KeySpecs to ensure Fusion 360 is shown instead of Onshape
  const normalizedSpecs = (project.keySpecs || []).map((spec) => {
    if (spec.label.toLowerCase() === 'modeling' && spec.value.toLowerCase().includes('onshape')) {
      return { ...spec, value: 'Fusion 360' };
    }
    return spec;
  });

  const hasModelingSpec = normalizedSpecs.some((s) => s.label.toLowerCase() === 'modeling');
  if (!hasModelingSpec && isAircraftProject) {
    normalizedSpecs.push({ label: 'Modeling', value: 'Fusion 360' });
  }

  // Fallback scope cards if not yet defined
  const scopeCards: ScopeCard[] =
    project.scopeCards && project.scopeCards.length > 0
      ? project.scopeCards
      : [
          {
            id: 'scope-xflr5',
            title: 'XFLR5 Aerodynamics',
            badge: 'My Scope',
            description:
              '2D and 3D panel method analysis, airfoil polar curve envelopes, zero-lift pitching moments, lift-to-drag optimization, and longitudinal static margin stability calculations.',
          },
          {
            id: 'scope-ansys',
            title: 'ANSYS CFD & Structural Analysis',
            badge: 'My Scope',
            description:
              'Computational fluid dynamics 3D volume mesh generation, transonic/subsonic boundary layer transitions, and wing spar stress & deflection evaluation under critical flight load factors.',
          },
        ];

  // Filter media items that have preview URLs
  const mediaList: MediaItem[] = (project.media || []).filter((m) => m && m.previewUrl);

  // Process and compress image files
  const processFiles = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    setUploadFeedback('Optimizing and adding photos...');

    const newMediaItems: MediaItem[] = [];
    const files = Array.from(fileList);

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      try {
        const compressedBase64 = await compressImage(file, 1400, 0.82);
        const titleWithoutExt = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/^(img|dsc|image)\s*/i, '');

        newMediaItems.push({
          id: `media-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          title: titleWithoutExt ? titleWithoutExt.charAt(0).toUpperCase() + titleWithoutExt.slice(1) : `Aircraft Project Photo ${mediaList.length + idx + 1}`,
          type: 'photo',
          caption: 'Aircraft project fabrication and documentation',
          previewUrl: compressedBase64,
        });
      } catch (err) {
        console.error('Error processing photo:', err);
      }
    }

    if (newMediaItems.length > 0 && onUpdateProject) {
      onUpdateProject({
        ...project,
        media: [...project.media, ...newMediaItems],
        keySpecs: normalizedSpecs,
        scopeCards,
      });
      setUploadFeedback(`Added ${newMediaItems.length} photo${newMediaItems.length > 1 ? 's' : ''} successfully!`);
      setTimeout(() => setUploadFeedback(null), 3500);
    }
    setIsProcessing(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePhoto = (id: string) => {
    if (!onUpdateProject) return;
    const updated = project.media.filter((m) => m.id !== id);
    onUpdateProject({
      ...project,
      media: updated,
    });
    if (lightboxIndex !== null) {
      setLightboxIndex(null);
    }
    setUploadFeedback('Photo removed.');
    setTimeout(() => setUploadFeedback(null), 2000);
  };

  // Start editing a scope card
  const handleStartEditScope = (scope: ScopeCard) => {
    setEditingScopeId(scope.id);
    setScopeForm({
      title: scope.title,
      badge: scope.badge || 'My Scope',
      description: scope.description,
    });
    const parsedBullets = parseDescriptionToBullets(scope.description);
    setScopeBullets(parsedBullets.length > 0 ? parsedBullets : [{ heading: '', body: '' }]);
    setScopeEditMode('bullets');
  };

  // Switch between structured Bullet List mode and Plain/Markdown Text mode
  const handleSwitchScopeEditMode = (nextMode: 'bullets' | 'text') => {
    if (nextMode === scopeEditMode) return;
    if (nextMode === 'text') {
      const serialized = bulletsToDescription(scopeBullets);
      setScopeForm((prev) => ({ ...prev, description: serialized }));
    } else {
      const parsed = parseDescriptionToBullets(scopeForm.description);
      setScopeBullets(parsed.length > 0 ? parsed : [{ heading: '', body: '' }]);
    }
    setScopeEditMode(nextMode);
  };

  // Auto-split single long paragraph into structured bullet items
  const handleAutoSplitScopeBullets = () => {
    const rawText =
      scopeEditMode === 'text' ? scopeForm.description : bulletsToDescription(scopeBullets);
    const split = smartSplitParagraphToBullets(rawText);
    setScopeBullets(split);
    setScopeForm((prev) => ({ ...prev, description: bulletsToDescription(split) }));
    setScopeEditMode('bullets');
  };

  // Save edited scope card
  const handleSaveScope = (scopeId: string) => {
    if (!onUpdateProject) return;
    const finalDescription =
      scopeEditMode === 'bullets'
        ? bulletsToDescription(scopeBullets)
        : scopeForm.description.trim();

    const updatedScopes = scopeCards.map((s) =>
      s.id === scopeId
        ? {
            ...s,
            title: scopeForm.title.trim() || s.title,
            badge: scopeForm.badge.trim() || 'My Scope',
            description: finalDescription,
          }
        : s
    );
    onUpdateProject({
      ...project,
      scopeCards: updatedScopes,
      keySpecs: project.keySpecs && project.keySpecs.length > 0 ? project.keySpecs : normalizedSpecs,
    });
    setEditingScopeId(null);
    setUploadFeedback('Scope card updated successfully!');
    setTimeout(() => setUploadFeedback(null), 2500);
  };

  const handleAddScopeCard = () => {
    if (!onUpdateProject) return;
    const newCard: ScopeCard = {
      id: `scope-${Date.now()}`,
      title: 'New Scope Area',
      badge: 'My Scope',
      description: '- **Key Responsibility:** Describe your methodology, tools, and results here.',
    };
    onUpdateProject({
      ...project,
      scopeCards: [...scopeCards, newCard],
      keySpecs: project.keySpecs && project.keySpecs.length > 0 ? project.keySpecs : normalizedSpecs,
    });
    handleStartEditScope(newCard);
  };

  const handleDeleteScopeCard = (scopeId: string) => {
    if (!onUpdateProject || scopeCards.length <= 1) return;
    const updatedScopes = scopeCards.filter((s) => s.id !== scopeId);
    onUpdateProject({
      ...project,
      scopeCards: updatedScopes,
      keySpecs: project.keySpecs && project.keySpecs.length > 0 ? project.keySpecs : normalizedSpecs,
    });
    setEditingScopeId(null);
  };

  // Render inline **bold** segments or "Heading: body" cleanly
  const renderScopeInlineText = (text: string, allowAutoHeadingBold: boolean) => {
    if (text.includes('**')) {
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={idx} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      });
    }

    if (allowAutoHeadingBold) {
      const { heading, body } = splitHeadingAndBody(text);
      if (heading) {
        return (
          <>
            <strong className="font-semibold text-slate-900">{heading}:</strong>
            {body ? ` ${body}` : ''}
          </>
        );
      }
    }

    return text;
  };

  // Save Onshape 3D model URL
  const handleSaveOnshapeUrl = () => {
    if (!onUpdateProject) return;
    const trimmed = onshapeInput.trim();
    onUpdateProject({
      ...project,
      onshapeUrl: trimmed,
      keySpecs: project.keySpecs && project.keySpecs.length > 0 ? project.keySpecs : normalizedSpecs,
    });
    setUploadFeedback('Onshape 3D model link updated successfully!');
    setTimeout(() => setUploadFeedback(null), 3000);
  };

  const handleRemoveOnshapeUrl = () => {
    if (!onUpdateProject) return;
    onUpdateProject({
      ...project,
      onshapeUrl: '',
      keySpecs: project.keySpecs && project.keySpecs.length > 0 ? project.keySpecs : normalizedSpecs,
    });
    setOnshapeInput('');
    setUploadFeedback('Onshape 3D CAD link removed.');
    setTimeout(() => setUploadFeedback(null), 2500);
  };

  // Technical Specifications editing handlers
  const handleStartEditSpecs = () => {
    const current = project.keySpecs && project.keySpecs.length > 0 ? project.keySpecs : normalizedSpecs;
    setSpecsList(current.map((s) => ({ ...s })));
    setIsEditingSpecs(true);
  };

  const handleUpdateSpec = (index: number, field: 'label' | 'value', val: string) => {
    setSpecsList((prev) =>
      prev.map((spec, idx) => (idx === index ? { ...spec, [field]: val } : spec))
    );
  };

  const handleAddSpec = () => {
    setSpecsList((prev) => [...prev, { label: 'SPECIFICATION', value: '' }]);
  };

  const handleDeleteSpec = (index: number) => {
    setSpecsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveSpecs = () => {
    if (!onUpdateProject) return;
    const cleaned = specsList
      .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
      .filter((s) => s.label.length > 0 || s.value.length > 0);

    onUpdateProject({
      ...project,
      keySpecs: cleaned,
    });
    setIsEditingSpecs(false);
    setUploadFeedback('Technical specifications updated successfully!');
    setTimeout(() => setUploadFeedback(null), 3000);
  };

  // Optional Key Metrics & Results editing handlers
  const handleStartEditMetrics = () => {
    const current = project.keyMetrics || [];
    setMetricsList(
      current.length > 0 ? current.map((m) => ({ ...m })) : [{ label: '', value: '' }]
    );
    setIsEditingMetrics(true);
  };

  const handleSaveMetrics = () => {
    if (!onUpdateProject) return;
    const cleaned = metricsList
      .map((m) => ({ label: m.label.trim(), value: m.value.trim() }))
      .filter((m) => m.label.length > 0 || m.value.length > 0);

    onUpdateProject({
      ...project,
      keyMetrics: cleaned,
    });
    setIsEditingMetrics(false);
    setUploadFeedback(
      cleaned.length > 0
        ? 'Key metrics & results updated!'
        : 'Key metrics cleared (hidden from visitors).'
    );
    setTimeout(() => setUploadFeedback(null), 3000);
  };

  const handleSaveNdaNote = (nextNote: string) => {
    if (!onUpdateProject) return;
    onUpdateProject({
      ...project,
      ndaNote: nextNote.trim(),
    });
    setIsEditingNda(false);
    setUploadFeedback(nextNote.trim() ? 'Confidentiality note saved.' : 'Confidentiality note removed.');
    setTimeout(() => setUploadFeedback(null), 2500);
  };

  // Manage project links (add, edit, delete)
  const handleDeleteLink = (index: number) => {
    if (!onUpdateProject) return;
    const updatedLinks = (project.links || []).filter((_, idx) => idx !== index);
    onUpdateProject({
      ...project,
      links: updatedLinks,
    });
    setUploadFeedback('Link removed successfully.');
    setTimeout(() => setUploadFeedback(null), 2500);
  };

  const handleAddLink = () => {
    if (!onUpdateProject) return;
    const updatedLinks = [...(project.links || []), { label: 'New Link', url: '' }];
    onUpdateProject({
      ...project,
      links: updatedLinks,
    });
    setIsEditingLinks(true);
  };

  const handleUpdateLink = (index: number, label: string, url: string) => {
    if (!onUpdateProject) return;
    const updatedLinks = (project.links || []).map((link, idx) =>
      idx === index ? { ...link, label, url } : link
    );
    onUpdateProject({
      ...project,
      links: updatedLinks,
    });
  };

  // Start editing photo text
  const handleStartEditMedia = (media: MediaItem) => {
    setEditingMediaId(media.id);
    // If it has default Onshape text, provide a clean default
    const cleanTitle =
      media.title === 'Onshape 3D Assembly Render' ? 'Aircraft Assembly Photo' : media.title;
    const cleanCaption =
      media.caption?.includes('Onshape') ? 'Aircraft assembly and components.' : media.caption;
    setMediaForm({
      title: cleanTitle,
      caption: cleanCaption || '',
    });
  };

  // Save edited photo text
  const handleSaveMedia = (mediaId: string) => {
    if (!onUpdateProject) return;
    const updatedMedia = project.media.map((m) =>
      m.id === mediaId
        ? {
            ...m,
            title: mediaForm.title.trim() || 'Project Photo',
            caption: mediaForm.caption.trim(),
          }
        : m
    );
    onUpdateProject({
      ...project,
      media: updatedMedia,
    });
    setEditingMediaId(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Upload Feedback Toast */}
      {uploadFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{uploadFeedback}</span>
          </div>
          <button onClick={() => setUploadFeedback(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner: Collaboration & Role Spotlight */}
      {project.isTeamProject && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                <Users className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Master's Degree Capstone Project · 4-Person Engineering Team
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {project.teamDescription ||
                    'Comprehensive aircraft design developed collaboratively by a team of 4 engineers.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>CAD Modeling: <strong>Fusion 360</strong></span>
              </div>
              {isOwner && (
                <button
                  onClick={handleAddScopeCard}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors"
                  title="Add another My Scope card"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Scope</span>
                </button>
              )}
            </div>
          </div>

          {/* Technical Scope Breakdown Cards (Bullet List + Structured Inline Editor) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scopeCards.map((scope) => {
              const isEditingThis = editingScopeId === scope.id;
              const renderBlocks = parseScopeRenderBlocks(scope.description);
              const canSuggestAutoSplit =
                scopeEditMode === 'bullets' &&
                scopeBullets.length === 1 &&
                scopeBullets[0].body.length > 110;

              return (
                <div
                  key={scope.id}
                  className={`p-4 bg-slate-50/80 border border-slate-200/90 rounded-lg space-y-2.5 relative group ${
                    isEditingThis ? 'md:col-span-2 bg-white shadow-sm ring-1 ring-blue-200' : ''
                  }`}
                >
                  {isEditingThis ? (
                    /* Edit Mode for Scope Card */
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={scopeForm.title}
                            onChange={(e) => setScopeForm({ ...scopeForm, title: e.target.value })}
                            className="text-xs font-bold px-2.5 py-1.5 border border-slate-300 rounded-md bg-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Card Title (e.g. ANSYS CFD & Structural Analysis)"
                          />
                          <input
                            type="text"
                            value={scopeForm.badge}
                            onChange={(e) => setScopeForm({ ...scopeForm, badge: e.target.value })}
                            className="text-[11px] font-mono px-2.5 py-1.5 border border-slate-300 rounded-md bg-white w-28 shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="My Scope"
                          />
                        </div>

                        {/* Editor Mode Switcher */}
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleSwitchScopeEditMode('bullets')}
                            className={`px-2 py-1 text-[11px] font-medium rounded inline-flex items-center gap-1 transition-colors ${
                              scopeEditMode === 'bullets'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <List className="w-3 h-3" />
                            <span>Bullet Points</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwitchScopeEditMode('text')}
                            className={`px-2 py-1 text-[11px] font-medium rounded inline-flex items-center gap-1 transition-colors ${
                              scopeEditMode === 'text'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <AlignLeft className="w-3 h-3" />
                            <span>Markdown / Text</span>
                          </button>
                        </div>
                      </div>

                      {canSuggestAutoSplit && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900">
                          <span>
                            Masz tutaj jeden długi akapit. Możesz go automatycznie rozbić na czytelne podpunkty z pogrubionymi nagłówkami.
                          </span>
                          <button
                            type="button"
                            onClick={handleAutoSplitScopeBullets}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Split into Bullets</span>
                          </button>
                        </div>
                      )}

                      {scopeEditMode === 'bullets' ? (
                        <div className="space-y-2.5">
                          {scopeBullets.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="w-1.5 h-1.5 rounded-full border border-blue-600 bg-white shrink-0" />
                                  <input
                                    type="text"
                                    value={item.heading}
                                    onChange={(e) => {
                                      const next = [...scopeBullets];
                                      next[idx] = { ...next[idx], heading: e.target.value };
                                      setScopeBullets(next);
                                    }}
                                    className="text-xs font-semibold px-2 py-1 border border-slate-300 rounded bg-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Bold Prefix / Stage (optional, e.g. Geometry Preparation & Domain Extraction)"
                                  />
                                </div>

                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => {
                                      if (idx === 0) return;
                                      const next = [...scopeBullets];
                                      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                      setScopeBullets(next);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                                    title="Move up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === scopeBullets.length - 1}
                                    onClick={() => {
                                      if (idx === scopeBullets.length - 1) return;
                                      const next = [...scopeBullets];
                                      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                                      setScopeBullets(next);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                                    title="Move down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (scopeBullets.length === 1) {
                                        setScopeBullets([{ heading: '', body: '' }]);
                                      } else {
                                        setScopeBullets(scopeBullets.filter((_, i) => i !== idx));
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    title="Remove bullet"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <textarea
                                rows={2}
                                value={item.body}
                                onChange={(e) => {
                                  const next = [...scopeBullets];
                                  next[idx] = { ...next[idx], body: e.target.value };
                                  setScopeBullets(next);
                                }}
                                className="text-xs leading-relaxed px-2.5 py-1.5 border border-slate-300 rounded bg-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Details, tools, parameters, and measurable results..."
                              />
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => setScopeBullets([...scopeBullets, { heading: '', body: '' }])}
                            className="w-full py-1.5 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 rounded-lg text-xs font-medium text-blue-600 inline-flex items-center justify-center gap-1 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Bullet Point</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <textarea
                            rows={8}
                            value={scopeForm.description}
                            onChange={(e) => setScopeForm({ ...scopeForm, description: e.target.value })}
                            className="text-xs leading-relaxed px-2.5 py-2 border border-slate-300 rounded-md bg-white w-full font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="- **Stage Title:** Description of your work..."
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                            <span>
                              Start lines with <code className="bg-slate-100 px-1 rounded">- </code> for bullets. Use{' '}
                              <code className="bg-slate-100 px-1 rounded">**Title:**</code> or{' '}
                              <code className="bg-slate-100 px-1 rounded">Title:</code> for bold prefixes.
                            </span>
                            {!hasBulletLines(scopeForm.description) && scopeForm.description.trim().length > 80 && (
                              <button
                                type="button"
                                onClick={handleAutoSplitScopeBullets}
                                className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Auto-format as bullets</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <div>
                          {scopeCards.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteScopeCard(scope.id)}
                              className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded inline-flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Card</span>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingScopeId(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveScope(scope.id)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Text</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode for Scope Card */
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                          <span>{scope.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {scope.badge || 'My Scope'}
                          </span>
                          {isOwner && (
                            <button
                              onClick={() => handleStartEditScope(scope)}
                              title="Click to edit bullet points"
                              className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-200/60 transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {renderBlocks.map((block, bIdx) =>
                          block.type === 'bullets' ? (
                            <ul key={bIdx} className="space-y-2.5">
                              {block.items.map((itemText, iIdx) => (
                                <li
                                  key={iIdx}
                                  className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed"
                                >
                                  <span
                                    className="mt-[6px] w-1.5 h-1.5 rounded-full border border-blue-600 bg-white shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span className="flex-1">
                                    {renderScopeInlineText(itemText, true)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p key={bIdx} className="text-xs text-slate-600 leading-relaxed">
                              {renderScopeInlineText(block.text, false)}
                            </p>
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content: Left Column (Description & Specs) + Right Column (Multi-Photo Gallery) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Narrative, Links & Technical Specs (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. PROJECT LINKS & FILES CARD (Now includes Onshape 3D CAD Model seamlessly!) */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Project Links & Files
                </h3>
              </div>
              {isOwner && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleAddLink}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                    title="Add a custom link"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Link</span>
                  </button>
                  <button
                    onClick={() => setIsEditingLinks(!isEditingLinks)}
                    className="text-xs text-slate-500 hover:text-blue-600 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors flex items-center gap-1 font-medium"
                    title="Edit or remove links"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="text-[11px]">{isEditingLinks ? 'Done' : 'Edit'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* If In Edit Mode (Owner only): unified editor for Onshape 3D URL + Custom Links */}
            {isOwner && isEditingLinks ? (
              <div className="space-y-3 text-xs">
                {/* Onshape 3D CAD Link Input */}
                <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-blue-600" />
                      <span>Onshape 3D CAD Model URL</span>
                    </label>
                    {project.onshapeUrl && (
                      <button
                        onClick={handleRemoveOnshapeUrl}
                        className="text-[10px] text-rose-600 hover:text-rose-800 flex items-center gap-0.5 font-medium"
                        title="Remove Onshape link"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove CAD link</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      value={onshapeInput}
                      onChange={(e) => setOnshapeInput(e.target.value)}
                      placeholder="https://cad.onshape.com/documents/..."
                      className="w-full text-xs px-2.5 py-1.5 border border-blue-300 rounded bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSaveOnshapeUrl}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shrink-0 flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>

                {/* Custom Links List Inputs */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Other Project Links (Reports, Papers, PDFs):
                  </label>
                  {(project.links || []).map((link, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => handleUpdateLink(idx, e.target.value, link.url)}
                          placeholder="Link Label (e.g. Simulation Summary)"
                          className="w-1/2 text-xs px-2 py-1 border border-slate-300 rounded bg-white font-medium"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleUpdateLink(idx, link.label, e.target.value)}
                          placeholder="URL (https://...)"
                          className="w-1/2 text-xs px-2 py-1 border border-slate-300 rounded bg-white font-mono"
                        />
                        <button
                          onClick={() => handleDeleteLink(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete this link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <button
                    onClick={handleAddLink}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Another Link</span>
                  </button>
                  <button
                    onClick={() => setIsEditingLinks(false)}
                    className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 shadow-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Display Mode */
              <div className="space-y-2">
                {/* 3D CAD Model on Onshape Entry (Compact, Clear, Integrated) */}
                {project.onshapeUrl && project.onshapeUrl.trim().length > 0 ? (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200/90 rounded-lg flex items-center justify-between gap-2 group transition-colors hover:bg-blue-50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Box className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <a
                          href={project.onshapeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-900 hover:text-blue-700 hover:underline inline-flex items-center gap-1 truncate"
                        >
                          <span className="truncate">3D CAD Model (Onshape Assembly)</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                        <span className="text-[10px] text-blue-600 block">
                          Interactive 3D model in browser
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(project.onshapeUrl || '');
                          setCopiedOnshape(true);
                          setTimeout(() => setCopiedOnshape(false), 2000);
                        }}
                        className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-100/70 rounded transition-colors"
                        title="Copy Onshape link"
                      >
                        {copiedOnshape ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {isOwner && (
                        <button
                          onClick={handleRemoveOnshapeUrl}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Remove Onshape CAD link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : isOwner && isAircraftProject ? (
                  /* Subtle button to add CAD link if not present */
                  <button
                    onClick={() => {
                      setIsEditingLinks(true);
                      setOnshapeInput(project.onshapeUrl || '');
                    }}
                    className="w-full p-2 border border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 rounded-lg text-xs text-blue-700 font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Box className="w-3.5 h-3.5 text-blue-600" />
                    <span>+ Add Onshape 3D CAD Model Link</span>
                  </button>
                ) : null}

                {/* Additional Project Links */}
                {(project.links || [])
                  .filter((link) => isOwner || Boolean(link.url && link.url.trim().length > 0))
                  .map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between group py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                  >
                    {link.url ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:text-blue-900 hover:underline font-medium text-xs inline-flex items-center gap-1.5 truncate max-w-[80%]"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{link.label}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px] truncate max-w-[80%] inline-flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <span className="truncate">{link.label}</span>
                        <span className="text-slate-300">(link pending)</span>
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      {link.url && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(link.url);
                            setUploadFeedback('Link copied to clipboard!');
                            setTimeout(() => setUploadFeedback(null), 2000);
                          }}
                          className="text-slate-300 hover:text-slate-600 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all"
                          title="Copy link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteLink(idx)}
                          className="text-slate-300 hover:text-rose-600 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-50 transition-all"
                          title="Delete this link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {((isOwner ? (project.links || []) : (project.links || []).filter((l) => l.url?.trim())).length === 0) && !project.onshapeUrl && (
                  <div className="text-slate-400 text-xs italic py-1">
                    {isOwner ? 'No links configured. Click "+ Add Link" to add one.' : 'No external files or links attached.'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. DESCRIPTION & STORY CARD */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Description & Story
              </h2>
              {isOwner && onOpenEdit && (
                <button
                  onClick={onOpenEdit}
                  className="text-xs text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Description Text */}
            {project.description && project.description.trim().length > 0 ? (
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line space-y-3 font-normal">
                {project.description}
              </div>
            ) : isOwner ? (
              <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-500 text-xs leading-relaxed">
                <span className="font-semibold text-slate-700 block mb-1">
                  Project Description (Blank)
                </span>
                Click{' '}
                <button
                  onClick={onOpenEdit}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Edit Content
                </button>{' '}
                to enter your story, challenges, and manufacturing milestones.
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Project overview coming soon.
              </div>
            )}

            {/* Optional Academic / NDA / IP Confidentiality Note */}
            {(project.ndaNote?.trim() || isOwner) && (
              <div className="pt-3 border-t border-slate-100">
                {isOwner && isEditingNda ? (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Academic / NDA / Confidentiality Note (leave empty to hide):
                    </label>
                    <input
                      type="text"
                      value={ndaDraft}
                      onChange={(e) => setNdaDraft(e.target.value)}
                      placeholder="e.g. Academic project — selected proprietary geometry parameters generalized."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setNdaDraft(
                            'Academic / research project — selected proprietary geometry and test parameters generalized.'
                          )
                        }
                        className="text-[11px] text-blue-600 hover:underline font-medium"
                      >
                        Use Academic / NDA Preset
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveNdaNote('')}
                          className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingNda(false)}
                          className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNdaNote(ndaDraft)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : project.ndaNote?.trim() ? (
                  <div className="flex items-start justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] text-slate-600">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{project.ndaNote}</span>
                    </div>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          setNdaDraft(project.ndaNote || '');
                          setIsEditingNda(true);
                        }}
                        className="text-slate-400 hover:text-blue-600 p-0.5 shrink-0"
                        title="Edit confidentiality note"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : isOwner ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNdaDraft(
                        'Academic / research project — selected proprietary geometry and test parameters generalized.'
                      );
                      setIsEditingNda(true);
                    }}
                    className="text-[11px] text-slate-400 hover:text-blue-600 inline-flex items-center gap-1 transition-colors"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>+ Add optional NDA / IP confidentiality note</span>
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {/* 2B. OPTIONAL KEY METRICS & RESULTS CARD (Hidden from visitors when empty!) */}
          {((project.keyMetrics && project.keyMetrics.length > 0) || isOwner) && (
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Key Metrics &amp; Results
                  </h3>
                </div>
                {isOwner && !isEditingMetrics && (
                  <button
                    type="button"
                    onClick={handleStartEditMetrics}
                    className="text-xs text-slate-500 hover:text-blue-600 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors flex items-center gap-1 font-medium"
                  >
                    {(project.keyMetrics || []).length > 0 ? (
                      <>
                        <Edit3 className="w-3 h-3" />
                        <span className="text-[11px]">Edit</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 text-blue-600" />
                        <span className="text-[11px] text-blue-600 font-semibold">Add Metrics</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {isOwner && isEditingMetrics ? (
                <div className="space-y-2.5 text-xs">
                  <p className="text-[11px] text-slate-500">
                    Add any measurable parameters or outcomes tailored to this project (leave empty to hide this section from visitors).
                  </p>
                  <div className="space-y-2">
                    {metricsList.map((metric, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <input
                          type="text"
                          value={metric.label}
                          onChange={(e) => {
                            const next = [...metricsList];
                            next[idx] = { ...next[idx], label: e.target.value };
                            setMetricsList(next);
                          }}
                          placeholder="Parameter (e.g. Mesh Size, L/D Gain, Latency)"
                          className="w-1/2 text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={metric.value}
                          onChange={(e) => {
                            const next = [...metricsList];
                            next[idx] = { ...next[idx], value: e.target.value };
                            setMetricsList(next);
                          }}
                          placeholder="Result (e.g. 5.65M cells, +14%, 11 m/s)"
                          className="w-1/2 text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setMetricsList(metricsList.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Remove metric"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setMetricsList([...metricsList, { label: '', value: '' }])}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Metric</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsEditingMetrics(false)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveMetrics}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (project.keyMetrics || []).length > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(project.keyMetrics || []).map((metric, idx) => (
                    <div
                      key={idx}
                      onClick={isOwner ? handleStartEditMetrics : undefined}
                      className={`p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/80 ${
                        isOwner ? 'cursor-pointer hover:bg-emerald-50 transition-colors' : ''
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wide text-emerald-700 font-semibold">
                        {metric.label}
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5 break-words">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : isOwner ? (
                <button
                  type="button"
                  onClick={handleStartEditMetrics}
                  className="w-full p-2.5 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 rounded-lg text-xs text-slate-400 hover:text-blue-700 text-center transition-colors"
                >
                  + Optional: Add engineering metrics &amp; results (hidden from visitors until filled)
                </button>
              ) : null}
            </div>
          )}

          {/* 3. TECHNICAL SPECIFICATIONS CARD (Editable across all projects!) */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Technical Specifications
                </h3>
              </div>
              {isOwner && (
                <div className="flex items-center gap-1.5">
                  {!isEditingSpecs ? (
                    <>
                      <button
                        onClick={() => {
                          const current =
                            project.keySpecs && project.keySpecs.length > 0
                              ? project.keySpecs
                              : normalizedSpecs;
                          setSpecsList([
                            ...current.map((s) => ({ ...s })),
                            { label: 'SPECIFICATION', value: '' },
                          ]);
                          setIsEditingSpecs(true);
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                        title="Add a new specification"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Spec</span>
                      </button>
                      <button
                        onClick={handleStartEditSpecs}
                        className="text-xs text-slate-500 hover:text-blue-600 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors flex items-center gap-1 font-medium"
                        title="Edit specifications"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span className="text-[11px]">Edit</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingSpecs(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Display Mode vs Inline Edit Mode */}
            {isOwner && isEditingSpecs ? (
              <div className="space-y-3 text-xs">
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {specsList.map((spec, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2"
                    >
                      <div className="w-2/5">
                        <label className="block text-[10px] font-mono uppercase text-slate-500 mb-0.5 font-bold">
                          Label
                        </label>
                        <input
                          type="text"
                          value={spec.label}
                          onChange={(e) => handleUpdateSpec(i, 'label', e.target.value)}
                          placeholder="e.g. CFD SOLVER"
                          className="w-full text-xs font-mono font-bold px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="w-3/5">
                        <label className="block text-[10px] font-mono uppercase text-slate-500 mb-0.5 font-bold">
                          Value
                        </label>
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => handleUpdateSpec(i, 'value', e.target.value)}
                          placeholder="e.g. ANSYS Fluent"
                          className="w-full text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteSpec(i)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors self-end mb-0.5"
                        title="Delete specification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {specsList.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-xs italic">
                      No specifications yet. Click below to add one.
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={handleAddSpec}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Another Spec</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingSpecs(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSpecs}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Specs</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(project.keySpecs && project.keySpecs.length > 0 ? project.keySpecs : normalizedSpecs).map((spec, i) => (
                  <div
                    key={i}
                    onClick={isOwner ? handleStartEditSpecs : undefined}
                    className={`bg-slate-50 p-2.5 rounded-lg border border-slate-200/90 transition-all group relative ${
                      isOwner ? 'hover:bg-blue-50/50 cursor-pointer' : ''
                    }`}
                    title={isOwner ? 'Click to edit specifications' : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">
                        {spec.label}
                      </div>
                      {isOwner && (
                        <Edit3 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" />
                      )}
                    </div>
                    <div className="font-semibold text-slate-900 text-xs mt-0.5 break-words">
                      {spec.value || <span className="text-slate-300 italic">Empty</span>}
                    </div>
                  </div>
                ))}

                {isOwner && (!project.keySpecs || project.keySpecs.length === 0) && normalizedSpecs.length === 0 && (
                  <div
                    onClick={handleStartEditSpecs}
                    className="col-span-2 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                  >
                    + Click here to add Technical Specifications
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Multi-Photo Project Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div
            onDragOver={(e) => {
              if (!isOwner) return;
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => isOwner && setIsDragging(false)}
            onDrop={(e) => {
              if (!isOwner) return;
              handleDrop(e);
            }}
            className={`bg-white rounded-xl border ${
              isDragging ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200/90'
            } p-5 shadow-xs space-y-4 transition-colors`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Project Gallery & Photos
                </h2>
                <p className="text-[11px] text-slate-500">
                  {mediaList.length} photo{mediaList.length === 1 ? '' : 's'}
                  {isOwner ? ' added · Click any photo to enlarge or edit captions' : ' · Click any photo to enlarge'}
                </p>
              </div>

              {/* Add Photo Button & Hidden File Input (Owner Only) */}
              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isProcessing ? 'Processing...' : 'Add Photos'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </div>
              )}
            </div>

            {/* If Photos Exist: Featured Main Photo + Thumbnails Grid */}
            {mediaList.length > 0 ? (
              <div className="space-y-4">
                {/* Featured Photo Slot */}
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 group">
                  <div className="aspect-[16/10] max-h-[440px] w-full flex items-center justify-center bg-slate-900">
                    <img
                      src={mediaList[0].previewUrl}
                      alt={mediaList[0].title}
                      className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-101"
                      onClick={() => setLightboxIndex(0)}
                    />
                  </div>

                  {/* Top Floating Badge & Delete Button */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                    <span className="text-[10px] font-mono text-white/90 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                      Primary Photo
                    </span>
                    {isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(mediaList[0].id);
                        }}
                        className="pointer-events-auto p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Bottom Text Strip with Inline Edit Support */}
                  <div className="p-3 bg-slate-900 text-white border-t border-slate-800 flex flex-col justify-between gap-1.5">
                    {editingMediaId === mediaList[0].id ? (
                      /* Inline Media Edit Form */
                      <div className="space-y-2 py-1">
                        <input
                          type="text"
                          value={mediaForm.title}
                          onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                          className="w-full text-xs font-semibold px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white"
                          placeholder="Photo Title (e.g. Workshop Assembly of Wing Frame)"
                        />
                        <input
                          type="text"
                          value={mediaForm.caption}
                          onChange={(e) => setMediaForm({ ...mediaForm, caption: e.target.value })}
                          className="w-full text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300"
                          placeholder="Description or notes about this photo"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingMediaId(null)}
                            className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveMedia(mediaList[0].id)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save Caption</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white tracking-tight truncate">
                            {mediaList[0].title === 'Onshape 3D Assembly Render'
                              ? 'Aircraft Assembly Photo'
                              : mediaList[0].title}
                          </h4>
                          {mediaList[0].caption && (
                            <p className="text-[11px] text-slate-300 line-clamp-1">
                              {mediaList[0].caption.includes('Onshape')
                                ? 'Aircraft assembly and components.'
                                : mediaList[0].caption}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isOwner && (
                            <button
                              onClick={() => handleStartEditMedia(mediaList[0])}
                              className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 flex items-center gap-1 transition-colors"
                              title="Edit this photo title and caption"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit Text</span>
                            </button>
                          )}
                          <button
                            onClick={() => setLightboxIndex(0)}
                            className="px-2 py-1 text-[11px] font-medium text-white bg-blue-600/80 hover:bg-blue-600 rounded flex items-center gap-1 transition-colors"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Enlarge</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Photos Grid (2 Columns) */}
                {mediaList.length > 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {mediaList.slice(1).map((media, idx) => {
                      const actualIdx = idx + 1;
                      return (
                        <div
                          key={media.id}
                          className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 group flex flex-col justify-between"
                        >
                          <div className="aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
                            <img
                              src={media.previewUrl}
                              alt={media.title}
                              className="w-full h-full object-cover cursor-pointer group-hover:scale-102 transition-transform duration-300"
                              onClick={() => setLightboxIndex(actualIdx)}
                            />
                          </div>

                          {/* Delete Floating Icon (Owner Only) */}
                          {isOwner && (
                            <div className="absolute top-2 right-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePhoto(media.id);
                                }}
                                className="p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors"
                                title="Remove photo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* Caption bar */}
                          <div className="p-2.5 bg-slate-900 text-white border-t border-slate-800">
                            {isOwner && editingMediaId === media.id ? (
                              <div className="space-y-1.5 py-1">
                                <input
                                  type="text"
                                  value={mediaForm.title}
                                  onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                                  className="w-full text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white"
                                  placeholder="Title"
                                />
                                <input
                                  type="text"
                                  value={mediaForm.caption}
                                  onChange={(e) => setMediaForm({ ...mediaForm, caption: e.target.value })}
                                  className="w-full text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300"
                                  placeholder="Caption"
                                />
                                <div className="flex justify-end gap-1">
                                  <button
                                    onClick={() => setEditingMediaId(null)}
                                    className="px-2 py-0.5 text-[10px] text-slate-400"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveMedia(media.id)}
                                    className="px-2.5 py-0.5 text-[10px] font-semibold text-white bg-blue-600 rounded"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1">
                                <div className="truncate flex-1">
                                  <h5 className="text-xs font-bold text-white truncate">
                                    {media.title === 'Onshape 3D Assembly Render'
                                      ? 'Aircraft Assembly'
                                      : media.title}
                                  </h5>
                                  {media.caption && (
                                    <p className="text-[10px] text-slate-300 truncate">
                                      {media.caption}
                                    </p>
                                  )}
                                </div>
                                {isOwner && (
                                  <button
                                    onClick={() => handleStartEditMedia(media)}
                                    className="p-1 text-slate-400 hover:text-white"
                                    title="Edit title & caption"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Big Drag & Drop or Click to Add More Photos (Owner Only) */}
                {isOwner && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/70 rounded-xl p-4 text-center cursor-pointer transition-colors flex items-center justify-center gap-2 text-xs font-semibold text-slate-700"
                  >
                    <Plus className="w-4 h-4 text-slate-500" />
                    <span>Click to add more photos or drag and drop image files here</span>
                  </div>
                )}
              </div>
            ) : isOwner ? (
              /* Zero State: Photo Dropzone Container (Owner Only) */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[16/10] border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors mb-3 shadow-xs">
                  <UploadCloud className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">
                  Add Photos From Your Project
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Click here or drag and drop image files from your computer (workshop assembly, simulation plots, or CAD renders).
                </p>
                <span className="mt-3 px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg group-hover:bg-slate-800 transition-colors shadow-xs">
                  Choose Photos
                </span>
              </div>
            ) : (
              /* Read-only Empty State for Visitors */
              <div className="w-full aspect-[16/10] border border-slate-200 bg-slate-50 rounded-xl flex flex-col items-center justify-center p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-2">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  No photos uploaded for this project yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal with Caption Editing */}
      {lightboxIndex !== null && mediaList[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEditMedia(mediaList[lightboxIndex]);
                }}
                className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center gap-1 text-xs"
                title="Edit photo title & caption"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setLightboxIndex(null)}
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Previous / Next Arrows */}
          {mediaList.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : mediaList.length - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev! < mediaList.length - 1 ? prev! + 1 : 0));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Lightbox Content */}
          <div
            className="max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={mediaList[lightboxIndex].previewUrl}
              alt={mediaList[lightboxIndex].title}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
            />

            {/* Editable Title & Caption Strip */}
            <div className="mt-4 text-center text-white max-w-lg w-full">
              {editingMediaId === mediaList[lightboxIndex].id ? (
                <div className="space-y-2 bg-slate-900/90 p-3 rounded-lg border border-slate-700">
                  <input
                    type="text"
                    value={mediaForm.title}
                    onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                    className="w-full text-xs font-semibold px-2 py-1 rounded bg-slate-800 border border-slate-600 text-white"
                    placeholder="Photo Title"
                  />
                  <input
                    type="text"
                    value={mediaForm.caption}
                    onChange={(e) => setMediaForm({ ...mediaForm, caption: e.target.value })}
                    className="w-full text-xs px-2 py-1 rounded bg-slate-800 border border-slate-600 text-slate-300"
                    placeholder="Caption"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setEditingMediaId(null)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveMedia(mediaList[lightboxIndex].id)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded"
                    >
                      Save Caption
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <h4 className="text-sm font-bold flex items-center justify-center gap-1.5">
                    <span>
                      {mediaList[lightboxIndex].title === 'Onshape 3D Assembly Render'
                        ? 'Aircraft Assembly Photo'
                        : mediaList[lightboxIndex].title}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => handleStartEditMedia(mediaList[lightboxIndex])}
                        className="text-slate-400 hover:text-white p-0.5"
                        title="Edit title & caption"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </h4>
                  {mediaList[lightboxIndex].caption && (
                    <p className="text-xs text-white/70 mt-1">
                      {mediaList[lightboxIndex].caption.includes('Onshape')
                        ? 'Aircraft assembly and components.'
                        : mediaList[lightboxIndex].caption}
                    </p>
                  )}
                  <span className="text-[11px] text-white/50 font-mono mt-1.5 block">
                    {lightboxIndex + 1} of {mediaList.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
