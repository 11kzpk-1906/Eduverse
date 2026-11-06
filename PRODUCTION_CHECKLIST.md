# EduVerse release checklist

## Required release gates
- Run `bunx vitest run` and ensure the Lovable preview reports a clean build.
- Configure GitHub Actions secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the CI build. These are public application configuration, not privileged keys.
- Verify email confirmation and OAuth provider settings by reading hosted auth settings. Do not infer them from source.
- New signups must receive only student access, even if altered metadata requests teacher/admin.
- Provision teacher access through a trusted operator; never public signup metadata.
- Review existing elevated accounts before launch; existing roles were not silently revoked.
- Keep the materials bucket private and verify both enrolled student access and nonmember denial.
- As a teacher, create a class; as a student, join with the code, open the teacher PDF, submit an answer.
- As the teacher, review and grade; as the student, read the grade and feedback after refresh and see real dashboard progress.
- Verify teacher submission and student grade notifications, including recipient isolation.
- Verify that students cannot edit grades or graded answers and teachers cannot alter student answers.
- Ask the AI tutor a question and exercise its recoverable failure state. Check available AI credits.
- Check desktop and narrow layouts, auth refresh, sign-out, empty states and retry states.

## Deployment
Database migrations apply immediately. App code and server functions reach the published site only after Publish → Publish changes.
This task does not publish automatically. After publishing, repeat the core flow on the published site with authorized test accounts.
Record the deployment date, verification results and any rollback decision; restore a previous app snapshot only if compatible with additive database changes.

## Scope
Assignment submissions are text answers. Teachers can upload PDFs and other class resources. File-based student submissions and attendance are not implemented by this core-loop task.