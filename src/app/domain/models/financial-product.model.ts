export interface FinancialProduct {
  id: string;
  name: string;
  description: string;
  logo: string;
  releaseDate: string;
  revisionDate: string;
}

export type UpdateFinancialProductPayload = Omit<FinancialProduct, 'id'>;