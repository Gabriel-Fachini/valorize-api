import { User } from '../entities/User'

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByAuth0Id(auth0Id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<User>
  delete(id: string): Promise<void>
  findAll(limit?: number, offset?: number): Promise<User[]>
  existsByEmail(email: string): Promise<boolean>
  existsByAuth0Id(auth0Id: string): Promise<boolean>
} 