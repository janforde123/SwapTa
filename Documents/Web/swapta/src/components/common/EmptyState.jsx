import React from 'react';
import { PackageOpen } from 'lucide-react';
import './EmptyState.css';

const EmptyState = ({ title = "No items found", message = "Try adjusting your filters or check back later.", icon: Icon = PackageOpen }) => {
    return (
        <div className="empty-state">
            <div className="empty-icon-wrapper">
                <Icon size={48} className="empty-icon" />
            </div>
            <h3 className="empty-title">{title}</h3>
            <p className="empty-message">{message}</p>
        </div>
    );
};

export default EmptyState;
