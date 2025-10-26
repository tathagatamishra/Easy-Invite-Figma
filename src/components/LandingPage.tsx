import { Send, Users, Image, Heart } from 'lucide-react';
import { Button } from './ui/button';
import logo from '../assets/logo.png'

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="w-full flex flex-col items-center mb-6">
          <img src={logo} alt="logo" style={{
            opacity: "65%",
            filter: "saturate(3) brightness(1.1)",
            height: "30vw"
          }} />
        </div>
        <div className="text-center mb-16">
          <h1 className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Send Beautiful WhatsApp Invitations
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Stop sending physical invitations. Send stunning digital invitation cards to all your relatives on WhatsApp with just a few clicks.
          </p>
          <Button onClick={onGetStarted} size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Send className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="mb-2">Send to WhatsApp</h3>
            <p className="text-gray-600">
              Send beautiful invitation cards directly to WhatsApp contacts
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="mb-2">Guest Management</h3>
            <p className="text-gray-600">
              Easy guest access with unique links - no signup required
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Image className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="mb-2">Event Gallery</h3>
            <p className="text-gray-600">
              Share photos from your event with all guests in real-time
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="mb-2">Customization</h3>
            <p className="text-gray-600">
              Personalize each invitation with custom messages and names
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-center mb-12">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="mb-2">Create Event</h3>
              <p className="text-gray-600">
                Choose your occasion, select a template, and customize your invitation card
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="mb-2">Add Guests</h3>
              <p className="text-gray-600">
                Import or add WhatsApp numbers. Personalize messages for each guest
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="mb-2">Send & Share</h3>
              <p className="text-gray-600">
                Send invitations via WhatsApp. Guests click the link to access the event
              </p>
            </div>
          </div>
        </div>

        {/* Occasions */}
        <div className="text-center mb-16">
          <h2 className="mb-8">Perfect for Every Occasion</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Wedding', 'Birthday', 'Anniversary', 'Baby Shower', 'Engagement', 'Graduation', 'Housewarming', 'Festival'].map((occasion) => (
              <div key={occasion} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
                <p>{occasion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-center text-white">
          <h2 className="mb-4">Ready to Send Your First Invitation?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of happy users sending beautiful invitations
          </p>
          <Button onClick={onGetStarted} size="lg" variant="secondary">
            Start Free
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 EZ Invite. Making celebrations easier.</p>
        </div>
      </footer>
    </div>
  );
}
