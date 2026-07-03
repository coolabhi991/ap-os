export interface Project {
  id: number;
  name: string;
  code: string;

  clientId: number;
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

    clientId: 1,
    client: "Nashik Municipal Corporation",

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

    clientId: 2,
    client: "PWD Maharashtra",

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

export function getProjects(): Project[] {
  return loadProjects();
}

export function getProject(
  id: number
): Project | undefined {
  return loadProjects().find((p) => p.id === id);
}

export function createProject(
  project: Omit<Project, "id">
) {
  const projects = loadProjects();

  const newProject: Project = {
    id: Date.now(),
    ...project,
  };

  projects.push(newProject);

  saveProjects(projects);

  return newProject;
}

export function updateProject(
  id: number,
  data: Omit<Project, "id">
) {
  const projects = loadProjects().map((project) =>
    project.id === id
      ? {
          id,
          ...data,
        }
      : project
  );

  saveProjects(projects);
}

export function deleteProject(id: number) {
  const projects = loadProjects().filter(
    (project) => project.id !== id
  );

  saveProjects(projects);
}

export function getProjectsByClient(
  clientId: number
): Project[] {
  return loadProjects().filter(
    (project) => project.clientId === clientId
  );
}