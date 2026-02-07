import React from 'react';
import { X } from 'lucide-react';
import '../../styles/PolicyPages.css';

const LegalModal = ({ isOpen, onClose, title, content }) => {
    if (!isOpen) return null;

    return (
        <div className="legal-modal-overlay" onClick={onClose}>
            <div className="legal-modal-container" onClick={e => e.stopPropagation()}>
                <div className="legal-modal-header">
                    <h2>{title}</h2>
                    <button className="legal-modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="legal-modal-body">
                    {content}
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
