import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Send, Image, MoreVertical, X, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import OfferCard from '../components/common/OfferCard';
import ReportModal from '../components/common/ReportModal';
import '../styles/Chat.css';

const Chat = () => {
    const { id } = useParams(); // Can be conversation ID or (in future) user ID to start chat
    const { user } = useAuth();
    const navigate = useNavigate();

    const [conversations, setConversations] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const messagesEndRef = useRef(null);

    // 1. Fetch Conversations
    useEffect(() => {
        if (!user) return;

        const fetchConversations = async () => {
            setLoading(true);
            // Fetch conversations where current user is a participant
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .contains('participants', [user.id])
                .order('last_updated', { ascending: false });

            if (error) {
                console.error("Error fetching chats:", error);
            } else {
                // Enrich with other user's profile
                const enriched = await Promise.all(data.map(async (conv) => {
                    const otherUserId = conv.participants.find(uid => uid !== user.id);
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', otherUserId)
                        .single();

                    // Check for unread messages from other user
                    const { count: unreadCount } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('conversation_id', conv.id)
                        .eq('is_read', false)
                        .neq('sender_id', user.id);

                    return {
                        ...conv,
                        otherUser: profile || { name: 'Unknown', avatar_url: 'https://via.placeholder.com/150' },
                        unreadCount: unreadCount || 0
                    };
                }));

                setConversations(enriched);
                if (enriched.length > 0 && !selectedChatId) {
                    // If ID param is present, try to find that chat, otherwise default to first
                    // Note: If ID is not a conversation ID but a User ID (for "Msg User"), logic would differ.
                    // For now assuming ID is conversation ID or empty.
                    if (id) {
                        const target = enriched.find(c => c.id == id); // loose equal for string/int
                        setSelectedChatId(target ? target.id : enriched[0].id);
                    } else {
                        setSelectedChatId(enriched[0].id);
                    }
                }
            }
            setLoading(false);
        };

        fetchConversations();

        // Subscribe to new conversations (optional, skipping for brevity)
    }, [user, id]);

    // 2. Fetch Messages & Realtime for Selected Chat
    useEffect(() => {
        if (!selectedChatId) return;

        const markAsRead = async () => {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', selectedChatId)
                .neq('sender_id', user.id)
                .eq('is_read', false);

            if (!error) {
                // Update local conversations list
                setConversations(prev => prev.map(c =>
                    c.id === selectedChatId ? { ...c, unreadCount: 0 } : c
                ));
                // Update local messages state for instant seen UI
                setMessages(prev => prev.map(m =>
                    m.conversation_id === selectedChatId && m.sender_id !== user.id
                        ? { ...m, is_read: true } : m
                ));
            }
        };

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', selectedChatId)
                .order('created_at', { ascending: true });

            if (!error) {
                setMessages(data);
                markAsRead();
            }
        };

        fetchMessages();

        // Realtime Subscription
        const channel = supabase
            .channel(`chat:${selectedChatId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${selectedChatId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
                if (payload.new.sender_id !== user.id) {
                    markAsRead();
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${selectedChatId}`
            }, (payload) => {
                setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedChatId, user]);

    // Scroll to bottom effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const activeChat = conversations.find(c => c.id === selectedChatId);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!messageText.trim() && !imageFile) || !selectedChatId) return;

        const text = messageText;
        const tempId = Date.now();
        let imageUrl = null;
        let localImageData = null;

        // If it's an image, create a local preview to show immediately
        if (imageFile) {
            localImageData = URL.createObjectURL(imageFile);
        }

        // Optimistic UI update - DO THIS FIRST
        const optimisticMessage = {
            id: tempId,
            conversation_id: selectedChatId,
            sender_id: user.id,
            text: text || (localImageData ? "📷 Image" : ""),
            type: localImageData ? 'image' : 'text',
            image_url: localImageData, // Show local preview
            created_at: new Date().toISOString(),
            is_read: false,
            is_optimistic: true
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setMessageText('');
        const currentImageFile = imageFile; // Store reference
        setImageFile(null); // Clear input immediately

        try {
            // Upload image if present
            if (currentImageFile) {
                setUploading(true);
                const fileExt = currentImageFile.name.split('.').pop();
                const fileName = `chat_${user.id}_${Date.now()}.${fileExt}`;
                const filePath = `chat-images/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('listings')
                    .upload(filePath, currentImageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('listings')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
                setUploading(false);
            }

            const { data, error } = await supabase
                .from('messages')
                .insert([{
                    conversation_id: selectedChatId,
                    sender_id: user.id,
                    text: text || (imageUrl ? "Sent an image" : ""),
                    type: imageUrl ? 'image' : 'text',
                    image_url: imageUrl
                }])
                .select()
                .single();

            if (error) throw error;

            // Replace optimistic message with real one
            setMessages(prev => prev.map(m => m.id === tempId ? data : m));

            // Update conversation last_message
            await supabase
                .from('conversations')
                .update({ last_message: text || "📷 Image", last_updated: new Date() })
                .eq('id', selectedChatId);

        } catch (error) {
            console.error("Send error:", error);
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
            alert("Failed to send message: " + (error.message || "Unknown error"));
            setUploading(false);
        }
    };

    const handleReportConversation = () => {
        setIsReportModalOpen(true);
        setMenuOpen(false);
    };

    const handleImageSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleOfferAction = async (msgId, action) => {
        // Update message status in DB
        const { error } = await supabase
            .from('messages')
            .update({
                offer_details: {
                    ...messages.find(m => m.id === msgId)?.offer_details,
                    status: action
                }
            })
            .eq('id', msgId);

        if (error) {
            console.error("Error updating offer:", error);
            return;
        }

        // Send system message notification (optional, skipping for MV)
    };

    if (loading && conversations.length === 0) return <div className="p-4">Loading chats...</div>;

    return (
        <div className="chat-container">
            {/* Sidebar - Conversation List */}
            <div className={`chat-sidebar ${selectedChatId ? 'mobile-hidden' : ''}`}>
                <div className="sidebar-header">
                    <h2>Messages</h2>
                </div>
                <div className="conversation-list">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-muted">No conversations yet.</div>
                    ) : (
                        conversations.map(chat => (
                            <div
                                key={chat.id}
                                className={`conversation-item ${selectedChatId === chat.id ? 'active' : ''} ${chat.unreadCount > 0 ? 'unread' : ''}`}
                                onClick={() => setSelectedChatId(chat.id)}
                            >
                                <img src={chat.otherUser.avatar_url || 'https://via.placeholder.com/150'} alt="Avatar" className="avatar-sm" />
                                <div className="conv-info">
                                    <div className="conv-name">
                                        {chat.otherUser.full_name || chat.otherUser.username || 'User'}
                                        {chat.unreadCount > 0 && <span className="unread-dot"></span>}
                                    </div>
                                    <div className="conv-preview">{chat.last_message}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`chat-main ${!selectedChatId && 'mobile-hidden'}`}>
                {activeChat ? (
                    <>
                        <div className="chat-header">
                            <button className="back-btn mobile-only" onClick={() => setSelectedChatId(null)}>
                                <ArrowLeft size={20} />
                            </button>
                            <div
                                className="header-user"
                                onClick={() => navigate(`/profile/${activeChat.otherUser.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <img src={activeChat.otherUser.avatar_url || 'https://via.placeholder.com/150'} alt="Avatar" className="avatar-sm" />
                                <h3>{activeChat.otherUser.full_name || 'User'}</h3>
                            </div>
                            <div className="header-actions">
                                <div className="dropdown-wrapper">
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setMenuOpen(!menuOpen)}
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    {menuOpen && (
                                        <div className="chat-menu-dropdown">
                                            <button onClick={handleReportConversation}>Report Conversation</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="messages-area">
                            {messages.map(msg => {
                                const isMe = msg.sender_id === user?.id;
                                return (
                                    <div key={msg.id} className={`message-row ${isMe ? 'me' : 'them'}`}>
                                        {!isMe && <img src={activeChat.otherUser.avatar_url} className="msg-avatar" />}

                                        {msg.type === 'offer' ? (
                                            <OfferCard
                                                // OfferCard expects { status, item, text } structure
                                                // Adapter for DB structure
                                                offer={{
                                                    ...msg,
                                                    status: msg.offer_details?.status || 'pending',
                                                    from_db: true,
                                                    item: msg.offer_details?.item, // Ideally fetched fully, but assuming stored in jsonb for now
                                                    text: msg.text
                                                }}
                                                isMe={isMe}
                                                onAccept={() => handleOfferAction(msg.id, 'accepted')}
                                                onDecline={() => handleOfferAction(msg.id, 'declined')}
                                            />
                                        ) : msg.type === 'image' ? (
                                            <div className={`message-bubble ${msg.is_optimistic ? 'optimistic' : ''}`}>
                                                {msg.text && <p>{msg.text}</p>}
                                                <img
                                                    src={msg.image_url}
                                                    alt="Shared image"
                                                    style={{ maxWidth: '250px', borderRadius: '8px', marginTop: '4px', cursor: 'zoom-in' }}
                                                    onClick={() => setSelectedImage(msg.image_url)}
                                                />
                                                {msg.is_optimistic && <div className="typing-indicator">Uploading...</div>}
                                            </div>
                                        ) : (
                                            <div className="message-bubble">
                                                {msg.text}
                                            </div>
                                        )}

                                        <div className="message-time">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {isMe && (
                                                <span className={`read-status ${msg.is_read ? 'seen' : ''}`}>
                                                    {msg.is_read ? <CheckCheck size={12} /> : <Check size={12} />}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            <label htmlFor="image-upload" className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                                <Image size={20} />
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            {imageFile && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                                    📎 {imageFile.name}
                                </span>
                            )}
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary btn-round" disabled={uploading}>
                                {uploading ? '...' : <Send size={18} />}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        {conversations.length > 0 ? "Select a conversation" : "No messages yet. Go explore items to swap!"}
                    </div>
                )}
            </div>

            {/* Image Viewer Modal */}
            {selectedImage && (
                <div className="image-viewer-modal" onClick={() => setSelectedImage(null)}>
                    <button className="close-viewer" onClick={() => setSelectedImage(null)}>
                        <X size={32} />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Zoomed view"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetType="conversation"
                targetId={selectedChatId}
                targetName={activeChat ? `Chat with ${activeChat.otherUser.full_name || 'User'}` : 'This conversation'}
            />
        </div>
    );
};

export default Chat;
