import { Team } from '../types';
import { Calendar, Trophy } from 'lucide-react';

interface TeamInfoProps {
  team: Team;
  participationCount?: number;
}

export default function TeamInfo({ team, participationCount }: TeamInfoProps) {
  return (
    <div className="bg-gradient-to-br from-[#16213e] to-[#1a1a2e] rounded-2xl p-6 border border-white/5">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-6xl">
          {team.logo}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-white mb-2">{team.name}</h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>成立于 {team.founded} 年</span>
            </div>
            {participationCount !== undefined && (
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#e94560]" />
                <span>世界杯参赛 {participationCount} 次</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
