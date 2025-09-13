import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicFileRefDto {
  @ApiProperty({ example: 'http://localhost:9100/crm-files/avatars/.../avatar.png' })
  url!: string;

  @ApiPropertyOptional({ example: 'image/png' })
  mime?: string;

  @ApiPropertyOptional({ example: 154327 })
  size?: number;

  @ApiPropertyOptional({ example: 'avatar.png' })
  name?: string;

  @ApiProperty({ example: '2025-09-08T14:04:50.397Z' })
  uploadedAt!: string;
}

export class AvatarDto {
  @ApiPropertyOptional({ example: 'preset-blue-01', description: 'Ідентифікатор пресету (коли не файл)' })
  name?: string;

  @ApiPropertyOptional({ example: 'http://localhost:9100/crm-files/projects/.../avatar.png' })
  url?: string;

  @ApiPropertyOptional({ example: 'image/png' })
  mime?: string;

  @ApiPropertyOptional({ example: 154327 })
  size?: number;

  @ApiPropertyOptional({ example: '2025-09-13T14:04:50.397Z' })
  uploadedAt?: string;
}
