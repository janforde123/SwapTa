import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Upload, Camera, Type, X } from 'lucide-react';
import '../styles/CreateListing.css';

const CreateListing = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID if editing
    const { user } = useAuth();
    const [listingType, setListingType] = useState('item');
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]); // Keep track of old photos

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        condition: 'Used - Good',
        lookingFor: '',
        location: user?.location || '',
    });

    useEffect(() => {
        if (id) {
            fetchListingData();
        }
    }, [id]);

    const fetchListingData = async () => {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(error);
            alert("Error fetching listing data.");
        } else if (data) {
            // Check ownership
            if (user && data.owner_id !== user.id) {
                alert("You cannot edit this listing.");
                navigate('/');
                return;
            }

            setFormData({
                title: data.title,
                description: data.description || '',
                category: data.category || '',
                condition: data.condition || 'Used - Good',
                lookingFor: data.looking_for || '',
                location: data.location || ''
            });
            setListingType(data.type);
            setExistingPhotos(data.photos || []);
            setPreviewUrls(data.photos || []);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...newFiles]);

            // Generate previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls((prev) => [...prev, ...newPreviews]);
        }
    };

    const uploadImages = async () => {
        const uploadedUrls = [];
        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('listings')
                .upload(filePath, file);

            if (uploadError) {
                console.error("Upload Error:", uploadError);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('listings')
                .getPublicUrl(filePath);

            uploadedUrls.push(publicUrl);
        }
        return uploadedUrls;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in.");
            return;
        }

        setUploading(true);

        // Validation: At least one photo required
        if (!id && files.length === 0) {
            alert("Please add at least one photo. Listings with images get much more engagement!");
            setUploading(false);
            return;
        }

        if (id && existingPhotos.length === 0 && files.length === 0) {
            alert("Listing must have at least one photo.");
            setUploading(false);
            return;
        }

        try {
            // 1. Upload New Images
            const newImageUrls = await uploadImages();

            // Combine old URLs (if any) with new ones. 
            // NOTE: In a real app we might want UI to remove specific photos. 
            // For now, we append new ones to the list. If it was a fresh edit state, we rely on previewUrls logic which is messy here.
            // Simplified: If editing, we keep all 'existingPhotos' + 'newImageUrls'.

            const finalPhotos = id ? [...existingPhotos, ...newImageUrls] : newImageUrls;

            const payload = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                condition: listingType === 'item' ? formData.condition : 'N/A',
                type: listingType,
                looking_for: formData.lookingFor,
                location: formData.location,
                photos: finalPhotos,
            };

            if (id) {
                // UPDATE
                const { error } = await supabase
                    .from('items')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
                alert("Listing updated!");
            } else {
                // INSERT
                const { error } = await supabase
                    .from('items')
                    .insert([{
                        owner_id: user.id,
                        ...payload,
                        lat: 10.3157, // Mock coords
                        lng: 123.8854
                    }]);
                if (error) throw error;
                alert("Listing created successfully!");
            }

            navigate('/');
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="create-listing-page">
            <h1 className="page-title">{id ? 'Edit Listing' : 'Create a New Post'}</h1>

            <div className="type-toggle-container">
                <label className={`type-option ${listingType === 'item' ? 'active' : ''}`}>
                    <input
                        type="radio"
                        name="type"
                        value="item"
                        checked={listingType === 'item'}
                        onChange={() => setListingType('item')}
                    />
                    <span>I have an Item to Swap</span>
                </label>
                <label className={`type-option ${listingType === 'looking_for' ? 'active' : ''}`}>
                    <input
                        type="radio"
                        name="type"
                        value="looking_for"
                        checked={listingType === 'looking_for'}
                        onChange={() => setListingType('looking_for')}
                    />
                    <span>I am Looking For...</span>
                </label>
            </div>

            <form onSubmit={handleSubmit} className="listing-form">
                {/* Photos Section */}
                <div className="form-section">
                    <label className="section-label">Photos (Up to 10)</label>
                    <div className="photo-upload-area">
                        {previewUrls.map((url, idx) => (
                            <div key={idx} className="preview-img-wrapper" style={{ position: 'relative', width: '80px', height: '80px', display: 'inline-block', marginRight: '10px' }}>
                                <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                            </div>
                        ))}

                        <label className="upload-placeholder" style={{ cursor: 'pointer' }}>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <Camera size={32} />
                            <span>Add Photos</span>
                        </label>
                    </div>
                </div>

                {/* Details Section */}
                <div className="form-section">
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            name="title"
                            placeholder={listingType === 'item' ? "e.g. Canon AE-1 Camera" : "e.g. Looking for Gaming Mouse"}
                            required
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            rows="4"
                            placeholder="Describe the item or what you are looking for..."
                            required
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <div className="form-row">
                        {listingType === 'item' ? (
                            <>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select name="category" required value={formData.category} onChange={handleChange}>
                                        <option value="">Select Category</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Fashion">Fashion</option>
                                        <option value="Home">Home & Living</option>
                                        <option value="Hobbies">Hobbies</option>
                                        <option value="Services">Services</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Condition</label>
                                    <select name="condition" value={formData.condition} onChange={handleChange}>
                                        <option value="New">New</option>
                                        <option value="Used - Like New">Used - Like New</option>
                                        <option value="Used - Good">Used - Good</option>
                                        <option value="Used - Fair">Used - Fair</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Category (Optional)</label>
                                <select name="category" value={formData.category} onChange={handleChange}>
                                    <option value="">Select Category (Optional)</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Fashion">Fashion</option>
                                    <option value="Home">Home & Living</option>
                                    <option value="Hobbies">Hobbies</option>
                                    <option value="Services">Services</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>
                            {listingType === 'item' ? "What do you want in return? (Optional)" : "What can you offer? (Optional)"}
                        </label>
                        <input
                            type="text"
                            name="lookingFor"
                            placeholder={listingType === 'item' ? "e.g. Looking for Nintendo Switch games" : "e.g. Willing to pay cash or trade my old phone"}
                            value={formData.lookingFor}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Location</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary submit-btn" disabled={uploading}>
                    {uploading ? 'Processing...' : (id ? 'Update Post' : 'Post Now')}
                </button>
            </form>
        </div>
    );
};

export default CreateListing;
