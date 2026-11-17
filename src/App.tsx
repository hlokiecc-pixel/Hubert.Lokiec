/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { INITIAL_PORTFOLIO_DATA, DEFAULT_SKILLS } from './data/defaultData';
import { ProfileData, ProjectData, SkillCategory } from './types/portfolio';
import { Header } from './components/Header';
import { AboutCard } from './components/AboutCard';
import { ResumeCard } from './components/ResumeCard';
import { SkillsCard } from './components/SkillsCard';
import { ProjectsGrid } from './components/ProjectsGrid';
import { ProjectDetailView } from './components/ProjectDetailView';
import { GitHubDeployModal } from './components/GitHubDeployModal';
import { EditContentModal } from './components/EditContentModal';
import { auth, googleProvider, OWNER_EMAIL } from './firebase';
import {
  savePortfolioToFirestore,
  subscribePublishedPortfolio,
} from './services/portfolioService';
import { Github, Edit3, Lock, CheckCircle2, AlertCircle, X, CloudUpload } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'engineering_portfolio_data_v1';

function sanitizeLoadedPortfolio(parsed: ProfileData): ProfileData {
  const updatedEducation = (parsed.education || []).map((edu) => {
    const inst = (edu.institution || '').trim();
    if (inst.toLowerCase() === 'poznań university of technology' || inst.toLowerCase() === 'poznan university of technology') {
      return { ...edu, institution: 'Poznań University of Technology' };
    }
    return edu;
  });

  const updatedProjects = (parsed.projects || []).map((proj) => {
    let nextSpecs = (proj.keySpecs || []).map((spec) => {
      if (spec.value && spec.value.includes('(Inżynierka)')) {
        return { ...spec, value: 'B.Sc. Engineering Thesis' };
      }
      return spec;
    });

    if (proj.id.includes('aircraft') || proj.id.includes('plane')) {
      nextSpecs = nextSpecs.map((spec) => {
        if (spec.label.toLowerCase() === 'modeling' && spec.value.toLowerCase().includes('onshape')) {
          return { ...spec, value: 'Fusion 360' };
        }
        return spec;
      });
      const hasModeling = nextSpecs.some((s) => s.label.toLowerCase() === 'modeling');
      if (!hasModeling) {
        nextSpecs.push({ label: 'Modeling', value: 'Fusion 360' });
      }
      const updatedMedia = (proj.media || []).map((m) => {
        if (m.title === 'Onshape 3D Assembly Render') {
          return {
            ...m,
            title: 'Aircraft Assembly',
            caption: m.caption?.includes('Onshape') ? 'Aircraft assembly and components.' : m.caption,
          };
        }
        return m;
      });
      const defaultScopes = [
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
      return {
        ...proj,
        keySpecs: nextSpecs,
        media: updatedMedia,
        scopeCards: proj.scopeCards && proj.scopeCards.length > 0 ? proj.scopeCards : defaultScopes,
        onshapeUrl: proj.onshapeUrl || '',
        ndaNote:
          proj.ndaNote !== undefined
            ? proj.ndaNote
            : 'Academic capstone project — selected proprietary geometry and load parameters generalized.',
      };
    }

    if (proj.id.includes('tji')) {
      return {
        ...proj,
        keySpecs: nextSpecs,
        ndaNote:
          proj.ndaNote !== undefined
            ? proj.ndaNote
            : 'Academic research thesis — selected experimental calibration parameters generalized.',
      };
    }

    return {
      ...proj,
      keySpecs: nextSpecs,
    };
  });

  const normalizedTitle =
    !parsed.title || parsed.title.trim() === '' || parsed.title.trim() === 'Mechanical & Aerospace Engineering'
      ? 'Aerospace & Mechanical Engineer | CFD, CAD & Python Automation'
      : parsed.title;

  return {
    ...parsed,
    title: normalizedTitle,
    education: updatedEducation,
    skills: parsed.skills && parsed.skills.length > 0 ? parsed.skills : DEFAULT_SKILLS,
    projects: updatedProjects,
  };
}

function loadInitialPortfolioData(): { data: ProfileData; hasLocalData: boolean } {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed: ProfileData = JSON.parse(saved);
      return {
        data: sanitizeLoadedPortfolio(parsed),
        hasLocalData: true,
      };
    }
  } catch (e) {
    console.warn('Could not read from localStorage:', e);
  }
  return {
    data: INITIAL_PORTFOLIO_DATA,
    hasLocalData: false,
  };
}

