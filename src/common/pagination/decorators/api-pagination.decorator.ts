import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export const ApiPagination = () =>
  applyDecorators(
    ApiQuery({ name: 'page', required: false, schema: { type: 'integer', minimum: 1, default: 1 }}),
    ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 }}),
    ApiQuery({ name: 'search', required: false, schema: { type: 'string' }}),
  );
