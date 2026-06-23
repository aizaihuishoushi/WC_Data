import { useState } from 'react';
import { TeamHistory as TeamHistoryType } from '../types';
import { Calendar, ChevronDown, ChevronUp, Swords } from 'lucide-react';

interface TeamHistoryProps {
  history: TeamHistoryType;
}

type FilterType = 'all' | '5' | '10';

export default function TeamHistory({ history }: TeamHistoryProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());

  const filteredParticipations = history.participations.filter((p) => {
    if (filter === 'all') return true;
    const yearsAgo = new Date().getFullYear() - p.year;
    if (filter === '5') return yearsAgo <= 5;
    if (filter === '10') return yearsAgo <= 10;
    return true;
  });

  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const getResultColor = (result: 'win' | 'draw' | 'loss') => {
    switch (result) {
      case 'win':
        return 'text-green-400';
      case 'draw':
        return 'text-yellow-400';
      case 'loss':
        return 'text-red-400';
    }
  };

  const getResultLabel = (result: 'win' | 'draw' | 'loss') => {
    switch (result) {
      case 'win':
        return '胜';
      case 'draw':
        return '平';
      case 'loss':
        return '负';
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#16213e] to-[#1a1a2e] rounded-2xl p-6 border border-white/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-[#e94560] rounded-full"></span>
          历史战绩
        </h3>

        <div className="flex gap-2">
          {[
            { key: 'all', label: '全部' },
            { key: '5', label: '近5届' },
            { key: '10', label: '近10届' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as FilterType)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === item.key
                  ? 'bg-[#e94560] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredParticipations.map((participation) => (
          <div
            key={participation.year}
            className="bg-white/5 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => toggleYear(participation.year)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#e94560]" />
                <span className="text-white font-bold text-lg">
                  {participation.year}
                </span>
                <span className="px-2 py-0.5 bg-[#e94560]/20 text-[#e94560] text-sm rounded">
                  {participation.stage}
                </span>
              </div>
              {expandedYears.has(participation.year) ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedYears.has(participation.year) && (
              <div className="border-t border-white/5">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-500 text-sm border-b border-white/5">
                      <th className="py-3 px-4 text-left">对手</th>
                      <th className="py-3 px-4 text-center">比分</th>
                      <th className="py-3 px-4 text-center">结果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participation.matches.map((match, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4 text-white">
                          <div className="flex items-center gap-2">
                            <Swords className="w-4 h-4 text-gray-500" />
                            {match.opponent}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-white font-mono">
                          {match.score}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-sm font-medium ${getResultColor(
                              match.result
                            )} bg-white/5`}
                          >
                            {getResultLabel(match.result)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
