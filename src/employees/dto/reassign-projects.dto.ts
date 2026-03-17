import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ReassignProjectsDto {
  @ApiProperty({
    example: 'f7c5b2f3-8a4b-4b9c-9f1a-1a2b3c4d5e6f',
    description: 'ID of the user who will become the new owner of all projects',
  })
  @IsString()
  @IsNotEmpty()
  newOwnerId!: string;
}
