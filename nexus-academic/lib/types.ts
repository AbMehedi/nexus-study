export interface Task {
  id: string;
  title: string;
  courseCode: string;
  deadline: Date;
  type: 'EXAM' | 'ASSIGNMENT' | 'PROJECT' | 'PRESENTATION';
  importance: number;
  priority: number;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  location?: string;
  weightage?: number;
  userId: string;
  createdAt: Date;
}

export interface SubTask {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

export interface Project {
  id: string;
  title: string;
  courseCode: string;
  deadline: Date;
  phase: 'REQUIREMENT' | 'IMPLEMENTATION' | 'DOCUMENTATION' | 'SUBMISSION';
  subTasks: SubTask[];
  repoLink?: string;
  docsLink?: string;
  userId: string;
  createdAt: Date;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  freeBlocks: { start: string; end: string }[]; // e.g. [{ start: '09:00', end: '11:00' }]
  userId: string;
}

export interface Sprint {
  id: string;
  taskId: string;
  title: string;
  startTime: Date;
  durationMinutes: number;
}
