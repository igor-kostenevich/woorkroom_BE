import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PublicFileRefDto } from '../../../storage/common/public-file-ref.dto';

export class ProjectUserBriefDto {
  @ApiProperty() id!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty({ nullable: true }) lastName!: string | null;

  @ApiProperty({ readOnly: true })
  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName ?? ''}`.trim();
  }

  @ApiPropertyOptional({ type: () => PublicFileRefDto, nullable: true })
  avatar?: PublicFileRefDto | null;
}
