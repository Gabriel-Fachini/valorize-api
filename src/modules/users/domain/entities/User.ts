import { BaseEntity } from '@shared/domain/entities/BaseEntity'

export interface UserProps {
  id?: string
  auth0Id: string
  email: string
  name: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export class User extends BaseEntity {
  private constructor(
    private readonly _auth0Id: string,
    private readonly _email: string,
    private _name: string,
    private _isActive: boolean = true,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt)
  }

  // Factory method to create a new user
  public static create(props: UserProps): User {
    const { auth0Id, email, name, isActive = true, id, createdAt, updatedAt } = props

    if (!auth0Id?.trim()) {
      throw new Error('Auth0 ID is required')
    }

    if (!email?.trim()) {
      throw new Error('Email is required')
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format')
    }

    if (!name?.trim()) {
      throw new Error('Name is required')
    }

    if (name.length < 2 || name.length > 100) {
      throw new Error('Name must be between 2 and 100 characters')
    }

    return new User(
      auth0Id.trim(),
      email.trim().toLowerCase(),
      name.trim(),
      isActive,
      id,
      createdAt,
      updatedAt,
    )
  }

  // Getters
  public get auth0Id(): string {
    return this._auth0Id
  }

  public get email(): string {
    return this._email
  }

  public get name(): string {
    return this._name
  }

  public get isActive(): boolean {
    return this._isActive
  }

  // Business methods
  public updateName(newName: string): void {
    if (!newName?.trim()) {
      throw new Error('Name is required')
    }

    if (newName.length < 2 || newName.length > 100) {
      throw new Error('Name must be between 2 and 100 characters')
    }

    this._name = newName.trim()
    this.touch() // Update the updatedAt timestamp
  }

  public deactivate(): void {
    if (!this._isActive) {
      throw new Error('User is already inactive')
    }
    
    this._isActive = false
    this.touch()
  }

  public activate(): void {
    if (this._isActive) {
      throw new Error('User is already active')
    }
    
    this._isActive = true
    this.touch()
  }

  // Utility methods
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  public equals(other: User): boolean {
    return this.id === other.id && this._auth0Id === other._auth0Id
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      auth0Id: this._auth0Id,
      email: this._email,
      name: this._name,
      isActive: this._isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
} 