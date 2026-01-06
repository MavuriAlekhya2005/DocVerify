import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HiDocumentText, 
  HiCheckCircle, 
  HiClock, 
  HiUserGroup,
  HiTrendingUp,
  HiTrendingDown,
  HiRefresh
} from 'react-icons/hi';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from '../../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentCertificates, setRecentCertificates] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsResult, certsResult] = await Promise.all([
        api.getStats(),
        api.getCertificates()
      ]);
      
      if (statsResult.success) {
        setStats(statsResult.data);
      }
      
      if (certsResult.success) {
        setRecentCertificates(certsResult.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statCards = stats ? [
    {
      label: 'Total Certificates',
      value: stats.totalCertificates?.toLocaleString() || '0',
      change: stats.recentCertificates > 0 ? `+${stats.recentCertificates} this week` : 'No new',
      trend: stats.recentCertificates > 0 ? 'up' : 'neutral',
      icon: HiDocumentText,
      color: 'primary',
    },
    {
      label: 'Total Verifications',
      value: stats.totalVerifications?.toLocaleString() || '0',
      change: stats.totalVerifications > 0 ? 'Active' : 'None yet',
      trend: stats.totalVerifications > 0 ? 'up' : 'neutral',
      icon: HiCheckCircle,
      color: 'accent',
    },
    {
      label: 'Pending/Processing',
      value: ((stats.statusCounts?.pending || 0) + (stats.statusCounts?.processing || 0)).toString(),
      change: stats.statusCounts?.completed ? `${stats.statusCounts.completed} completed` : 'None',
      trend: 'neutral',
      icon: HiClock,
      color: 'yellow',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers?.toLocaleString() || '0',
      change: stats.totalUsers > 0 ? 'Registered' : 'None yet',
      trend: stats.totalUsers > 0 ? 'up' : 'neutral',
      icon: HiUserGroup,
      color: 'purple',
    },
  ] : [];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartLabels = stats?.monthlyData?.map(m => {
    const [year, month] = m.month.split('-');
    return monthNames[parseInt(month) - 1];
  }) || monthNames.slice(0, 6);
  
  const lineChartData = {
    labels: chartLabels.length > 0 ? chartLabels : ['No data'],
    datasets: [
      {
        label: 'Certificates Issued',
        data: stats?.monthlyData?.map(m => m.certificates) || [0],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Verifications',
        data: stats?.monthlyData?.map(m => m.verifications) || [0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#9ca3af', usePointStyle: true },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
    },
  };

  const typeLabels = stats?.typeDistribution?.map(t => t.type || 'Unknown') || ['No data'];
  const typeCounts = stats?.typeDistribution?.map(t => t.count) || [1];
  const typeColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  const doughnutData = {
    labels: typeLabels,
    datasets: [{ data: typeCounts, backgroundColor: typeColors.slice(0, typeLabels.length), borderWidth: 0 }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#9ca3af', usePointStyle: true, padding: 20 } },
    },
    cutout: '70%',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Overview of certificate issuance and verification activity</p>
        </div>
        <button onClick={fetchData} className="btn-secondary">
          <HiRefresh className="w-5 h-5 mr-2 inline" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-dark-100/50 rounded-2xl border border-white/10 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-600/20 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                stat.trend === 'up' ? 'text-accent-400' : stat.trend === 'down' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {stat.trend === 'up' && <HiTrendingUp className="w-4 h-4" />}
                {stat.trend === 'down' && <HiTrendingDown className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-gray-400 text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-dark-100/50 rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold mb-6">Issuance & Verification Trends</h3>
          <div className="h-80"><Line data={lineChartData} options={lineChartOptions} /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold mb-6">Document Types</h3>
          <div className="h-64"><Doughnut data={doughnutData} options={doughnutOptions} /></div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold mb-6">Recent Certificates</h3>
          <div className="space-y-4">
            {recentCertificates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No certificates yet</p>
            ) : (
              recentCertificates.map((cert) => (
                <div key={cert._id} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                    <HiDocumentText className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{cert.title}</p>
                    <p className="text-gray-500 text-xs">{cert.certificateId}</p>
                  </div>
                  <span className="text-gray-500 text-xs">{new Date(cert.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold mb-6">Access Statistics</h3>
          <div className="space-y-4">
            {[
              { label: 'Total Verifications', value: stats?.totalVerifications || 0, color: 'from-primary-600 to-accent-600' },
              { label: 'Full Access Requests', value: stats?.totalFullAccess || 0, color: 'from-accent-600 to-blue-600' },
              { label: 'Document Downloads', value: stats?.totalDownloads || 0, color: 'from-purple-600 to-pink-600' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">{item.label}</span>
                  <span className="text-gray-400 text-sm">{item.value}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                    style={{ width: item.value > 0 ? `${Math.min((item.value / Math.max(stats?.totalVerifications || 1, 1)) * 100, 100)}%` : '0%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
