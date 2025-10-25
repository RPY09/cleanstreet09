import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ViewComplaints.css';

const ViewComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockComplaints = [
      {
        id: 1,
        title: 'Large pothole on Main Street causing traffic delays',
        description: 'There\'s a massive pothole on Main Street near the intersection with Oak Avenue. It\'s been there for weeks and is causing serious damage to vehicles. Multiple cars have gotten flat tires.',
        location: 'Main Street & Oak Avenue',
        time: '1 day ago',
        upvotes: 12,
        downvotes: 2,
        comments: [],
        user: { name: 'John Doe', username: 'johndoe' },
        status: 'reported'
      },
      {
        id: 2,
        title: 'Illegal garbage dump behind shopping center',
        description: 'Someone has been dumping large amounts of trash behind the Westfield Shopping Center. It\'s attracting rats and creating an unsanitary environment.',
        location: 'Westfield Shopping Center, Back Parking Lot',
        time: '1 day ago',
        upvotes: 8,
        downvotes: 1,
        comments: [],
        user: { name: 'Jane Smith', username: 'janesmith' },
        status: 'in_progress'
      },
      {
        id: 3,
        title: 'Broken streetlight in residential area',
        description: 'The streetlight at the corner of Pine Street and 2nd Avenue has been out for over a month. This creates a safety hazard for pedestrians at night.',
        location: 'Pine Street & 2nd Avenue',
        time: '1 day ago',
        upvotes: 15,
        downvotes: 0,
        comments: [],
        user: { name: 'Mike Johnson', username: 'mikej' },
        status: 'reported'
      }
    ];
    setComplaints(mockComplaints);
  }, []);

  const handleVote = (complaintId, voteType) => {
    setComplaints(prev => prev.map(complaint => {
      if (complaint.id === complaintId) {
        if (voteType === 'upvote') {
          return { ...complaint, upvotes: complaint.upvotes + 1 };
        } else {
          return { ...complaint, downvotes: complaint.downvotes + 1 };
        }
      }
      return complaint;
    }));
  };

  const handleAddComment = (complaintId) => {
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now(),
      content: commentText,
      user: { name: user.name, username: user.username },
      timestamp: new Date().toLocaleDateString()
    };

    setComplaints(prev => prev.map(complaint => {
      if (complaint.id === complaintId) {
        return {
          ...complaint,
          comments: [...complaint.comments, newComment]
        };
      }
      return complaint;
    }));

    setCommentText('');
    setSelectedComplaint(null);
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'reported': 'status-reported',
      'in_progress': 'status-in-progress',
      'resolved': 'status-resolved'
    };
    return statusMap[status] || 'status-default';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'reported': 'Reported',
      'in_progress': 'In Progress',
      'resolved': 'Resolved'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="view-complaints-page">
      <div className="container">
        <div className="complaints-header">
          <h1>Community Reports</h1>
          <p>See what issues your community is reporting and show your support</p>
        </div>

        <div className="complaints-grid">
          {complaints.map(complaint => (
            <div key={complaint.id} className="complaint-card">
              <div className="complaint-header">
                <h3>{complaint.title}</h3>
                <span className={`status-badge ${getStatusClass(complaint.status)}`}>
                  {getStatusText(complaint.status)}
                </span>
              </div>
              
              <p className="complaint-description">{complaint.description}</p>
              
              <div className="complaint-meta">
                <div className="location">
                  📍 {complaint.location}
                </div>
                <div className="time">
                  {complaint.time}
                </div>
              </div>

              <div className="complaint-actions">
                <div className="voting-section">
                  <button 
                    className="vote-btn upvote"
                    onClick={() => handleVote(complaint.id, 'upvote')}
                  >
                    👍 {complaint.upvotes}
                  </button>
                  <button 
                    className="vote-btn downvote"
                    onClick={() => handleVote(complaint.id, 'downvote')}
                  >
                    👎 {complaint.downvotes}
                  </button>
                </div>

                <button 
                  className="comment-btn"
                  onClick={() => setSelectedComplaint(
                    selectedComplaint?.id === complaint.id ? null : complaint
                  )}
                >
                  💬 Comments ({complaint.comments.length})
                </button>
              </div>

              {selectedComplaint?.id === complaint.id && (
                <div className="comments-section">
                  <div className="comments-list">
                    {complaint.comments.length > 0 ? (
                      complaint.comments.map(comment => (
                        <div key={comment.id} className="comment">
                          <div className="comment-header">
                            <strong>{comment.user.name}</strong>
                            <span className="comment-time">{comment.timestamp}</span>
                          </div>
                          <p className="comment-content">{comment.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="no-comments">No comments yet. Be the first to comment!</p>
                    )}
                  </div>
                  
                  {user && (
                    <div className="add-comment">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add your comment..."
                        rows="3"
                        className="comment-input"
                      />
                      <button 
                        onClick={() => handleAddComment(complaint.id)}
                        className="btn btn-primary"
                        disabled={!commentText.trim()}
                      >
                        Post Comment
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewComplaints;