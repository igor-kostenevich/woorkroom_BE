import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function getSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('API documentation for the E-commerce application')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build()
}