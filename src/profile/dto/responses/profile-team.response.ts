import { ApiProperty } from '@nestjs/swagger';
import { PublicFileRef } from 'src/storage/common/file-ref';

export class ProfileTeamMemberResponse {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({
    example: 'Frontend Developer',
    nullable: true,
  })
  position: string | null;

  @ApiProperty({ description: 'User avatar', type: () => Object, nullable: true })
  avatar?: PublicFileRef | null;
}