export default function App() {
  const initialLoadRef = useRef<{ data: ProfileData; hasLocalData: boolean } | null>(null);
  if (initialLoadRef.current === null) {
    initialLoadRef.current = loadInitialPortfolioData();
  }

  const [portfolioData, setPortfolioData] = useState<ProfileData>(initialLoadRef.current.data);
  const [hasLocalStoredData] = useState<boolean>(initialLoadRef.current.hasLocalData);

  const [user, setUser] = useState<User | null>(null);
  const [cloudLoaded, setCloudLoaded] = useState<boolean>(false);
  const [hasPublishedPortfolio, setHasPublishedPortfolio] = useState<boolean>(false);
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [cloudNotice, setCloudNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentView, setCurrentView] = useState<'home' | 'project-detail'>('home');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('aircraft-msc');
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const autoMigratedRef = useRef<boolean>(false);

  const isOwner = Boolean(
    user && user.emailVerified && user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()
  );

  // Listen for Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsEditModalOpen(false);
        setIsDeployModalOpen(false);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to published Firestore portfolio (public read)
  useEffect(() => {
    const unsub = subscribePublishedPortfolio((exists, cloudData) => {
      setCloudLoaded(true);
      if (exists && cloudData) {
        const sanitized = sanitizeLoadedPortfolio(cloudData);
        setHasPublishedPortfolio(true);
        setPortfolioData(sanitized);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
        } catch (e) {
          console.warn('Could not sync cloud data to localStorage:', e);
        }
      } else {
        setHasPublishedPortfolio(false);
      }
    });
    return () => unsub();
  }, []);

  // Automatically publish localStorage texts & photos on first owner login if cloud doc does not exist yet
  useEffect(() => {
    if (!isOwner || !user || !cloudLoaded || hasPublishedPortfolio || autoMigratedRef.current) {
      return;
    }

    autoMigratedRef.current = true;
    const migrateLocalToCloud = async () => {
      setIsSavingCloud(true);
      try {
        await savePortfolioToFirestore(portfolioData, user.uid);
        setHasPublishedPortfolio(true);
        setCloudNotice({
          type: 'success',
          text: 'Wszystkie Twoje dane i zdjęcia zostały opublikowane w bazie danych. Od teraz każdy odwiedzający widzi tę wersję w trybie tylko do odczytu.',
        });
      } catch (err) {
        console.error('Auto-migration failed:', err);
        autoMigratedRef.current = false;
        setCloudNotice({
          type: 'error',
          text: 'Nie udało się zapisać lokalnych danych w bazie danych. Spróbuj zapisać zmiany ponownie.',
        });
      } finally {
        setIsSavingCloud(false);
      }
    };

    migrateLocalToCloud();
  }, [isOwner, user, cloudLoaded, hasPublishedPortfolio, portfolioData]);

  // Auto-dismiss success notices
  useEffect(() => {
    if (cloudNotice?.type === 'success') {
      const timer = setTimeout(() => setCloudNotice(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [cloudNotice]);

  // Sync with URL Hash for shareable links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('project/')) {
        const id = hash.replace('project/', '');
        const exists = portfolioData.projects.some((p) => p.id === id);
        if (exists) {
          setSelectedProjectId(id);
          setCurrentView('project-detail');
        }
      } else {
        setCurrentView('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [portfolioData.projects]);

  const handleOwnerLogin = async () => {
    setCloudNotice(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error('Owner sign-in failed:', err);
      setCloudNotice({
        type: 'error',
        text: 'Logowanie Google nie powiodło się. Upewnij się, że okno logowania nie jest zablokowane.',
      });
    }
  };

  const handleOwnerLogout = async () => {
    try {
      await signOut(auth);
      setIsEditModalOpen(false);
      setIsDeployModalOpen(false);
      setCloudNotice(null);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  // Persist changes locally and publish to Firestore (Owner only)
  const handleSaveData = async (updated: ProfileData) => {
    if (!isOwner || !user) return;
    setPortfolioData(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    setIsEditModalOpen(false);
    setIsSavingCloud(true);
    setCloudNotice(null);
    try {
      await savePortfolioToFirestore(updated, user.uid);
      setHasPublishedPortfolio(true);
      setCloudNotice({
        type: 'success',
        text: 'Zmiany zapisane i opublikowane dla wszystkich odwiedzających.',
      });
    } catch (err) {
      console.error('Failed to save to Firestore:', err);
      setCloudNotice({
        type: 'error',
        text: 'Nie udało się zapisać zmian w bazie danych. Sprawdź połączenie lub uprawnienia właściciela.',
      });
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleResetData = async () => {
    if (!isOwner || !user) return;
    setPortfolioData(INITIAL_PORTFOLIO_DATA);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setIsEditModalOpen(false);
    setIsSavingCloud(true);
    try {
      await savePortfolioToFirestore(INITIAL_PORTFOLIO_DATA, user.uid);
      setHasPublishedPortfolio(true);
      setCloudNotice({
        type: 'success',
        text: 'Przywrócono szablon bazowy i zaktualizowano bazę danych.',
      });
    } catch (err) {
      console.error('Failed to reset in Firestore:', err);
      setCloudNotice({
        type: 'error',
        text: 'Nie udało się zresetować danych w bazie danych.',
      });
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setCurrentView('project-detail');
    window.location.hash = `project/${id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setCurrentView('home');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateProject = (updatedProject: ProjectData) => {
    if (!isOwner) return;
    const updatedProjects = portfolioData.projects.map((p) =>
      p.id === updatedProject.id ? updatedProject : p
    );
    handleSaveData({
      ...portfolioData,
      projects: updatedProjects,
    });
  };

  const handleUpdateAvatar = (avatarUrl: string) => {
    if (!isOwner) return;
    handleSaveData({
      ...portfolioData,
      avatarUrl,
    });
  };

  const handleUpdateSkills = (updatedSkills: SkillCategory[]) => {
    if (!isOwner) return;
    handleSaveData({
      ...portfolioData,
      skills: updatedSkills,
    });
  };

  const handleUpdateProjectThumbnail = (projectId: string, imageUrl: string) => {
    if (!isOwner) return;
    const updatedProjects = portfolioData.projects.map((p) => {
      if (p.id === projectId) {
        const existingMedia = p.media || [];
        if (existingMedia.length > 0) {
          const updatedMedia = [{ ...existingMedia[0], previewUrl: imageUrl }, ...existingMedia.slice(1)];
          return { ...p, media: updatedMedia };
        } else {
          return {
            ...p,
            media: [
              {
                id: `media-${Date.now()}`,
                title: `${p.title} Cover`,
                type: 'photo' as const,
                caption: 'Project cover photo',
                previewUrl: imageUrl,
              },
            ],
          };
        }
      }
      return p;
    });
    handleSaveData({
      ...portfolioData,
      projects: updatedProjects,
    });
  };

  const currentProject =
    portfolioData.projects.find((p) => p.id === selectedProjectId) ||
    portfolioData.projects[0];

  const showPendingLocalPublishNotice =
    cloudLoaded && !hasPublishedPortfolio && hasLocalStoredData && !isOwner && !user;

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-800">
      {/* Top Header */}
      <Header
        name={portfolioData.name}
        title={portfolioData.title}
        isDetailView={currentView === 'project-detail'}
        projectTitle={currentProject?.title}
        isOwner={isOwner}
        signedInEmail={user?.email || null}
        isSavingCloud={isSavingCloud}
        onGoHome={handleGoHome}
        onOpenEdit={() => isOwner && setIsEditModalOpen(true)}
        onOpenDeployGuide={() => isOwner && setIsDeployModalOpen(true)}
        onOwnerLogin={handleOwnerLogin}
        onOwnerLogout={handleOwnerLogout}
      />

      {/* One-time notice for the owner to publish existing local browser data to Firestore */}
      {showPendingLocalPublishNotice && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-950 text-xs px-4 py-2.5">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <CloudUpload className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Masz lokalnie wpisane dane i zdjęcia. Zaloguj się raz jako właściciel ({OWNER_EMAIL}), aby zapisać je w bazie danych dla wszystkich odwiedzających.
              </span>
            </div>
            <button
              onClick={handleOwnerLogin}
              className="px-3 py-1.5 bg-amber-900 hover:bg-amber-800 text-white rounded-md font-semibold text-xs whitespace-nowrap transition-colors"
            >
              Zaloguj i opublikuj dane
            </button>
          </div>
        </div>
      )}

      {/* Non-owner signed-in read-only notice */}
      {user && !isOwner && (
        <div className="bg-slate-800 text-slate-200 text-xs px-4 py-2 border-b border-slate-700">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              Zalogowano jako <strong>{user.email}</strong>. Tylko właściciel ({OWNER_EMAIL}) może edytować stronę — aktywny jest tryb tylko do odczytu.
            </span>
            <button
              onClick={handleOwnerLogout}
              className="underline font-medium hover:text-white whitespace-nowrap"
            >
              Wyloguj
            </button>
          </div>
        </div>
      )}

      {/* Cloud save status toast */}
      {cloudNotice && (
        <div
          className={`text-xs px-4 py-2 border-b ${
            cloudNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {cloudNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{cloudNotice.text}</span>
            </div>
            <button
              onClick={() => setCloudNotice(null)}
              className="p-0.5 opacity-70 hover:opacity-100"
              aria-label="Close notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 py-8">
        {currentView === 'home' ? (
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: About Me + Resume (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <AboutCard
                  profile={portfolioData}
                  isOwner={isOwner}
                  onUpdateAvatar={handleUpdateAvatar}
                  onOpenEdit={() => isOwner && setIsEditModalOpen(true)}
                />
                <ResumeCard
                  experiences={portfolioData.experiences}
                  education={portfolioData.education}
                  isOwner={isOwner}
                  onOpenEdit={() => isOwner && setIsEditModalOpen(true)}
                />
              </div>

              {/* RIGHT COLUMN: Core Skills + Categorized Projects (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <SkillsCard
                  skills={portfolioData.skills || DEFAULT_SKILLS}
                  isOwner={isOwner}
                  onUpdateSkills={handleUpdateSkills}
                />
                <ProjectsGrid
                  projects={portfolioData.projects}
                  isOwner={isOwner}
                  onSelectProject={handleSelectProject}
                  onOpenEdit={() => isOwner && setIsEditModalOpen(true)}
                  onUpdateProjectThumbnail={handleUpdateProjectThumbnail}
                />
              </div>
            </div>
          </div>
        ) : (
          <ProjectDetailView
            project={currentProject}
            isOwner={isOwner}
            onUpdateProject={handleUpdateProject}
            onOpenEdit={() => isOwner && setIsEditModalOpen(true)}
          />
        )}
      </main>

      {/* Minimal Engineering Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{portfolioData.name || 'Portfolio'}</span>
            <span>·</span>
            <span>Engineering & Research Showcase</span>
          </div>

          <div className="flex items-center gap-4">
            {isOwner ? (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Content</span>
                </button>
                <button
                  onClick={() => setIsDeployModalOpen(true)}
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 font-semibold"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Pages Deployment Guide</span>
                </button>
              </>
            ) : !user ? (
              <button
                onClick={handleOwnerLogin}
                className="text-slate-400 hover:text-slate-700 inline-flex items-center gap-1 font-medium transition-colors"
              >
                <Lock className="w-3 h-3" />
                <span>Owner Login</span>
              </button>
            ) : null}
          </div>
        </div>
      </footer>

      {/* GitHub Deployment Assistant Modal (Owner only) */}
      {isOwner && isDeployModalOpen && (
        <GitHubDeployModal
          isOpen={isDeployModalOpen}
          onClose={() => setIsDeployModalOpen(false)}
        />
      )}

      {/* Content Editor Modal (Owner only) */}
      {isOwner && isEditModalOpen && (
        <EditContentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          data={portfolioData}
          onSave={handleSaveData}
          onReset={handleResetData}
        />
      )}
    </div>
  );
}

