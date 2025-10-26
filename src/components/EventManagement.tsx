import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Send, Image as ImageIcon, Upload, Plus, Trash2, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Guest {
  id: string;
  phone: string;
  customMessage?: string;
  customName?: string;
  guestToken: string;
  username: string;
}

interface EventManagementProps {
  event: any;
  accessToken: string;
  onBack: () => void;
  onViewGallery: (eventId: string) => void;
}

const TEMPLATE_CARDS = [
  'https://images.unsplash.com/photo-1738025275088-554086913a78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwaW52aXRhdGlvbiUyMGNhcmR8ZW58MXx8fHwxNzYxNDE4MzM4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1650584997985-e713a869ee77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ0aGRheSUyMGNlbGVicmF0aW9uJTIwcGFydHl8ZW58MXx8fHwxNzYxMzQyODU5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1760783319065-d5b31a94b017?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZXN0aXZlJTIwY2VsZWJyYXRpb24lMjBldmVudHxlbnwxfHx8fDE3NjE0MTgzMzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1761116362962-3cd736532ea2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwaW52aXRhdGlvbiUyMGRlc2lnbnxlbnwxfHx8fDE3NjE0MTgzMzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
];

export function EventManagement({ event, accessToken, onBack, onViewGallery }: EventManagementProps) {
  const [guests, setGuests] = useState<Guest[]>(event.guests || []);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_CARDS[0]);
  const [customCard, setCustomCard] = useState('');
  const [message, setMessage] = useState(`You're invited to ${event.name}!`);
  const [invitationType, setInvitationType] = useState<'standard' | 'customized'>('standard');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Guest management
  const [newGuests, setNewGuests] = useState([{ phone: '', customName: '', customMessage: '' }]);

  const addGuestRow = () => {
    setNewGuests([...newGuests, { phone: '', customName: '', customMessage: '' }]);
  };

  const removeGuestRow = (index: number) => {
    setNewGuests(newGuests.filter((_, i) => i !== index));
  };

  const updateGuestRow = (index: number, field: string, value: string) => {
    const updated = [...newGuests];
    updated[index] = { ...updated[index], [field]: value };
    setNewGuests(updated);
  };

  const handleAddGuests = async () => {
    const validGuests = newGuests.filter(g => g.phone.trim());
    if (validGuests.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-892911f0/events/${event.id}/guests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ guests: validGuests }),
        }
      );

      const data = await response.json();
      console.log('Add guests response:', data);

      if (response.ok) {
        setGuests([...guests, ...data.guests]);
        setNewGuests([{ phone: '', customName: '', customMessage: '' }]);
      }
    } catch (error) {
      console.error('Add guests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitations = async () => {
    setLoading(true);
    try {
      const cardImage = customCard || selectedTemplate;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-892911f0/events/${event.id}/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            cardImage,
            message,
            invitationType,
          }),
        }
      );

      const data = await response.json();
      console.log('Send invitations response:', data);

      if (response.ok) {
        alert('Good luck sending Invitation! LOL');
        console.log('Invitation Links:', data.invitations);
      }
    } catch (error) {
      console.error('Send invitations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomCard(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyInvitationLink = (token: string, index: number) => {
    const link = `${window.location.origin}/guest/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Event Header */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow">
          <div className="flex items-start justify-between">
            <div>
              <h1>{event.name}</h1>
              <p className="text-gray-600 capitalize">{event.occasion} • {new Date(event.date).toLocaleDateString()}</p>
              {event.description && (
                <p className="text-gray-600 mt-2">{event.description}</p>
              )}
            </div>
            <Button onClick={() => onViewGallery(event.id)} variant="outline">
              <ImageIcon className="w-4 h-4 mr-2" />
              View Gallery
            </Button>
          </div>
          <div className="mt-4 flex gap-4">
            <Badge variant="secondary">
              <Users className="w-3 h-3 mr-1" />
              {guests.length} Guests
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="guests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guests">Manage Guests</TabsTrigger>
            <TabsTrigger value="template">Choose Template</TabsTrigger>
            <TabsTrigger value="send">Send Invitations</TabsTrigger>
          </TabsList>

          {/* Manage Guests Tab */}
          <TabsContent value="guests">
            <Card>
              <CardHeader>
                <CardTitle>Guest List</CardTitle>
                <CardDescription>
                  Add WhatsApp numbers and customize messages for each guest
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {newGuests.map((guest, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <Input
                          placeholder="WhatsApp Number (e.g., +1234567890)"
                          value={guest.phone}
                          onChange={(e) => updateGuestRow(index, 'phone', e.target.value)}
                        />
                      </div>
                      {invitationType === 'customized' && (
                        <>
                          <div className="flex-1">
                            <Input
                              placeholder="Guest Name (for card)"
                              value={guest.customName}
                              onChange={(e) => updateGuestRow(index, 'customName', e.target.value)}
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              placeholder="Custom Message"
                              value={guest.customMessage}
                              onChange={(e) => updateGuestRow(index, 'customMessage', e.target.value)}
                            />
                          </div>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeGuestRow(index)}
                        disabled={newGuests.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mb-6">
                  <Button variant="outline" onClick={addGuestRow}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add More
                  </Button>
                  <Button onClick={handleAddGuests} disabled={loading}>
                    Save Guests
                  </Button>
                </div>

                <div className="border-t pt-6">
                  <h3 className="mb-4">Added Guests ({guests.length})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {guests.map((guest, index) => (
                      <div key={guest.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p>{guest.phone}</p>
                          {guest.customName && (
                            <p className="text-sm text-gray-600">Name: {guest.customName}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInvitationLink(guest.guestToken, index)}
                        >
                          {copiedIndex === index ? (
                            <><Check className="w-3 h-3 mr-1" /> Copied</>
                          ) : (
                            <><Copy className="w-3 h-3 mr-1" /> Copy Link</>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Choose Template Tab */}
          <TabsContent value="template">
            <Card>
              <CardHeader>
                <CardTitle>Invitation Card</CardTitle>
                <CardDescription>
                  Choose a template or upload your own custom card
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="card-upload">Upload Custom Card</Label>
                    <div className="mt-2">
                      <label htmlFor="card-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Click to upload your card image</p>
                        </div>
                      </label>
                      <input
                        id="card-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>

                  {customCard && (
                    <div>
                      <Label>Your Custom Card</Label>
                      <div className="mt-2 relative">
                        <ImageWithFallback
                          src={customCard}
                          alt="Custom card"
                          className="w-full max-w-md rounded-lg shadow-lg"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Or Choose a Template</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {TEMPLATE_CARDS.map((template, index) => (
                        <div
                          key={index}
                          className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            selectedTemplate === template && !customCard
                              ? 'border-purple-600 shadow-lg'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                          onClick={() => {
                            setSelectedTemplate(template);
                            setCustomCard('');
                          }}
                        >
                          <ImageWithFallback
                            src={template}
                            alt={`Template ${index + 1}`}
                            className="w-full aspect-[3/4] object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Send Invitations Tab */}
          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle>Send Invitations</CardTitle>
                <CardDescription>
                  Customize your message and send to all guests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label>Invitation Type</Label>
                    <div className="flex gap-4 mt-2">
                      <Button
                        variant={invitationType === 'standard' ? 'default' : 'outline'}
                        onClick={() => setInvitationType('standard')}
                      >
                        Standard
                      </Button>
                      <Button
                        variant={invitationType === 'customized' ? 'default' : 'outline'}
                        onClick={() => setInvitationType('customized')}
                      >
                        Customized (with guest names)
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      placeholder="Enter your invitation message..."
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm mb-2">Preview</h4>
                    <div className="space-y-2">
                      <div className="bg-white p-3 rounded">
                        <ImageWithFallback
                          src={customCard || selectedTemplate}
                          alt="Card preview"
                          className="w-full max-w-xs rounded"
                        />
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message}</p>
                      <p className="text-sm text-blue-600">🔗 Click here to view invitation</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleSendInvitations}
                    disabled={loading || guests.length === 0}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? 'Sending...' : `Send to ${guests.length} Guest${guests.length !== 1 ? 's' : ''}`}
                  </Button>

                  <p className="text-sm text-gray-600 text-center">
                    Note: This is a demo. May be I should send via WhatsApp Business API.
                    or can copy individual guest links from the "Manage Guests" tab, boring!.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
