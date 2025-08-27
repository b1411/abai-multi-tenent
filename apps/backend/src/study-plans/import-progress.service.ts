import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ReplaySubject, Observable } from 'rxjs';

export type ImportStepStatus = 'pending' | 'active' | 'done' | 'error';

export interface ImportProgressStep {
  key: string;
  label: string;
  status: ImportStepStatus;
}

export interface ImportJobProgress {
  jobId: string;
  steps: ImportProgressStep[];
  percent: number; // upload percent (0-100) during upload phase
  createdAt: string;
  updatedAt: string;
  error?: string;
  result?: {
    studyPlanId: number;
    curriculumPlanId: number;
    totalLessons: number;
  };
  finished: boolean;
}

const DEFAULT_STEPS: Omit<ImportProgressStep, 'status'>[] = [
  { key: 'upload', label: 'Загрузка файла' },
  { key: 'extract', label: 'Извлечение текста' },
  { key: 'ai', label: 'AI парсинг' },
  { key: 'plan', label: 'Создание учебного плана' },
  { key: 'lessons', label: 'Создание уроков' },
  { key: 'curriculum', label: 'Создание КТП' },
  { key: 'finish', label: 'Завершение' }
];

@Injectable()
export class ImportProgressService {
  private jobs = new Map<string, ImportJobProgress>();
  private jobStreams = new Map<string, ReplaySubject<ImportJobProgress>>();

  /**
   * Создание нового джоба
   */
  createJob(): ImportJobProgress {
    const jobId = randomUUID();
    const now = new Date().toISOString();
    const job: ImportJobProgress = {
      jobId,
      steps: DEFAULT_STEPS.map((s, idx) => ({
        ...s,
        status: idx === 0 ? 'active' : 'pending'
      })),
      percent: 0,
      createdAt: now,
      updatedAt: now,
      finished: false
    };
    this.jobs.set(jobId, job);
    const stream = new ReplaySubject<ImportJobProgress>(1);
    stream.next(job);
    this.jobStreams.set(jobId, stream);
    return job;
  }

  /**
   * Подписка для SSE
   */
  subscribe(jobId: string): Observable<ImportJobProgress> {
    const stream = this.jobStreams.get(jobId);
    if (!stream) {
      throw new Error('JOB_NOT_FOUND');
    }
    return stream.asObservable();
  }

  getJob(jobId: string): ImportJobProgress | undefined {
    return this.jobs.get(jobId);
  }

  private emit(jobId: string) {
    const job = this.jobs.get(jobId);
    const stream = this.jobStreams.get(jobId);
    if (job && stream) {
      stream.next({ ...job });
      if (job.finished) {
        // оставляем поток открытым ещё немного — можно опционально закрывать
        stream.complete();
      }
    }
  }

  updateUpload(jobId: string, percent: number) {
    const job = this.jobs.get(jobId);
    if (!job || job.finished) return;
    job.percent = percent;
    job.updatedAt = new Date().toISOString();
    this.emit(jobId);
  }

  setStepStatus(jobId: string, key: string, status: ImportStepStatus) {
    const job = this.jobs.get(jobId);
    if (!job || job.finished) return;
    const step = job.steps.find((s) => s.key === key);
    if (!step) return;

    if (status === 'active') {
      // Завершаем предыдущий active если он другой
      const currentActive = job.steps.find((s) => s.status === 'active');
      if (currentActive && currentActive.key !== key) {
        currentActive.status = 'done';
      }
    }

    step.status = status;

    if (status === 'error') {
      job.finished = true;
    }

    job.updatedAt = new Date().toISOString();
    this.emit(jobId);
  }

  complete(jobId: string, result: ImportJobProgress['result']) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.steps.forEach((s) => {
      if (s.status !== 'done' && s.status !== 'error') s.status = 'done';
    });
    const finish = job.steps.find((s) => s.key === 'finish');
    if (finish) finish.status = 'done';

    job.result = result || undefined;
    job.finished = true;
    job.percent = 100;
    job.updatedAt = new Date().toISOString();
    this.emit(jobId);
  }

  fail(jobId: string, error: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const active = job.steps.find((s) => s.status === 'active') || job.steps.find((s) => s.status === 'pending');
    if (active) active.status = 'error';

    job.error = error;
    job.finished = true;
    job.updatedAt = new Date().toISOString();
    this.emit(jobId);
  }

  cleanup(expireMs = 1000 * 60 * 60) {
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (now - new Date(job.updatedAt).getTime() > expireMs) {
        this.jobs.delete(id);
        const stream = this.jobStreams.get(id);
        if (stream) {
            stream.complete();
            this.jobStreams.delete(id);
        }
      }
    }
  }
}
