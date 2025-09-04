import { BaseEntity } from '@shared/domain/entities/BaseEntity'

export interface PermissionProps {
  id?: string
  name: string
  resource: string
  action: string
  description?: string
  createdAt?: Date
  updatedAt?: Date
}

export class Permission extends BaseEntity {
  private constructor(
    private readonly _name: string,
    private readonly _resource: string,
    private readonly _action: string,
    private readonly _description?: string,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt)
  }

  // Factory method to create a new permission
  public static create(props: PermissionProps): Permission {
    const { name, resource, action, description, id, createdAt, updatedAt } = props

    if (!name?.trim()) {
      throw new Error('Permission name is required')
    }

    if (!resource?.trim()) {
      throw new Error('Permission resource is required')
    }

    if (!action?.trim()) {
      throw new Error('Permission action is required')
    }

    // Validate name format
    if (name.length < 2 || name.length > 100) {
      throw new Error('Permission name must be between 2 and 100 characters')
    }

    // Validate resource format (alphanumeric, underscore, dash)
    if (!/^[a-zA-Z0-9_-]+$/.test(resource)) {
      throw new Error('Resource can only contain letters, numbers, underscores, and dashes')
    }

    // Validate action format (alphanumeric, underscore, dash)
    if (!/^[a-zA-Z0-9_-]+$/.test(action)) {
      throw new Error('Action can only contain letters, numbers, underscores, and dashes')
    }

    if (description && description.length > 255) {
      throw new Error('Permission description cannot exceed 255 characters')
    }

    return new Permission(
      name.trim(),
      resource.trim().toLowerCase(),
      action.trim().toLowerCase(),
      description?.trim(),
      id,
      createdAt,
      updatedAt,
    )
  }

  // Factory method to create from resource:action format
  public static createFromResourceAction(
    resource: string,
    action: string,
    description?: string,
  ): Permission {
    const name = `${resource}:${action}`
    return Permission.create({
      name,
      resource,
      action,
      description,
    })
  }

  // Getters
  public get name(): string {
    return this._name
  }

  public get resource(): string {
    return this._resource
  }

  public get action(): string {
    return this._action
  }

  public get description(): string | undefined {
    return this._description
  }

  // Business methods
  public matches(resource: string, action: string): boolean {
    return this._resource === resource.toLowerCase() && this._action === action.toLowerCase()
  }

  public matchesName(permissionName: string): boolean {
    return this._name === permissionName
  }

  public equals(other: Permission): boolean {
    return (
      this.id === other.id ||
      (this._resource === other._resource && this._action === other._action)
    )
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this._name,
      resource: this._resource,
      action: this._action,
      description: this._description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}