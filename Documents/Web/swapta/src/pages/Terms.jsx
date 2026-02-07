import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import '../styles/PolicyPages.css';

const Terms = () => {
    return (
        <div className="policy-page">
            <Link to="/register" className="policy-close-btn" title="Close">
                <X size={24} />
            </Link>

            <div className="policy-container">
                <h1>Terms of Service</h1>
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
                    <p>SwapTa is not responsible for disputes between users.</p>
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
                    <p>SwapTa does not:</p>
                    <ul>
                        <li>Handle payments</li>
                        <li>Act as a middleman</li>
                        <li>Guarantee successful or fair trades</li>
                    </ul>
                    <p><strong>Always:</strong> Always verify the item before meeting and trade only in safe, public places like malls or parks. Protect your personal information and prioritize your safety at all times.</p>
                </section>

                <section className="policy-section">
                    <h2>6. Account Termination</h2>
                    <p>We may suspend or terminate accounts that violate these Terms, harm the community, or engage in illegal activity.</p>
                </section>

                <section className="policy-section">
                    <h2>7. Limitation of Liability</h2>
                    <p>SwapTa is not liable for losses, damages, scams, injuries, or failed trades. Use the platform at your own risk.</p>
                </section>

                <section className="policy-section">
                    <h2>8. Changes to Terms</h2>
                    <p>We may update these Terms at any time. Continued use means acceptance.</p>
                </section>

            </div>
        </div>
    );
};

export default Terms;
