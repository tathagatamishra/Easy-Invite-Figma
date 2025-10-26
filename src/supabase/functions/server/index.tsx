import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Initialize storage bucket
async function initStorage() {
  const bucketName = 'make-892911f0-invitations';
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, { public: false });
    console.log('Created bucket:', bucketName);
  }
}
await initStorage();

// Generate random alphanumeric string
function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Auth: Sender Signup
app.post('/make-server-892911f0/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'sender' },
      email_confirm: true, // Auto-confirm since email server not configured
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Signup exception:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Auth: Sender Signin
app.post('/make-server-892911f0/auth/signin', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('Signin error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      access_token: data.session?.access_token,
      user: data.user 
    });
  } catch (error) {
    console.log('Signin exception:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Create Event
app.post('/make-server-892911f0/events', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, occasion, description, date } = await c.req.json();
    const eventId = generateId(12);
    
    const event = {
      id: eventId,
      senderId: user.id,
      name,
      occasion,
      description,
      date,
      guests: [],
      createdAt: new Date().toISOString(),
    };

    await kv.set(`event:${eventId}`, event);
    
    // Add to sender's events list
    const senderEvents = await kv.get(`sender:${user.id}:events`) || [];
    senderEvents.push(eventId);
    await kv.set(`sender:${user.id}:events`, senderEvents);

    return c.json({ event });
  } catch (error) {
    console.log('Create event error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get Sender's Events
app.get('/make-server-892911f0/events', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const eventIds = await kv.get(`sender:${user.id}:events`) || [];
    const events = await kv.mget(eventIds.map(id => `event:${id}`));

    return c.json({ events });
  } catch (error) {
    console.log('Get events error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get Single Event
app.get('/make-server-892911f0/events/:id', async (c) => {
  try {
    const eventId = c.req.param('id');
    const event = await kv.get(`event:${eventId}`);
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    return c.json({ event });
  } catch (error) {
    console.log('Get event error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Add Guests to Event
app.post('/make-server-892911f0/events/:id/guests', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const eventId = c.req.param('id');
    const { guests } = await c.req.json(); // Array of { phone, customMessage?, customName? }
    
    const event = await kv.get(`event:${eventId}`);
    if (!event || event.senderId !== user.id) {
      return c.json({ error: 'Event not found or unauthorized' }, 404);
    }

    const newGuests = guests.map(guest => ({
      id: generateId(12),
      phone: guest.phone,
      customMessage: guest.customMessage || '',
      customName: guest.customName || '',
      guestToken: generateId(16),
      username: `guest${generateId(6).toUpperCase()}`,
      profilePhoto: '',
      addedAt: new Date().toISOString(),
    }));

    event.guests = [...(event.guests || []), ...newGuests];
    await kv.set(`event:${eventId}`, event);

    // Create guest access tokens
    for (const guest of newGuests) {
      await kv.set(`guest:token:${guest.guestToken}`, {
        eventId,
        guestId: guest.id,
      });
    }

    return c.json({ guests: newGuests });
  } catch (error) {
    console.log('Add guests error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Guest Auto-Login
app.get('/make-server-892911f0/guest/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const guestData = await kv.get(`guest:token:${token}`);
    
    if (!guestData) {
      return c.json({ error: 'Invalid invitation link' }, 404);
    }

    const event = await kv.get(`event:${guestData.eventId}`);
    const guest = event.guests.find(g => g.id === guestData.guestId);

    if (!guest) {
      return c.json({ error: 'Guest not found' }, 404);
    }

    return c.json({ 
      eventId: guestData.eventId,
      guestId: guestData.guestId,
      guest,
      event: {
        id: event.id,
        name: event.name,
        occasion: event.occasion,
        description: event.description,
        date: event.date,
      }
    });
  } catch (error) {
    console.log('Guest login error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Update Guest Profile
app.put('/make-server-892911f0/guest/:token/profile', async (c) => {
  try {
    const token = c.req.param('token');
    const { username, profilePhoto } = await c.req.json();
    
    const guestData = await kv.get(`guest:token:${token}`);
    if (!guestData) {
      return c.json({ error: 'Invalid token' }, 404);
    }

    const event = await kv.get(`event:${guestData.eventId}`);
    const guestIndex = event.guests.findIndex(g => g.id === guestData.guestId);
    
    if (guestIndex === -1) {
      return c.json({ error: 'Guest not found' }, 404);
    }

    if (username) event.guests[guestIndex].username = username;
    if (profilePhoto !== undefined) event.guests[guestIndex].profilePhoto = profilePhoto;
    
    await kv.set(`event:${guestData.eventId}`, event);

    return c.json({ guest: event.guests[guestIndex] });
  } catch (error) {
    console.log('Update profile error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Delete Guest Account
app.delete('/make-server-892911f0/guest/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const guestData = await kv.get(`guest:token:${token}`);
    
    if (!guestData) {
      return c.json({ error: 'Invalid token' }, 404);
    }

    const event = await kv.get(`event:${guestData.eventId}`);
    event.guests = event.guests.filter(g => g.id !== guestData.guestId);
    
    await kv.set(`event:${guestData.eventId}`, event);
    await kv.del(`guest:token:${token}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete guest error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Upload Image to Gallery
app.post('/make-server-892911f0/gallery/:eventId/upload', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const { imageData, uploadedBy, uploaderName, uploaderType } = await c.req.json();
    
    const event = await kv.get(`event:${eventId}`);
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Upload to Supabase Storage
    const imageId = generateId(16);
    const fileName = `${eventId}/${imageId}.jpg`;
    
    // Convert base64 to blob
    const base64Data = imageData.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const { error: uploadError } = await supabase.storage
      .from('make-892911f0-invitations')
      .upload(fileName, binaryData, {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.log('Storage upload error:', uploadError);
      return c.json({ error: uploadError.message }, 500);
    }

    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from('make-892911f0-invitations')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

    const image = {
      id: imageId,
      url: urlData?.signedUrl,
      fileName,
      uploadedBy,
      uploaderName,
      uploaderType, // 'sender' or 'guest'
      likes: [],
      comments: [],
      uploadedAt: new Date().toISOString(),
    };

    // Store image metadata
    const galleryKey = `gallery:${eventId}`;
    const gallery = await kv.get(galleryKey) || [];
    gallery.push(image);
    await kv.set(galleryKey, gallery);

    return c.json({ image });
  } catch (error) {
    console.log('Upload image error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get Gallery Images
app.get('/make-server-892911f0/gallery/:eventId', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const gallery = await kv.get(`gallery:${eventId}`) || [];
    
    // Refresh signed URLs if needed
    const refreshedGallery = await Promise.all(gallery.map(async (img) => {
      const { data: urlData } = await supabase.storage
        .from('make-892911f0-invitations')
        .createSignedUrl(img.fileName, 60 * 60 * 24 * 365);
      
      return { ...img, url: urlData?.signedUrl || img.url };
    }));

    return c.json({ gallery: refreshedGallery });
  } catch (error) {
    console.log('Get gallery error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Like Image
app.post('/make-server-892911f0/gallery/:eventId/like', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const { imageId, userId, username } = await c.req.json();
    
    const gallery = await kv.get(`gallery:${eventId}`) || [];
    const imageIndex = gallery.findIndex(img => img.id === imageId);
    
    if (imageIndex === -1) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const image = gallery[imageIndex];
    const likeIndex = image.likes.findIndex(like => like.userId === userId);
    
    if (likeIndex === -1) {
      image.likes.push({ userId, username });
    } else {
      image.likes.splice(likeIndex, 1);
    }
    
    gallery[imageIndex] = image;
    await kv.set(`gallery:${eventId}`, gallery);

    return c.json({ image });
  } catch (error) {
    console.log('Like image error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Comment on Image
app.post('/make-server-892911f0/gallery/:eventId/comment', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const { imageId, userId, username, comment } = await c.req.json();
    
    const gallery = await kv.get(`gallery:${eventId}`) || [];
    const imageIndex = gallery.findIndex(img => img.id === imageId);
    
    if (imageIndex === -1) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const newComment = {
      id: generateId(8),
      userId,
      username,
      comment,
      createdAt: new Date().toISOString(),
    };

    gallery[imageIndex].comments.push(newComment);
    await kv.set(`gallery:${eventId}`, gallery);

    return c.json({ comment: newComment });
  } catch (error) {
    console.log('Comment error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Delete Image
app.delete('/make-server-892911f0/gallery/:eventId/:imageId', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const imageId = c.req.param('imageId');
    const { userId, userType } = await c.req.json();
    
    const gallery = await kv.get(`gallery:${eventId}`) || [];
    const imageIndex = gallery.findIndex(img => img.id === imageId);
    
    if (imageIndex === -1) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const image = gallery[imageIndex];
    
    // Check permission: sender can delete any, guest can only delete their own
    if (userType !== 'sender' && image.uploadedBy !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Delete from storage
    await supabase.storage
      .from('make-892911f0-invitations')
      .remove([image.fileName]);

    gallery.splice(imageIndex, 1);
    await kv.set(`gallery:${eventId}`, gallery);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete image error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Send Invitations (Mock WhatsApp API integration)
app.post('/make-server-892911f0/events/:id/send', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const eventId = c.req.param('id');
    const { cardImage, message, invitationType } = await c.req.json();
    
    const event = await kv.get(`event:${eventId}`);
    if (!event || event.senderId !== user.id) {
      return c.json({ error: 'Event not found or unauthorized' }, 404);
    }

    // In production, integrate with WhatsApp Business API
    // For now, we'll just generate the invitation links
    const invitations = event.guests.map(guest => ({
      phone: guest.phone,
      link: `${c.req.header('origin')}/guest/${guest.guestToken}`,
      cardImage,
      message: guest.customMessage || message,
      guestName: guest.customName,
    }));

    // Mark event as sent
    event.invitationsSent = true;
    event.sentAt = new Date().toISOString();
    await kv.set(`event:${eventId}`, event);

    return c.json({ 
      success: true, 
      invitations,
      message: 'Invitations prepared. In production, these would be sent via WhatsApp API.'
    });
  } catch (error) {
    console.log('Send invitations error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
