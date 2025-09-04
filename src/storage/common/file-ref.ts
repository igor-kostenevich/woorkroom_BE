export type FileRef = {
  url: string;
  key: string;
  bucket: string;
  mime?: string;
  size?: number;
  name?: string;
  public?: boolean;
  uploadedAt: string;
};