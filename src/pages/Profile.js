import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || ''
  });

  if (!user) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="not-authorized">
            <h2>Please log in to view your profile</h2>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically update the user profile via API
    alert('Profile updated successfully!');
    setEditMode(false);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>Profile</h1>
          <p>Manage your account information and preferences</p>
        </div>

        <div className="profile-layout">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="user-card">
              <div className="user-avatar">
                {getInitials(user.name)}
              </div>
              <div className="user-info">
                <h3>{user.name}</h3>
                <p className="username">@{user.username}</p>
                <p className="user-role">{user.role}</p>
              </div>
              <p className="user-bio">{user.bio}</p>
              <p className="member-since">
                Member since {new Date(user.memberSince).toLocaleDateString()}
              </p>
            </div>

            <nav className="profile-nav">
              <button 
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Account Information
              </button>
              <button 
                className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                Security Settings
              </button>
              <button 
                className={`nav-item ${activeTab === 'privacy' ? 'active' : ''}`}
                onClick={() => setActiveTab('privacy')}
              >
                Privacy Settings
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="profile-content">
            {activeTab === 'profile' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Account Information</h2>
                  <p>Update your personal details</p>
                  {!editMode && (
                    <button 
                      className="btn btn-outline"
                      onClick={() => setEditMode(true)}
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {editMode ? (
                  <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="name" className="form-label">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className="form-control"
                          value={formData.name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          className="form-control"
                          value={formData.username}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="form-control"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone" className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className="form-control"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="location" className="form-label">Location</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        className="form-control"
                        value={formData.location}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="bio" className="form-label">Bio</label>
                      <textarea
                        id="bio"
                        name="bio"
                        className="form-control"
                        rows="4"
                        value={formData.bio}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="btn btn-outline"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-details">
                    <div className="detail-group">
                      <label>Username</label>
                      <p>@{user.username}</p>
                    </div>
                    <div className="detail-group">
                      <label>Email</label>
                      <p>{user.email}</p>
                    </div>
                    <div className="detail-group">
                      <label>Full Name</label>
                      <p>{user.name}</p>
                    </div>
                    {user.phone && (
                      <div className="detail-group">
                        <label>Phone Number</label>
                        <p>{user.phone}</p>
                      </div>
                    )}
                    <div className="detail-group">
                      <label>Location</label>
                      <p>{user.location}</p>
                    </div>
                    <div className="detail-group">
                      <label>Bio</label>
                      <p>{user.bio}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="tab-content">
                <h2>Security Settings</h2>
                <p>Manage your account security and privacy</p>
                
                <div className="security-section">
                  <h3>Change Password</h3>
                  <div className="password-form">
                    <div className="form-group">
                      <label htmlFor="currentPassword" className="form-label">Current Password</label>
                      <input
                        type="password"
                        id="currentPassword"
                        className="form-control"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="newPassword" className="form-label">New Password</label>
                      <input
                        type="password"
                        id="newPassword"
                        className="form-control"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        className="form-control"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <button className="btn btn-primary">Update Password</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="tab-content">
                <h2>Privacy Settings</h2>
                <p>Control your privacy preferences</p>
                
                <div className="privacy-options">
                  <div className="privacy-option">
                    <label className="checkbox-label">
                      <input type="checkbox" defaultChecked />
                      <span>Show my profile to other users</span>
                    </label>
                  </div>
                  <div className="privacy-option">
                    <label className="checkbox-label">
                      <input type="checkbox" defaultChecked />
                      <span>Allow comments on my reports</span>
                    </label>
                  </div>
                  <div className="privacy-option">
                    <label className="checkbox-label">
                      <input type="checkbox" />
                      <span>Receive email notifications</span>
                    </label>
                  </div>
                  <div className="privacy-option">
                    <label className="checkbox-label">
                      <input type="checkbox" defaultChecked />
                      <span>Show my voting activity</span>
                    </label>
                  </div>
                </div>
                
                <button className="btn btn-primary">Save Privacy Settings</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;