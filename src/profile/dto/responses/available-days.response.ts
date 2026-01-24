import { ApiProperty } from '@nestjs/swagger';

export class VacationTypeDaysInfo {
  @ApiProperty({ description: 'Total limit for this type', example: 20 })
  limit!: number;

  @ApiProperty({ description: 'Used days for this type', example: 5 })
  used!: number;

  @ApiProperty({ description: 'Available days for this type', example: 15 })
  available!: number;
}

export class AvailableDaysResponse {
  @ApiProperty({ description: 'Vacation days information', type: VacationTypeDaysInfo })
  VACATION!: VacationTypeDaysInfo;

  @ApiProperty({ description: 'Sick leave days information', type: VacationTypeDaysInfo })
  SICK!: VacationTypeDaysInfo;

  @ApiProperty({ description: 'Remote work days information', type: VacationTypeDaysInfo })
  REMOTE!: VacationTypeDaysInfo;
}

