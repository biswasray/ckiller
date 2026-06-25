import { useEffect, useMemo, useState } from "react";
import {
  CollapsibleSection,
  Header,
  Label,
  Sidebar,
  SKILL_DRAG_MIME,
  TextInput,
  WorkflowCanvas,
} from "../components";
import { useAppDispatch, useAppSelector, useTheme } from "../store/hooks";
import { fetchSkills } from "../store/skillsSlice";

export function WorkflowScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { groups, loading, error } = useAppSelector((state) => state.skills);

  const [title, setTitle] = useState("Unnamed");
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
            {loading && (
              <Label variant="muted">Loading skills…</Label>
            )}
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
          title={title}
          onTitleChange={setTitle}
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
