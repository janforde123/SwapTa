import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, User, Check } from 'lucide-react';
import './MarkTradedModal.css';

const MarkTradedModal = ({ isOpen, onClose, listingId, onConfirm }) => {
    const [loading, setLoading] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [customNote, setCustomNote] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCandidates();
        }
    }, [isOpen]);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: conversations } = await supabase
                .from('conversations')
                .select('*')
                .contains('participants', [user.id])
                .order('last_updated', { ascending: false })
                .limit(10);

            if (conversations) {
                const otherUserIds = conversations.map(c =>
                    c.participants.find(p => p !== user.id)
                );

                if (otherUserIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, full_name, username, avatar_url')
                        .in('id', otherUserIds);

                    setCandidates(profiles || []);
                }
            }
        } catch (err) {
            console.error("Error fetching candidates:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        onConfirm(selectedUserId, customNote);
    };

    if (!isOpen) return null;

    return (
        <div className="mark-traded-modal">
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Mark as Traded</h2>
                        <button onClick={onClose} className="close-btn"><X size={24} /></button>
                    </div>

                    <div className="modal-body">
                        <p className="description">Who did you trade this item with?</p>

                        {loading ? (
                            <div className="loading-state">
                                <p>Loading recent contacts...</p>
                            </div>
                        ) : (
                            <div className="user-selection-list">
                                {candidates.map(user => (
                                    <div
                                        key={user.id}
                                        className={`user-candidate ${selectedUserId === user.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedUserId(user.id)}
                                    >
                                        <img
                                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                            alt={user.username}
                                            className="avatar-sm"
                                        />
                                        <span className="username">{user.full_name || user.username}</span>
                                        {selectedUserId === user.id && <Check size={20} className="check-icon" />}
                                    </div>
                                ))}

                                <div
                                    className={`user-candidate ${selectedUserId === 'outside' ? 'selected' : ''}`}
                                    onClick={() => setSelectedUserId('outside')}
                                >
                                    <div className="avatar-placeholder"><User size={20} /></div>
                                    <span className="username">Someone outside SwapTa!</span>
                                    {selectedUserId === 'outside' && <Check size={20} className="check-icon" />}
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Private Note (Optional)</label>
                            <textarea
                                rows="3"
                                placeholder="e.g. Swapped for a bike..."
                                value={customNote}
                                onChange={(e) => setCustomNote(e.target.value)}
                            />
                        </div>

                        <div className="modal-actions">
                            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
                            <button
                                onClick={handleConfirm}
                                className="btn btn-primary"
                                disabled={!selectedUserId}
                            >
                                Confirm Trade
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarkTradedModal;
