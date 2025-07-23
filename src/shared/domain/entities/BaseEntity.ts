import { randomUUID } from 'crypto'

export abstract class BaseEntity {
  protected _id: string
  protected _createdAt: Date
  protected _updatedAt: Date

  constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id || randomUUID()
    this._createdAt = createdAt || new Date()
    this._updatedAt = updatedAt || new Date()
  }

  public get id(): string {
    return this._id
  }

  public get createdAt(): Date {
    return this._createdAt
  }

  public get updatedAt(): Date {
    return this._updatedAt
  }

  protected touch(): void {
    this._updatedAt = new Date()
  }

  public abstract equals(other: BaseEntity): boolean
  public abstract toJSON(): Record<string, any>
} 