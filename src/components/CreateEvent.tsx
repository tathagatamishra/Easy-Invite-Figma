import { useState } from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const OCCASIONS = [
  'Wedding',
  'Birthday',
  'Anniversary',
  'Baby Shower',
  'Engagement',
  'Graduation',
  'Housewarming',
  'Festival',
  'Retirement',
  'Other',
];

interface CreateEventProps {
  accessToken: string;
  onBack: () => void;
  onEventCreated: (event: any) => void;
}

export function CreateEvent({ accessToken, onBack, onEventCreated }: CreateEventProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [occasion, setOccasion] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-892911f0/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name,
            occasion,
            description,
            date,
          }),
        }
      );

      const data = await response.json();
      console.log('Event creation response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      onEventCreated(data.event);
    } catch (err: any) {
      console.error('Create event error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>
              Set up your event details and start inviting guests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Sarah & John's Wedding"
                  required
                />
              </div>

              <div>
                <Label htmlFor="occasion">Occasion *</Label>
                <Select value={occasion} onValueChange={setOccasion} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCASIONS.map((occ) => (
                      <SelectItem key={occ} value={occ.toLowerCase()}>
                        {occ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Event Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Tell your guests about the event..."
                  rows={4}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !occasion}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <div className="max-w-2xl mx-auto mt-8">
          <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Choose an invitation template or upload your own card</li>
                <li>Add your guests' WhatsApp numbers</li>
                <li>Customize messages (optional)</li>
                <li>Send invitations to all guests at once</li>
                <li>Track RSVPs and manage the event gallery</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
