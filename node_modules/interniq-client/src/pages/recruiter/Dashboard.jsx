import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { Users, Briefcase, FileCode2, Target, TrendingUp } from 'lucide-react';

import Navbar from '@/components/common/Navbar';
import PageLoader from '@/components/common/PageLoader';
import { Card, CardBody } from '@/components/ui/index.jsx';
import adminService from '@/services/adminService';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, trend }) => (
  <Card className="bg-card/50 backdrop-blur-sm border-border">
    <CardBody className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-foreground">{value}</h3>
        </div>
        <div className="p-3 bg-primary/10 rounded-xl">
          <Icon className="text-primary w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className="text-emerald-500 w-4 h-4 mr-1" />
          <span className="text-emerald-500 font-medium">{trend}</span>
          <span className="text-muted-foreground ml-2">vs last month</span>
        </div>
      )}
    </CardBody>
  </Card>
);

const RecruiterDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [atsData, setAtsData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, atsRes] = await Promise.all([
          adminService.getStats(),
          adminService.getAtsDistribution(),
        ]);

        setStats(statsRes.data?.data);
        setAtsData(atsRes.data?.data || []);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Recruiter Dashboard</h1>
          <p className="text-muted-foreground">
            Analytics and stats for your job postings and applicants.
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Candidates" 
            value={stats?.totalStudents || 0} 
            icon={Users} 
            trend="+12%" 
          />
          <StatCard 
            title="Active Postings" 
            value={stats?.totalInternships || 0} 
            icon={Briefcase} 
            trend="+4%" 
          />
          <StatCard 
            title="Avg. ATS Score" 
            value={`${stats?.avgAtsScore || 0}/100`} 
            icon={Target} 
          />
          <StatCard 
            title="Avg. Coding Score" 
            value={`${stats?.avgCodingScore || 0}/100`} 
            icon={FileCode2} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ATS Score Distribution Chart */}
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold mb-6">Candidate ATS Score Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={atsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="range" stroke="#888" tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      cursor={{fill: '#222'}} 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    />
                    <Bar dataKey="students" fill="#6366f1" radius={[4, 4, 0, 0]} name="Candidates" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default RecruiterDashboard;
