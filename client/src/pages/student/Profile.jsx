import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Settings, MapPin, Briefcase, Code, Sparkles, Check, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/common/Navbar';
import useAuthStore from '@/store/authStore';
import { Card, CardBody, Badge, Button, Input, Label } from '@/components/ui/index.jsx';

const Profile = () => {
  const { user, updateProfile, refreshUser, isLoading } = useAuthStore();

  const [activeTab, setActiveTab] = useState('settings'); // 'profile' | 'settings'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'student',
    domain: '',
    location: '',
    internshipType: 'any',
    preferredLanguages: ''
  });

  // Fetch the latest user profile details on mount (empty deps = run only once)
  useEffect(() => {
    refreshUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchronize form data when the user profile is loaded or updated
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        role: user.role || 'student',
        domain: user.preferences?.domain?.join(', ') || '',
        location: user.preferences?.location || '',
        internshipType: user.preferences?.internshipType || 'any',
        preferredLanguages: user.preferences?.preferredLanguages?.join(', ') || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      phone: formData.phone,
      role: formData.role,
      preferences: {
        domain: formData.domain.split(',').map(s => s.trim()).filter(Boolean),
        location: formData.location,
        internshipType: formData.internshipType,
        preferredLanguages: formData.preferredLanguages.split(',').map(s => s.trim()).filter(Boolean)
      }
    };

    const res = await updateProfile(payload);
    if (res.success) {
      toast.success('Profile and preferences updated successfully!');
    } else {
      toast.error(res.message || 'Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black flex items-center gap-2">
            <User className="text-brand-400" />
            My Profile & Settings
          </h1>
          <p className="text-muted mt-1">Manage your account information and matching preferences</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card/50 border-border overflow-hidden">
              <CardBody className="p-6 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-brand flex items-center justify-center text-white text-3xl font-black shadow-glow-sm">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{user?.name}</h3>
                  <Badge variant="brand" className="mt-1 capitalize">{user?.role}</Badge>
                </div>
                <div className="pt-4 border-t border-border text-left space-y-2.5 text-sm text-muted">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-muted" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-muted" />
                      <span>{user?.phone}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Tab Navigation */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeTab === 'settings'
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                    : 'text-muted hover:text-foreground hover:bg-subtle'
                }`}
              >
                <Settings size={18} />
                Account Settings
              </button>
              {user?.role === 'student' && (
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                    activeTab === 'profile'
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                      : 'text-muted hover:text-foreground hover:bg-subtle'
                  }`}
                >
                  <User size={18} />
                  Assessment Scores
                </button>
              )}
            </div>
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'settings' ? (
              <Card className="bg-card/50 border-border">
                <CardBody className="p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-border pb-4">
                    <Settings className="text-brand-400" size={20} />
                    Personal Details & Preferences
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g. Dharun Kumar"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="e.g. +91 98765 43210"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">User Role</Label>
                        <div
                          id="role"
                          className="w-full h-10 px-3 rounded-md bg-subtle/50 border border-dashed border-border flex items-center text-foreground text-sm capitalize font-medium cursor-not-allowed"
                        >
                          {user?.role || 'student'}
                        </div>
                        <p className="text-xs text-muted">Role is assigned by the system and cannot be changed.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        value={user?.email || ''}
                        disabled
                        className="bg-subtle/50 cursor-not-allowed border-dashed"
                      />
                      <p className="text-xs text-muted">Contact support to change your account email.</p>
                    </div>

                    {user?.role === 'student' && (
                      <>
                        <h3 className="text-lg font-bold pt-4 border-b border-surface-border pb-2 flex items-center gap-2">
                          <Sparkles className="text-accent-400" size={18} />
                          AI Recommendation Preferences
                        </h3>

                        <div className="grid sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="domain">Preferred Domains (comma separated)</Label>
                            <Input
                              id="domain"
                              name="domain"
                              value={formData.domain}
                              onChange={handleInputChange}
                              placeholder="e.g. Frontend Development, Machine Learning"
                            />
                            <p className="text-xs text-muted">Domains you're interested in.</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="location">Preferred Location</Label>
                            <Input
                              id="location"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                              placeholder="e.g. Bangalore, India"
                            />
                            <p className="text-xs text-muted">City name or leave blank for any.</p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="internshipType">Internship Mode</Label>
                            <select
                              id="internshipType"
                              name="internshipType"
                              value={formData.internshipType}
                              onChange={handleInputChange}
                              className="w-full h-10 px-3 rounded-md bg-subtle border border-border focus:border-brand-500 focus:outline-none text-foreground text-sm"
                            >
                              <option value="any">Any (Remote / Hybrid / On-site)</option>
                              <option value="remote">Remote</option>
                              <option value="hybrid">Hybrid</option>
                              <option value="onsite">On-site</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="preferredLanguages">Preferred Languages (comma separated)</Label>
                            <Input
                              id="preferredLanguages"
                              name="preferredLanguages"
                              value={formData.preferredLanguages}
                              onChange={handleInputChange}
                              placeholder="e.g. JavaScript, Python, C++"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="pt-4 border-t border-border flex justify-end">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="gap-2 px-6 py-5 font-bold shadow-md shadow-brand-500/10"
                      >
                        {isLoading ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save size={16} />
                            Save Profile Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>
            ) : (
              <Card className="bg-card/50 border-border">
                <CardBody className="p-8 space-y-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-4">
                    <User className="text-brand-400" size={20} />
                    AI Assessment Scores
                  </h2>

                  <p className="text-muted text-sm leading-relaxed">
                    These scores are parsed from your uploaded resume and calculated based on your completed MCQ and coding tests. They are used by the AI model to rank matching internship positions.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-subtle/50 p-5 rounded-2xl border border-border text-center space-y-2">
                      <h4 className="text-xs text-muted uppercase tracking-wider font-semibold">ATS Score</h4>
                      <div className="text-3xl font-black text-brand-400">{user?.atsScore ?? '—'}<span className="text-xs text-muted font-normal">/100</span></div>
                    </div>
                    <div className="bg-subtle/50 p-5 rounded-2xl border border-border text-center space-y-2">
                      <h4 className="text-xs text-muted uppercase tracking-wider font-semibold">MCQ Score</h4>
                      <div className="text-3xl font-black text-accent-400">{user?.mcqScore ?? '—'}<span className="text-xs text-muted font-normal">/100</span></div>
                    </div>
                    <div className="bg-subtle/50 p-5 rounded-2xl border border-border text-center space-y-2">
                      <h4 className="text-xs text-muted uppercase tracking-wider font-semibold">Coding Score</h4>
                      <div className="text-3xl font-black text-cyan-400">{user?.codingScore ?? '—'}<span className="text-xs text-muted font-normal">/100</span></div>
                    </div>
                    <div className="bg-subtle/50 p-5 rounded-2xl border border-border text-center space-y-2">
                      <h4 className="text-xs text-muted uppercase tracking-wider font-semibold">Overall Score</h4>
                      <div className="text-3xl font-black text-emerald-400">{user?.overallScore ?? '—'}<span className="text-xs text-muted font-normal">/100</span></div>
                    </div>
                  </div>

                  {user?.skills?.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <Code className="text-brand-400" size={16} />
                        Your Skill Profile
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {user.skills.map((skill) => (
                          <Badge key={skill} variant="neutral" className="text-xs capitalize">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
