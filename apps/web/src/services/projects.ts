import api from "./api";

export interface Project {
  id: string;
  companyId: string;
  clientId: string | null;
  projectTypeId: string | null;
  name: string;
  code: string | null;
  description: string | null;
  location: string | null;
  manager: string | null;
  status: string;
  contractValue: string; // Decimal serialized as string by Prisma
  progress: number;
  startDate: string | null;
  endDate: string | null;
  client: { id: string; name: string } | null;
  projectType: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: Project[];
}

export interface ProjectFormData {
  name: string;
  code: string;
  clientName: string;
  projectTypeName: string;
  contractValue: string;
  manager: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
  location: string;
}

export interface ProjectListQuery {
  search?: string;
  status?: string;
  clientId?: string;
  projectTypeId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getProjects(query?: ProjectListQuery): Promise<ProjectListResponse> {
  const response = await api.get<ProjectListResponse>("/projects", { params: query });
  return response.data;
}

export async function getProject(id: string): Promise<Project> {
  const response = await api.get<{ success: boolean; data: Project }>(`/projects/${id}`);
  return response.data.data;
}

export async function createProject(data: ProjectFormData): Promise<Project> {
  const response = await api.post<{ success: boolean; data: Project }>("/projects", {
    name: data.name,
    code: data.code || undefined,
    clientName: data.clientName || undefined,
    projectTypeName: data.projectTypeName || undefined,
    contractValue: data.contractValue ? Number(data.contractValue) : 0,
    manager: data.manager || undefined,
    startDate: data.startDate || undefined,
    endDate: data.endDate || undefined,
    status: data.status || "PLANNING",
    description: data.description || undefined,
    location: data.location || undefined,
  });
  return response.data.data;
}

export async function updateProject(id: string, data: ProjectFormData): Promise<Project> {
  const response = await api.put<{ success: boolean; data: Project }>(`/projects/${id}`, {
    name: data.name,
    code: data.code || undefined,
    clientName: data.clientName || undefined,
    projectTypeName: data.projectTypeName || undefined,
    contractValue: data.contractValue ? Number(data.contractValue) : 0,
    manager: data.manager || undefined,
    startDate: data.startDate || undefined,
    endDate: data.endDate || undefined,
    status: data.status || "PLANNING",
    description: data.description || undefined,
    location: data.location || undefined,
  });
  return response.data.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}
