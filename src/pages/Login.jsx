import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LegalModal from '../components/common/LegalModal';
import '../styles/Login.css';

const Login = ({ isSignUpDefault = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, signUp } = useAuth();

    const [isLogin, setIsLogin] = useState(!isSignUpDefault);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [activeModal, setActiveModal] = useState(null); // 'terms' or 'privacy' or null

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    });

    const from = location.state?.from?.pathname || '/';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!isLogin && !agreedToTerms) {
                setError("You must agree to the Terms and Conditions and Privacy Policy.");
                setLoading(false);
                return;
            }

            if (isLogin) {
                await login(formData.email, formData.password);
                navigate(from, { replace: true });
            } else {
                await signUp(formData.email, formData.password, formData.fullName);
                // Depending on Supabase settings, might need email confirm. 
                // Assuming auto-confirm off or user checks mail.
                alert("Account created! Please check your email if confirmation is required, or simpler login.");
                navigate(from, { replace: true });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>SwapTa!</h1>
                    <p>{isLogin ? 'Welcome back to the community' : 'Join the growing Cebu exchange'}</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                className="form-input"
                                type="text"
                                name="fullName"
                                placeholder="Juan Dela Cruz"
                                value={formData.fullName}
                                onChange={handleChange}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            className="form-input"
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            className="form-input"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                    </div>

                    {!isLogin && (
                        <div className="terms-group">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                required
                            />
                            <label htmlFor="terms">
                                I agree to the <button type="button" className="btn-link" onClick={() => setActiveModal('terms')}>Terms and Conditions</button> and <button type="button" className="btn-link" onClick={() => setActiveModal('privacy')}>Privacy Policy</button>
                            </label>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '1.5rem' }}>
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            className="btn-link"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? 'Register' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>

            <LegalModal
                isOpen={activeModal === 'terms'}
                onClose={() => setActiveModal(null)}
                title="Terms of Service"
                content={
                    <>
                        <span className="policy-date">Effective Date: February 2026</span>
                        <section className="policy-section">
                            <p>Welcome to SwapTa. By using our website or services, you agree to these Terms.</p>
                        </section>
                        <section className="policy-section">
                            <h2>1. What SwapTa Is</h2>
                            <p>SwapTa is a community-based platform that allows users to swap or trade items and services. We do not sell items, handle payments, or guarantee trades.</p>
                        </section>
                        <section className="policy-section">
                            <h2>2. Eligibility</h2>
                            <ul>
                                <li>You must be at least 13 years old</li>
                                <li>You are responsible for all activity under your account</li>
                                <li>Information you provide must be accurate and honest</li>
                            </ul>
                        </section>
                        <section className="policy-section">
                            <h2>3. User Responsibilities</h2>
                            <p>You agree:</p>
                            <ul>
                                <li>Not to post illegal, stolen, or prohibited items</li>
                                <li>Not to scam, impersonate, or mislead others</li>
                                <li>Not to upload harmful, abusive, or offensive content</li>
                                <li>To meet and trade at your own risk</li>
                            </ul>
                        </section>
                        <section className="policy-section">
                            <h2>4. Listings & Trades</h2>
                            <ul>
                                <li>Users are fully responsible for their listings</li>
                                <li>SwapTa does not verify item quality or authenticity</li>
                                <li>Trades are final unless both parties agree otherwise</li>
                            </ul>
                        </section>
                        <section className="policy-section">
                            <h2>5. Safety Disclaimer</h2>
                            <p>SwapTa does not: Handle payments, Act as a middleman, or Guarantee successful or fair trades.</p>
                            <p><strong>Always:</strong> Always verify the item before meeting and trade only in safe, public places like malls or parks. Protect your personal information and prioritize your safety at all times.</p>
                        </section>
                    </>
                }
            />

            <LegalModal
                isOpen={activeModal === 'privacy'}
                onClose={() => setActiveModal(null)}
                title="Privacy Policy"
                content={
                    <>
                        <span className="policy-date">Effective Date: February 2026</span>
                        <section className="policy-section">
                            <p>Your privacy matters to us. This policy explains how we collect and use your data.</p>
                        </section>
                        <section className="policy-section">
                            <h2>1. Information We Collect</h2>
                            <ul>
                                <li>Name or nickname</li>
                                <li>Email address</li>
                                <li>Uploaded images</li>
                                <li>Messages and listings</li>
                            </ul>
                        </section>
                        <section className="policy-section">
                            <h2>2. How We Use Your Data</h2>
                            <p>We use your data to manage accounts, display listings, enable messaging, and maintain security.</p>
                        </section>
                        <section className="policy-section">
                            <h2>3. Data Storage</h2>
                            <p>Data is securely stored using third-party services (Supabase). We do not sell your personal data.</p>
                        </section>
                        <section className="policy-section">
                            <h2>4. Data Security</h2>
                            <p>We take reasonable steps to protect your information, but no system is 100% secure.</p>
                        </section>
                    </>
                }
            />
        </div>
    );
};

export default Login;
