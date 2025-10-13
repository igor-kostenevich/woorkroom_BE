import type { Express } from 'express';

declare global {
  namespace Express {
    export interface Multer {
      File: Express.Multer["File"];
    }
  }
}
export {};
