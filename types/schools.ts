// types/school.ts

export interface School {
  id: string;
  name: string;
  slug: string;
  motto?: string | null;
  address?: string | null;
  contact?: string | null;
  contact2?: string | null;
  contact3?: string | null;
  email?: string | null;
  email2?: string | null;
  website?: string | null;
  isActive: boolean;
  admin: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  _count: {
    students: number;
    teachers: number;
    classTemplates: number;
    parents: number;
    academicYears: number;
    streams?: number;
    subjects?: number;
  };
  createdAt: Date;
}

export interface SchoolFormData {
  name: string;
  slug: string;
  motto?: string;      // optional as in Prisma model
  address?: string;    // optional
  contact?: string;    // optional
  contact2?: string;   // optional
  contact3?: string;   // optional
  email?: string;      // optional
  email2?: string;     // optional
  website?: string;    // optional
  logo?: string | null; // optional
  isActive: boolean;    // required
}
