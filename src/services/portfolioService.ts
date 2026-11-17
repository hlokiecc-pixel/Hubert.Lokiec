import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ProfileData, ProjectData, MediaItem, SkillCategory } from '../types/portfolio';
import { compressDataUrl } from '../utils/imageCompressor';

const PORTFOLIO_DOC_PATH = 'portfolios/main';
const MEDIA_COLLECTION_PATH = 'portfolios/main/media';

interface StoredMediaDoc {
  ownerUid: string;
  projectId: string;
  title: string;
  type: 'cad' | 'simulation' | 'photo' | 'chart' | 'avatar';
  caption: string;
  dataUrl: string;
  order: number;
  isPublic: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface StoredPortfolioDoc {
  ownerUid: string;
  name: string;
  title: string;
  bio: string;
  links: ProfileData['links'];
  experiences: ProfileData['experiences'];
  education: ProfileData['education'];
  skills?: SkillCategory[];
  projects: ProjectData[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `item_${Date.now()}`;
}

function sanitizeLinks(links: ProfileData['links']): ProfileData['links'] {
  const allowedKeys = ['linkedin', 'github', 'onshape', 'youtube', 'email', 'cvUrl'] as const;
  const out: ProfileData['links'] = {};
  for (const key of allowedKeys) {
    const val = links?.[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      out[key] = val.trim().slice(0, key === 'email' ? 200 : 500);
    }
  }
  return out;
}

function stripMediaDataUrls(projects: ProjectData[]): ProjectData[] {
  return (projects || []).slice(0, 30).map((proj) => ({
    ...proj,
    media: (proj.media || []).map(({ previewUrl: _ignored, ...rest }) => ({
      ...rest,
      id: sanitizeId(rest.id),
      title: (rest.title || '').slice(0, 200),
      caption: (rest.caption || '').slice(0, 1000),
    })),
  }));
}

function assembleProfileData(
  portfolioDoc: StoredPortfolioDoc,
  mediaDocs: Array<{ id: string; data: StoredMediaDoc }>
): ProfileData {
  const avatarDoc = mediaDocs.find((m) => m.id === 'avatar' || m.data.type === 'avatar');
  const mediaById = new Map<string, StoredMediaDoc>();
  const mediaByProject = new Map<string, Array<{ id: string; data: StoredMediaDoc }>>();

  for (const item of mediaDocs) {
    if (item.id === 'avatar' || item.data.type === 'avatar') continue;
    mediaById.set(item.id, item.data);
    const list = mediaByProject.get(item.data.projectId) || [];
    list.push(item);
    mediaByProject.set(item.data.projectId, list);
  }

  const projects: ProjectData[] = (portfolioDoc.projects || []).map((proj) => {
    const seenIds = new Set<string>();
    const hydratedMedia: MediaItem[] = (proj.media || []).map((m) => {
      const safeId = sanitizeId(m.id);
      seenIds.add(safeId);
      const stored = mediaById.get(safeId);
      return {
        ...m,
        id: safeId,
        title: stored?.title || m.title,
        caption: stored?.caption ?? m.caption,
        previewUrl: stored?.dataUrl || m.previewUrl,
      };
    });

    // Include any media documents belonging to this project that weren't in metadata array
    const extraProjectMedia = (mediaByProject.get(proj.id) || [])
      .filter((item) => !seenIds.has(item.id))
      .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));

    for (const extra of extraProjectMedia) {
      hydratedMedia.push({
        id: extra.id,
        title: extra.data.title,
        type: extra.data.type === 'avatar' ? 'photo' : extra.data.type,
        caption: extra.data.caption,
        previewUrl: extra.data.dataUrl,
      });
    }

    return {
      ...proj,
      media: hydratedMedia,
    };
  });

  return {
    name: portfolioDoc.name || '',
    title: portfolioDoc.title || '',
    bio: portfolioDoc.bio || '',
    avatarUrl: avatarDoc?.data.dataUrl || '',
    links: portfolioDoc.links || {},
    experiences: portfolioDoc.experiences || [],
    education: portfolioDoc.education || [],
    skills: portfolioDoc.skills,
    projects,
  };
}

