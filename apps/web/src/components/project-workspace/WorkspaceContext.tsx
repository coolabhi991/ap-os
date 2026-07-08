import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Project } from "../../services/projects";

interface WorkspaceContextValue {
  project: Project;
  activeSection: string;
  setActiveSection: (section: string) => void;
  sharedFilters: Record<string, string>;
  setSharedFilter: (key: string, value: string) => void;
  sharedActions: Record<string, string>;
  setSharedAction: (key: string, value: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

interface WorkspaceProviderProps {
  project: Project;
  children: ReactNode;
}

export function WorkspaceProvider({ project, children }: WorkspaceProviderProps) {
  const [activeSection, setActiveSection] = useState("Overview");
  const [sharedFilters, setSharedFilters] = useState<Record<string, string>>({});
  const [sharedActions, setSharedActions] = useState<Record<string, string>>({});

  const value = useMemo<WorkspaceContextValue>(() => ({
    project,
    activeSection,
    setActiveSection,
    sharedFilters,
    setSharedFilter: (key, value) => setSharedFilters((current) => ({ ...current, [key]: value })),
    sharedActions,
    setSharedAction: (key, value) => setSharedActions((current) => ({ ...current, [key]: value })),
  }), [activeSection, project, sharedActions, sharedFilters]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }

  return context;
}
