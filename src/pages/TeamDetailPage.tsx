import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore, getAllTeams } from '../store/appStore';
import { teamsHistoryData, getTeamHistory, getTeamMatches, getWorldCupYears } from '../data/worldCupHistory';
import TeamInfo from '../components/TeamInfo';
import TeamStats from '../components/TeamStats';
import TeamHistory from '../components/TeamHistory';
import { ArrowLeft, Trophy, Calendar, Star, Globe } from 'lucide-react';

export default function TeamDetailPage() {
  const { teamCode } = useParams<{ teamCode: string }>();
  const { fetchTeamHistory } = useAppStore();

  const allTeams = getAllTeams();
  const team = allTeams.find((t) => t.code === teamCode);
  
  // 优先使用真实历史数据
  const historyData = teamCode ? getTeamHistory(teamCode) : undefined;
  const matchData = teamCode ? getTeamMatches(teamCode) : [];

  useEffect(() => {
    if (teamCode) {
      fetchTeamHistory(teamCode);
    }
  }, [teamCode, fetchTeamHistory]);

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">球队未找到</h1>
          <Link
            to="/"
            className="text-[#e94560] hover:underline flex items-center gap-2 justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  // 统计数据
  const stats = historyData ? {
    totalParticipations: historyData.appearances.length,
    totalMatches: historyData.totalMatches,
    wins: historyData.totalWins,
    draws: historyData.totalDraws,
    losses: historyData.totalLosses,
    totalGoals: historyData.totalGoalsFor,
  } : {
    totalParticipations: 0,
    totalMatches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    totalGoals: 0,
  };

  // 历史战绩
  const history = historyData ? {
    teamCode: historyData.code,
    participations: historyData.appearances.map(year => ({
      year,
      stage: getStageForYear(year, historyData),
      matches: matchData.filter(m => m.year === year).map(m => ({
        opponent: m.team1 === historyData.code ? m.team2 : m.team1,
        score: formatScore(m),
        result: getMatchResult(m, historyData.code),
        goalsFor: m.team1 === historyData.code ? (m.score?.ft?.[0] ?? 0) : (m.score?.ft?.[1] ?? 0),
        goalsAgainst: m.team1 === historyData.code ? (m.score?.ft?.[1] ?? 0) : (m.score?.ft?.[0] ?? 0),
      })),
    })).reverse(),
    stats: stats,
  } : undefined;

  // 获取某年世界杯该队的最好成绩
  function getStageForYear(year: number, data: typeof historyData): string {
    if (data?.championsYears.includes(year)) return '冠军 🏆';
    if (data?.finalsAppearances.includes(year)) return '亚军';
    if (data?.semiFinalsAppearances.includes(year)) return '四强';
    return '小组赛';
  }

  function formatScore(match: any): string {
    if (!match.score?.ft) return 'vs';
    return `${match.score.ft[0]}-${match.score.ft[1]}`;
  }

  function getMatchResult(match: any, teamCode: string): 'win' | 'draw' | 'loss' {
    if (!match.score?.ft) return 'draw';
    const team1Score = match.score.ft[0];
    const team2Score = match.score.ft[1];
    if (team1Score === team2Score) return 'draw';
    if (match.team1 === teamCode) {
      return team1Score > team2Score ? 'win' : 'loss';
    } else {
      return team2Score > team1Score ? 'win' : 'loss';
    }
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <TeamInfo
          team={team}
          participationCount={stats.totalParticipations}
        />

        {/* 真实历史数据展示 */}
        {historyData && (
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">世界杯历史数据</h2>
              <span className="text-xs text-gray-400 ml-2">数据来源: OpenFootball / Fjelstul World Cup Database</span>
            </div>
            
            {/* 成就展示 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{historyData.championsYears.length}</div>
                <div className="text-sm text-gray-400">夺冠次数</div>
                {historyData.championsYears.length > 0 && (
                  <div className="text-xs text-yellow-300 mt-1">
                    {historyData.championsYears.join(', ')}
                  </div>
                )}
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-white">{historyData.finalsAppearances.length}</div>
                <div className="text-sm text-gray-400">决赛参赛</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-400">{historyData.semiFinalsAppearances.length}</div>
                <div className="text-sm text-gray-400">四强次数</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{historyData.totalMatches}</div>
                <div className="text-sm text-gray-400">总比赛场次</div>
              </div>
            </div>

            {/* 详细统计 */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{historyData.totalWins}</div>
                <div className="text-xs text-gray-400">胜</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">{historyData.totalDraws}</div>
                <div className="text-xs text-gray-400">平</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{historyData.totalLosses}</div>
                <div className="text-xs text-gray-400">负</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{historyData.totalGoalsFor}</div>
                <div className="text-xs text-gray-400">总进球</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-400">{historyData.totalGoalsAgainst}</div>
                <div className="text-xs text-gray-400">总失球</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{historyData.totalGoalsFor - historyData.totalGoalsAgainst}</div>
                <div className="text-xs text-gray-400">净胜球</div>
              </div>
            </div>

            {/* 参赛年份 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">参赛年份</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {historyData.appearances.map(year => (
                  <span 
                    key={year} 
                    className={`px-2 py-1 rounded text-sm ${
                      historyData.championsYears.includes(year) 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : historyData.finalsAppearances.includes(year)
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : historyData.semiFinalsAppearances.includes(year)
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-white/10 text-gray-300 border border-white/10'
                    }`}
                  >
                    {year}
                    {historyData.championsYears.includes(year) && ' 🏆'}
                  </span>
                ))}
              </div>
            </div>

            {/* 最近比赛 */}
            {matchData.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">最近比赛</span>
                </div>
                <div className="space-y-2">
                  {matchData.slice(0, 5).map((match, index) => {
                    const isHome = match.team1 === teamCode;
                    const score = match.score?.ft 
                      ? `${match.score.ft[0]}-${match.score.ft[1]}` 
                      : 'vs';
                    const opponent = isHome ? match.team2 : match.team1;
                    const result = getMatchResult(match, teamCode || '');
                    
                    return (
                      <div 
                        key={index}
                        className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-12">{match.year}</span>
                          <span className="text-white font-medium">{opponent}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${
                            result === 'win' ? 'text-green-400' : 
                            result === 'loss' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {score}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            result === 'win' ? 'bg-green-500/20 text-green-400' : 
                            result === 'loss' ? 'bg-red-500/20 text-red-400' : 
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {result === 'win' ? '胜' : result === 'loss' ? '负' : '平'}
                          </span>
                          <span className="text-xs text-gray-500">{match.round}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 备用：使用模拟数据（如果没有真实数据） */}
        {!historyData && history && <TeamStats stats={history.stats} />}
        {!historyData && history && <TeamHistory history={history} />}

        {/* 既没有真实数据也没有模拟数据 */}
        {!historyData && !history && (
          <div className="bg-white/5 rounded-xl p-8 text-center">
            <Globe className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">暂无该球队的历史数据</p>
            <p className="text-sm text-gray-500 mt-2">
              历史数据来源: OpenFootball (CC0) / Fjelstul World Cup Database (CC-BY-SA-4.0)
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
