import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export function subscribeOrgCollection<T>(
  orgId: string,
  ownerId: string,
  colName: string,
  onData: (items: T[]) => void
): Unsubscribe {
  const path = `organizations/${orgId}/${colName}`;
  const q = query(collection(db, path), where('ownerId', '==', ownerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const rows: T[] = [];
      snapshot.forEach((docSnap) => {
        rows.push(docSnap.data() as T);
      });
      onData(rows);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        console.warn(`Subscription warning on ${path}:`, e);
      }
    }
  );
}

export async function upsertOrgDoc<T extends { id: string }>(
  orgId: string,
  colName: string,
  data: T
): Promise<void> {
  const path = `organizations/${orgId}/${colName}/${data.id}`;
  try {
    await setDoc(doc(db, path), data as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateOrgDoc(
  orgId: string,
  colName: string,
  docId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const path = `organizations/${orgId}/${colName}/${docId}`;
  try {
    await updateDoc(doc(db, path), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrgDoc(
  orgId: string,
  colName: string,
  docId: string
): Promise<void> {
  const path = `organizations/${orgId}/${colName}/${docId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function batchWriteOrgDocs(
  orgId: string,
  entries: Array<{ colName: string; id: string; data: Record<string, unknown> }>
): Promise<void> {
  // Firestore batches support up to 500 writes per batch
  const CHUNK_SIZE = 400;
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const entry of chunk) {
      const ref = doc(db, `organizations/${orgId}/${entry.colName}/${entry.id}`);
      batch.set(ref, entry.data);
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `organizations/${orgId}/batch`);
    }
  }
}

export async function clearDemoDocsFromOrg(
  orgId: string,
  ownerId: string,
  colNames: string[]
): Promise<number> {
  let deletedCount = 0;
  for (const colName of colNames) {
    const path = `organizations/${orgId}/${colName}`;
    try {
      const q = query(collection(db, path), where('ownerId', '==', ownerId));
      const snap = await getDocs(q);
      const demoDocs = snap.docs.filter((d) => d.data().isDemo === true);
      for (let i = 0; i < demoDocs.length; i += 400) {
        const chunk = demoDocs.slice(i, i + 400);
        const batch = writeBatch(db);
        chunk.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        deletedCount += chunk.length;
      }
    } catch (error) {
      console.warn(`Error clearing demo docs from ${path}:`, error);
    }
  }
  return deletedCount;
}

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];
  const blob = new Blob(['\ufeff' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
