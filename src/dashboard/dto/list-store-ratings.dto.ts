import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const STORE_RATING_SORT_FIELDS = [
  'name',
  'email',
  'rating',
  'createdAt',
] as const;

export type StoreRatingSortField = (typeof STORE_RATING_SORT_FIELDS)[number];

export class ListStoreRatingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsIn(STORE_RATING_SORT_FIELDS)
  sortBy: StoreRatingSortField = 'createdAt';

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC' = 'DESC';
}
