import { describe, it, expect, beforeEach } from 'vitest'
import { Role } from '../domain/entities/Role'
import { Permission } from '../domain/entities/Permission'
import { User } from '../../users/domain/entities/User'

describe('RBAC Domain Entities', () => {
  describe('Role Entity', () => {
    it('should create a valid role', () => {
      const role = Role.create({
        name: 'admin',
        description: 'Administrator role',
        isActive: true,
      })

      expect(role.name).toBe('admin')
      expect(role.description).toBe('Administrator role')
      expect(role.isActive).toBe(true)
    })

    it('should normalize role name to lowercase', () => {
      const role = Role.create({
        name: 'ADMIN',
        description: 'Administrator role',
      })

      expect(role.name).toBe('admin')
    })

    it('should validate role name format', () => {
      expect(() => {
        Role.create({
          name: 'invalid name!',
          description: 'Invalid role name',
        })
      }).toThrow('Role name can only contain letters, numbers, underscores, and dashes')
    })

    it('should require role name', () => {
      expect(() => {
        Role.create({
          name: '',
          description: 'Empty name',
        })
      }).toThrow('Role name is required')
    })

    it('should activate and deactivate roles', () => {
      const role = Role.create({
        name: 'test-role',
        description: 'Test role',
        isActive: false,
      })

      expect(role.isActive).toBe(false)

      role.activate()
      expect(role.isActive).toBe(true)

      role.deactivate()
      expect(role.isActive).toBe(false)
    })
  })

  describe('Permission Entity', () => {
    it('should create a valid permission', () => {
      const permission = Permission.create({
        name: 'users:read',
        resource: 'users',
        action: 'read',
        description: 'Read user information',
      })

      expect(permission.name).toBe('users:read')
      expect(permission.resource).toBe('users')
      expect(permission.action).toBe('read')
      expect(permission.description).toBe('Read user information')
    })

    it('should create permission from resource and action', () => {
      const permission = Permission.createFromResourceAction(
        'admin',
        'access',
        'Access admin panel'
      )

      expect(permission.name).toBe('admin:access')
      expect(permission.resource).toBe('admin')
      expect(permission.action).toBe('access')
      expect(permission.description).toBe('Access admin panel')
    })

    it('should normalize resource and action to lowercase', () => {
      const permission = Permission.create({
        name: 'USERS:READ',
        resource: 'USERS',
        action: 'READ',
      })

      expect(permission.resource).toBe('users')
      expect(permission.action).toBe('read')
    })

    it('should match resource and action', () => {
      const permission = Permission.createFromResourceAction('users', 'read')

      expect(permission.matches('users', 'read')).toBe(true)
      expect(permission.matches('USERS', 'READ')).toBe(true)
      expect(permission.matches('users', 'write')).toBe(false)
      expect(permission.matches('admin', 'read')).toBe(false)
    })

    it('should require permission name', () => {
      expect(() => {
        Permission.create({
          name: '',
          resource: 'users',
          action: 'read',
        })
      }).toThrow('Permission name is required')
    })

    it('should require resource', () => {
      expect(() => {
        Permission.create({
          name: 'test:read',
          resource: '',
          action: 'read',
        })
      }).toThrow('Permission resource is required')
    })

    it('should require action', () => {
      expect(() => {
        Permission.create({
          name: 'test:read',
          resource: 'test',
          action: '',
        })
      }).toThrow('Permission action is required')
    })
  })

  describe('User Entity with RBAC', () => {
    let user: User
    let adminRole: Role
    let userRole: Role

    beforeEach(() => {
      user = User.create({
        auth0Id: 'auth0|test-user-123',
        email: 'test@example.com',
        name: 'Test User',
      })

      adminRole = Role.create({
        name: 'admin',
        description: 'Administrator role',
      })

      userRole = Role.create({
        name: 'user',
        description: 'Regular user role',
      })
    })

    it('should start with no roles', () => {
      expect(user.roles).toHaveLength(0)
      expect(user.hasRole('admin')).toBe(false)
      expect(user.hasRole('user')).toBe(false)
    })

    it('should add roles to user', () => {
      user.addRole(adminRole)
      
      expect(user.roles).toHaveLength(1)
      expect(user.hasRole('admin')).toBe(true)
      expect(user.hasRole('user')).toBe(false)
    })

    it('should prevent duplicate role assignment', () => {
      user.addRole(adminRole)
      
      expect(() => {
        user.addRole(adminRole)
      }).toThrow('User already has role: admin')
    })

    it('should remove roles from user', () => {
      user.addRole(adminRole)
      user.addRole(userRole)
      
      expect(user.roles).toHaveLength(2)
      expect(user.hasRole('admin')).toBe(true)
      expect(user.hasRole('user')).toBe(true)

      user.removeRole('admin')
      
      expect(user.roles).toHaveLength(1)
      expect(user.hasRole('admin')).toBe(false)
      expect(user.hasRole('user')).toBe(true)
    })

    it('should check if user has any of multiple roles', () => {
      user.addRole(userRole)
      
      expect(user.hasAnyRole(['admin', 'user'])).toBe(true)
      expect(user.hasAnyRole(['admin', 'manager'])).toBe(false)
      expect(user.hasAnyRole(['user'])).toBe(true)
    })

    it('should get only active roles', () => {
      const inactiveRole = Role.create({
        name: 'inactive',
        description: 'Inactive role',
        isActive: true, // Create as active first
      })

      user.addRole(adminRole) // Active
      user.addRole(inactiveRole) // Add as active
      
      // Then deactivate the role
      inactiveRole.deactivate()

      const activeRoles = user.getActiveRoles()
      expect(activeRoles).toHaveLength(1)
      expect(activeRoles[0].name).toBe('admin')
    })

    it('should prevent adding inactive roles', () => {
      const inactiveRole = Role.create({
        name: 'inactive',
        description: 'Inactive role',
        isActive: false,
      })

      expect(() => {
        user.addRole(inactiveRole)
      }).toThrow('Cannot assign inactive role to user')
    })

    it('should include roles in JSON representation', () => {
      user.addRole(adminRole)
      user.addRole(userRole)

      const json = user.toJSON()
      
      expect(json.roles).toHaveLength(2)
      expect(json.roles[0].name).toBe('admin')
      expect(json.roles[1].name).toBe('user')
    })
  })
})