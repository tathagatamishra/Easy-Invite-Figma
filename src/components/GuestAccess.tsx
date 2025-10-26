import { useState, useEffect } from 'react';
import { User, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface GuestAccessProps {
  token: string;
  onViewGallery: (eventId: string, guestToken: string, guestData: any) => void;
}

export function GuestAccess({ token, onViewGallery }: GuestAccessProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guestData, setGuestData] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadGuestData();
  }, [token]);

  const loadGuestData = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-892911f0/guest/${token}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      console.log('Guest data loaded:', data);

      if (response.ok) {
        setGuestData(data);
        setUsername(data.guest.username);
        setProfilePhoto(data.guest.profilePhoto || '');
      } else {
        setError(data.error || 'Invalid invitation link');
      }
    } catch (err: any) {
      console.error('Load guest data error:', err);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-892911f0/guest/${token}/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ username, profilePhoto }),
        }
      );

      const data = await response.json();
      console.log('Profile update response:', data);

      if (response.ok) {
        setGuestData({ ...guestData, guest: data.guest });
        setEditing(false);
      }
    } catch (error) {
      console.error('Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-892911f0/guest/${token}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        alert('Your account has been deleted. Thank you for being part of the event!');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Delete account error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading && !guestData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <p className="text-gray-600">Loading your invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Event Info */}
        <Card className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
          <CardHeader>
            <CardTitle>{guestData.event.name}</CardTitle>
            <CardDescription className="capitalize">
              {guestData.event.occasion} • {new Date(guestData.event.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </CardDescription>
          </CardHeader>
          {guestData.event.description && (
            <CardContent>
              <p className="text-gray-700">{guestData.event.description}</p>
            </CardContent>
          )}
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Update your name and photo to share with other guests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={profilePhoto} />
                        <AvatarFallback>
                          <User className="w-12 h-12" />
                        </AvatarFallback>
                      </Avatar>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                  <p className="text-sm text-center text-gray-600">Click avatar to change photo</p>

                  <div>
                    <Label htmlFor="username">Display Name</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleUpdateProfile} disabled={loading} className="flex-1">
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={guestData.guest.profilePhoto} />
                      <AvatarFallback>
                        <User className="w-12 h-12" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center">
                    <h3>{guestData.guest.username}</h3>
                    <p className="text-sm text-gray-600">Guest</p>
                  </div>
                  <Button onClick={() => setEditing(true)} className="w-full" variant="outline">
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Event Actions</CardTitle>
              <CardDescription>
                View the event gallery and manage your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => onViewGallery(guestData.eventId, token, guestData)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                View Event Gallery
              </Button>

              <div className="border-t pt-4">
                <h4 className="text-sm mb-2">Account Settings</h4>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  This will remove you from the event and delete all your data
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Notice */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="mb-2">Privacy Notice</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Your phone number is private and not visible to other guests</li>
              <li>• Other guests can see your display name and profile photo</li>
              <li>• You can upload photos to the event gallery</li>
              <li>• You can delete your account at any time</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
              You will be removed from the event and all your data will be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
