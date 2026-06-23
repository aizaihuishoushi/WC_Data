import { Link } from 'react-router-dom';
import { Match } from '../types';
import { Trophy, Clock, MapPin, Calendar } from 'lucide-react';

interface MatchCardProps {
  match: Match;
}

const statusLabels: Record<Match['status'], string> = {
  live: '直播中',
  upcoming: '未开始',
  finished: '已结束',
};

const statusColors: Record<Match['status'], string> = {
  live: 'bg-red-500 animate-pulse',
  upcoming: 'bg-blue-500',
  finished: 'bg-gray-600',
};

export default function MatchCard({ match }: MatchCardProps) {
  const isLive = match.status === 'live';

  return (
    <div className="group relative bg-gradient-to-br from-[#16213e] to-[#1a1a2e] rounded-2xl p-4 sm:p-6 border border-white/5 transition-all duration-300 hover:border-[#e94560]/30 hover:shadow-[0_0_30px_rgba(233,69,96,0.15)] hover:-translate-y-1">
      {isLive && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-red-400 text-sm font-medium">LIVE</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[match.status]} text-white`}>
          {statusLabels[match.status]}
        </span>
        {match.group && (
          <span className="text-gray-400 text-sm">小组 {match.group}</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        {/* 主队 - 可点击跳转 */}
        <Link
          to={`/team/${match.homeTeam.code}`}
          className="flex flex-col items-center gap-3 flex-1 text-center hover:opacity-80 transition-opacity"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-110 transition-transform">
            {match.homeTeam.logo}
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white font-medium text-sm sm:text-base">
              {match.homeTeam.name}
            </span>
            <span className="text-gray-500 text-xs">
              {match.homeTeam.nameEn}
            </span>
          </div>
        </Link>

        <div className="flex flex-col items-center px-4 sm:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className={`text-3xl sm:text-5xl font-bold ${isLive ? 'text-[#e94560]' : 'text-white'}`}>
              {match.homeScore}
            </span>
            <span className="text-gray-500 text-2xl">-</span>
            <span className={`text-3xl sm:text-5xl font-bold ${isLive ? 'text-[#e94560]' : 'text-white'}`}>
              {match.awayScore}
            </span>
          </div>
          {match.status === 'upcoming' && (
            <div className="flex items-center gap-2 mt-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{match.time}</span>
            </div>
          )}
        </div>

        {/* 客队 - 可点击跳转 */}
        <Link
          to={`/team/${match.awayTeam.code}`}
          className="flex flex-col items-center gap-3 flex-1 text-center hover:opacity-80 transition-opacity"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-110 transition-transform">
            {match.awayTeam.logo}
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white font-medium text-sm sm:text-base">
              {match.awayTeam.name}
            </span>
            <span className="text-gray-500 text-xs">
              {match.awayTeam.nameEn}
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-sm">
        <Calendar className="w-4 h-4" />
        <span>{match.date} {match.time} (北京时间)</span>
      </div>

      <div className="flex items-center justify-center gap-2 mt-2 text-gray-500 text-sm">
        <MapPin className="w-4 h-4" />
        <span>{match.venue}</span>
      </div>

      {match.stage !== 'group' && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <Trophy className="w-4 h-4 text-[#e94560]" />
          <span className="text-[#e94560] text-sm font-medium">
            {match.stage === 'round16' && '16强'}
            {match.stage === 'quarter' && '8强'}
            {match.stage === 'semi' && '半决赛'}
            {match.stage === 'final' && '决赛'}
          </span>
        </div>
      )}
    </div>
  );
}
