import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { MOCK_LISTINGS } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import './TradeModal.css';

const TradeModal = ({ isOpen, onClose, targetListing, onVerifyOffer }) => {
  const { user } = useAuth();
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [offerMessage, setOfferMessage] = useState('');

  if (!isOpen || !user) return null;

  // Get current user's available items
  const myItems = MOCK_LISTINGS.filter(
    item => item.ownerId === user.id && item.type === 'item' && item.status !== 'traded'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedItemId && !offerMessage) return;

    const selectedItem = myItems.find(i => i.id === parseInt(selectedItemId));

    // Construct the offer object
    const offer = {
      type: 'offer', // 'message' or 'offer'
      itemId: selectedItemId,
      item: selectedItem, // Simplified: passing full object for mock convenience
      text: offerMessage,
      targetListingId: targetListing?.id // Context of what I want from them
    };

    onVerifyOffer(offer);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Make an Offer</h2>
          <button onClick={onClose} className="close-btn"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="trade-form">
          <div className="target-summary">
            <p>You are interested in:</p>
            <div className="mini-listing">
              {targetListing?.photos?.[0] && <img src={targetListing.photos[0]} alt="" />}
              <span>{targetListing?.title || "User's Item"}</span>
            </div>
          </div>

          <div className="form-group">
            <label>Select an item to swap (Optional if paying cash/service)</label>
            <div className="item-selector">
              {myItems.length > 0 ? (
                myItems.map(item => (
                  <div
                    key={item.id}
                    className={`select-item ${selectedItemId === item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    <div className="select-img-wrapper">
                      {item.photos?.[0] && <img src={item.photos[0]} alt="" />}
                    </div>
                    <span className="select-name">{item.title}</span>
                    {selectedItemId === item.id && <div className="check-mark"><Check size={12} /></div>}
                  </div>
                ))
              ) : (
                <p className="no-items-msg">You have no items listed yet. <br />You can offer cash or service description below.</p>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Message / Offer Details</label>
            <textarea
              placeholder="Hi, would you be interested in swapping for..."
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              rows="3"
              required={!selectedItemId}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!selectedItemId && !offerMessage}>Send Offer</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeModal;
