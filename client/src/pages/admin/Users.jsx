import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, UserX, UserCheck } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import PageLoader from '@/components/common/PageLoader';
import { Card, CardBody, Badge, Button } from '@/components/ui/index.jsx';
import adminService from '@/services/adminService';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async (p = 1) => {
    try {
      setLoading(true);
      const { data } = await adminService.getUsers(p, 10);
      setUsers(data.data.users);
      setTotalPages(data.data.pages);
      setPage(p);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async (userId) => {
    try {
      const { data } = await adminService.toggleUserBlock(userId);
      setUsers(users.map(u => u._id === userId ? { ...u, isBlocked: data.data.isBlocked } : u));
      toast.success(data.message);
    } catch (err) {
      toast.error('Failed to toggle block status');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full pt-24 pb-12">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Shield className="text-primary" />
              Candidate Management
            </h1>
            <p className="text-muted-foreground">
              Monitor student profiles, block malicious actors, and review platform usage.
            </p>
          </div>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-surface-900 border-b border-border">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-center">Scores (ATS / Code)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center"><PageLoader /></td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-muted-foreground">No students found.</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user._id} className="border-b border-border hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{user.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant="outline" className="text-xs">{user.atsScore || 0}</Badge>
                          <span className="text-muted-foreground">/</span>
                          <Badge variant="outline" className="text-xs">{user.codingScore || 0}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.isBlocked ? (
                          <Badge className="bg-danger-500/20 text-danger-400 border-danger-500/50">Blocked</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Active</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant={user.isBlocked ? "outline" : "destructive"} 
                          size="sm"
                          onClick={() => handleToggleBlock(user._id)}
                          className="w-28 text-xs font-semibold gap-2"
                        >
                          {user.isBlocked ? (
                            <><UserCheck size={14} /> Unblock</>
                          ) : (
                            <><UserX size={14} /> Block</>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="p-4 border-t border-border flex justify-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => fetchUsers(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm font-medium text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === totalPages}
                onClick={() => fetchUsers(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default AdminUsers;
