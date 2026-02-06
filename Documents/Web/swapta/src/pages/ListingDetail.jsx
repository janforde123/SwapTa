import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MOCK_LISTINGS, MOCK_USERS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { MapPin, User, MessageCircle, ArrowLeft, MoreVertical, AlertTriangle, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import TradeModal from '../components/common/TradeModal';
import MarkTradedModal from '../components/common/MarkTradedModal';
import ReportModal from '../components/common/ReportModal';
import '../styles/ListingDetail.css';

const ListingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [listing, setListing] = useState(null);
    const [owner, setOwner] = useState(null);
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [isMarkTradedModalOpen, setIsMarkTradedModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        const fetchListing = async () => {
            // Real Data Fetch
            const { data, error } = await supabase
                .from('items')
                .select('*, owner_id, profiles!owner_id(*)') // Join with profiles
                .eq('id', id)
                .single();

            if (data) {
                setListing(data);
                if (data.profiles) {
                    // Fetch actual traded items count for this owner
                    const { count: tradedCount } = await supabase
                        .from('items')
                        .select('*', { count: 'exact', head: true })
                        .eq('owner_id', data.owner_id)
                        .eq('status', 'traded');

                    setOwner({
                        id: data.owner_id,
                        name: data.profiles.full_name || data.profiles.username || 'User',
                        avatar: data.profiles.avatar_url || 'https://via.placeholder.com/150',
                        rating: data.profiles.rating || 0,
                        trades: tradedCount || 0,
                        verified: data.profiles.is_verified,
                        location: data.profiles.location || 'Cebu'
                    });
                }
            } else {
                // Fallback to Mock if not found in DB (for legacy mock links if any exist)
                const foundListing = MOCK_LISTINGS.find(l => l.id === parseInt(id));
                if (foundListing) {
                    setListing(foundListing);
                    const foundOwner = MOCK_USERS.find(u => u.id === foundListing.ownerId);
                    setOwner(foundOwner);
                } else {
                    console.error("Error fetching listing:", error);
                }
            }
        };

        fetchListing();
    }, [id]);

    const handleTradeOffer = async (offer) => {
        if (!user || !owner) return;

        // 1. Create or Find Conversation
        // Simple logic: Check if conversation exists (omitted for brevity, assume create new for now or rely on specific query)
        // For MVP, lets just insert a new one if we don't handle deduping perfectly, or try to query specific pair.

        try {
            // Find existing conversation
            const { data: existingConvs } = await supabase
                .from('conversations')
                .select('*')
                .contains('participants', [user.id, owner.id]);

            let convId;
            if (existingConvs && existingConvs.length > 0) {
                convId = existingConvs[0].id;
            } else {
                // Create new
                const { data: newConv, error } = await supabase
                    .from('conversations')
                    .insert([{
                        participants: [user.id, owner.id],
                        last_message: "Sent an offer"
                    }])
                    .select()
                    .single();

                if (error || !newConv) {
                    console.error("Conversation creation error:", error);
                    throw new Error("Unable to create conversation. Please run fix_chat_policies.sql in Supabase.");
                }
                convId = newConv.id;
            }

            // 2. Insert Offer Message
            const { error: msgError } = await supabase
                .from('messages')
                .insert([{
                    conversation_id: convId,
                    sender_id: user.id,
                    text: offer.text || "I have an offer for you!",
                    type: 'offer',
                    offer_details: {
                        item: offer.item, // Storing minimal snapshot of item offered
                        status: 'pending',
                        target_listing_id: listing.id
                    }
                }]);

            if (msgError) throw msgError;

            alert("Offer sent! Redirecting to chat...");
            navigate(`/messages/${convId}`);

        } catch (err) {
            console.error("Trade Error:", err);
            alert("Failed to send offer.");
        }
    };

    const handleChatClick = async () => {
        if (!user) {
            navigate('/login', { state: { from: `/listing/${id}` } });
            return;
        }

        try {
            const { data: existingConvs, error: searchError } = await supabase
                .from('conversations')
                .select('*')
                .contains('participants', [user.id, owner.id]);

            if (searchError) {
                console.error("Search error:", searchError);
                alert("Error checking conversations. Please try again.");
                return;
            }

            if (existingConvs && existingConvs.length > 0) {
                navigate(`/messages/${existingConvs[0].id}`);
            } else {
                // Create new conversation
                const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert([{
                        participants: [user.id, owner.id],
                        last_message: "Started a chat"
                    }])
                    .select()
                    .single();

                if (createError || !newConv) {
                    console.error("Create error:", createError);
                    alert("Unable to start chat. Please run fix_chat_policies.sql in Supabase first.");
                    return;
                }

                navigate(`/messages/${newConv.id}`);
            }
        } catch (e) {
            console.error("Chat error:", e);
            alert("Error starting chat. Please try again.");
        }
    };
    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this listing?")) return;

        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Delete error:", error);
            alert("Failed to delete listing.");
        } else {
            alert("Listing deleted.");
            navigate('/');
        }
    };

    const handleMarkTradedClick = () => {
        setIsMarkTradedModalOpen(true);
    };

    const confirmMarkTraded = async (partnerId, note) => {
        try {
            const dbPartnerId = partnerId === 'outside' ? null : partnerId;

            // 1. Update Item Status
            const { error: itemError } = await supabase
                .from('items')
                .update({
                    status: 'traded',
                    traded_with: dbPartnerId
                })
                .eq('id', id);

            if (itemError) throw itemError;

            // 2. Increment User's Trade Count
            // We fetch the current count first to increment it
            const { data: profile } = await supabase
                .from('profiles')
                .select('trades_count')
                .eq('id', user.id)
                .single();

            const newCount = (profile?.trades_count || 0) + 1;

            await supabase
                .from('profiles')
                .update({ trades_count: newCount })
                .eq('id', user.id);

            // 3. Update Local State
            setListing({ ...listing, status: 'traded', traded_with: dbPartnerId });
            setIsMarkTradedModalOpen(false);
            alert("Item marked as traded! Your trade count has been updated.");

        } catch (error) {
            console.error("Trade confirmation error:", error);
            alert("Failed to update status: " + error.message);
        }
    };

    const handleEdit = () => {
        navigate(`/edit/${id}`);
    };

    if (!listing) return <div className="container py-4">Loading or Not Found...</div>;

    const isLookingFor = listing.type === 'looking_for';

    return (
        <div className="listing-detail-page">
            <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to Browse</Link>

            <div className="listing-grid">
                {/* Left: Images */}
                <div className="listing-images">
                    {listing.photos && listing.photos.length > 0 ? (
                        <img src={listing.photos[0]} alt={listing.title} className="main-image" />
                    ) : (
                        <div className="image-placeholder-large">
                            No Image Available
                        </div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="listing-info">
                    <div className="listing-header">
                        <span className={`badge ${listing.status === 'traded' ? 'badge-gray' : isLookingFor ? 'badge-blue' : 'badge-green'}`}>
                            {listing.status === 'traded' ? 'TRADED' : isLookingFor ? 'LOOKING FOR' : 'AVAILABLE'}
                        </span>
                        <span className="listing-date">Posted on {new Date(listing.created_at || listing.postedAt || Date.now()).toLocaleDateString()}</span>
                    </div>

                    <h1 className="listing-title">{listing.title}</h1>

                    <div className="listing-location">
                        <MapPin size={18} />
                        {listing.location}
                    </div>

                    <div className="listing-section">
                        <h3>Description</h3>
                        <p>{listing.description}</p>
                    </div>

                    {listing.condition !== 'N/A' && (
                        <div className="listing-section">
                            <h3>Condition</h3>
                            <p>{listing.condition}</p>
                        </div>
                    )}

                    {listing.lookingFor && (
                        <div className="listing-section highlight-box">
                            <h3>{isLookingFor ? 'Offering' : 'Willing to swap for'}</h3>
                            <p>{listing.lookingFor}</p>
                        </div>
                    )}

                    {listing.status === 'traded' && (
                        <div className="listing-section highlight-box success">
                            <h3>⚠️ TRADED</h3>
                            <p>This item has already been traded.</p>
                        </div>
                    )}

                    {/* Owner Card */}
                    {owner && (
                        <div className="owner-card">
                            <div className="owner-header">
                                <img src={owner.avatar} alt={owner.name} className="owner-avatar" />
                                <div>
                                    <div className="owner-name">
                                        {owner.name}
                                        {owner.verified && <span className="verified-badge" title="Verified Cebu User">✓</span>}
                                    </div>
                                    <div className="owner-meta">Ref: {owner.rating} ★ ({owner.trades} trades)</div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="owner-actions">
                                {user?.id === owner.id ? (
                                    <>
                                        {listing.status !== 'traded' && (
                                            <div className="action-grid">
                                                <button className="btn btn-secondary" onClick={handleMarkTradedClick}>
                                                    <CheckCircle size={18} /> Mark Traded
                                                </button>
                                                <button className="btn btn-outline" onClick={handleEdit}>
                                                    <Edit2 size={18} /> Edit
                                                </button>
                                            </div>
                                        )}
                                        <button className="btn btn-outline-danger w-full mt-2" onClick={handleDelete}>
                                            <Trash2 size={18} /> Delete Listing
                                        </button>
                                    </>
                                ) : (
                                    listing.status !== 'traded' ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                            <button className="btn btn-outline w-full" onClick={() => navigate(`/profile/${owner.id}`)}>
                                                <User size={18} /> Visit Profile
                                            </button>
                                            <button className="btn btn-primary w-full" onClick={handleChatClick}>
                                                <MessageCircle size={18} /> Make Offer / Chat
                                            </button>
                                            <button className="btn btn-ghost w-full" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }} onClick={() => {
                                                if (!user) {
                                                    navigate('/login');
                                                } else {
                                                    setIsReportModalOpen(true);
                                                }
                                            }}>
                                                Report Listing
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="btn btn-disabled w-full" disabled>
                                            Item Traded
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    <div className="safety-tip">
                        <AlertTriangle size={16} />
                        <span>Always verify the item before meeting and trade only in safe, public places like malls or parks. Protect your personal information and prioritize your safety at all times.</span>
                    </div>
                </div>
            </div>

            <TradeModal
                isOpen={isTradeModalOpen}
                onClose={() => setIsTradeModalOpen(false)}
                targetListing={listing}
                onVerifyOffer={handleTradeOffer}
            />

            <MarkTradedModal
                isOpen={isMarkTradedModalOpen}
                onClose={() => setIsMarkTradedModalOpen(false)}
                listingId={id}
                onConfirm={confirmMarkTraded}
            />

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetType="item"
                targetId={listing.id}
                targetName={listing.title}
            />
        </div>
    );
};

export default ListingDetail;
