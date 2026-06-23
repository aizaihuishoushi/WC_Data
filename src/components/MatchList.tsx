import { useState } from 'react';
import { Match } from '../types';
import MatchCard from './MatchCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  title?: string;
  initialCount?: number; // 默认显示的数量，0或undefined表示全部显示
}

export default function MatchList({ matches, title, initialCount }: MatchListProps) {
  const showAll = !initialCount || initialCount <= 0;
  const [expanded, setExpanded] = useState(showAll);
  const displayMatches = expanded ? matches : matches.slice(0, initialCount);
  const hasMore = !showAll && matches.length > initialCount;

  return (
    <div className="space-y-4">
      {title && (
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-[#e94560] rounded-full"></span>
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayMatches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all border border-white/10 hover:border-[#e94560]/40"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-5 h-5" />
                收起 ({matches.length}场)
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                展开全部 ({matches.length}场)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
