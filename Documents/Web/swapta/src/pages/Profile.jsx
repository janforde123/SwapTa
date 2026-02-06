import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import ListingCard from '../components/common/ListingCard';
import { MapPin, Star, ShieldCheck, Calendar, Edit, MessageCircle, Flag } from 'lucide-react';
import EditProfileModal from '../components/common/EditProfileModal';
import ReportModal from '../components/common/ReportModal';
import '../styles/Profile.css';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [userListings, setUserListings] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'traded'
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!id && !currentUser) return;

            const userId = id || currentUser.id;

            // 1. Fetch Profile
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error("Error loading profile:", error);
            } else {
                setProfileUser({
                    id: profile.id,
                    name: profile.full_name || profile.username || 'User',
                    username: profile.username,
                    avatar: profile.avatar_url || 'https://via.placeholder.com/150',
                    location: profile.location || 'Cebu City',
                    bio: profile.bio || '',
                    joined: new Date(profile.created_at || Date.now()).toLocaleDateString(),
                    verified: profile.is_verified,
                    rating: parseFloat(profile.rating) || 0,
                    trades: profile.trades_count || 0,
                    fullProfile: profile, // Store raw for edit
                });
            }

            // 2. Fetch Listings (all of them) with profile info
            const { data: items } = await supabase
                .from('items')
                .select(`
                    *,
                    profiles:owner_id (
                        id,
                        full_name,
                        username,
                        avatar_url
                    )
                `)
                .eq('owner_id', userId);

            if (items) {
                setUserListings(items);
            }
        };

        fetchProfileData();
    }, [id, currentUser, refreshTrigger]);

    const handleProfileUpdate = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    if (!profileUser) return <div className="p-4">Loading Profile...</div>;

    const isOwnProfile = currentUser && currentUser.id === profileUser.id;

    return (
        <div className="profile-page">
            {/* Profile Header */}
            <div className="profile-header">
                <div className="profile-cover"></div>
                <div className="profile-info-container">
                    <img src={profileUser.avatar} alt={profileUser.name} className="profile-avatar-lg" />
                    <div className="profile-details">
                        <div className="profile-name-row">
                            <h1>{profileUser.name}</h1>
                            {profileUser.verified && <ShieldCheck className="verified-icon" size={24} />}
                        </div>
                        <div className="profile-meta">
                            <div className="meta-item">
                                <MapPin size={16} />
                                {profileUser.location}
                            </div>
                            <div className="meta-item">
                                <Star size={16} className="star-icon" />
                                {profileUser.rating} Rating ({userListings.filter(l => l.status === 'traded').length} trades)
                            </div>
                            <div className="meta-item">
                                <Calendar size={16} />
                                Joined {profileUser.joined}
                            </div>
                        </div>
                        {profileUser.bio && (
                            <p className="profile-bio">{profileUser.bio}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="profile-actions">
                        {isOwnProfile ? (
                            <button className="btn btn-outline" onClick={() => setIsEditModalOpen(true)}>
                                <Edit size={16} /> Edit Profile
                            </button>
                        ) : (
                            <div className="profile-action-group">
                                <button className="btn-profile msg-btn" onClick={() => navigate(`/messages/${profileUser.id}`)}>
                                    <MessageCircle size={18} /> Message
                                </button>
                                <button className="btn-profile report-btn" onClick={() => {
                                    if (!currentUser) {
                                        navigate('/login');
                                    } else {
                                        setIsReportModalOpen(true);
                                    }
                                }}>
                                    <Flag size={18} /> Report
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="profile-content">
                <div className="profile-tabs">
                    <button
                        className={`profile-tab ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active Listings
                    </button>
                    <button
                        className={`profile-tab ${activeTab === 'traded' ? 'active' : ''}`}
                        onClick={() => setActiveTab('traded')}
                    >
                        Trade History
                    </button>
                </div>

                <div className="profile-listings-grid">
                    {userListings.filter(l => l.status === activeTab).length > 0 ? (
                        userListings
                            .filter(l => l.status === activeTab)
                            .map(listing => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))
                    ) : (
                        <p className="no-listings">
                            {activeTab === 'active' ? 'No active listings.' : 'No items traded yet.'}
                        </p>
                    )}
                </div>
            </div>

            {isOwnProfile && (
                <EditProfileModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    profile={profileUser.fullProfile}
                    onUpdate={handleProfileUpdate}
                />
            )}

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetType="user"
                targetId={profileUser.id}
                targetName={profileUser.name}
            />
        </div>
    );
};

export default Profile;
