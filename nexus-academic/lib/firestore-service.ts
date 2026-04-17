import { db } from "@/lib/firebase";
import {
  addDoc as addFirestoreDoc,
  collection,
  deleteDoc as deleteFirestoreDoc,
  doc,
  getDoc as getFirestoreDoc,
  getDocs as getFirestoreDocs,
  onSnapshot,
  query,
  updateDoc as updateFirestoreDoc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type FirestoreDataConverter,
  type QueryConstraint,
} from "firebase/firestore";
import type { FirestoreDate, Project, Task } from "@/lib/types";

const toDate = (value: FirestoreDate): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as unknown as string | number);
};

export const taskConverter: FirestoreDataConverter<Task> = {
  toFirestore(task: Task): DocumentData {
    const { id, ...rest } = task;
    return {
      ...rest,
      deadline: toDate(task.deadline),
      createdAt: toDate(task.createdAt),
      subTasks: task.subTasks ?? [],
    };
  },
  fromFirestore(snapshot, options): Task {
    const data = snapshot.data(options) as Omit<Task, "id">;
    return {
      id: snapshot.id,
      ...data,
      deadline: toDate(data.deadline),
      createdAt: toDate(data.createdAt),
      subTasks: data.subTasks ?? [], // backward compat for pre-subtask tasks
    };
  },
};

export const projectConverter: FirestoreDataConverter<Project> = {
  toFirestore(project: Project): DocumentData {
    const { id, ...rest } = project;
    return {
      ...rest,
      deadline: toDate(project.deadline),
      createdAt: toDate(project.createdAt),
    };
  },
  fromFirestore(snapshot, options): Project {
    const data = snapshot.data(options) as Omit<Project, "id">;
    return {
      id: snapshot.id,
      ...data,
      deadline: toDate(data.deadline),
      createdAt: toDate(data.createdAt),
    };
  },
};

type CollectionOptions<T> = {
  converter?: FirestoreDataConverter<T>;
  queryConstraints?: QueryConstraint[];
};

const getCollectionRef = <T>(
  collectionPath: string,
  options: CollectionOptions<T> = {}
): CollectionReference<T> => {
  const baseRef = collection(db, collectionPath);
  return (options.converter
    ? baseRef.withConverter(options.converter)
    : baseRef) as CollectionReference<T>;
};

export const addDoc = async <T>(collectionPath: string, data: T) => {
  const collectionRef = collection(db, collectionPath) as CollectionReference<T>;
  return addFirestoreDoc(collectionRef, data);
};

export const updateDoc = async <T>(
  collectionPath: string,
  id: string,
  data: Partial<T>
) => {
  const docRef = doc(db, collectionPath, id) as DocumentReference<T>;
  return updateFirestoreDoc(docRef, data);
};

export const deleteDoc = async (collectionPath: string, id: string) => {
  const docRef = doc(db, collectionPath, id);
  return deleteFirestoreDoc(docRef);
};

export const getDoc = async <T>(
  collectionPath: string,
  id: string,
  converter?: FirestoreDataConverter<T>
): Promise<T | null> => {
  const docRef = converter
    ? doc(db, collectionPath, id).withConverter(converter)
    : (doc(db, collectionPath, id) as DocumentReference<T>);
  const snapshot = await getFirestoreDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as T) : null;
};

export const getDocs = async <T>(
  collectionPath: string,
  options: CollectionOptions<T> = {}
): Promise<T[]> => {
  const collectionRef = getCollectionRef<T>(collectionPath, options);
  const q = options.queryConstraints?.length
    ? query(collectionRef, ...options.queryConstraints)
    : collectionRef;
  const snapshot = await getFirestoreDocs(q);
  return snapshot.docs.map((docItem) => docItem.data() as T);
};

export const subscribeToCollection = <T>(
  collectionPath: string,
  options: CollectionOptions<T> = {},
  onData: (data: T[]) => void,
  onError?: (error: Error) => void
) => {
  const collectionRef = getCollectionRef<T>(collectionPath, options);
  const q = options.queryConstraints?.length
    ? query(collectionRef, ...options.queryConstraints)
    : collectionRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((docItem) => docItem.data() as T);
      onData(data);
    },
    (error) => onError?.(error as Error)
  );
};
