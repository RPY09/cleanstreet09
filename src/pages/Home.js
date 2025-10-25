import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Make Your City Cleaner & Smarter</h1>
            <p>Report civic issues, track progress, and help build a better community together.</p>
            <div className="hero-actions">
              {user ? (
                <>
                  <Link to="/report-issue" className="btn btn-primary">
                    + Report an Issue
                  </Link>
                  <Link to="/complaints" className="btn btn-outline">
                    View Reports
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-outline">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <h2>How CleanStreet Works</h2>
          <p className="section-subtitle">Simple steps to make a difference in your community</p>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">📝</div>
              <h3>Report Issues</h3>
              <p>Easily report civic problems with photos and location details</p>
            </div>
            
            <div className="step-card">
              <div className="step-icon">📊</div>
              <h3>Track Progress</h3>
              <p>Monitor the status of reported issues and see updates in real-time</p>
            </div>
            
            <div className="step-card">
              <div className="step-icon">👥</div>
              <h3>Community Impact</h3>
              <p>Vote and comment on issues to help prioritize community needs</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Make a Difference?</h2>
            <p>Join thousands of citizens working together to create cleaner, safer communities.</p>
            <Link to={user ? "/report-issue" : "/register"} className="btn btn-primary">
              Start Reporting Issues
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;