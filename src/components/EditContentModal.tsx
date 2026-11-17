import React, { useState } from 'react';
import { X, Save, RotateCcw, Download, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { ProfileData, ProjectData, ExperienceItem, EducationItem } from '../types/portfolio';

interface EditContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProfileData;
  onSave: (updatedData: ProfileData) => void;
  onReset: () => void;
}

export const EditContentModal: React.FC<EditContentModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<ProfileData>(JSON.parse(JSON.stringify(data)));
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'projects'>('profile');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(data.projects[0]?.id || '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    setSaveStatus('Changes saved & published!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'portfolio-data.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleAddExperience = () => {
    const newItem: ExperienceItem = {
      id: `exp-${Date.now()}`,
      role: 'New Position',
      organization: 'Company / Institution',
      period: '2024 – Present',
      description: '',
    };
    setFormData({
      ...formData,
      experiences: [...formData.experiences, newItem],
    });
  };

  const handleDeleteExperience = (id: string) => {
    setFormData({
      ...formData,
      experiences: formData.experiences.filter((exp) => exp.id !== id),
    });
  };

  const handleAddProject = () => {
    const newProj: ProjectData = {
      id: `proj-${Date.now()}`,
      title: 'New Engineering Project',
      subtitle: 'Project subtitle or technical domain',
      category: 'Engineering & Technology',
      year: '2025',
      isTeamProject: false,
      myRole: 'Lead Engineer',
      myTools: ['Tool 1', 'Tool 2'],
      description: '',
      links: [{ label: 'Project Link', url: '' }],
      keySpecs: [{ label: 'Specification', value: 'Value' }],
      media: [],
      customNotes: '',
    };
    setFormData({
      ...formData,
      projects: [...formData.projects, newProj],
    });
    setSelectedProjectId(newProj.id);
  };

  const handleDeleteProject = (id: string) => {
    const filtered = formData.projects.filter((p) => p.id !== id);
    setFormData({
      ...formData,
      projects: filtered,
    });
    if (selectedProjectId === id && filtered.length > 0) {
      setSelectedProjectId(filtered[0].id);
    }
  };

  const currentProject = formData.projects.find((p) => p.id === selectedProjectId) || formData.projects[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div>
            <h3 className="font-semibold text-base text-white">Edit Portfolio Content</h3>
            <p className="text-xs text-slate-400">
              Customize all text, bio, experience, and project descriptions. All changes update instantly!
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Profile & Links
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'experience'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Experience & Education
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'projects'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Projects & Details
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJSON}
              title="Export JSON file to keep or commit to GitHub"
              className="px-2.5 py-1 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {saveStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveStatus}</span>
            </div>
          )}

          {/* TAB 1: Profile & Bio */}
          {activeTab === 'profile' && (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name:</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Krzysztof Kowalski"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Title:</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Mechanical & Aerospace Engineer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  About Me / Personal Bio (write your story here):
                </label>
                <textarea
                  rows={5}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                  placeholder="Write your personal introduction, degree, technical interests, and aspirations..."
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Tip: Mention your background in mechanical engineering, simulations, and interest in aerospace and robotics.
                </p>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Social & Portfolio Links</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">LinkedIn Profile URL:</label>
                    <input
                      type="url"
                      value={formData.links.linkedin || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          links: { ...formData.links, linkedin: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">GitHub Profile URL:</label>
                    <input
                      type="url"
                      value={formData.links.github || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          links: { ...formData.links, github: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Onshape / CAD Profile URL:</label>
                    <input
                      type="url"
                      value={formData.links.onshape || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          links: { ...formData.links, onshape: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="https://cad.onshape.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Contact Email:</label>
                    <input
                      type="email"
                      value={formData.links.email || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          links: { ...formData.links, email: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      CV / Resume PDF URL (optional — displays Download CV button):
                    </label>
                    <input
                      type="url"
                      value={formData.links.cvUrl || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          links: { ...formData.links, cvUrl: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="https://drive.google.com/... or ./Hubert_Lokiec_CV.pdf"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Experience & Education */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              {/* Experience */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Work Experience Timeline
                  </h4>
                  <button
                    onClick={handleAddExperience}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Position</span>
                  </button>
                </div>

                {formData.experiences.map((exp, idx) => (
                  <div key={exp.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400">Position #{idx + 1}</span>
                      <button
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-600">Company / Organization:</label>
                        <input
                          type="text"
                          value={exp.organization}
                          onChange={(e) => {
                            const updated = [...formData.experiences];
                            updated[idx].organization = e.target.value;
                            setFormData({ ...formData, experiences: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">Role / Title:</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => {
                            const updated = [...formData.experiences];
                            updated[idx].role = e.target.value;
                            setFormData({ ...formData, experiences: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">Period (e.g. 09.2024 – 02.2025):</label>
                        <input
                          type="text"
                          value={exp.period}
                          onChange={(e) => {
                            const updated = [...formData.experiences];
                            updated[idx].period = e.target.value;
                            setFormData({ ...formData, experiences: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Education */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Education & Academic Degrees
                </h4>

                {formData.education.map((edu, idx) => (
                  <div key={edu.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-600">Degree:</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].degree = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">University / Institution:</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].institution = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">Period (e.g. 2023 – 2025):</label>
                        <input
                          type="text"
                          value={edu.period}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].period = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600">Thesis Title & Focus:</label>
                      <input
                        type="text"
                        value={edu.details || ''}
                        onChange={(e) => {
                          const updated = [...formData.education];
                          updated[idx].details = e.target.value;
                          setFormData({ ...formData, education: updated });
                        }}
                        className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Projects & Onshape */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl">
                  {formData.projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                        selectedProjectId === p.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {p.title.split('[')[0].trim()}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAddProject}
                  className="px-2.5 py-1 text-xs text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 font-medium whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {currentProject && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-semibold text-slate-800">
                      Editing: {currentProject.title}
                    </span>
                    {formData.projects.length > 1 && (
                      <button
                        onClick={() => handleDeleteProject(currentProject.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Project</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title:</label>
                      <input
                        type="text"
                        value={currentProject.title}
                        onChange={(e) => {
                          const updated = formData.projects.map((p) =>
                            p.id === currentProject.id ? { ...p, title: e.target.value } : p
                          );
                          setFormData({ ...formData, projects: updated });
                        }}
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Category:</label>
                      <input
                        type="text"
                        value={currentProject.category}
                        onChange={(e) => {
                          const updated = formData.projects.map((p) =>
                            p.id === currentProject.id ? { ...p, category: e.target.value } : p
                          );
                          setFormData({ ...formData, projects: updated });
                        }}
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
                        placeholder="e.g. Aerospace & CFD"
                      />
                    </div>
                  </div>

                  {/* Team vs Individual Scope */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isTeamCheck"
                        checked={currentProject.isTeamProject || false}
                        onChange={(e) => {
                          const updated = formData.projects.map((p) =>
                            p.id === currentProject.id ? { ...p, isTeamProject: e.target.checked } : p
                          );
                          setFormData({ ...formData, projects: updated });
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isTeamCheck" className="text-xs font-semibold text-slate-800">
                        This was a collaborative / team project (e.g. Master's team of 4)
                      </label>
                    </div>

                    {currentProject.isTeamProject && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <div>
                          <label className="block text-[11px] text-slate-600">Total Team Size:</label>
                          <input
                            type="number"
                            value={currentProject.teamSize || 4}
                            onChange={(e) => {
                              const updated = formData.projects.map((p) =>
                                p.id === currentProject.id ? { ...p, teamSize: parseInt(e.target.value) || 1 } : p
                              );
                              setFormData({ ...formData, projects: updated });
                            }}
                            className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded bg-slate-50"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-600">Team Scope Summary:</label>
                          <input
                            type="text"
                            value={currentProject.teamDescription || ''}
                            onChange={(e) => {
                              const updated = formData.projects.map((p) =>
                                p.id === currentProject.id ? { ...p, teamDescription: e.target.value } : p
                              );
                              setFormData({ ...formData, projects: updated });
                            }}
                            className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded bg-slate-50"
                            placeholder="e.g. Master's capstone project developed in a 4-person team"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        My Personal Contributions & Tools (e.g. XFLR5, ANSYS, CAD):
                      </label>
                      <input
                        type="text"
                        value={currentProject.myRole || ''}
                        onChange={(e) => {
                          const updated = formData.projects.map((p) =>
                            p.id === currentProject.id ? { ...p, myRole: e.target.value } : p
                          );
                          setFormData({ ...formData, projects: updated });
                        }}
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-slate-50"
                        placeholder="My scope: Aerodynamic analysis in XFLR5, CFD simulations in ANSYS, and CAD modeling"
                      />
                    </div>
                  </div>

                  {/* Technical Specifications Editor */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800">
                        Technical Specifications (e.g. Modeling, Tools, Wingspan):
                      </label>
                      <button
                        onClick={() => {
                          const updatedSpecs = [...(currentProject.keySpecs || []), { label: 'New Spec', value: 'Value' }];
                          const updated = formData.projects.map((p) =>
                            p.id === currentProject.id ? { ...p, keySpecs: updatedSpecs } : p
                          );
                          setFormData({ ...formData, projects: updated });
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Spec</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(currentProject.keySpecs || []).map((spec, specIdx) => (
                        <div key={specIdx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                          <input
                            type="text"
                            value={spec.label}
                            onChange={(e) => {
                              const updatedSpecs = (currentProject.keySpecs || []).map((s, i) =>
                                i === specIdx ? { ...s, label: e.target.value } : s
                              );
                              const updated = formData.projects.map((p) =>
                                p.id === currentProject.id ? { ...p, keySpecs: updatedSpecs } : p
                              );
                              setFormData({ ...formData, projects: updated });
                            }}
                            className="w-1/2 text-xs px-2 py-0.5 border border-slate-300 rounded bg-white font-mono"
                            placeholder="Label"
                          />
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => {
                              const updatedSpecs = (currentProject.keySpecs || []).map((s, i) =>
                                i === specIdx ? { ...s, value: e.target.value } : s
                              );
                              const updated = formData.projects.map((p) =>
                                p.id === currentProject.id ? { ...p, keySpecs: updatedSpecs } : p
                              );
                              setFormData({ ...formData, projects: updated });
                            }}
                            className="w-1/2 text-xs px-2 py-0.5 border border-slate-300 rounded bg-white font-semibold"
                            placeholder="Value"
                          />
                          <button
                            onClick={() => {
                              const updatedSpecs = currentProject.keySpecs.filter((_, i) => i !== specIdx);
                              const updated = formData.projects.map((p) =>
                                p.id === currentProject.id ? { ...p, keySpecs: updatedSpecs } : p
                              );
                              setFormData({ ...formData, projects: updated });
                            }}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Onshape 3D CAD Assembly URL */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      Onshape 3D Model URL (public assembly link):
                    </label>
                    <input
                      type="url"
                      value={currentProject.onshapeUrl || ''}
                      onChange={(e) => {
                        const updated = formData.projects.map((p) =>
                          p.id === currentProject.id ? { ...p, onshapeUrl: e.target.value } : p
                        );
                        setFormData({ ...formData, projects: updated });
                      }}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white font-mono focus:ring-2 focus:ring-blue-500"
                      placeholder="https://cad.onshape.com/documents/..."
                    />
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Paste the link to your public Onshape document. Visitors will see a prominent button and viewer to explore your 3D CAD assembly.
                    </p>
                  </div>

                  {/* Project Custom Links & Files */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800">
                        Project Links & Files (e.g. PDF Summary, Code Repository):
                      </label>
                      <button
                        onClick={() => {
                          const updatedLinks = [...(currentProject.links || []), { label: 'New Link', url: '' }];
                          const updated = formData.projects.map((p) =>
                            p.id === currentProject.id ? { ...p, links: updatedLinks } : p
                          );
                          setFormData({ ...formData, projects: updated });
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Link</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {(currentProject.links || []).map((link, linkIdx) => (
                        <div key={linkIdx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => {
                              const updatedLinks = [...currentProject.links];
                              updatedLinks[linkIdx].label = e.target.value;
                              const updated = formData.projects.map((p) =>
                                p.id === currentProject.id ? { ...p, links: updatedLinks } : p
                              );
                              setFormData({ ...formData, projects: updated });
                            }}
                            className="w-1/2 text-xs px-2 py-0.5 border border-slate-300 rounded bg-white"
                            placeholder="Label (e.g. Summary PDF)"
                          />
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => {
                              const updatedLinks = [...currentProject.links];
                              updatedLinks[linkIdx].url = e.target.value;
                              const updated = formData.projects.map((p) =>
                                p.id === currentProject.id ? { ...p, links: updatedLinks } : p
                              );
                              setFormData({ ...formData, projects: updated });
                            }}
                            className="w-1/2 text-xs px-2 py-0.5 border border-slate-300 rounded bg-white font-mono"
                            placeholder="URL (https://...)"
                          />
                          <button
                            onClick={() => {
                              const updatedLinks = currentProject.links.filter((_, i) => i !== linkIdx);
                              const updated = formData.projects.map((p) =>
                                p.id === currentProject.id ? { ...p, links: updatedLinks } : p
                              );
                              setFormData({ ...formData, projects: updated });
                            }}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                            title="Delete this link"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Project Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Project Description (write your text here):
                    </label>
                    <textarea
                      rows={5}
                      value={currentProject.description}
                      onChange={(e) => {
                        const updated = formData.projects.map((p) =>
                          p.id === currentProject.id ? { ...p, description: e.target.value } : p
                        );
                        setFormData({ ...formData, projects: updated });
                      }}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white leading-relaxed"
                      placeholder="Describe the project goal, methodology, technical challenges solved, results, and outcomes..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-700 font-medium">Reset all text to blank template?</span>
              <button
                onClick={() => {
                  setConfirmReset(false);
                  onReset();
                }}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Blank Template</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
