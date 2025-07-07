
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserX, Shield, Crown } from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  created_at: string;
  avatar_url: string | null;
  role?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    adminUsers: 0
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Set mock data for demonstration
        const mockUsers: UserProfile[] = [
          {
            id: '1',
            full_name: 'John Doe',
            username: 'johndoe',
            created_at: new Date().toISOString(),
            avatar_url: null,
            role: 'user'
          },
          {
            id: '2',
            full_name: 'Admin User',
            username: 'admin',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            avatar_url: null,
            role: 'admin'
          },
          {
            id: '3',
            full_name: 'Jane Smith',
            username: 'janesmith',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            avatar_url: null,
            role: 'user'
          },
          {
            id: '4',
            full_name: 'Mike Johnson',
            username: 'mikej',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            avatar_url: null,
            role: 'moderator'
          }
        ];

        setUsers(mockUsers);
        
        const total = mockUsers.length;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const newToday = mockUsers.filter(user => 
          new Date(user.created_at) >= today
        ).length;

        setStats({
          totalUsers: total,
          activeUsers: Math.floor(total * 0.8),
          newUsers: newToday,
          adminUsers: mockUsers.filter(user => user.role === 'admin' || user.role === 'moderator').length
        });
      } catch (error) {
        console.error('Error in fetchUsers:', error);
        setUsers([]);
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          newUsers: 0,
          adminUsers: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-yellow-100 text-yellow-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{stats.totalUsers}</div>
            <p className="text-xs text-blue-600">Registered users</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{stats.activeUsers}</div>
            <p className="text-xs text-green-600">Active this month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">New Users</CardTitle>
            <UserX className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{stats.newUsers}</div>
            <p className="text-xs text-orange-600">Joined today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{stats.adminUsers}</div>
            <p className="text-xs text-purple-600">With admin access</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" />
            User Management
          </CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name || 'User'} className="w-10 h-10 rounded-full" />
                      ) : (
                        <Users className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{user.full_name || 'Unknown User'}</h3>
                      <p className="text-sm text-gray-500">@{user.username || 'no-username'}</p>
                      <p className="text-xs text-gray-400">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(user.role)}
                        {user.role || 'user'}
                      </div>
                    </Badge>
                    
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No users found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
