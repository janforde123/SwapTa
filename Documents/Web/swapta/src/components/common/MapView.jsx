import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon issue with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapView = ({ listings }) => {
    // Cebu City Default Position
    const defaultPosition = [10.3157, 123.8854];

    return (
        <div className="map-container" style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
            <MapContainer center={defaultPosition} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {listings.map(listing => (
                    (listing.lat && listing.lng) && (
                        <Marker key={listing.id} position={[listing.lat, listing.lng]}>
                            <Popup>
                                <div style={{ minWidth: '150px' }}>
                                    <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>{listing.title}</strong>
                                    <span className={`badge ${listing.type === 'looking_for' ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                        {listing.type === 'looking_for' ? 'Looking For' : 'Item'}
                                    </span>
                                    <p style={{ margin: '8px 0', fontSize: '12px' }}>{listing.location}</p>
                                    <Link to={`/listing/${listing.id}`} style={{ fontSize: '12px', color: '#ff8800', fontWeight: 'bold' }}>View Details</Link>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    );
};

export default MapView;
