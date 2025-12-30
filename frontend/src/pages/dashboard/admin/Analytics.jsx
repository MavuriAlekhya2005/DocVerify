import { motion } from 'framer-motion';
import { 
  HiDocumentText, 
  HiCheckCircle, 
  HiClock, 
  HiUserGroup,
  HiTrendingUp,
  HiTrendingDown,
  HiArrowRight
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
  const stats = [
    {
      label: 'Total Certificates',
      value: '12,847',
      change: '+12.5%',
      trend: 'up',
      icon: HiDocumentText,
      color: 'primary',
    },
    {
      label: 'Verified Today',
      value: '234',
      change: '+8.2%',
      trend: 'up',
      icon: HiCheckCircle,
      color: 'accent',
    },
    {
      label: 'Pending Review',
      value: '45',
      change: '-5.1%',
      trend: 'down',
      icon: HiClock,
      color: 'yellow',
    },
    {
      label: 'Active Users',
      value: '1,892',
      change: '+15.3%',
      trend: 'up',
      icon: HiUserGroup,
      color: 'purple',
    },
  ];

  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Certificates Issued',
        data: [1200, 1900, 1500, 2100, 2400, 2100, 2800],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Verifications',
        data: [800, 1200, 1100, 1500, 1800, 1600, 2200],
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
        labels: {
          color: '#9ca3af',
          usePointStyle: true,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
  };

  const doughnutData = {
    labels: ['Degrees', 'Certifications', 'Experience', 'Courses'],
    datasets: [
      {
        data: [35, 30, 20, 15],
        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#9ca3af',
          usePointStyle: true,
          padding: 20,
        },
      },
    },
    cutout: '70%',
  };

  const recentActivities = [
    { action: 'Certificate issued', user: 'John Doe', time: '2 min ago', type: 'issue' },
    { action: 'Bulk upload completed', user: 'Admin', time: '15 min ago', type: 'bulk' },
    { action: 'Certificate verified', user: 'HR Team', time: '1 hour ago', type: 'verify' },
    { action: 'New user registered', user: 'Jane Smith', time: '2 hours ago', type: 'user' },
    { action: 'Certificate rejected', user: 'System', time: '3 hours ago', type: 'reject' },
  ];

  const topCertificates = [
    { name: 'Bachelor of Science', count: 2341, percent: 28 },
    { name: 'AWS Solutions Architect', count: 1892, percent: 23 },
    { name: 'Experience Letter', count: 1567, percent: 19 },
    { name: 'Python Developer', count: 1234, percent: 15 },
    { name: 'Data Science', count: 987, percent: 12 },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">Overview of certificate issuance and verification activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
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
                stat.trend === 'up' ? 'text-accent-400' : 'text-red-400'
              }`}>
                {stat.trend === 'up' ? <HiTrendingUp className="w-4 h-4" /> : <HiTrendingDown className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-gray-400 text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-dark-100/50 rounded-2xl border border-white/10 p-6"
        >
          <h3 className="text-white font-semibold mb-6">Issuance & Verification Trends</h3>
          <div className="h-80">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </motion.div>

        {/* Doughnut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-100/50 rounded-2xl border border-white/10 p-6"
        >
          <h3 className="text-white font-semibold mb-6">Certificate Types</h3>
          <div className="h-64">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-dark-100/50 rounded-2xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">Recent Activity</h3>
            <button className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1">
              View All <HiArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activity.type === 'issue' ? 'bg-primary-600/20' :
                  activity.type === 'verify' ? 'bg-accent-600/20' :
                  activity.type === 'bulk' ? 'bg-purple-600/20' :
                  activity.type === 'reject' ? 'bg-red-600/20' : 'bg-blue-600/20'
                }`}>
                  <HiDocumentText className={`w-5 h-5 ${
                    activity.type === 'issue' ? 'text-primary-400' :
                    activity.type === 'verify' ? 'text-accent-400' :
                    activity.type === 'bulk' ? 'text-purple-400' :
                    activity.type === 'reject' ? 'text-red-400' : 'text-blue-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.action}</p>
                  <p className="text-gray-500 text-xs">{activity.user}</p>
                </div>
                <span className="text-gray-500 text-xs">{activity.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Certificates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-dark-100/50 rounded-2xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">Top Certificate Types</h3>
            <button className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1">
              View All <HiArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {topCertificates.map((cert, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">{cert.name}</span>
                  <span className="text-gray-400 text-sm">{cert.count}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-600 to-accent-600 rounded-full"
                    style={{ width: `${cert.percent}%` }}
                  ></div>
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
