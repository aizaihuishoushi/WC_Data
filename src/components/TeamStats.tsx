import { TeamStats as TeamStatsType } from '../types';
import { Target, Trophy, TrendingUp, Award } from 'lucide-react';

interface TeamStatsProps {
  stats: TeamStatsType;
}

export default function TeamStats({ stats }: TeamStatsProps) {
  const statItems = [
    {
      label: '总场次',
      value: stats.totalMatches,
      icon: Target,
      color: 'text-blue-400',
    },
    {
      label: '胜利',
      value: stats.wins,
      icon: Trophy,
      color: 'text-green-400',
    },
    {
      label: '平局',
      value: stats.draws,
      icon: TrendingUp,
      color: 'text-yellow-400',
    },
    {
      label: '失利',
      value: stats.losses,
      icon: Award,
      color: 'text-red-400',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-[#16213e] to-[#1a1a2e] rounded-2xl p-6 border border-white/5">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-[#e94560] rounded-full"></span>
        数据统计
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="bg-white/5 rounded-xl p-4 text-center"
          >
            <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
            <div className={`text-3xl font-bold ${item.color}`}>
              {item.value}
            </div>
            <div className="text-gray-400 text-sm">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">总进球数</span>
          <span className="text-2xl font-bold text-[#e94560]">
            {stats.totalGoals}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">参赛届数</span>
          <span className="text-2xl font-bold text-white">
            {stats.totalParticipations}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-gray-400 text-sm mb-2">胜率</div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${(stats.wins / stats.totalMatches) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1 text-sm">
          <span className="text-green-400">
            {((stats.wins / stats.totalMatches) * 100).toFixed(1)}%
          </span>
          <span className="text-gray-500">
            {stats.wins}胜 {stats.draws}平 {stats.losses}负
          </span>
        </div>
      </div>
    </div>
  );
}
