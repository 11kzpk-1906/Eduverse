import type { AssignmentWithMeta } from "./data";

export function submissionStatus(a: AssignmentWithMeta, userId?: string) {
  const sub = a.submissions.find((s) => s.student_id === userId);
  return { status: !sub ? "pending" : sub.grade != null ? "graded" : "submitted", sub } as const;
}

export function learningProgress(assignments: AssignmentWithMeta[], studentId?: string) {
  const rows = assignments.flatMap((a) => a.submissions
    .filter((s) => !studentId || s.student_id === studentId)
    .map((s) => ({ ...s, points: a.points })));
  const graded = rows.filter((s) => s.grade != null);
  const possible = graded.reduce((n, s) => n + s.points, 0);
  const earned = graded.reduce((n, s) => n + (s.grade ?? 0), 0);
  return {
    submitted: rows.length,
    graded: graded.length,
    toGrade: rows.length - graded.length,
    pending: studentId ? assignments.filter((a) => submissionStatus(a, studentId).status === "pending").length : 0,
    average: possible ? Math.round(earned / possible * 100) : null,
  };
}

export function validPoints(value: string) {
  const n = Number(value);
  return value.trim() !== "" && Number.isInteger(n) && n > 0;
}

export function validGrade(value: string, points: number) {
  const n = Number(value);
  return value.trim() !== "" && Number.isInteger(n) && n >= 0 && n <= points;
}