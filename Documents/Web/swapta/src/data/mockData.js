export const MOCK_USERS = [
    {
        id: 1,
        name: 'Janford Taller',
        avatar: 'https://ui-avatars.com/api/?name=Janford+Taller&background=random',
        rating: 4.8,
        trades: 12,
        verified: true,
        location: 'Cebu City',
        joined: 'Jan 2024',
        bio: 'Tech enthusiast and vintage collector.'
    }
];

export const MOCK_LISTINGS = [
    {
        id: 101,
        ownerId: 1,
        title: 'Vintage Camera',
        description: 'A classic 35mm film camera in great condition.',
        category: 'Electronics',
        condition: 'Good',
        type: 'item',
        location: 'Cebu City',
        photos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500'],
        status: 'active',
        created_at: new Date().toISOString()
    }
];
