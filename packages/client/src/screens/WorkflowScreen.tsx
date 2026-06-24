import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CollapsibleSection,
  Header,
  Label,
  Sidebar,
  TextInput,
} from "../components";
import { useAppDispatch, useAppSelector, useTheme } from "../store/hooks";
import { fetchSkills } from "../store/skillsSlice";

export function WorkflowScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { groups, loading, error } = useAppSelector((state) => state.skills);

  const [title, setTitle] = useState("Unnamed");
  const [query, setQuery] = useState("");

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
                  style={{
                    padding: `${theme.spacing.xs}px 0`,
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.md,
                    cursor: "default",
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
        <Header title={title} onTitleChange={setTitle} />

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: theme.spacing.xxl,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: theme.spacing.xl,
            }}
          >
            {skills.map((skill) => (
              <Card key={skill.name} interactive>
                <Label>{skill.name}</Label>
                <p
                  style={{
                    margin: `${theme.spacing.sm}px 0 0`,
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                    lineHeight: theme.typography.lineHeight.normal,
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {skill.description}
                </p>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
