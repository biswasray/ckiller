import { useEffect, useMemo, useState } from "react";
import {
  Button,
  CollapsibleSection,
  CopyIcon,
  Header,
  IconButton,
  Label,
  Sidebar,
  SKILL_DRAG_MIME,
  TextInput,
  TrashIcon,
  WorkflowCanvas,
} from "../components";
import { useAppDispatch, useAppSelector, useTheme } from "../store/hooks";
import { fetchSkills } from "../store/skillsSlice";
import {
  addWorkflow,
  displayWorkflow,
  duplicateWorkflow,
  removeWorkflow,
  renameWorkflow,
  selectActiveWorkflow,
  selectWorkflows,
} from "../store/workflowSlice";

export function WorkflowScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { groups, loading, error } = useAppSelector((state) => state.skills);
  const workflows = useAppSelector(selectWorkflows);
  const activeWorkflow = useAppSelector(selectActiveWorkflow);

  const [query, setQuery] = useState("");
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    dispatch(fetchSkills());
  }, [dispatch]);

  // Flatten skills from all groups (local + global) into one searchable list.
  const skills = useMemo(() => {
    const all = groups.flatMap((group) => group.skills);
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      (skill) =>
        skill.name.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q),
    );
  }, [groups, query]);

  // Displayed workflow pinned to the top, then newest first.
  const sortedWorkflows = useMemo(
    () =>
      [...workflows].sort((a, b) => {
        if (a.isDisplayed !== b.isDisplayed) return a.isDisplayed ? -1 : 1;
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [workflows],
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: theme.colors.background,
        color: theme.colors.text,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <Sidebar>
        <CollapsibleSection title="Skills">
          <div style={{ marginTop: theme.spacing.sm }}>
            <TextInput
              type="search"
              value={query}
              onChange={setQuery}
              placeholder="Search skills…"
            />
          </div>

          <div style={{ marginTop: theme.spacing.lg }}>
            {loading && <Label variant="muted">Loading skills…</Label>}
            {error && (
              <Label variant="muted" style={{ color: theme.colors.error }}>
                {error}
              </Label>
            )}
            {!loading && !error && skills.length === 0 && (
              <Label variant="muted">No skills found.</Label>
            )}
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {skills.map((skill) => (
                <li
                  key={skill.name}
                  title={skill.description}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(SKILL_DRAG_MIME, skill.name);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  style={{
                    padding: `${theme.spacing.xs}px 0`,
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.md,
                    cursor: "grab",
                  }}
                >
                  {skill.name}
                </li>
              ))}
            </ul>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Workflows">
          <div style={{ marginTop: theme.spacing.sm }}>
            <Button
              onClick={() => dispatch(addWorkflow())}
              style={{ width: "100%" }}
            >
              + New workflow
            </Button>
          </div>

          <ul
            style={{
              listStyle: "none",
              margin: `${theme.spacing.lg}px 0 0`,
              padding: 0,
            }}
          >
            {sortedWorkflows.map((workflow) => {
              const isActive = workflow.isDisplayed;
              return (
                <li
                  key={workflow.id}
                  onClick={() => dispatch(displayWorkflow(workflow.id))}
                  title={workflow.title || "Unnamed"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: theme.spacing.sm,
                    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                    marginBottom: theme.spacing.xs,
                    borderRadius: theme.borderRadius.sm,
                    cursor: "pointer",
                    background: isActive
                      ? theme.colors.surfaceVariant
                      : "transparent",
                    color: isActive
                      ? theme.colors.text
                      : theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.md,
                    fontWeight: isActive
                      ? theme.typography.fontWeight.semiBold
                      : theme.typography.fontWeight.regular,
                  }}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {workflow.title || "Unnamed"}
                  </span>
                  <div style={{ display: "flex", gap: theme.spacing.xs }}>
                    <IconButton
                      ariaLabel="Copy workflow"
                      size={24}
                      onClick={() => dispatch(duplicateWorkflow(workflow.id))}
                    >
                      <CopyIcon size={14} />
                    </IconButton>
                    <IconButton
                      ariaLabel="Delete workflow"
                      size={24}
                      onClick={() => dispatch(removeWorkflow(workflow.id))}
                    >
                      <TrashIcon size={14} />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        </CollapsibleSection>
      </Sidebar>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Header
          title={activeWorkflow?.title ?? ""}
          onTitleChange={(value) =>
            activeWorkflow &&
            dispatch(renameWorkflow({ id: activeWorkflow.id, title: value }))
          }
          selectActive={selectMode}
          onToggleSelect={() => setSelectMode((v) => !v)}
        />
        <WorkflowCanvas
          selectMode={selectMode}
          onExitSelect={() => setSelectMode(false)}
        />
      </div>
    </div>
  );
}
