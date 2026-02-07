import React, { useState } from 'react';
import { X, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './ReportModal.css';

const REASONS = {
    item: ['Scam', 'Stolen Photo', 'Prohibited Item', 'Other'],
    user: ['Fraud/Scam', 'Harassment', 'Inappropriate Behavior', 'Other'],
    conversation: ['Inappropriate Content', 'Offensive Language', 'Spam', 'Other']
};

const ReportModal = ({ isOpen, onClose, targetType, targetId, targetName }) => {
    const { user } = useAuth();
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        if (!reason) {
            alert("Please select a reason.");
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('reports')
                .insert([{
                    reporter_id: user.id,
                    target_type: targetType,
                    target_id: targetId,
                    reason: reason,
                    description: description
                }]);

            if (error) throw error;

            setSubmitted(true);
            setTimeout(() => {
                onClose();
                setSubmitted(false);
                setReason('');
                setDescription('');
            }, 2000);

        } catch (error) {
            console.error("Reporting Error:", error);
            alert("Failed to submit report: " + (error.message || "Unknown error"));
        } finally {
            setSubmitting(false);
        }
    };

    const reasons = REASONS[targetType] || REASONS.item;

    return (
        <div className="report-modal-overlay" onClick={onClose}>
            <div className="report-modal-content" onClick={e => e.stopPropagation()}>
                <div className="report-modal-header">
                    <h2><AlertTriangle size={20} color="var(--error)" /> Report {targetType}</h2>
                    <button className="report-close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="report-modal-body">
                    {submitted ? (
                        <div className="text-center py-4">
                            <Shield size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                            <h3>Report Submitted</h3>
                            <p>Thank you for keeping SwapTa! safe. We will review this report shortly.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="report-target-info">
                                Reporting: <strong>{targetName || targetId}</strong>
                            </div>

                            <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 500 }}>Select a reason:</p>
                            <div className="report-reasons-grid">
                                {reasons.map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        className={`reason-btn ${reason === r ? 'active' : ''}`}
                                        onClick={() => setReason(r)}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            <div className="report-description-area">
                                <label>Additional Details (Optional)</label>
                                <textarea
                                    placeholder="Provide more context..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="report-modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                                <button
                                    type="submit"
                                    className="btn btn-report"
                                    disabled={submitting || !reason}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
