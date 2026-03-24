import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