export async function fetchPublishedPortfolio(): Promise<{
  exists: boolean;
  data: ProfileData | null;
}> {
  const portfolioRef = doc(db, 'portfolios', 'main');
  let portfolioSnap;
  try {
    portfolioSnap = await getDoc(portfolioRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, PORTFOLIO_DOC_PATH);
  }

  if (!portfolioSnap.exists()) {
    return { exists: false, data: null };
  }

  const mediaQuery = query(
    collection(db, 'portfolios', 'main', 'media'),
    where('isPublic', '==', true)
  );
  let mediaSnap;
  try {
    mediaSnap = await getDocs(mediaQuery);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MEDIA_COLLECTION_PATH);
  }

  const mediaDocs = mediaSnap.docs.map((d) => ({
    id: d.id,
    data: d.data() as StoredMediaDoc,
  }));

  return {
    exists: true,
    data: assembleProfileData(portfolioSnap.data() as StoredPortfolioDoc, mediaDocs),
  };
}

export function subscribePublishedPortfolio(
  onUpdate: (exists: boolean, data: ProfileData | null) => void
): () => void {
  let latestPortfolio: StoredPortfolioDoc | null = null;
  let portfolioExists = false;
  let portfolioLoaded = false;
  let latestMedia: Array<{ id: string; data: StoredMediaDoc }> = [];
  let mediaLoaded = false;

  const emitIfReady = () => {
    if (!portfolioLoaded || !mediaLoaded) return;
    if (!portfolioExists || !latestPortfolio) {
      onUpdate(false, null);
      return;
    }
    onUpdate(true, assembleProfileData(latestPortfolio, latestMedia));
  };

  const unsubPortfolio = onSnapshot(
    doc(db, 'portfolios', 'main'),
    (snap) => {
      portfolioLoaded = true;
      portfolioExists = snap.exists();
      latestPortfolio = snap.exists() ? (snap.data() as StoredPortfolioDoc) : null;
      emitIfReady();
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, PORTFOLIO_DOC_PATH);
    }
  );

  const mediaQuery = query(
    collection(db, 'portfolios', 'main', 'media'),
    where('isPublic', '==', true)
  );

  const unsubMedia = onSnapshot(
    mediaQuery,
    (snap) => {
      mediaLoaded = true;
      latestMedia = snap.docs.map((d) => ({
        id: d.id,
        data: d.data() as StoredMediaDoc,
      }));
      emitIfReady();
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, MEDIA_COLLECTION_PATH);
    }
  );

  return () => {
    unsubPortfolio();
    unsubMedia();
  };
}

