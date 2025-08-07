import React from 'react';
import { Link } from 'react-router-dom';
import { MapIcon, PlusIcon, EyeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="mb-8">
          <span className="text-8xl block mb-4 animate-pulse-slow">🛸</span>
          <h1 className="text-5xl md:text-7xl font-bold gradient-text mb-6 text-shadow">
            UFO Beep
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Report, explore, and discuss UFO sightings from around the world. 
            Join our community of believers and skeptics in uncovering the truth.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/submit" className="btn btn-primary text-lg px-8 py-3 animate-glow">
            <PlusIcon className="w-6 h-6 mr-2" />
            Report a Sighting
          </Link>
          <Link to="/map" className="btn btn-secondary text-lg px-8 py-3">
            <MapIcon className="w-6 h-6 mr-2" />
            Explore Map
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <div className="card text-center">
          <div className="card-body">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold mb-2">Interactive Map</h3>
            <p className="text-gray-400">
              Explore UFO sightings on a real-time interactive map with location-based filtering.
            </p>
          </div>
        </div>

        <div className="card text-center">
          <div className="card-body">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-xl font-semibold mb-2">Photo & Video</h3>
            <p className="text-gray-400">
              Upload images and videos as evidence. Capture directly with your device camera.
            </p>
          </div>
        </div>

        <div className="card text-center">
          <div className="card-body">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
            <p className="text-gray-400">
              Discuss sightings in real-time chat rooms. Connect with other witnesses.
            </p>
          </div>
        </div>

        <div className="card text-center">
          <div className="card-body">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold mb-2">Notifications</h3>
            <p className="text-gray-400">
              Get notified when new sightings are reported near your location.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Sightings Preview */}
      <div className="card mb-16">
        <div className="card-header">
          <h2 className="text-2xl font-bold">Recent Sightings</h2>
        </div>
        <div className="card-body">
          <div className="text-center py-8 text-gray-400">
            <EyeIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Recent sightings will appear here</p>
            <Link to="/map" className="btn btn-primary mt-4">
              View All Sightings
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-8 gradient-text">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-cosmic-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold">Spot Something</h3>
            <p className="text-gray-400">
              Witness an unexplained phenomenon? Don't keep it to yourself.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-16 h-16 bg-cosmic-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold">Report It</h3>
            <p className="text-gray-400">
              Share your experience with detailed descriptions, photos, and location data.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-16 h-16 bg-cosmic-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold">Connect</h3>
            <p className="text-gray-400">
              Join discussions, find other witnesses, and help uncover the truth together.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="card glass text-center">
        <div className="card-body">
          <h2 className="text-3xl font-bold mb-4 gradient-text">
            Ready to Share Your Experience?
          </h2>
          <p className="text-lg text-gray-300 mb-6">
            Join thousands of witnesses sharing their UFO encounters. 
            Your story matters and could be the key to understanding these phenomena.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/submit" className="btn btn-success text-lg px-8 py-3">
              <PlusIcon className="w-6 h-6 mr-2" />
              Submit Your Sighting
            </Link>
            <Link to="/register" className="btn btn-secondary text-lg px-8 py-3">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;