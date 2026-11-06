import { describe, expect, it } from "vitest";
import { learningProgress, submissionStatus, validGrade, validPoints } from "./learning-loop";
import type { AssignmentWithMeta } from "./data";

const work = (points: number, grade: number | null, student = "student"): AssignmentWithMeta => ({
  id: String(points), class_id: "class", teacher_id: "teacher", title: "Work", description: null,
  due_date: null, points, created_at: "2026-11-01", class_name: "Math", class_subject: "Math",
  submissions: [{ id: String(points), assignment_id: String(points), student_id: student, content: "Answer", grade,
    feedback: null, submitted_at: "2026-11-01", graded_at: grade == null ? null : "2026-11-02" }],
});
describe("teacher → submission → progress", () => {
  it("keeps submitted work awaiting teacher review", () => {
    expect(submissionStatus(work(100, null), "student").status).toBe("submitted");
    expect(learningProgress([work(100, null)]).toGrade).toBe(1);
  });
  it("recognizes zero as a reviewed grade", () => {
    expect(submissionStatus(work(100, 0), "student").status).toBe("graded");
  });
  it("weights actual grades by possible points", () => {
    expect(learningProgress([work(20, 10), work(100, 90)], "student").average).toBe(83);
  });
  it("excludes other students from student progress", () => {
    expect(learningProgress([work(20, 10), work(100, 100, "other")], "student").average).toBe(50);
  });
  it("does not invent progress before grading", () => {
    expect(learningProgress([work(100, null)], "student").average).toBeNull();
    expect(learningProgress([], "student").submitted).toBe(0);
  });
  it("counts absent submissions as pending", () => {
    expect(learningProgress([{...work(100,null), submissions:[]}], "student").pending).toBe(1);
  });
  it("requires positive whole assignment points", () => {
    expect(validPoints("100")).toBe(true);
    for (const value of ["", "0", "-1", "1.5", "bad"]) expect(validPoints(value)).toBe(false);
  });
  it("requires an explicit whole grade within assignment points", () => {
    expect(validGrade("0",100)).toBe(true);
    expect(validGrade("100",100)).toBe(true);
    for (const value of ["", "-1", "101", "1.5"]) expect(validGrade(value,100)).toBe(false);
  });
});