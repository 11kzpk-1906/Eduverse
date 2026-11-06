CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email, NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

ALTER POLICY "Teachers insert own classes" ON public.classes WITH CHECK (teacher_id = auth.uid() AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')));
ALTER POLICY "Teachers update own classes" ON public.classes USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid() AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')));
ALTER POLICY "Teachers update own assignments" ON public.assignments USING (teacher_id = auth.uid() AND public.is_class_teacher(class_id, auth.uid())) WITH CHECK (teacher_id = auth.uid() AND public.is_class_teacher(class_id, auth.uid()));
REVOKE INSERT, UPDATE ON public.class_enrollments FROM authenticated;
CREATE OR REPLACE FUNCTION public.join_class_by_code(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _class_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to join a class'; END IF;
  IF NOT public.has_role(auth.uid(), 'student') THEN RAISE EXCEPTION 'Student access required'; END IF;
  IF trim(_code) !~* '^[A-Z0-9]{6}$' THEN RAISE EXCEPTION 'Enter a six-character class code'; END IF;
  SELECT id INTO _class_id FROM public.classes WHERE join_code = upper(trim(_code));
  IF _class_id IS NULL THEN RAISE EXCEPTION 'Invalid class code'; END IF;
  INSERT INTO public.class_enrollments (class_id, student_id) VALUES (_class_id, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN _class_id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.join_class_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_learning_submission()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _points integer; _teacher boolean;
BEGIN
  SELECT points INTO _points FROM public.assignments WHERE id = NEW.assignment_id;
  IF _points IS NULL THEN RAISE EXCEPTION 'Assignment unavailable'; END IF;
  _teacher := public.is_assignment_teacher(NEW.assignment_id, auth.uid());
  IF TG_OP = 'UPDATE' THEN
    IF NEW.assignment_id IS DISTINCT FROM OLD.assignment_id OR NEW.student_id IS DISTINCT FROM OLD.student_id THEN RAISE EXCEPTION 'Submission ownership cannot change'; END IF;
    IF auth.uid() IS NOT NULL AND NOT _teacher THEN
      IF OLD.grade IS NOT NULL THEN RAISE EXCEPTION 'Graded work is read-only'; END IF;
      IF NEW.grade IS DISTINCT FROM OLD.grade OR NEW.feedback IS DISTINCT FROM OLD.feedback OR NEW.graded_at IS DISTINCT FROM OLD.graded_at THEN RAISE EXCEPTION 'Only the class teacher can grade'; END IF;
    ELSIF _teacher AND (NEW.content IS DISTINCT FROM OLD.content OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at) THEN
      RAISE EXCEPTION 'Teachers cannot change student answers';
    END IF;
  ELSIF auth.uid() IS NOT NULL AND (NEW.grade IS NOT NULL OR NEW.feedback IS NOT NULL OR NEW.graded_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Submit answers before grading';
  END IF;
  IF NEW.content IS NULL OR length(trim(NEW.content)) = 0 THEN RAISE EXCEPTION 'Write your submission first'; END IF;
  IF NEW.grade IS NOT NULL AND (NEW.grade < 0 OR NEW.grade > _points) THEN RAISE EXCEPTION 'Grade must be within assignment points'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER validate_learning_submission BEFORE INSERT OR UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.validate_learning_submission();
ALTER POLICY "Students delete own submissions" ON public.submissions USING (student_id = auth.uid() AND grade IS NULL);
ALTER POLICY "Students edit own, teachers grade" ON public.submissions USING ((student_id = auth.uid() AND public.is_enrolled(public.assignment_class_id(assignment_id), auth.uid())) OR public.is_assignment_teacher(assignment_id, auth.uid())) WITH CHECK ((student_id = auth.uid() AND public.is_enrolled(public.assignment_class_id(assignment_id), auth.uid())) OR public.is_assignment_teacher(assignment_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_learning_assignment()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.points <= 0 OR length(trim(NEW.title)) = 0 THEN RAISE EXCEPTION 'A title and positive points are required'; END IF;
  IF TG_OP = 'UPDATE' AND (NEW.class_id IS DISTINCT FROM OLD.class_id OR NEW.teacher_id IS DISTINCT FROM OLD.teacher_id) THEN RAISE EXCEPTION 'Assignment ownership cannot change'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER validate_learning_assignment BEFORE INSERT OR UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.validate_learning_assignment();

CREATE OR REPLACE FUNCTION public.notify_learning_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT a.teacher_id, 'submission', 'New submission: ' || a.title, COALESCE(p.full_name, 'A student') || ' submitted work for review.', '/assignments'
  FROM public.assignments a LEFT JOIN public.profiles p ON p.id = NEW.student_id WHERE a.id = NEW.assignment_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_learning_submission AFTER INSERT ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.notify_learning_submission();
REVOKE EXECUTE ON FUNCTION public.notify_learning_submission(), public.notify_new_assignment(), public.notify_new_announcement(), public.notify_graded_submission(), public.award_xp(uuid, integer), public.on_graded_xp(), public.on_quiz_attempt() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.on_graded_xp()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.grade IS NOT NULL AND OLD.grade IS NULL THEN PERFORM public.award_xp(NEW.student_id, GREATEST(10, NEW.grade)); END IF;
  RETURN NEW;
END; $$;