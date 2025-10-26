import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Heart, MessageSquare, Download, Trash2, Share2, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface GalleryImage {
  id: string;
  url: string;
  fileName: string;
  uploadedBy: string;
  uploaderName: string;
  uploaderType: string;
  likes: Array<{ userId: string; username: string }>;
  comments: Array<{ id: string; userId: string; username: string; comment: string; createdAt: string }>;
  uploadedAt: string;
}

interface EventGalleryProps {
  eventId: string;
  userType: 'sender' | 'guest';
  userId: string;
  username: string;
  accessToken?: string;
  guestToken?: string;
  onBack: () => void;
}

export function EventGallery({
  eventId,
  userType,
  userId,
  username,
  accessToken,
  guestToken,
  onBack,
}: EventGalleryProps) {
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadGallery();
    // Refresh gallery every 10 seconds
    const interval = setInterval(loadGallery, 10000);
    return () => clearInterval(interval);
  }, [eventId]);

  const loadGallery = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-892911f0/gallery/${eventId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      console.log('Gallery loaded:', data);

      if (response.ok) {
        setGallery(data.gallery || []);
      }
    } catch (error) {
      console.error('Load gallery error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-892911f0/gallery/${eventId}/upload`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              imageData,
              uploadedBy: userId,
              uploaderName: username,
              uploaderType: userType,
            }),
          }
        );

        const data = await response.json();
        console.log('Upload response:', data);

        if (response.ok) {
          await loadGallery();
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
    }
  };

  const handleLike = async (imageId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-892911f0/gallery/${eventId}/like`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            imageId,
            userId,
            username,
          }),
        }
      );

      if (response.ok) {
        await loadGallery();
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleComment = async (imageId: string) => {
    if (!commentText.trim()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-892911f0/gallery/${eventId}/comment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            imageId,
            userId,
            username,
            comment: commentText,
          }),
        }
      );

      if (response.ok) {
        setCommentText('');
        await loadGallery();
        // Update selected image
        if (selectedImage?.id === imageId) {
          const updated = gallery.find(img => img.id === imageId);
          if (updated) setSelectedImage(updated);
        }
      }
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-892911f0/gallery/${eventId}/${imageId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userId,
            userType,
          }),
        }
      );

      if (response.ok) {
        await loadGallery();
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleDownload = (image: GalleryImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `event-photo-${image.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (image: GalleryImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Event Photo',
          text: `Check out this photo from the event!`,
          url: image.url,
        });
      } catch (error) {
        console.log('Share error:', error);
      }
    } else {
      navigator.clipboard.writeText(image.url);
      alert('Image link copied to clipboard!');
    }
  };

  const isLiked = (image: GalleryImage) => {
    return image.likes.some(like => like.userId === userId);
  };

  const canDelete = (image: GalleryImage) => {
    return userType === 'sender' || image.uploadedBy === userId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <label htmlFor="image-upload">
              <Button disabled={uploading} asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </span>
              </Button>
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </div>

        <h1 className="mb-8">Event Gallery</h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading gallery...</p>
          </div>
        ) : gallery.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="mb-2">No Photos Yet</h3>
              <p className="text-gray-600 mb-6">
                Be the first to share photos from the event!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {gallery.map((image) => (
              <Card
                key={image.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedImage(image)}
              >
                <div className="aspect-square relative">
                  <ImageWithFallback
                    src={image.url}
                    alt="Event photo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(image.id);
                        }}
                        className="flex items-center gap-1 hover:text-red-600 transition-colors"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isLiked(image) ? 'fill-red-600 text-red-600' : ''
                          }`}
                        />
                        <span className="text-sm">{image.likes.length}</span>
                      </button>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">{image.comments.length}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{image.uploaderName}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Image Detail Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Photo Details</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(selectedImage)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleShare(selectedImage)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    {canDelete(selectedImage) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(selectedImage.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <ImageWithFallback
                  src={selectedImage.url}
                  alt="Event photo"
                  className="w-full rounded-lg"
                />

                {/* Uploader Info */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Uploaded by {selectedImage.uploaderName}</span>
                  <span>•</span>
                  <span>{new Date(selectedImage.uploadedAt).toLocaleDateString()}</span>
                </div>

                {/* Likes */}
                <div>
                  <button
                    onClick={() => handleLike(selectedImage.id)}
                    className="flex items-center gap-2 hover:text-red-600 transition-colors mb-2"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isLiked(selectedImage) ? 'fill-red-600 text-red-600' : ''
                      }`}
                    />
                    <span>{selectedImage.likes.length} {selectedImage.likes.length === 1 ? 'like' : 'likes'}</span>
                  </button>
                  {selectedImage.likes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedImage.likes.map((like, index) => (
                        <span key={index} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {like.username}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div className="border-t pt-4">
                  <h4 className="mb-3">Comments ({selectedImage.comments.length})</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                    {selectedImage.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{comment.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-100 rounded-lg p-3">
                            <p className="text-sm mb-1">{comment.username}</p>
                            <p className="text-sm text-gray-700">{comment.comment}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleComment(selectedImage.id);
                        }
                      }}
                    />
                    <Button onClick={() => handleComment(selectedImage.id)}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
