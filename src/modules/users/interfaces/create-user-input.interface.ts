import type { Role } from '@prisma/client';

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: Role;
}