export async function savePortfolioToFirestore(data: ProfileData, ownerUid: string): Promise<void> {
  const portfolioRef = doc(db, 'portfolios', 'main');

  // 1. Check whether main portfolio document exists so we preserve createdAt on update
  let existingSnap;
  try {
    existingSnap = await getDoc(portfolioRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, PORTFOLIO_DOC_PATH);
  }

  const sanitizedProjects = stripMediaDataUrls(data.projects);
  const sanitizedPayload = {
    name: (data.name || '').slice(0, 150),
    title: (data.title || '').slice(0, 200),
    bio: (data.bio || '').slice(0, 10000),
    links: sanitizeLinks(data.links || {}),
    experiences: (data.experiences || []).slice(0, 30),
    education: (data.education || []).slice(0, 20),
    skills: (data.skills || []).slice(0, 12),
    projects: sanitizedProjects,
  };

  if (!existingSnap.exists()) {
    try {
      await setDoc(portfolioRef, {
        ownerUid,
        ...sanitizedPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, PORTFOLIO_DOC_PATH);
    }
  } else {
    try {
      await updateDoc(portfolioRef, {
        ...sanitizedPayload,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, PORTFOLIO_DOC_PATH);
    }
  }

  // 2. Fetch existing media documents to determine create/update/delete
  const mediaQuery = query(
    collection(db, 'portfolios', 'main', 'media'),
    where('isPublic', '==', true)
  );
  let existingMediaSnap;
  try {
    existingMediaSnap = await getDocs(mediaQuery);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MEDIA_COLLECTION_PATH);
  }
  const existingMediaMap = new Map(
    existingMediaSnap.docs.map((d) => [d.id, d.data() as StoredMediaDoc])
  );
  const desiredMediaIds = new Set<string>();

  // 3. Upsert or delete avatar
  if (data.avatarUrl && data.avatarUrl.trim().length > 0) {
    desiredMediaIds.add('avatar');
    const compressedAvatar = await compressDataUrl(data.avatarUrl, 800, 0.82, 850_000);
    const avatarRef = doc(db, 'portfolios', 'main', 'media', 'avatar');
    const avatarPath = `${MEDIA_COLLECTION_PATH}/avatar`;
    const existingAvatar = existingMediaMap.get('avatar');

    if (!existingAvatar) {
      try {
        await setDoc(avatarRef, {
          ownerUid,
          projectId: 'profile',
          title: 'Portrait Avatar',
          type: 'avatar',
          caption: 'Owner portrait photo',
          dataUrl: compressedAvatar,
          order: 0,
          isPublic: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, avatarPath);
      }
    } else if (existingAvatar.dataUrl !== compressedAvatar) {
      try {
        await updateDoc(avatarRef, {
          projectId: 'profile',
          title: 'Portrait Avatar',
          type: 'avatar',
          caption: 'Owner portrait photo',
          dataUrl: compressedAvatar,
          order: 0,
          isPublic: true,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, avatarPath);
      }
    }
  }

  // 4. Upsert all project media items that have previewUrl
  for (const proj of data.projects || []) {
    const mediaItems = proj.media || [];
    for (let idx = 0; idx < mediaItems.length; idx++) {
      const m = mediaItems[idx];
      if (!m.previewUrl || m.previewUrl.trim().length === 0) continue;

      const mediaId = sanitizeId(m.id);
      desiredMediaIds.add(mediaId);
      const compressedDataUrl = await compressDataUrl(m.previewUrl, 1400, 0.82, 850_000);
      const mediaRef = doc(db, 'portfolios', 'main', 'media', mediaId);
      const mediaPath = `${MEDIA_COLLECTION_PATH}/${mediaId}`;

      const validTypes = ['cad', 'simulation', 'photo', 'chart'] as const;
      const safeType = validTypes.includes(m.type) ? m.type : 'photo';
      const nextTitle = (m.title || 'Project Photo').slice(0, 200);
      const nextCaption = (m.caption || '').slice(0, 1000);
      const nextProjectId = proj.id.slice(0, 128);
      const existingItem = existingMediaMap.get(mediaId);

      if (!existingItem) {
        try {
          await setDoc(mediaRef, {
            ownerUid,
            projectId: nextProjectId,
            title: nextTitle,
            type: safeType,
            caption: nextCaption,
            dataUrl: compressedDataUrl,
            order: idx,
            isPublic: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, mediaPath);
        }
      } else if (
        existingItem.dataUrl !== compressedDataUrl ||
        existingItem.title !== nextTitle ||
        existingItem.caption !== nextCaption ||
        existingItem.type !== safeType ||
        existingItem.order !== idx ||
        existingItem.projectId !== nextProjectId
      ) {
        try {
          await updateDoc(mediaRef, {
            projectId: nextProjectId,
            title: nextTitle,
            type: safeType,
            caption: nextCaption,
            dataUrl: compressedDataUrl,
            order: idx,
            isPublic: true,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, mediaPath);
        }
      }
    }
  }

  // 5. Remove obsolete media docs that were deleted by owner
  for (const existingId of existingMediaMap.keys()) {
    if (!desiredMediaIds.has(existingId)) {
      const delRef = doc(db, 'portfolios', 'main', 'media', existingId);
      const delPath = `${MEDIA_COLLECTION_PATH}/${existingId}`;
      try {
        await deleteDoc(delRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, delPath);
      }
    }
  }
}
