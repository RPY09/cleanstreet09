import React, { useState } from 'react';
import { AlertTriangle, Bike, Flame, CheckCircle, Plus, Map, List } from 'lucide-react';

const Dashboard = () => {
  const [stats] = useState({
    total: 4,
    pending: 1,
    inProgress: 0,
    resolved: 0
  });

  const [recentActivity] = useState([
    {
      id: 1,
      title: 'Pothole on Main Streets',
      time: '2 hours ago',
      status: 'Resolved',
      icon: 'check',
      color: 'bg-green-500'
    },
    {
      id: 2,
      title: 'New Streetlight Issue',
      time: '5 hours ago',
      status: 'Reported',
      icon: 'light',
      color: 'bg-blue-400'
    },
    {
      id: 3,
      title: 'Garbage dump complaint',
      time: '1 day ago',
      status: 'Updated',
      icon: 'garbage',
      color: 'bg-pink-400'
    }
  ]);

  const StatCard = ({ icon: IconComponent, count, label, bgColor }) => (
    <div className={`${bgColor} rounded-2xl p-6 shadow-lg`}>
      <div className="flex flex-col items-center justify-center space-y-3">
        <IconComponent className="w-10 h-10 text-teal-800" />
        <div className="text-4xl font-bold text-gray-800">{count}</div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
      </div>
    </div>
  );

  const ActivityItem = ({ item }) => {
    const getIcon = () => {
      switch (item.icon) {
        case 'check':
          return <CheckCircle className="w-6 h-6 text-white" />;
        case 'light':
          return <Flame className="w-6 h-6 text-white" />;
        case 'garbage':
          return <div className="w-6 h-6 rounded-full bg-white/30" />;
        default:
          return <CheckCircle className="w-6 h-6 text-white" />;
      }
    };

    const getStatusColor = () => {
      switch (item.status) {
        case 'Resolved':
          return 'bg-teal-700';
        case 'Reported':
          return 'bg-teal-700';
        case 'Updated':
          return 'bg-teal-700';
        default:
          return 'bg-teal-700';
      }
    };

    return (
      <div className="bg-teal-100/60 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`${item.color} rounded-full p-3 flex items-center justify-center`}>
            {getIcon()}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{item.title}</div>
            <div className="text-sm text-gray-600">{item.time}</div>
          </div>
        </div>
        <div className={`${getStatusColor()} text-white px-4 py-2 rounded-full text-sm font-medium`}>
          {item.status}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-gray-900">
      {/* Header */}
      <header className="bg-teal-100/10 backdrop-blur-sm border-b border-teal-700/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-teal-100 rounded-lg p-2">
                <Bike className="w-6 h-6 text-teal-800" />
              </div>
              <div>
                <div className="font-bold text-gray-100 text-lg">CleanStreet</div>
                <div className="text-xs text-teal-300">Keep the streets clean</div>
              </div>
            </div>
            <nav className="flex items-center space-x-1">
              <button className="px-4 py-2 text-teal-100 hover:bg-teal-800/30 rounded-lg transition">
                Home
              </button>
              <button className="px-4 py-2 text-teal-100 hover:bg-teal-800/30 rounded-lg transition">
                Dashboard
              </button>
              <button className="px-4 py-2 text-teal-100 hover:bg-teal-800/30 rounded-lg transition">
                Report Issue
              </button>
              <button className="px-4 py-2 text-teal-100 hover:bg-teal-800/30 rounded-lg transition">
                View Complaints
              </button>
              <button className="px-4 py-2 text-teal-100 hover:bg-teal-800/30 rounded-lg transition">
                Profile
              </button>
              <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition ml-2">
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-teal-300">See what issues your community is reporting and share your support</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={AlertTriangle}
            count={stats.total}
            label="Total Issues"
            bgColor="bg-teal-100"
          />
          <StatCard 
            icon={Bike}
            count={stats.pending}
            label="Pending"
            bgColor="bg-teal-100"
          />
          <StatCard 
            icon={Flame}
            count={stats.inProgress}
            label="In Progress"
            bgColor="bg-teal-100"
          />
          <StatCard 
            icon={CheckCircle}
            count={stats.resolved}
            label="Resolved"
            bgColor="bg-teal-100"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-teal-800/20 backdrop-blur-sm rounded-2xl p-6 border border-teal-700/30">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map(item => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-teal-800/20 backdrop-blur-sm rounded-2xl p-6 border border-teal-700/30">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <button className="w-full bg-teal-700 hover:bg-teal-600 text-white font-semibold py-4 px-6 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg">
                <Plus className="w-5 h-5" />
                <span>Report New Issue</span>
              </button>
              <button className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-4 px-6 rounded-xl transition shadow-lg">
                View All Complaints
              </button>
              <button className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-4 px-6 rounded-xl transition shadow-lg">
                Issue Map
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;