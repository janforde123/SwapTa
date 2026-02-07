import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Menu, X, User, MessageCircle, PlusCircle, Search, Moon, Sun } from 'lucide-react';
import logo from '../../assets/logo.png';
import './Layout.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    useEffect(() => {
        if (!user) return;

        const fetchUnreadCount = async () => {
            const { data: conversations } = await supabase
                .from('conversations')
                .select('id')
                .contains('participants', [user.id]);

            if (!conversations) return;

            const convIds = conversations.map(c => c.id);

            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .in('conversation_id', convIds)
                .eq('is_read', false)
                .neq('sender_id', user.id);

            setUnreadCount(count || 0);
        };

        fetchUnreadCount();

        // Subscribe to messages (new messages and read status changes)
        const channel = supabase
            .channel('unread-messages')
            .on('postgres_changes', {
                event: '*', // Listen to all changes (INSERT for new, UPDATE for read status)
                schema: 'public',
                table: 'messages'
            }, () => {
                // Small delay to ensure DB finishes update before we fetch count
                setTimeout(fetchUnreadCount, 300);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return (
        <nav className="navbar">
            <div className="container nav-content">
                <Link to="/" className="logo">
                    <img src={logo} alt="SwapTa!" className="logo-img" />
                    <span>SwapTa!</span>
                </Link>

                {/* Desktop Nav */}
                <div className="nav-links desktop-only">
                    <Link to="/" className="nav-link">Home</Link>
                    {user ? (
                        <>
                            <Link to="/messages" className="nav-link" style={{ position: 'relative' }}>
                                <MessageCircle size={20} />
                                {unreadCount > 0 && (
                                    <span className="unread-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                )}
                            </Link>
                            <Link to="/create" className="btn btn-primary"><PlusCircle size={18} /> Post</Link>
                            <button onClick={() => setIsDark(!isDark)} className="btn btn-ghost btn-sm" title="Toggle dark mode">
                                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <div className="user-menu">
                                <Link to={`/profile/${user.id}`} className="nav-link user-link">
                                    <img src={user.user_metadata?.avatar_url || user.avatar_url || 'https://ui-avatars.com/api/?name=User'} alt={user.name} className="avatar-sm" />
                                </Link>
                                <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsDark(!isDark)} className="btn btn-ghost btn-sm" title="Toggle dark mode">
                                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <Link to="/login" className="btn btn-secondary">Login</Link>
                        </>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="mobile-menu">
                    <Link to="/" onClick={() => setIsOpen(false)}>Home</Link>
                    {user ? (
                        <>
                            <Link to="/create" onClick={() => setIsOpen(false)}>Post Ad</Link>
                            <Link to="/messages" onClick={() => setIsOpen(false)}>Messages</Link>
                            <Link to={`/profile/${user.id}`} onClick={() => setIsOpen(false)}>Profile</Link>
                            <button onClick={() => { logout(); setIsOpen(false); }}>Logout</button>
                        </>
                    ) : (
                        <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
                    )}
                </div>
            )}
        </nav>
    );
};

const Footer = () => (
    <footer className="footer">
        <div className="container">
            <p>&copy; 2026 SwapTa! Cebu. All rights reserved.</p>
        </div>
    </footer>
);

export const Layout = ({ children }) => {
    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="main-content container">
                {children}
            </main>
            <Footer />
        </div>
    );
};
