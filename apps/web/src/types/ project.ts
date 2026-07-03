export interface Project {
  id: number;

  code: string;

  name: string;

  clientId: number;

  client: string;

  location: string;

  status:
    | "Planning"
    | "In Progress"
    | "Completed"
    | "On Hold";

  startDate: string;

  endDate: string;

  budget: number;

  description: string;

  createdAt: string;
}