
export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  description: string | null;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}
