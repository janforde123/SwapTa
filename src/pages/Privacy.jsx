import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import '../styles/PolicyPages.css';

const Privacy = () => {
    return (
        <div className="policy-page">
            <Link to="/register" className="policy-close-btn" title="Close">
                <X size={24} />
            </Link>

            <div className="policy-container">
                <h1>Privacy Policy</h1>
                <span className="policy-date">Effective Date: February 2026</span>

                <section className="policy-section">
                    <p>Your privacy matters to us. This policy explains how we collect and use your data.</p>
                </section>

                <section className="policy-section">
                    <h2>1. Information We Collect</h2>
                    <p>We may collect:</p>
                    <ul>
                        <li>Name or nickname</li>
                        <li>Email address</li>
                        <li>Uploaded images</li>
                        <li>Messages and listings</li>
                        <li>Basic usage data (for app functionality)</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>2. How We Use Your Data</h2>
                    <p>We use your data to:</p>
                    <ul>
                        <li>Create and manage accounts</li>
                        <li>Display listings</li>
                        <li>Enable messaging</li>
                        <li>Improve the platform</li>
                        <li>Maintain security</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>3. Data Storage</h2>
                    <ul>
                        <li>Data is securely stored using third-party services (e.g., Supabase)</li>
                        <li>We do not sell your personal data</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>4. Sharing Information</h2>
                    <p>We only share data when required by law or to operate core services (hosting, database, authentication).</p>
                </section>

                <section className="policy-section">
                    <h2>5. Cookies</h2>
                    <p>We may use cookies or local storage for login sessions and app functionality.</p>
                </section>

                <section className="policy-section">
                    <h2>6. Your Rights</h2>
                    <p>You can request account deletion, update your information, or contact us regarding your data.</p>
                </section>

                <section className="policy-section">
                    <h2>7. Data Security</h2>
                    <p>We take reasonable steps to protect your information, but no system is 100% secure.</p>
                </section>

                <section className="policy-section">
                    <h2>8. Changes to This Policy</h2>
                    <p>Updates may happen. Continued use means acceptance.</p>
                </section>

            </div>
        </div>
    );
};

export default Privacy;
