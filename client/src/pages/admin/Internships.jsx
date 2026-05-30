import React, { useEffect, useState } from 'react';
import { Briefcase, Plus, Trash2, Edit3, X } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import PageLoader from '@/components/common/PageLoader';
import { Card, CardBody, Badge, Button, Input, Label } from '@/components/ui/index.jsx';
import adminService from '@/services/adminService';
import toast from 'react-hot-toast';

const AdminInternships = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', company: '', description: '', location: '', mode: 'remote', duration: '', 
    stipendAmount: '', stipendCurrency: 'INR', requiredSkills: '', domain: '', applyLink: ''
  });
  const [editingId, setEditingId] = useState(null);

  const fetchInternships = async (p = 1) => {
    try {
      setLoading(true);
      const { data } = await adminService.getInternships(p, 10);
      setInternships(data.data.internships);
      setTotalPages(data.data.pages);
      setPage(p);
    } catch (err) {
      toast.error('Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = (internship = null) => {
    if (internship) {
      setEditingId(internship._id);
      setFormData({
        title: internship.title,
        company: internship.company,
        description: internship.description || '',
        location: internship.location,
        mode: internship.mode,
        duration: internship.duration,
        stipendAmount: internship.stipend?.amount || '',
        stipendCurrency: internship.stipend?.currency || 'USD',
        requiredSkills: internship.requiredSkills.join(', '),
        domain: internship.domain.join(', '),
        applyLink: internship.applyLink
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '', company: '', description: '', location: '', mode: 'remote', duration: '', 
        stipendAmount: '', stipendCurrency: 'INR', requiredSkills: '', domain: '', applyLink: ''
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        company: formData.company,
        description: formData.description || `${formData.title} internship at ${formData.company}. Required skills: ${formData.requiredSkills}.`,
        location: formData.location,
        mode: formData.mode,
        duration: formData.duration,
        stipend: { amount: Number(formData.stipendAmount), currency: formData.stipendCurrency },
        requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        domain: formData.domain.split(',').map(s => s.trim()).filter(Boolean),
        applyLink: formData.applyLink,
        isActive: true
      };

      if (editingId) {
        await adminService.updateInternship(editingId, payload);
        toast.success('Internship updated successfully');
      } else {
        await adminService.createInternship(payload);
        toast.success('Internship created successfully');
      }
      
      handleCloseForm();
      fetchInternships(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save internship');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this internship?')) return;
    try {
      await adminService.deleteInternship(id);
      toast.success('Internship deleted successfully');
      fetchInternships(page);
    } catch (err) {
      toast.error('Failed to delete internship');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <Navbar />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full pt-24 pb-12">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Briefcase className="text-primary" />
              Internship Listings
            </h1>
            <p className="text-muted-foreground">
              Manage platform internship opportunities and generate AI semantic embeddings.
            </p>
          </div>
          <Button onClick={() => handleOpenForm()} className="gap-2">
            <Plus size={16} /> Post Internship
          </Button>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-surface-900 border-b border-border">
                <tr>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Location/Mode</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center"><PageLoader /></td>
                  </tr>
                ) : internships.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-muted-foreground">No internships found.</td>
                  </tr>
                ) : (
                  internships.map(internship => (
                    <tr key={internship._id} className="border-b border-border hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{internship.title}</td>
                      <td className="px-6 py-4 text-muted-foreground">{internship.company}</td>
                      <td className="px-6 py-4">
                        <span className="capitalize">{internship.mode}</span> 
                        {internship.location && ` • ${internship.location}`}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {internship.isActive ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Active</Badge>
                        ) : (
                          <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/50">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenForm(internship)}>
                            <Edit3 size={14} />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(internship._id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
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
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => fetchInternships(page - 1)}>Previous</Button>
              <span className="flex items-center px-4 text-sm font-medium text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => fetchInternships(page + 1)}>Next</Button>
            </div>
          )}
        </Card>
      </main>

      {/* Slide-over Form Panel */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseForm} />
          <div
            className="relative w-full max-w-md border-l border-border h-full shadow-2xl flex flex-col animate-in slide-in-from-right"
            style={{ background: 'var(--surface-card)', color: 'var(--surface-text)' }}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Internship' : 'Post Internship'}</h2>
              <button onClick={handleCloseForm} className="text-muted-foreground hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <Label>Job Title *</Label>
                <Input name="title" required value={formData.title} onChange={handleInputChange} placeholder="e.g. Frontend Engineer Intern" />
              </div>
              <div className="space-y-1">
                <Label>Company *</Label>
                <Input name="company" required value={formData.company} onChange={handleInputChange} placeholder="e.g. Infosys, TCS, Flipkart" />
              </div>
              <div className="space-y-1">
                <Label>Description *</Label>
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the internship role and responsibilities..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border text-sm resize-none focus:outline-none"
                  style={{
                    background: 'var(--surface-subtle)',
                    borderColor: 'var(--surface-border)',
                    color: 'var(--surface-text)',
                  }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Mode</Label>
                  <select
                    name="mode"
                    className="w-full h-10 px-3 rounded-md border focus:outline-none"
                    style={{ background: 'var(--surface-subtle)', borderColor: 'var(--surface-border)', color: 'var(--surface-text)' }}
                    value={formData.mode}
                    onChange={handleInputChange}
                  >
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Location</Label>
                  <Input name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. Bengaluru, Karnataka" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Stipend Amount</Label>
                  <Input type="number" name="stipendAmount" value={formData.stipendAmount} onChange={handleInputChange} placeholder="e.g. 5000" />
                </div>
                <div className="space-y-1">
                  <Label>Currency</Label>
                  <select
                    name="stipendCurrency"
                    className="w-full h-10 px-3 rounded-md border focus:outline-none"
                    style={{ background: 'var(--surface-subtle)', borderColor: 'var(--surface-border)', color: 'var(--surface-text)' }}
                    value={formData.stipendCurrency}
                    onChange={handleInputChange}
                  >
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Duration *</Label>
                <Input name="duration" required value={formData.duration} onChange={handleInputChange} placeholder="e.g. 3 months" />
              </div>

              <div className="space-y-1">
                <Label>Required Skills (comma separated) *</Label>
                <Input name="requiredSkills" required value={formData.requiredSkills} onChange={handleInputChange} placeholder="React, Node.js, TypeScript" />
                <p className="text-xs text-muted-foreground mt-1">Used for AI semantic matching</p>
              </div>

              <div className="space-y-1">
                <Label>Domain (comma separated) *</Label>
                <Input name="domain" required value={formData.domain} onChange={handleInputChange} placeholder="Software Engineering, Web Development" />
              </div>

              <div className="space-y-1">
                <Label>Application Link *</Label>
                <Input type="url" name="applyLink" required value={formData.applyLink} onChange={handleInputChange} placeholder="https://..." />
              </div>
            </form>

            <div
              className="p-6 border-t border-border flex justify-end gap-3"
              style={{ background: 'var(--surface-card)' }}
            >
              <Button variant="outline" onClick={handleCloseForm}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingId ? 'Update' : 'Publish'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInternships;
