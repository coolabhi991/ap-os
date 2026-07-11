import api from "./api";

export interface ProjectContractInfo {
  workOrderNumber: string;
  workOrderDate: string;
  agreementNumber: string;
  agreementDate: string;
  tenderNumber: string;
  department: string;
  division: string;
  subDivision: string;
  clientEngineer: string;
  contractValue: string;
  estimateAmount: string;
  workStartDate: string;
  completionDate: string;
  defectLiabilityPeriod: string;
  securityDepositPercent: string;
  performanceGuaranteePercent: string;
  gstPercent: string;
  updatedAt: string;
}

export interface ProjectContractInfoFormData {
  workOrderNumber?: string;
  workOrderDate?: string;
  agreementNumber?: string;
  agreementDate?: string;
  tenderNumber?: string;
  department?: string;
  division?: string;
  subDivision?: string;
  clientEngineer?: string;
  contractValue?: number;
  estimateAmount?: number;
  workStartDate?: string;
  completionDate?: string;
  defectLiabilityPeriod?: string;
  securityDepositPercent?: number;
  performanceGuaranteePercent?: number;
  gstPercent?: number;
}

export async function getProjectContractInfo(projectId: string): Promise<ProjectContractInfo> {
  const response = await api.get<{ success: boolean; data: ProjectContractInfo }>(`/projects/${projectId}/contract-info`);
  return response.data.data;
}

export async function saveProjectContractInfo(projectId: string, data: ProjectContractInfoFormData): Promise<ProjectContractInfo> {
  const response = await api.put<{ success: boolean; data: ProjectContractInfo }>(`/projects/${projectId}/contract-info`, data);
  return response.data.data;
}
