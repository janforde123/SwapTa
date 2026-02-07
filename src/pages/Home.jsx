import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MOCK_LISTINGS } from '../data/mockData'; // Keeping for fallback if needed, or remove
import ListingCard from '../components/common/ListingCard';
import EmptyState from '../components/common/EmptyState';
import MapView from '../components/common/MapView';
import { Filter, Map as MapIcon, Grid } from 'lucide-react';
import '../styles/Home.css';

const Home = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all'); // 'all', 'item', 'looking_for'
    const [viewMode, setViewMode] = useState('grid'); // 'grid' only

    useEffect(() => {
        const fetchListings = async () => {
            setLoading(true);
            let query = supabase
                .from('items')
                .select(`
                    *,
                    profiles:owner_id (
                        id,
                        full_name,
                        username,
                        avatar_url
                    )
                `);

            if (filterType !== 'all') {
                query = query.eq('type', filterType).eq('status', 'active');
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching listings:", error);
            } else {
                setListings(data || []);
            }
            setLoading(false);
        };

        fetchListings();
    }, [filterType]);

    const filteredListings = listings; // Already filtered by query

    return (
        <div className="home-page">
            {/* Hero / Welcome */}
            <section className="hero-section">
                <h1>Turn what you don’t need into something useful — Cebu style.</h1>
                <p>SwapTa! is a community-first marketplace where people in Cebu trade things they no longer need for items that matter. We’re currently in beta, so we’re still improving features and refining the experience—your feedback helps us make SwapTa better for everyone.</p>
            </section>

            {/* Filters & Actions */}
            <div className="feed-controls">
                <div className="filter-tabs">
                    <button
                        className={`tab-btn ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        All
                    </button>
                    <button
                        className={`tab-btn ${filterType === 'item' ? 'active' : ''}`}
                        onClick={() => setFilterType('item')}
                    >
                        Items Available
                    </button>
                    <button
                        className={`tab-btn ${filterType === 'looking_for' ? 'active' : ''}`}
                        onClick={() => setFilterType('looking_for')}
                    >
                        Looking For
                    </button>
                </div>

                <div className="view-toggles">
                    {/* Map removed by user request */}
                </div>
            </div>

            {/* Feed */}
            {viewMode === 'map' ? (
                <div className="map-view-wrapper" style={{ marginTop: '1rem' }}>
                    <MapView listings={filteredListings} />
                </div>
            ) : (
                <div className="listings-grid">
                    {filteredListings.length > 0 ? (
                        filteredListings.map(listing => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))
                    ) : (
                        <div className="col-span-full">
                            <EmptyState title="No posts found" message="Try changing the category or be the first to post!" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Home;
