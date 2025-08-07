import React from 'react';

const ProfilePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold gradient-text">User Profile</h1>
          <p className="text-gray-400 mt-2">Manage your account and view your activity</p>
        </div>

        <div className="card-body">
          {/* Profile page will be implemented in Task 10 */}
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-xl font-semibold mb-2">Profile Page Coming Soon</h2>
            <p>User profile and settings will be available in the next update</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;