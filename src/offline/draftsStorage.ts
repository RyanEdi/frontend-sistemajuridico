// frontend/src/offline/draftsStorage.ts
export type DraftType = 'client' | 'petition';

export interface Draft {
  id: string;
  type: DraftType;
  clientId?: string;
  data: any;
  updatedAt: string; // ISO
}

const STORAGE_KEY = 'legaltech_pcd_drafts';

export function getDrafts(): Draft[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Draft[];
  } catch {
    return [];
  }
}

export function saveDraft(draft: Draft) {
  const drafts = getDrafts();
  const idx = drafts.findIndex(d => d.id === draft.id);
  if (idx === -1) {
    drafts.push(draft);
  } else {
    drafts[idx] = draft;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function deleteDraft(id: string) {
  const drafts = getDrafts().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}