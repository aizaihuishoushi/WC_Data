import { Link, useLocation } from 'react-router-dom';
import { Trophy, Home } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f3460]/95 backdrop-blur-lg border-t border-white/10 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              location.pathname === '/'
                ? 'text-[#e94560]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">首页</span>
          </Link>

          <div className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 cursor-not-allowed">
            <Trophy className="w-6 h-6" />
            <span className="text-xs font-medium">排行榜</span>
          </div>
        </div>
      </div>

      <div className="h-safe-area-inset-bottom"></div>
    </nav>
  );
}
