import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Activity, Clock, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [secret, setSecret] = useState(localStorage.getItem('xorya_admin_secret') || '');
    const [isAuthorized, setIsAuthorized] = useState(false);

    const fetchStats = async (providedSecret) => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:3001' 
                : window.location.origin;

            const response = await axios.get(`${baseUrl}/api/admin/stats`, {
                params: { secret: providedSecret || secret }
            });
            setStats(response.data);
            setIsAuthorized(true);
            if (providedSecret) localStorage.setItem('xorya_admin_secret', providedSecret);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch stats');
            setIsAuthorized(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (secret) {
            fetchStats();
        } else {
            setLoading(false);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        fetchStats(secret);
    };

    if (!isAuthorized) {
        return (
            <div className="admin-login-container">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="admin-login-card"
                >
                    <div className="admin-login-header">
                        <ShieldCheck className="admin-icon" size={48} />
                        <h1>Admin Access</h1>
                        <p>XORYA Streaming Service Insights</p>
                    </div>
                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <input 
                                type="password" 
                                placeholder="Enter Admin Secret" 
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                            />
                        </div>
                        {error && <div className="error-message"><AlertCircle size={16}/> {error}</div>}
                        <button type="submit" disabled={loading}>
                            {loading ? 'Verifying...' : 'Access Dashboard'}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="dashboard-content">
                <header className="dashboard-header">
                    <div>
                        <h1>Analytics Console</h1>
                        <p>Real-time performance and audience metrics</p>
                    </div>
                    <button className="refresh-btn" onClick={() => fetchStats()} disabled={loading}>
                        <RefreshCw size={20} className={loading ? 'spinning' : ''} />
                    </button>
                </header>

                <div className="stats-grid">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="stat-card total"
                    >
                        <div className="stat-icon-wrapper">
                            <Users size={32} />
                        </div>
                        <div className="stat-info">
                            <h3>Total Visitors</h3>
                            <div className="stat-value">{stats?.totalVisitors || 0}</div>
                            <p>Unique users discovered</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="stat-card active"
                    >
                        <div className="stat-icon-wrapper pulse">
                            <Activity size={32} />
                        </div>
                        <div className="stat-info">
                            <h3>Active Now</h3>
                            <div className="stat-value">{stats?.activeNow || 0}</div>
                            <p>Current concurrent viewers</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="stat-card recent"
                    >
                        <div className="stat-icon-wrapper">
                            <Clock size={32} />
                        </div>
                        <div className="stat-info">
                            <h3>Recently Active</h3>
                            <div className="stat-value">{stats?.recentlyActive || 0}</div>
                            <p>Last 15 minutes activity</p>
                        </div>
                    </motion.div>
                </div>

                <div className="dashboard-bottom">
                    <div className="info-panel">
                        <h3>System Status</h3>
                        <div className="status-item">
                            <span className="dot online"></span>
                            <span>Backend Server: Online</span>
                        </div>
                        <div className="status-item">
                            <span className="dot online"></span>
                            <span>Tracking Service: Operational</span>
                        </div>
                        <div className="timestamp">
                            Last Updated: {stats?.serverTime ? new Date(stats.serverTime).toLocaleTimeString() : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
