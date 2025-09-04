import { Role } from '../entities/Role'

export interface RoleRepository {
  create(role: Role): Promise<Role>
  findById(id: string): Promise<Role | null>
  findByName(name: string): Promise<Role | null>
  findAll(): Promise<Role[]>
  findActive(): Promise<Role[]>
  update(role: Role): Promise<Role>
  delete(id: string): Promise<void>
}