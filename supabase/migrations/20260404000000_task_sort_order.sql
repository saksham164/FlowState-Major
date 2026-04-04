-- ============================================================
-- FlowState - Phase 10 Task Ordering
-- Adds persistent manual ordering for task drag-and-drop.
-- ============================================================

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

WITH ordered_tasks AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY
        CASE WHEN status = 'completed' THEN 1 ELSE 0 END,
        created_at ASC
    ) AS row_num
  FROM public.tasks
)
UPDATE public.tasks AS tasks
SET sort_order = ordered_tasks.row_num
FROM ordered_tasks
WHERE tasks.id = ordered_tasks.id
  AND tasks.sort_order IS NULL;

ALTER TABLE public.tasks
ALTER COLUMN sort_order SET DEFAULT 0;
