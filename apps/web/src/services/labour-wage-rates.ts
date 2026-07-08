import api from "./api";

export interface LabourWageRate {
  id: string;
  companyId: string;
  labourId: string;
  dailyWage: string;
  overtimeRate: string;
  effectiveFrom: string;
  createdAt: string;
}

export interface LabourWageRateFormData {
  dailyWage: number;
  overtimeRate: number;
  effectiveFrom: string;
}

export async function getLabourWageRates(labourId: string): Promise<LabourWageRate[]> {
  const response = await api.get<{ success: boolean; data: LabourWageRate[] }>("/labour-wage-rates", { params: { labourId } });
  return response.data.data;
}

export async function createLabourWageRate(labourId: string, data: LabourWageRateFormData): Promise<LabourWageRate> {
  const response = await api.post<{ success: boolean; data: LabourWageRate }>("/labour-wage-rates", { labourId, ...data });
  return response.data.data;
}
