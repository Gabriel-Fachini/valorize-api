import { BaseEntity } from '@shared/domain/entities/BaseEntity'

export interface RoleProps {
  id?: string
  name: string
  description?: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export class Role extends BaseEntity {
  private constructor(
    private readonly _name: string,
    private readonly _description?: string,
    private _isActive: boolean = true,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt)
  }

  // Factory method to create a new role
  public static create(props: RoleProps): Role {
    const { name, description, isActive = true, id, createdAt, updatedAt } = props

    if (!name?.trim()) {
      throw new Error('Role name is required')
    }

    if (name.length < 2 || name.length > 50) {
      throw new Error('Role name must be between 2 and 50 characters')
    }

    // Validate role name format (alphanumeric, underscore, dash)
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error('Role name can only contain letters, numbers, underscores, and dashes')
    }

    if (description && description.length > 255) {
      throw new Error('Role description cannot exceed 255 characters')
    }

    return new Role(
      name.trim().toLowerCase(),
      description?.trim(),
      isActive,
      id,
      createdAt,
      updatedAt,
    )
  }

  // Getters
  public get name(): string {
    return this._name
  }

  public get description(): string | undefined {
    return this._description
  }

  public get isActive(): boolean {
    return this._isActive
  }

  // Business methods
  public activate(): void {
    if (this._isActive) {
      throw new Error('Role is already active')
    }
    
    this._isActive = true
    this.touch()
  }

  public deactivate(): void {
    if (!this._isActive) {
      throw new Error('Role is already inactive')
    }
    
    this._isActive = false
    this.touch()
  }

  public equals(other: Role): boolean {
    return this.id === other.id && this._name === other._name
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this._name,
      description: this._description,
      isActive: this._isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}