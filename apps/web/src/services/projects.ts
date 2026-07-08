export interface Project {
  id: number;
  name: string;
  code: string;
  client: string;
  projectType: string;
  budget: string;
  manager: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
}

const STORAGE_KEY = "ap-os-projects";

const defaultProjects: Project[] = [
  {
    id: 1,
    name: "Water Supply Phase 3",
    code: "WSP-001",
    client: "NMC",
    projectType: "Water Supply",
    budget: "27",
    manager: "Abhijit Patil",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "Running",
    description: "Water Supply Project",
  },
  {
    id: 2,
    name: "Smart City Road",
    code: "SCR-002",
    client: "PWD",
    projectType: "Road",
    budget: "14",
    manager: "Rahul Sharma",
    startDate: "2026-02-01",
    endDate: "2026-10-30",
    status: "Planning",
    description: "Road Construction",
  },
];

function loadProjects(): Project[] {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaultProjects)
    );
    return defaultProjects;
  }

  return JSON.parse(data);
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(projects)
  );
}

export function getProjects() {
  return loadProjects();
}

export function getProject(id: number) {
  return loadProjects().find((p) => p.id === id);
}

export function createProject(project: Omit<Project, "id">) {
  const projects = loadProjects();

  projects.push({
    id: Date.now(),
    ...project,
  });

  saveProjects(projects);
}

export function updateProject(
  id: number,
  data: Omit<Project, "id">
) {
  const projects = loadProjects().map((p) =>
    p.id === id ? { id, ...data } : p
  );

  saveProjects(projects);
}

export function deleteProject(id: number) {
  const projects = loadProjects().filter(
    (p) => p.id !== id
  );

  saveProjects(projects);
}