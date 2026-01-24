import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, ValidateIf } from 'class-validator';

export class UpdateVacationRequestDto {
  @ApiPropertyOptional({
    description: 'Start date',
    example: '2025-02-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @ValidateIf((o) => o.startDate !== undefined || o.endDate !== undefined)
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date',
    example: '2025-02-05T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @ValidateIf((o) => o.startDate !== undefined || o.endDate !== undefined)
  @IsDateString()
  @IsOptional()
  endDate?: string;

  hasAtLeastOneField() {
    return this.startDate !== undefined || this.endDate !== undefined;
  }
}

