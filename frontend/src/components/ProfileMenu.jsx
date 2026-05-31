import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, Shield, LogOut, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfileMenu = ({ user, onLogout }) => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    // CLOSE WHEN CLICKING OUTSIDE
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div style={{ position: 'relative' }} ref={menuRef}>

            {/* BUTTON */}
            <button
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    color: 'white'
                }}
            >
                <User size={16} />
                {user.username}
                <ChevronDown size={16} />
            </button>

            {/* DROPDOWN */}
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: '110%',
                        width: '220px',
                        background: '#0f172a',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        zIndex: 99999,   // 🔥 FIX OVERLAY ISSUE
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    }}
                >

                    <Link
                        to="/profile"
                        onClick={() => setOpen(false)}
                        style={itemStyle}
                    >
                        <User size={16} /> Profile
                    </Link>

                    <Link
                        to="/settings"
                        onClick={() => setOpen(false)}
                        style={itemStyle}
                    >
                        <Settings size={16} /> Settings
                    </Link>

                    <Link
                        to="/privacy-policy"
                        onClick={() => setOpen(false)}
                        style={itemStyle}
                    >
                        <Shield size={16} /> Privacy
                    </Link>

                    <button
    onClick={() => {
        onLogout();
        setOpen(false);
    }}
    style={itemStyle}
>
                        <LogOut size={16} /> Logout
                    </button>

                </div>
            )}
        </div>
    );
};

const itemStyle = {
    width: '100%',
    padding: '12px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    textDecoration: 'none'
};

export default ProfileMenu;