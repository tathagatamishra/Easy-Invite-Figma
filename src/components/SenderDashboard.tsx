import { useState, useEffect } from 'react';
import { Plus, Calendar, Users, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Event {
  id: string;
  name: string;
  occasion: string;
  description: string;
  date: string;
  guests: any[];
  createdAt: string;
}

interface SenderDashboardProps {
  accessToken: string;
  user: any;
  onCreateEvent: () => void;
  onSelectEvent: (event: Event) => void;
  onLogout: () => void;
}

export function SenderDashboard({
  accessToken,
  user,
  onCreateEvent,
  onSelectEvent,
  onLogout,
}: SenderDashboardProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-892911f0/events`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      console.log('Events loaded:', data);

      if (response.ok) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Load events error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-purple-600">WhatsApp Invitations</h2>
            <p className="text-gray-600">Welcome, {user?.user_metadata?.name}</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1>My Events</h1>
            <p className="text-gray-600">Manage your events and invitations</p>
          </div>
          <Button onClick={onCreateEvent} className="bg-gradient-to-r from-purple-600 to-pink-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="mb-2">No Events Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first event to start sending invitations
              </p>
              <Button onClick={onCreateEvent} className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card
                key={event.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onSelectEvent(event)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{event.name}</CardTitle>
                      <CardDescription className="capitalize">{event.occasion}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {event.guests?.length || 0} guests
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
