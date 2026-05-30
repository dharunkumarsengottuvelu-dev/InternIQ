import React, { useState } from 'react';
import Navbar from '@/components/common/Navbar';
import { Card, CardBody } from '@/components/ui/index.jsx';
import adminService from '@/services/adminService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PostInternship = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    requiredSkills: '',
    location: '',
    mode: 'remote',
    applyLink: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        requiredSkills: formData.requiredSkills.split(',').map(s => s.trim())
      };
      await adminService.createInternship(payload);
      toast.success('Internship posted successfully');
      navigate('/recruiter/dashboard');
    } catch (err) {
      toast.error('Failed to post internship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6">Post an Internship</h1>
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job Title</label>
                <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground" placeholder="e.g. Frontend Engineering Intern" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <input required type="text" name="company" value={formData.company} onChange={handleChange} className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground" placeholder="e.g. TechCorp" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea required name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground" placeholder="Job description..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Required Skills (comma separated)</label>
                <input required type="text" name="requiredSkills" value={formData.requiredSkills} onChange={handleChange} className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground" placeholder="React, Node.js, TypeScript" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground" placeholder="e.g. San Francisco, CA" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Work Mode</label>
                  <select name="mode" value={formData.mode} onChange={handleChange} className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground">
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Application Link / Email</label>
                <input required type="text" name="applyLink" value={formData.applyLink} onChange={handleChange} className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground" placeholder="https://..." />
              </div>
              <button disabled={loading} type="submit" className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors mt-6">
                {loading ? 'Posting...' : 'Post Internship'}
              </button>
            </form>
          </CardBody>
        </Card>
      </main>
    </div>
  );
};

export default PostInternship;
