import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, Camera, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './TradeModal.css'; // Reuse modal styles

const EditProfileModal = ({ isOpen, onClose, profile, onUpdate }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        location: profile?.location || '',
        bio: profile?.bio || ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(profile?.avatar_url);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let avatarUrl = profile.avatar_url;

            // 1. Upload Avatar if changed
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars') // Ensure 'avatars' bucket exists
                    .upload(filePath, avatarFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                avatarUrl = publicUrl;
            }

            // 2. Update Profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    location: formData.location,
                    bio: formData.bio,
                    avatar_url: avatarUrl,
                    updated_at: new Date()
                })
                .eq('id', user.id);

            if (error) throw error;

            alert("Profile updated!");
            onUpdate(); // Refresh parent
            onClose();
        } catch (err) {
            console.error("Error updating profile:", err);
            alert("Failed to update profile: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Edit Profile</h2>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem' }}>
                    <div className="avatar-upload-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                            <img
                                src={previewUrl}
                                alt="Avatar"
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                            />
                            <label style={{
                                position: 'absolute', bottom: 0, right: 0,
                                background: 'var(--primary)', color: 'white',
                                borderRadius: '50%', padding: '6px', cursor: 'pointer'
                            }}>
                                <Camera size={16} />
                                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Location</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. Cebu City"
                            className="input-field"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label>Bio</label>
                        <textarea
                            name="bio"
                            rows="3"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell us about yourself..."
                            className="input-field"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="btn btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
