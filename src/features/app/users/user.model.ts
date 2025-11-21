import { randomUUID } from 'crypto'
import { prisma } from '@/lib/database'

export interface UserProps {
  id?: string
  authUserId: string
  email: string
  name: string
  companyId: string
  avatar?: string
  isActive?: boolean
  jobTitle?: { name: string } | null
  department?: { name: string } | null
  createdAt?: Date
  updatedAt?: Date
}

export class User {
  private _id: string
  private _createdAt: Date
  private _updatedAt: Date
  private _jobTitle?: { name: string } | null
  private _department?: { name: string } | null

  private constructor(
    private readonly _authUserId: string,
    private readonly _email: string,
    private _name: string,
    private _companyId: string,
    private _avatar?: string,
    private _isActive: boolean = true,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
    jobTitle?: { name: string } | null,
    department?: { name: string } | null,
  ) {
    this._id = id ?? randomUUID()
    this._createdAt = createdAt ?? new Date()
    this._updatedAt = updatedAt ?? new Date()
    this._jobTitle = jobTitle
    this._department = department
  }

  // Factory method to create a new user
  public static create(props: UserProps): User {
    const { authUserId, email, name, companyId, avatar, isActive = true, id, createdAt, updatedAt } = props

    if (!authUserId?.trim()) {
      throw new Error('Auth User ID is required')
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

    if (!companyId?.trim()) {
      throw new Error('Company ID is required')
    }

    return new User(
      authUserId.trim(),
      email.trim().toLowerCase(),
      name.trim(),
      companyId.trim(),
      avatar,
      isActive,
      id,
      createdAt,
      updatedAt,
    )
  }

  // Getters
  public get id(): string {
    return this._id
  }

  public get authUserId(): string {
    return this._authUserId
  }

  /**
   * Deprecated: Use authUserId instead
   * Kept for backward compatibility during migration
   */
  public get auth0Id(): string {
    return this._authUserId
  }

  public get email(): string {
    return this._email
  }

  public get companyId(): string {
    return this._companyId
  }

  public get name(): string {
    return this._name
  }

  public get avatar(): string | undefined {
    return this._avatar
  }

  public get isActive(): boolean {
    return this._isActive
  }

  public get createdAt(): Date {
    return this._createdAt
  }

  public get updatedAt(): Date {
    return this._updatedAt
  }

  public get jobTitle(): string | null {
    return this._jobTitle?.name ?? null
  }

  public get department(): string | null {
    return this._department?.name ?? null
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
    this.touch()
  }

  public updateAvatar(avatarUrl?: string): void {
    // Avatar is optional, so empty string or undefined is valid
    if (avatarUrl === null) {
      throw new Error('Avatar cannot be null, use undefined or empty string to remove')
    }

    // If avatar is provided, validate it's a valid URL format
    if (avatarUrl?.trim()) {
      const trimmedUrl = avatarUrl.trim()
      
      // Basic URL validation
      if (!this.isValidUrl(trimmedUrl)) {
        throw new Error('Invalid URL format for avatar')
      }

      // Check if it's an http or https URL
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        throw new Error('Avatar URL must start with http:// or https://')
      }

      this._avatar = trimmedUrl
    } else {
      // Remove avatar if empty string or undefined
      this._avatar = undefined
    }
    
    this.touch()
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

  private touch(): void {
    this._updatedAt = new Date()
  }

  // Utility methods
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  public equals(other: User): boolean {
    return this.id === other.id && this._authUserId === other._authUserId
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      authUserId: this._authUserId,
      email: this._email,
      name: this._name,
      avatar: this._avatar,
      isActive: this._isActive,
      companyId: this._companyId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      jobTitle: this._jobTitle ?? null,
      department: this._department ?? null,
    }
  }

  // Static repository methods (consolidating repository functionality)
  public static async findById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          authUserId: true,
          email: true,
          name: true,
          companyId: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          jobTitle: { select: { name: true } },
          department: { select: { name: true } },
        },
      })

      return user ? this.toDomainEntity(user) : null
    } catch (error) {
      throw new Error(`Failed to find user by id: ${error}`)
    }
  }

  public static async findByAuthUserId(authUserId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { authUserId },
        select: {
          id: true,
          authUserId: true,
          email: true,
          name: true,
          companyId: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          jobTitle: { select: { name: true } },
          department: { select: { name: true } },
        },
      })

      return user ? this.toDomainEntity(user) : null
    } catch (error) {
      throw new Error(`Failed to find user by authUserId: ${error}`)
    }
  }


  public static async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          authUserId: true,
          email: true,
          name: true,
          companyId: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          jobTitle: { select: { name: true } },
          department: { select: { name: true } },
        },
      })

      return user ? this.toDomainEntity(user) : null
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error}`)
    }
  }

  public static async findAll(limit = 50, offset = 0): Promise<User[]> {
    try {
      const users = await prisma.user.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          authUserId: true,
          email: true,
          name: true,
          companyId: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          jobTitle: { select: { name: true } },
          department: { select: { name: true } },
        },
      })

      return users.map(user => this.toDomainEntity(user))
    } catch (error) {
      throw new Error(`Failed to find all users: ${error}`)
    }
  }

  public static async existsByEmail(email: string): Promise<boolean> {
    try {
      const count = await prisma.user.count({
        where: { email: email.toLowerCase() },
      })
      return count > 0
    } catch (error) {
      throw new Error(`Failed to check if user exists by email: ${error}`)
    }
  }

  public static async existsByAuthUserId(authUserId: string): Promise<boolean> {
    try {
      const count = await prisma.user.count({
        where: { authUserId },
      })
      return count > 0
    } catch (error) {
      throw new Error(`Failed to check if user exists by authUserId: ${error}`)
    }
  }

  /**
   * Deprecated: Use existsByAuthUserId instead
   * Kept for backward compatibility during migration
   */
  public static async existsByAuth0Id(authUserId: string): Promise<boolean> {
    return this.existsByAuthUserId(authUserId)
  }

  // Instance method to save current user
  public async save(): Promise<User> {
    try {
      const userData = {
        authUserId: this._authUserId,
        email: this._email,
        name: this._name,
        companyId: this._companyId,
        avatar: this._avatar,
        isActive: this._isActive,
        updatedAt: new Date(),
      }

      const savedUser = await prisma.user.upsert({
        where: { id: this._id },
        create: {
          id: this._id,
          ...userData,
          createdAt: this._createdAt,
        },
        update: userData,
      })

      return User.toDomainEntity(savedUser)
    } catch (error) {
      throw new Error(`Failed to save user: ${error}`)
    }
  }

  // Instance method to delete current user
  public async delete(): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: this._id },
      })
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`)
    }
  }

  private static toDomainEntity(prismaUser: any): User {
    return User.create({
      id: prismaUser.id,
      authUserId: prismaUser.authUserId,
      email: prismaUser.email,
      name: prismaUser.name,
      companyId: prismaUser.companyId,
      avatar: prismaUser.avatar,
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      jobTitle: prismaUser.jobTitle ? { name: prismaUser.jobTitle.name } : null,
      department: prismaUser.department ? { name: prismaUser.department.name } : null,
    })
  }
}
