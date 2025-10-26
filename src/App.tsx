import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { SenderAuth } from './components/SenderAuth';
import { SenderDashboard } from './components/SenderDashboard';
import { CreateEvent } from './components/CreateEvent';
import { EventManagement } from './components/EventManagement';
import { GuestAccess } from './components/GuestAccess';
import { EventGallery } from './components/EventGallery';

type View = 
  | { type: 'landing' }
  | { type: 'auth' }
  | { type: 'dashboard' }
  | { type: 'create-event' }
  | { type: 'manage-event'; event: any }
  | { type: 'guest-access'; token: string }
  | { type: 'gallery'; eventId: string; userType: 'sender' | 'guest'; userId: string; username: string; guestToken?: string };

export default function App() {
  const [view, setView] = useState<View>({ type: 'landing' });
  const [accessToken, setAccessToken] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if URL has guest token
    const path = window.location.pathname;
    const guestMatch = path.match(/\/guest\/([^/]+)/);
    
    if (guestMatch) {
      const token = guestMatch[1];
      setView({ type: 'guest-access', token });
    }

    // Check for saved auth
    const savedToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser && !guestMatch) {
      setAccessToken(savedToken);
      setUser(JSON.parse(savedUser));
      setView({ type: 'dashboard' });
    }
  }, []);

  const handleAuthSuccess = (token: string, userData: any) => {
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setView({ type: 'dashboard' });
  };

  const handleLogout = () => {
    setAccessToken('');
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setView({ type: 'landing' });
  };

  const handleEventCreated = (event: any) => {
    setView({ type: 'manage-event', event });
  };

  const handleViewGalleryFromSender = (eventId: string) => {
    setView({
      type: 'gallery',
      eventId,
      userType: 'sender',
      userId: user.id,
      username: user.user_metadata?.name || 'Organizer',
    });
  };

  const handleViewGalleryFromGuest = (eventId: string, guestToken: string, guestData: any) => {
    setView({
      type: 'gallery',
      eventId,
      userType: 'guest',
      userId: guestData.guestId,
      username: guestData.guest.username,
      guestToken,
    });
  };

  // Render based on view
  switch (view.type) {
    case 'landing':
      return <LandingPage onGetStarted={() => setView({ type: 'auth' })} />;

    case 'auth':
      return (
        <SenderAuth
          onAuthSuccess={handleAuthSuccess}
        />
      );

    case 'dashboard':
      return (
        <SenderDashboard
          accessToken={accessToken}
          user={user}
          onCreateEvent={() => setView({ type: 'create-event' })}
          onSelectEvent={(event) => setView({ type: 'manage-event', event })}
          onLogout={handleLogout}
        />
      );

    case 'create-event':
      return (
        <CreateEvent
          accessToken={accessToken}
          onBack={() => setView({ type: 'dashboard' })}
          onEventCreated={handleEventCreated}
        />
      );

    case 'manage-event':
      return (
        <EventManagement
          event={view.event}
          accessToken={accessToken}
          onBack={() => setView({ type: 'dashboard' })}
          onViewGallery={handleViewGalleryFromSender}
        />
      );

    case 'guest-access':
      return (
        <GuestAccess
          token={view.token}
          onViewGallery={handleViewGalleryFromGuest}
        />
      );

    case 'gallery':
      return (
        <EventGallery
          eventId={view.eventId}
          userType={view.userType}
          userId={view.userId}
          username={view.username}
          accessToken={view.userType === 'sender' ? accessToken : undefined}
          guestToken={view.guestToken}
          onBack={() => {
            if (view.userType === 'sender') {
              setView({ type: 'dashboard' });
            } else {
              setView({ type: 'guest-access', token: view.guestToken || '' });
            }
          }}
        />
      );

    default:
      return <LandingPage onGetStarted={() => setView({ type: 'auth' })} />;
  }
}
