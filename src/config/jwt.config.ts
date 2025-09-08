import { type JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export async function getJwtConfig(configService: ConfigService): Promise<JwtModuleOptions> {
  return {
    secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    signOptions: {
      algorithm: "HS256"
    },
    verifyOptions: {
      algorithms: ["HS256"],
      ignoreExpiration: false,
    }
  }
}