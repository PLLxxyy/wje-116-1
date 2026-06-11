import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import ClubList from './pages/ClubList';
import ClubDetail from './pages/ClubDetail';
import ActivityDetail from './pages/ActivityDetail';
import Dashboard from './pages/admin/Dashboard';
import ClubReview from './pages/admin/ClubReview';
import ContentReview from './pages/admin/ContentReview';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Navbar />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/clubs" element={<ClubList />} />
          <Route path="/clubs/:id" element={<ClubDetail />} />
          <Route path="/activities/:id" element={<ActivityDetail />} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/club-review" element={<ProtectedRoute requireAdmin><ClubReview /></ProtectedRoute>} />
          <Route path="/admin/content-review" element={<ProtectedRoute requireAdmin><ContentReview /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}
