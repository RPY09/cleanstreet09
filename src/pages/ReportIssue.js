import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './ReportIssue.css';

const ReportIssue = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    issueType: '',
    priority: 'medium',
    address: '',
    landmark: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const issueTypes = [
    { value: 'pothole', label: 'Pothole' },
    { value: 'garbage', label: 'Garbage Dump' },
    { value: 'streetlight', label: 'Broken Streetlight' },
    { value: 'water_leak', label: 'Water Leak' },
    { value: 'other', label: 'Other' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      alert('Issue reported successfully!');
      setFormData({
        title: '',
        issueType: '',
        priority: 'medium',
        address: '',
        landmark: '',
        description: ''
      });
      setLoading(false);
    }, 2000);
  };

  if (!user) {
    return (
      <div className="report-issue-page">
        <div className="container">
          <div className="not-authorized">
            <h2>Please log in to report issues</h2>
            <p>You need to be logged in to submit civic issues.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-issue-page">
      <div className="container">
        <div className="report-header">
          <h1>Report a Civic Issue</h1>
          <p>Help make your community cleaner and safer by reporting issues</p>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-section">
            <h3>Issue Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title" className="form-label">Issue Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-control"
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="issueType" className="form-label">Issue Type</label>
                <select
                  id="issueType"
                  name="issueType"
                  className="form-control"
                  value={formData.issueType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select issue type</option>
                  {issueTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priority" className="form-label">Priority Level</label>
                <select
                  id="priority"
                  name="priority"
                  className="form-control"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  {priorityLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="address" className="form-label">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  className="form-control"
                  placeholder="Enter street address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="landmark" className="form-label">Nearby Landmark (Optional)</label>
              <input
                type="text"
                id="landmark"
                name="landmark"
                className="form-control"
                placeholder="e.g., Near City Hall"
                value={formData.landmark}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                rows="5"
                placeholder="Describe the issue in detail..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Location on Map</h3>
            <div className="map-placeholder">
              <p>Map integration would go here</p>
              <p>📍 Select location on map</p>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;