import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import MatchList from '../components/MatchList';
import { Radio, Calendar, Loader2, Trophy, Users, Settings } from 'lucide-react';
import TournamentBracket from '../components/TournamentBracket';
import SettingsDialog from '../components/ProxyDialog';

type TabType = 'live' | 'knockout';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const { activeGroup, setActiveGroup, matches, loading, fetchMatches } = useAppStore();

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // 动态从实际数据中提取所有小组，确保12个小组都显示
  const allGroups = useMemo(() => {
    const groups = new Set<string>();
    matches.forEach(m => {
      if (m.stage === 'group' && m.group) {
        groups.add(m.group);
      }
    });
    // 确保所有12个小组都存在（A-L），防止数据不完整时缺少显示
    const allLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    allLetters.forEach(letter => groups.add(letter));
    return Array.from(groups).sort();
  }, [matches]);

  // 统计各类比赛数量
  const groupMatchesCount = matches.filter(m => m.stage === 'group').length;
  const knockoutMatchesCount = matches.filter(m => m.stage !== 'group').length;

  // 如果还没选择过小组，默认选第一个
  useEffect(() => {
    if (allGroups.length > 0 && !allGroups.includes(activeGroup)) {
      setActiveGroup(allGroups[0]);
    }
  }, [allGroups, activeGroup, setActiveGroup]);

  const liveMatches = matches.filter((m) => m.status === 'live');
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming');
  const finishedMatches = matches.filter((m) => m.status === 'finished');
  const groupMatches = matches.filter(
    (m) => m.stage === 'group' && m.group === activeGroup
  );

  // 计算小组排名
  const getGroupStandings = (groupLetter: string) => {
    const groupMatchesList = matches.filter(
      (m) => m.stage === 'group' && m.group === groupLetter
    );
    
    // 收集所有球队
    const teamsMap = new Map<string, { played: number; wins: number; draws: number; losses: number; gf: number; ga: number; gd: number; points: number }>();
    
    groupMatchesList.forEach(match => {
      if (match.status === 'finished' || match.status === 'live') {
        // 主队
        if (!teamsMap.has(match.homeTeam.code)) {
          teamsMap.set(match.homeTeam.code, { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 });
        }
        // 客队
        if (!teamsMap.has(match.awayTeam.code)) {
          teamsMap.set(match.awayTeam.code, { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 });
        }
        
        const home = teamsMap.get(match.homeTeam.code)!;
        const away = teamsMap.get(match.awayTeam.code)!;
        
        home.played++;
        away.played++;
        home.gf += match.homeScore;
        home.ga += match.awayScore;
        away.gf += match.awayScore;
        away.ga += match.homeScore;
        home.gd = home.gf - home.ga;
        away.gd = away.gf - away.ga;
        
        if (match.homeScore > match.awayScore) {
          home.wins++;
          home.points += 3;
          away.losses++;
        } else if (match.homeScore < match.awayScore) {
          away.wins++;
          away.points += 3;
          home.losses++;
        } else {
          home.draws++;
          away.draws++;
          home.points += 1;
          away.points += 1;
        }
      }
    });
    
    return Array.from(teamsMap.entries())
      .map(([code, stats]) => ({
        code,
        team: matches.find(m => m.homeTeam.code === code)?.homeTeam || 
              matches.find(m => m.awayTeam.code === code)?.awayTeam ||
              { code, name: code, nameEn: code, logo: '⚽', founded: 1900 },
        ...stats
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e94560] to-[#0f3460] flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">世界杯 2026</h1>
              <p className="text-gray-400 text-sm">FIFA World Cup Qatar 2026</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'live'
                  ? 'bg-[#e94560] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Radio className="w-4 h-4" />
              赛事
            </button>
            <button
              onClick={() => setActiveTab('knockout')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'knockout'
                  ? 'bg-[#e94560] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Trophy className="w-4 h-4" />
              淘汰赛
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setSettingsDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
              title="设置"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">设置</span>
            </button>
          </div>
        </div>
      </header>

      <SettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        onSuccess={() => {
          // 配置成功，刷新数据
          fetchMatches();
        }}
      />

      <main className="w-full px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>正在加载比赛数据...</p>
          </div>
        ) : activeTab === 'live' ? (
          <div className="space-y-8">
            {liveMatches.length > 0 && (
              <section>
                <MatchList
                  matches={liveMatches}
                  title={`正在直播 (${liveMatches.length})`}
                />
              </section>
            )}

            {finishedMatches.length > 0 && (
              <section>
                <MatchList
                  matches={finishedMatches}
                  title={`已结束 (${finishedMatches.length})`}
                  initialCount={4}
                />
              </section>
            )}

            {upcomingMatches.length > 0 && (
              <section>
                <MatchList
                  matches={upcomingMatches}
                  title={`即将开始 (${upcomingMatches.length})`}
                  initialCount={4}
                />
              </section>
            )}

            {liveMatches.length === 0 && upcomingMatches.length === 0 && finishedMatches.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <p className="text-xl mb-2">暂无比赛数据</p>
                <p className="text-sm">请检查 API Token 配置或稍后再试</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* 淘汰赛对阵图 */}
            <TournamentBracket matches={matches} />
            
            {/* 小组赛排名 */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#e94560]" />
                小组赛排名
              </h2>

              {/* 数据完整性提示 */}
              {!loading && (
                <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300 flex items-start gap-2">
                  <span className="text-base">📊</span>
                  <div>
                    共接收到 <b>{matches.length}</b> 场比赛 · 其中小组赛 <b>{groupMatchesCount}</b> 场 · 淘汰赛 <b>{knockoutMatchesCount}</b> 场 · 识别到 <b>{allGroups.length}</b> 个小组。
                    {allGroups.length < 8 && (
                      <span className="text-yellow-400 ml-1">（小组赛数量较少，可能赛事尚未完全开踢或 API 数据尚未更新）</span>
                    )}
                  </div>
                </div>
              )}

              {/* 小组选择器（动态从数据生成） */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {allGroups.length > 0 ? (
                  allGroups.map((group) => (
                    <button
                      key={group}
                      onClick={() => setActiveGroup(group)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex-shrink-0 ${
                        activeGroup === group
                          ? 'bg-[#e94560] text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      小组 {group}
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-gray-400">暂无小组数据</div>
                )}
              </div>
              
              {/* 小组排名表格 */}
              <div className="bg-white/5 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">排名</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">球队</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">场次</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">胜</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">平</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">负</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">进球</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">失球</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">净胜</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">积分</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {getGroupStandings(activeGroup).map((standing, index) => (
                      <tr key={standing.code} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            index === 1 ? 'bg-gray-400/20 text-gray-300' :
                            index === 2 ? 'bg-orange-600/20 text-orange-400' :
                            'bg-white/10 text-gray-400'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/team/${standing.team.code}`}
                            className="flex items-center gap-2 hover:opacity-75 transition-opacity group"
                          >
                            <span className="text-lg">{standing.team.logo}</span>
                            <div className="flex flex-col">
                              <span className="text-white font-medium group-hover:underline">{standing.team.name}</span>
                              <span className="text-gray-500 text-xs">{standing.team.nameEn}</span>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300">{standing.played}</td>
                        <td className="px-4 py-3 text-center text-green-400">{standing.wins}</td>
                        <td className="px-4 py-3 text-center text-yellow-400">{standing.draws}</td>
                        <td className="px-4 py-3 text-center text-red-400">{standing.losses}</td>
                        <td className="px-4 py-3 text-center text-gray-300">{standing.gf}</td>
                        <td className="px-4 py-3 text-center text-gray-300">{standing.ga}</td>
                        <td className={`px-4 py-3 text-center font-medium ${standing.gd > 0 ? 'text-green-400' : standing.gd < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {standing.gd > 0 ? '+' : ''}{standing.gd}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-[#e94560]/20 text-[#e94560] font-bold">
                            {standing.points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {getGroupStandings(activeGroup).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    小组 {activeGroup} 暂无比赛数据
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
