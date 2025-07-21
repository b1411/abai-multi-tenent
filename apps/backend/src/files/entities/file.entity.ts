export class FileEntity {
  id: number;
  name: string;
  originalName: string;
  url: string;
  type: string;
  size: number;
  category: string;
  uploadedBy?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
