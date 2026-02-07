import React from 'react';
import { MapPin, ArrowRightLeft, Search, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ListingCard.css';

const ListingCard = ({ listing }) => {
    const isLookingFor = listing.type === 'looking_for';

    // Calculate time ago
    const getTimeAgo = (dateString) => {
        const now = new Date();
        const posted = new Date(dateString);
        const diffMs = now - posted;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return posted.toLocaleDateString();
    };

    const posterName = listing.profiles?.full_name || listing.profiles?.username || 'User';

    return (
        <Link to={`/listing/${listing.id}`} className={`listing-card ${isLookingFor && listing.status === 'active' ? 'looking-for' : ''}`}>
            <div className="card-image-wrapper">
                {listing.photos && listing.photos.length > 0 ? (
                    <img src={listing.photos[0]} alt={listing.title} className="card-image" />
                ) : (
                    <div className="card-placeholder">
                        {isLookingFor ? <Search size={32} /> : <ArrowRightLeft size={32} />}
                    </div>
                )}
                {!isLookingFor && listing.status === 'active' && (
                    <div className="card-condition-badge">
                        {listing.condition}
                    </div>
                )}
                <div className={`card-badge ${listing.status === 'traded' ? 'traded' : isLookingFor ? 'looking-for-type' : 'available'}`}>
                    {listing.status === 'traded' ? 'TRADED' : isLookingFor ? 'LOOKING FOR' : 'AVAILABLE'}
                </div>
            </div>

            <div className="card-content">
                <h3 className="card-title">{listing.title}</h3>

                {isLookingFor && listing.lookingFor && (
                    <p className="card-offer">Offering: <span>Trade / Service</span></p>
                )}

                <div className="card-footer">
                    <div className="card-location">
                        <MapPin size={14} />
                        <span>{listing.location}</span>
                    </div>
                    <span className="card-time">{getTimeAgo(listing.created_at)}</span>
                </div>

                <div className="card-poster">
                    <User size={14} />
                    <span>{posterName}</span>
                </div>
            </div>
        </Link>
    );
};

export default ListingCard;
