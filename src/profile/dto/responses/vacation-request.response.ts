import { ApiProperty } from '@nestjs/swagger';
import { VacationType, VacationStatus } from '@prisma/client';

export class VacationRequestResponse {
  @ApiProperty({ description: 'Request ID', example: 'f7c5b2f3-8a4b-4b9c-9f1a-1a2b3c4d5e6f' })
  id!: string;

  @ApiProperty({ description: 'User ID', example: 'f7c5b2f3-8a4b-4b9c-9f1a-1a2b3c4d5e6f' })
  userId!: string;

  @ApiProperty({
    description: 'Request type',
    enum: VacationType,
    example: VacationType.VACATION,
  })
  type!: VacationType;

  @ApiProperty({
    description: 'Request status',
    enum: VacationStatus,
    example: VacationStatus.PENDING,
  })
  status!: VacationStatus;

  @ApiProperty({
    description: 'Start date',
    example: '2025-02-01T00:00:00.000Z',
    type: Date,
  })
  startDate!: Date;

  @ApiProperty({
    description: 'End date',
    example: '2025-02-05T00:00:00.000Z',
    type: Date,
  })
  endDate!: Date;

  @ApiProperty({
    description: 'Duration in days',
    example: 5,
  })
  durationDays!: number;

  @ApiProperty({
    description: 'Created at',
    example: '2025-01-24T17:00:00.000Z',
    type: Date,
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2025-01-24T17:00:00.000Z',
    type: Date,
  })
  updatedAt!: Date;
}

