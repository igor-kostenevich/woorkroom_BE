import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsDateString, IsNotEmpty } from 'class-validator';
import { VacationType } from '@prisma/client';

export class CreateVacationRequestDto {
  @ApiProperty({
    description: 'Request type',
    enum: VacationType,
    example: VacationType.VACATION,
  })
  @IsEnum(VacationType)
  @IsNotEmpty()
  type!: VacationType;

  @ApiProperty({
    description: 'Start date',
    example: '2025-02-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({
    description: 'End date',
    example: '2025-02-05T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate!: string;
}

