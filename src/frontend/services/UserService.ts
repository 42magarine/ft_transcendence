export default class UserService {
    private users: Map<number, any> = new Map();

    async getCurrentUser(): Promise<any> {
      try {
        // Use /api/auth/me to match your UserManagementService endpoint.
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Send cookies if required for session-based auth.
        });
        if (response.status === 401) {
          // Not authenticated, return null.
          return null;
        }
        // Return the parsed user object.
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        return null;
      }
    }

    async getUserById(userId: number): Promise<any> {
      // Check the local cache first.
      if (this.users.has(userId)) {
        return this.users.get(userId);
      }

      try {
        const response = await fetch(`/api/users/${userId}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`Error fetching user with id ${userId}`);
        }
        const userInfo = await response.json();

        // Cache the result.
        this.users.set(userId, userInfo);

        return userInfo;
      } catch (error) {
        console.error(`Failed to fetch user with id ${userId}:`, error);
        throw error;
      }
    }

    async getAllUsers(): Promise<any[]> {
      try {
        const response = await fetch('/api/users', {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Error fetching users list');
        }
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch all users:', error);
        return [];
      }
    }
  }
