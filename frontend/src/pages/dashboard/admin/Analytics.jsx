import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HiDocumentText, 
  HiCheckCircle, 
  HiClock, 
  HiUserGroup,
  HiTrendingUp,
  HiTrendingDown,
  HiRefresh,
  HiCube,
  HiChip,
  HiDatabase,
  HiLightningBolt,
  HiGlobe,
  HiDownload,
  HiEye,
  HiServer
} from 'react-icons/hi';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [recentCertificates, setRecentCertificates] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsResult, certsResult, detailedResult] = await Promise.all([
        api.getStats(),
        api.getCertificates(),
        api.getDetailedAnalytics().catch(() => null),
      ]);
      
      if (statsResult.success) {
        setStats(statsResult.data);
      }
      
      if (certsResult.success) {
        setRecentCertificates(certsResult.data.slice(0, 5));
      }

      if (detailedResult?.success) {
        setDetailedStats(detailedResult.data);
      }

      // Fetch realtime stats
      const realtimeResult = await api.getRealtimeAnalytics().catch(() => null);
      if (realtimeResult?.success) {
        setRealtimeStats(realtimeResult.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh realtime stats every 30 seconds
    const interval = setInterval(async () => {
      try {
        const realtimeResult = await api.getRealtimeAnalytics().catch(() => null);
        if (realtimeResult?.success) {
          setRealtimeStats(realtimeResult.data);
        }
      } catch (e) {
        // Silently fail for realtime updates
      }
    }, 30000);

    return () => clearInterval(interval);
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

  // Hourly activity bar chart data
  const hourlyData = {
    labels: detailedStats?.activity?.hourly?.map(h => `${h.hour}:00`) || Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Documents',
        data: detailedStats?.activity?.hourly?.map(h => h.documents) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderRadius: 4,
      },
      {
        label: 'Verifications',
        data: detailedStats?.activity?.hourly?.map(h => h.verifications) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#9ca3af' } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
    },
  };

  // Service status indicators
  const services = detailedStats?.services || {};

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
          <p className="text-gray-400">Comprehensive overview of DocVerify activity and performance</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Realtime indicator */}
          {realtimeStats && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-600/20 rounded-lg border border-accent-600/30">
              <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></span>
              <span className="text-accent-400 text-sm font-medium">
                {realtimeStats.last5Minutes?.newDocuments || 0} new (5m)
              </span>
            </div>
          )}
          <button onClick={fetchData} className="btn-secondary">
            <HiRefresh className="w-5 h-5 mr-2 inline" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
        {['overview', 'activity', 'performance', 'services'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg capitalize transition-all ${
              activeTab === tab
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
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
                  { label: 'Total Verifications', value: stats?.totalVerifications || 0, icon: HiEye, color: 'from-primary-600 to-accent-600' },
                  { label: 'Full Access Requests', value: stats?.totalFullAccess || 0, icon: HiCheckCircle, color: 'from-accent-600 to-blue-600' },
                  { label: 'Document Downloads', value: stats?.totalDownloads || 0, icon: HiDownload, color: 'from-purple-600 to-pink-600' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-sm">{item.label}</span>
                        <span className="text-gray-400 text-sm font-medium">{item.value.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all`}
                          style={{ width: item.value > 0 ? `${Math.min((item.value / Math.max(stats?.totalVerifications || 1, 1)) * 100, 100)}%` : '0%' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <>
          {/* Realtime Activity */}
          {realtimeStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary-600/20 to-accent-600/20 rounded-2xl border border-primary-500/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <HiLightningBolt className="w-6 h-6 text-primary-400" />
                  <span className="text-gray-400 text-sm">Last 5 Minutes</span>
                </div>
                <div className="text-4xl font-bold text-white mb-1">
                  {realtimeStats.last5Minutes?.newDocuments || 0}
                </div>
                <div className="text-gray-400 text-sm">New Documents</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-accent-600/20 to-blue-600/20 rounded-2xl border border-accent-500/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <HiClock className="w-6 h-6 text-accent-400" />
                  <span className="text-gray-400 text-sm">Last Hour</span>
                </div>
                <div className="text-4xl font-bold text-white mb-1">
                  {realtimeStats.lastHour?.newDocuments || 0}
                </div>
                <div className="text-gray-400 text-sm">New Documents</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-500/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <HiEye className="w-6 h-6 text-purple-400" />
                  <span className="text-gray-400 text-sm">Last Hour</span>
                </div>
                <div className="text-4xl font-bold text-white mb-1">
                  {realtimeStats.lastHour?.verifications || 0}
                </div>
                <div className="text-gray-400 text-sm">Verifications</div>
              </motion.div>
            </div>
          )}

          {/* Hourly Activity Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-dark-100/50 rounded-2xl border border-white/10 p-6 mb-8">
            <h3 className="text-white font-semibold mb-6">24-Hour Activity</h3>
            <div className="h-80">
              <Bar data={hourlyData} options={barChartOptions} />
            </div>
          </motion.div>

          {/* Daily Activity Table */}
          {detailedStats?.activity?.daily && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <h3 className="text-white font-semibold mb-6">Daily Activity (Last 30 Days)</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Documents</th>
                      <th className="pb-3 font-medium">Verifications</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedStats.activity.daily.slice(-10).reverse().map((day, idx) => (
                      <tr key={day._id} className="border-b border-white/5 last:border-0">
                        <td className="py-3 text-white text-sm">{day._id}</td>
                        <td className="py-3 text-gray-400 text-sm">{day.documents}</td>
                        <td className="py-3 text-gray-400 text-sm">{day.verifications}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <>
          {/* Processing Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <div className="text-gray-400 text-sm mb-2">Avg Confidence Score</div>
              <div className="text-3xl font-bold text-white mb-2">
                {detailedStats?.overview?.avgConfidenceScore || 0}%
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-600 to-accent-600 rounded-full"
                  style={{ width: `${detailedStats?.overview?.avgConfidenceScore || 0}%` }}
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <div className="text-gray-400 text-sm mb-2">Avg Word Count</div>
              <div className="text-3xl font-bold text-white">
                {detailedStats?.processing?.avgWordCount?.toLocaleString() || 0}
              </div>
              <div className="text-gray-500 text-sm mt-1">words per document</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <div className="text-gray-400 text-sm mb-2">OCR Processed</div>
              <div className="text-3xl font-bold text-white">
                {detailedStats?.processing?.ocrProcessedCount?.toLocaleString() || 0}
              </div>
              <div className="text-gray-500 text-sm mt-1">documents with OCR</div>
            </motion.div>
          </div>

          {/* Top Verified Documents */}
          {detailedStats?.topPerformers?.mostVerified && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-dark-100/50 rounded-2xl border border-white/10 p-6 mb-8">
              <h3 className="text-white font-semibold mb-6">Most Verified Documents</h3>
              <div className="space-y-4">
                {detailedStats.topPerformers.mostVerified.map((doc, idx) => (
                  <div key={doc.certificateId} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                      idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-white/5 text-gray-500'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{doc.title}</p>
                      <p className="text-gray-500 text-xs">{doc.certificateId}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{doc.verificationCount}</div>
                      <div className="text-gray-500 text-xs">verifications</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Extraction Status Distribution */}
          {detailedStats?.distributions?.byStatus && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <h3 className="text-white font-semibold mb-6">Extraction Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(detailedStats.distributions.byStatus).map(([status, count]) => (
                  <div key={status} className="text-center p-4 bg-white/5 rounded-xl">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                      status === 'completed' ? 'bg-accent-500' :
                      status === 'processing' ? 'bg-yellow-500' :
                      status === 'failed' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="text-2xl font-bold text-white">{count}</div>
                    <div className="text-gray-400 text-sm capitalize">{status}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <>
          {/* Service Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-6 ${
                services.ai === 'active' 
                  ? 'bg-accent-600/10 border-accent-500/30' 
                  : 'bg-yellow-600/10 border-yellow-500/30'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <HiChip className={`w-6 h-6 ${services.ai === 'active' ? 'text-accent-400' : 'text-yellow-400'}`} />
                <span className="text-white font-medium">AI Service</span>
              </div>
              <div className={`text-sm font-medium ${services.ai === 'active' ? 'text-accent-400' : 'text-yellow-400'}`}>
                {services.ai === 'active' ? 'OpenAI Active' : 'Fallback Mode'}
              </div>
              <p className="text-gray-400 text-xs mt-2">
                {services.ai === 'active' 
                  ? 'Using GPT for intelligent field extraction' 
                  : 'Using regex-based extraction'}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className={`rounded-2xl border p-6 ${
                services.cache === 'redis' 
                  ? 'bg-accent-600/10 border-accent-500/30' 
                  : 'bg-yellow-600/10 border-yellow-500/30'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <HiDatabase className={`w-6 h-6 ${services.cache === 'redis' ? 'text-accent-400' : 'text-yellow-400'}`} />
                <span className="text-white font-medium">Cache Service</span>
              </div>
              <div className={`text-sm font-medium ${services.cache === 'redis' ? 'text-accent-400' : 'text-yellow-400'}`}>
                {services.cache === 'redis' ? 'Redis Connected' : 'In-Memory Cache'}
              </div>
              <p className="text-gray-400 text-xs mt-2">
                {services.cache === 'redis' 
                  ? 'Distributed caching active' 
                  : 'Using local memory cache'}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className={`rounded-2xl border p-6 ${
                services.blockchain === 'connected' 
                  ? 'bg-accent-600/10 border-accent-500/30' 
                  : 'bg-red-600/10 border-red-500/30'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <HiCube className={`w-6 h-6 ${services.blockchain === 'connected' ? 'text-accent-400' : 'text-red-400'}`} />
                <span className="text-white font-medium">Blockchain</span>
              </div>
              <div className={`text-sm font-medium ${services.blockchain === 'connected' ? 'text-accent-400' : 'text-red-400'}`}>
                {services.blockchain === 'connected' ? 'Connected' : 'Disconnected'}
              </div>
              <p className="text-gray-400 text-xs mt-2">
                {services.blockchain === 'connected' 
                  ? 'Smart contract active' 
                  : 'DB-only verification'}
              </p>
            </motion.div>
          </div>

          {/* Blockchain Stats */}
          {detailedStats?.blockchain?.available && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-dark-100/50 rounded-2xl border border-white/10 p-6 mb-8">
              <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                <HiCube className="w-5 h-5 text-primary-400" />
                Blockchain Statistics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <div className="text-gray-400 text-sm mb-1">On-Chain Documents</div>
                  <div className="text-2xl font-bold text-white">
                    {detailedStats.blockchain.totalDocuments?.toLocaleString() || 0}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Total Batches</div>
                  <div className="text-2xl font-bold text-white">
                    {detailedStats.blockchain.totalBatches?.toLocaleString() || 0}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Chain Verifications</div>
                  <div className="text-2xl font-bold text-white">
                    {detailedStats.blockchain.totalVerifications?.toLocaleString() || 0}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Network</div>
                  <div className="text-lg font-medium text-primary-400">
                    {detailedStats.blockchain.network || 'Local'}
                  </div>
                </div>
              </div>
              {detailedStats.blockchain.contractAddress && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-gray-400 text-sm mb-1">Contract Address</div>
                  <code className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded">
                    {detailedStats.blockchain.contractAddress}
                  </code>
                </div>
              )}
            </motion.div>
          )}

          {/* User Role Distribution */}
          {detailedStats?.distributions?.byUserRole && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                <HiUserGroup className="w-5 h-5 text-primary-400" />
                User Distribution
              </h3>
              <div className="grid grid-cols-3 gap-6">
                {Object.entries(detailedStats.distributions.byUserRole).map(([role, count]) => (
                  <div key={role} className="text-center">
                    <div className={`w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center ${
                      role === 'admin' ? 'bg-red-500/20' :
                      role === 'verifier' ? 'bg-purple-500/20' :
                      'bg-primary-500/20'
                    }`}>
                      <HiUserGroup className={`w-8 h-8 ${
                        role === 'admin' ? 'text-red-400' :
                        role === 'verifier' ? 'text-purple-400' :
                        'text-primary-400'
                      }`} />
                    </div>
                    <div className="text-2xl font-bold text-white">{count}</div>
                    <div className="text-gray-400 text-sm capitalize">{role}s</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
