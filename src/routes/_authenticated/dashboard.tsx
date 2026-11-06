import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ClipboardList, CheckCircle2, Percent, Users, Sparkles, FolderOpen } from "lucide-react";
import { useSession, useProfile, useRole } from "@/hooks/useAuth";
import { useAssignments, useClasses } from "@/lib/data";
import { learningProgress, submissionStatus } from "@/lib/learning-loop";
import { pageMeta } from "@/lib/page-meta";
import { PageHeader, StatCard } from "@/components/dashboard-bits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryRecovery } from "@/components/query-recovery";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageMeta("Learning dashboard", "Your classes, assignment reviews, grades and next learning steps."),
  component: Dashboard,
});
function Dashboard() {
  const { user } = useSession();
  const profile = useProfile(user?.id);
  const role = useRole(user?.id);
  const classes = useClasses();
  const assignments = useAssignments();
  const teacher = role.data === "teacher" || role.data === "admin";
  const rows = (assignments.data ?? []).filter(a => !teacher || a.teacher_id === user?.id);
  const progress = learningProgress(rows, teacher ? undefined : user?.id);
  const next = rows.filter(a => teacher ? a.submissions.some(s => s.grade == null) : submissionStatus(a, user?.id).status === "pending");
  const owned = (classes.data ?? []).filter(c => !teacher || c.teacher_id === user?.id);
  if (role.isError || classes.isError || assignments.isError) return <QueryRecovery retry={() => { void role.refetch(); void classes.refetch(); void assignments.refetch(); }} />;
  return <div className="space-y-6">
    <PageHeader title={`Welcome, ${profile.data?.full_name?.split(" ")[0] ?? "learner"}`} subtitle={teacher ? "Your class review queue" : "Your learning progress"} />
    {role.isLoading || classes.isLoading || assignments.isLoading ? <Skeleton className="h-24 w-full" /> : <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Classes" value={owned.length} icon={BookOpen} tone="primary" />
        <StatCard label={teacher ? "To grade" : "Pending assignments"} value={teacher ? progress.toGrade : progress.pending} icon={ClipboardList} tone="warning" />
        <StatCard label={teacher ? "Students enrolled" : "Submitted"} value={teacher ? owned.reduce((n,c)=>n+c.student_count,0) : progress.submitted} icon={teacher ? Users : CheckCircle2} tone="success" />
        <StatCard label="Average grade" value={progress.average == null ? "—" : `${progress.average}%`} icon={Percent} tone="secondary" hint={`${progress.graded} graded submissions`} />
      </div>
      <nav className="flex flex-wrap gap-2">
        <Button asChild><Link to="/classes"><BookOpen className="h-4 w-4" />{teacher ? "Manage classes" : "Join a class"}</Link></Button>
        <Button asChild variant="outline"><Link to="/materials"><FolderOpen className="h-4 w-4" />Materials</Link></Button>
        <Button asChild variant="outline"><Link to="/assignments"><ClipboardList className="h-4 w-4" />Assignments</Link></Button>
        <Button asChild variant="outline"><Link to="/tutor"><Sparkles className="h-4 w-4" />AI Tutor</Link></Button>
      </nav>
      <section className="border-t border-border pt-6">
        <h2 className="mb-4 text-lg font-semibold">{teacher ? "Needs review" : "Next assignments"}</h2>
        {!next.length ? <div className="py-6"><p className="font-medium">{owned.length ? "You’re all caught up" : "No classes yet"}</p><p className="mt-1 text-sm text-muted-foreground">{owned.length ? "New work will appear here." : teacher ? "Create your first class to begin." : "Your teacher’s join code connects you to your coursework."}</p></div> : <ul className="divide-y divide-border">{next.map(a=><li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.class_name} · {teacher ? `${a.submissions.filter(s=>s.grade == null).length} awaiting review` : a.due_date ? `Due ${new Date(a.due_date).toLocaleDateString()}` : "No due date"}</p></div><Button asChild size="sm" variant="outline"><Link to="/assignments">{teacher ? "Review" : "Open"}</Link></Button></li>)}</ul>}
      </section>
      {!teacher && <section className="border-t border-border pt-6"><h2 className="mb-4 text-lg font-semibold">Grades & feedback</h2>{!progress.graded ? <p className="text-sm text-muted-foreground">Your grades will appear after your teacher reviews your work.</p> : rows.flatMap(a=>a.submissions.filter(s=>s.student_id === user?.id && s.grade != null).map(s=><div key={s.id} className="border-b border-border py-3"><div className="flex justify-between gap-3"><span className="font-medium">{a.title}</span><span className="font-semibold text-success">{s.grade}/{a.points}</span></div><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{s.feedback || "No written feedback yet."}</p></div>))}</section>}
    </>}
  </div>;
}
