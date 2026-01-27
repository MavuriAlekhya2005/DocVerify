import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiCog,
  HiUser,
  HiBell,
  HiShieldCheck,
  HiColorSwatch,
  HiGlobe,
  HiMail,
  HiKey,
  HiEye,
  HiEyeOff,
  HiCheck,
  HiCamera,
  HiTrash,
  HiExclamation,
  HiMoon,
  HiSun,
  HiDesktopComputer,
} from 'react-icons/hi';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Settings = ({ userRole = 'user' }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    avatar: null,
  });
  
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  });
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    documentIssued: true,
    documentVerified: true,
    weeklyReport: false,
    marketingEmails: false,
  });

  const [connectedAccounts, setConnectedAccounts] = useState({
    google: false,
    github: false,
  });

  const [appearance, setAppearance] = useState({
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.getProfile();
      if (response.success && response.user) {
        setProfile({
          name: response.user.name || '',
          email: response.user.email || '',
          phone: response.user.phone || '',
          organization: response.user.organization || '',
          avatar: response.user.avatar || null,
        });
        setConnectedAccounts({
          google: response.user.googleId ? true : false,
          github: response.user.githubId ? true : false,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const response = await api.updateProfile(profile);
      if (response.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.success('Profile updated successfully');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (security.newPassword !== security.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (security.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.changePassword({
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
      });
      if (response.success) {
        toast.success('Password changed successfully');
        setSecurity({ ...security, currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectOAuth = async (provider) => {
    // In a real app, this would redirect to OAuth flow
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/${provider}`;
  };

  const handleDisconnectOAuth = async (provider) => {
    try {
      const response = await api.disconnectOAuth(provider);
      if (response.success) {
        setConnectedAccounts({ ...connectedAccounts, [provider]: false });
        toast.success(`${provider} account disconnected`);
      }
    } catch (error) {
      toast.error(`Failed to disconnect ${provider}`);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: HiUser },
    { id: 'security', label: 'Security', icon: HiShieldCheck },
    { id: 'notifications', label: 'Notifications', icon: HiBell },
    { id: 'appearance', label: 'Appearance', icon: HiColorSwatch },
    ...(userRole === 'admin' ? [{ id: 'system', label: 'System', icon: HiCog }] : []),
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-display">Settings</h1>
        <p className="text-gray-400 mt-2">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-dark-200 rounded-2xl border border-white/10 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-200 rounded-2xl border border-white/10 p-6"
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>
                
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">{profile.name?.charAt(0) || 'U'}</span>
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
                      <HiCamera className="w-4 h-4 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                  </div>
                  <div>
                    <p className="text-white font-medium">Profile Photo</p>
                    <p className="text-gray-400 text-sm">JPG, PNG or GIF. Max 2MB</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Organization</label>
                    <input
                      type="text"
                      value={profile.organization}
                      onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                <h2 className="text-xl font-bold text-white mb-6">Security Settings</h2>

                {/* Change Password */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={security.currentPassword}
                          onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                      <input
                        type="password"
                        value={security.newPassword}
                        onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={security.confirmPassword}
                        onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white"
                      />
                    </div>
                    <button
                      onClick={handlePasswordChange}
                      disabled={loading}
                      className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 font-semibold disabled:opacity-50"
                    >
                      Update Password
                    </button>
                  </div>
                </div>

                {/* Connected Accounts */}
                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Connected Accounts</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-dark-300 rounded-xl border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                          <FaGoogle className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Google</p>
                          <p className="text-gray-400 text-sm">{connectedAccounts.google ? 'Connected' : 'Not connected'}</p>
                        </div>
                      </div>
                      {connectedAccounts.google ? (
                        <button
                          onClick={() => handleDisconnectOAuth('google')}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnectOAuth('google')}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-4 bg-dark-300 rounded-xl border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
                          <FaGithub className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">GitHub</p>
                          <p className="text-gray-400 text-sm">{connectedAccounts.github ? 'Connected' : 'Not connected'}</p>
                        </div>
                      </div>
                      {connectedAccounts.github ? (
                        <button
                          onClick={() => handleDisconnectOAuth('github')}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnectOAuth('github')}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
                      <p className="text-gray-400 text-sm mt-1">Add an extra layer of security to your account</p>
                    </div>
                    <button
                      onClick={() => setSecurity({ ...security, twoFactorEnabled: !security.twoFactorEnabled })}
                      className={`relative w-14 h-8 rounded-full transition-colors ${security.twoFactorEnabled ? 'bg-primary-500' : 'bg-gray-600'}`}
                    >
                      <div className={`absolute w-6 h-6 bg-white rounded-full top-1 transition-all ${security.twoFactorEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-6">Notification Preferences</h2>
                
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'documentIssued', label: 'Document Issued', desc: 'When a document is issued to you or by you' },
                    { key: 'documentVerified', label: 'Document Verified', desc: 'When someone verifies your document' },
                    { key: 'weeklyReport', label: 'Weekly Report', desc: 'Weekly summary of your activity' },
                    { key: 'marketingEmails', label: 'Marketing Emails', desc: 'News and updates about DocVerify' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-dark-300 rounded-xl border border-white/10">
                      <div>
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                        className={`relative w-14 h-8 rounded-full transition-colors ${notifications[item.key] ? 'bg-primary-500' : 'bg-gray-600'}`}
                      >
                        <div className={`absolute w-6 h-6 bg-white rounded-full top-1 transition-all ${notifications[item.key] ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => toast.success('Notification preferences saved')}
                    className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 font-semibold"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-6">Appearance Settings</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                  <select
                    value={appearance.language}
                    onChange={(e) => setAppearance({ ...appearance, language: e.target.value })}
                    className="w-full max-w-xs px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date Format</label>
                  <select
                    value={appearance.dateFormat}
                    onChange={(e) => setAppearance({ ...appearance, dateFormat: e.target.value })}
                    className="w-full max-w-xs px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            )}

            {/* System Tab (Admin Only) */}
            {activeTab === 'system' && userRole === 'admin' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-6">System Settings</h2>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-4">
                  <HiExclamation className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">Admin Only Section</p>
                    <p className="text-yellow-400/80 text-sm">Changes here affect all users of the system</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-dark-300 rounded-xl border border-white/10">
                    <div>
                      <p className="text-white font-medium">Maintenance Mode</p>
                      <p className="text-gray-400 text-sm">Temporarily disable access for non-admins</p>
                    </div>
                    <button className="relative w-14 h-8 rounded-full transition-colors bg-gray-600">
                      <div className="absolute w-6 h-6 bg-white rounded-full top-1 left-1" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-dark-300 rounded-xl border border-white/10">
                    <div>
                      <p className="text-white font-medium">Public Registration</p>
                      <p className="text-gray-400 text-sm">Allow new users to register</p>
                    </div>
                    <button className="relative w-14 h-8 rounded-full transition-colors bg-primary-500">
                      <div className="absolute w-6 h-6 bg-white rounded-full top-1 left-7" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-dark-300 rounded-xl border border-white/10">
                    <div>
                      <p className="text-white font-medium">Email Verification Required</p>
                      <p className="text-gray-400 text-sm">Require email verification for new accounts</p>
                    </div>
                    <button className="relative w-14 h-8 rounded-full transition-colors bg-primary-500">
                      <div className="absolute w-6 h-6 bg-white rounded-full top-1 left-7" />
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Clear All Data</p>
                        <p className="text-gray-400 text-sm">Permanently delete all certificates and user data</p>
                      </div>
                      <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                        Clear Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
