import { randomUUID } from 'crypto'
import { prisma } from '@/lib/database'

export interface RoleProps {
  id?: string
  name: string
  description?: string
  companyId: string
  createdAt?: Date
  updatedAt?: Date
}

export class Role {
  private _id: string
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(
    private _name: string,
    private _companyId: string,
    private _description?: string,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this._id = id ?? randomUUID()
    this._createdAt = createdAt ?? new Date()
    this._updatedAt = updatedAt ?? new Date()
  }

  static create(props: RoleProps): Role {
    const { name, companyId, description, id, createdAt, updatedAt } = props
    if (!name?.trim()) {
      throw new Error('Role name is required')
    }
    if (!companyId?.trim()) {
      throw new Error('Company ID is required')
    }
    return new Role(name.trim(), companyId.trim(), description, id, createdAt, updatedAt)
  }

  get id(): string { return this._id }
  get name(): string { return this._name }
  get companyId(): string { return this._companyId }
  get description(): string | undefined { return this._description }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      companyId: this._companyId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }

  static async findById(id: string): Promise<Role | null> {
    const role = await prisma.role.findUnique({ where: { id } })
    return role ? Role.create(role) : null
  }
}

export interface PermissionProps {
  id?: string
  name: string
  description?: string
  createdAt?: Date
  updatedAt?: Date
}

export class Permission {
  private _id: string
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(
    private _name: string,
    private _description?: string,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this._id = id ?? randomUUID()
    this._createdAt = createdAt ?? new Date()
    this._updatedAt = updatedAt ?? new Date()
  }

  static create(props: PermissionProps): Permission {
    const { name, description, id, createdAt, updatedAt } = props
    if (!name?.trim()) {
      throw new Error('Permission name is required')
    }
    return new Permission(name.trim(), description, id, createdAt, updatedAt)
  }

  get id(): string { return this._id }
  get name(): string { return this._name }
  get description(): string | undefined { return this._description }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }

  static async findByName(name: string): Promise<Permission | null> {
    const permission = await prisma.permission.findUnique({ where: { name } })
    return permission ? Permission.create(permission) : null
  }
}
