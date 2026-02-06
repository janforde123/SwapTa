import React from 'react';
import { Check, X } from 'lucide-react';
import './OfferCard.css';

const OfferCard = ({ offer, isMe, onAccept, onDecline }) => {
    return (
        <div className={`offer-card ${isMe ? 'offer-me' : 'offer-them'} ${offer.status}`}>
            <div className="offer-header">
                <span className="offer-label">
                    {isMe ? 'You sent an offer' : 'Sent you an offer'}
                </span>
                <span className={`offer-status ${offer.status || 'pending'}`}>
                    {offer.status?.toUpperCase() || 'PENDING'}
                </span>
            </div>

            <div className="offer-item">
                {offer.item?.photos?.[0] && (
                    <img src={offer.item.photos[0]} alt="" className="offer-img" />
                )}
                <div className="offer-details">
                    <h4>{offer.item?.title || "Item Offer"}</h4>
                    {offer.cash && <p>+ ₱{offer.cash} Cash</p>}
                </div>
            </div>

            {offer.text && <p className="offer-msg">"{offer.text}"</p>}

            {!isMe && (!offer.status || offer.status === 'pending') && (
                <div className="offer-actions">
                    <button className="btn-decline" onClick={onDecline}>Decline</button>
                    <button className="btn-accept" onClick={onAccept}>Accept Trade</button>
                </div>
            )}
        </div>
    );
};

export default OfferCard;
