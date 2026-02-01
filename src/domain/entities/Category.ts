
export interface Category {
  id: number;
  name: string;
  parentId?: number;
  description?: string;
  icon: string;
  color: string;
  createdAt?: Date;
  updatedAt?: Date;
}
