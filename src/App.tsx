import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TeamDetailPage from './pages/TeamDetailPage';
import Navigation from './components/Navigation';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#1a1a2e] w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/team/:teamCode" element={<TeamDetailPage />} />
        </Routes>
        <Navigation />
      </div>
    </Router>
  );
}
