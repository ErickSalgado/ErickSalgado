export interface FinancialProductDto {
    id: string;
    name: string;
    description: string;
    logo: string;
    date_release: string;
    date_revision: string;
}

export type UpdateFinancialProductDto = Omit<FinancialProductDto, 'id'>;

export interface ProductListResponseDto {
    data: FinancialProductDto[];
}

export interface ProductMutationResponseDto<TData = FinancialProductDto> {
    message: string;
    data: TData;
}

export interface DeleteProductResponseDto {
    message: string;
}