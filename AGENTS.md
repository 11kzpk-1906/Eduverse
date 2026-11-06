<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->


## Learning loop architecture
- Public signup always provisions a student; teacher/admin grants require trusted operator approval, because signup metadata is user-controlled.
- Database triggers enforce immutable submission ownership and teacher-only grading; client validation is only user feedback.
- Dashboard and analytics derive progress from visible assignments and submissions through shared pure learning-loop helpers; never show invented metrics.
- AI tutor uses the AI Gateway SDK inside authenticated server functions; generated model declarations must remain in source.
- Unit tests run with Vitest; database regression tests use an explicit test connection and roll back fixtures.
