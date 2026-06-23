import { useState, useMemo } from 'react';
import { Match, Team } from '../types';
import { MapPin, X, Calendar, Clock } from 'lucide-react';

// 2026世界杯48队淘汰赛完整对阵规则（参考FIFA官网）
// 12个小组(A-L)，每组前2名直接晋级，8个成绩最好的第3名晋级，共32队
// 淘汰赛结构：32强 → 16强 → 四分之一决赛 → 半决赛 → 决赛/季军赛

interface BracketNode {
  matchId: string;
  label: string; // M71, M72等
  date: string;
  time: string;
  round: 'round32' | 'round16' | 'quarter' | 'semi' | 'final' | 'third';
  side: 'left' | 'right';
  homeSource: { rank: number; groups: string[] };
  awaySource: { rank: number; groups: string[] };
  knockoutMatch?: Match;
}

function getRoundLabel(round: string): string {
  switch (round) {
    case 'round32': return '32强';
    case 'round16': return '16强';
    case 'quarter': return '四分之一决赛';
    case 'semi': return '半决赛';
    case 'final': return '决赛';
    case 'third': return '季军赛';
    default: return '淘汰赛';
  }
}

function getGroupStandings(matches: Match[], groupLetter: string) {
  const groupMatchesList = matches.filter(
    (m) => m.stage === 'group' && m.group === groupLetter
  );

  const teamsMap = new Map<string, { played: number; wins: number; draws: number; losses: number; gf: number; ga: number; gd: number; points: number; team: Team }>();

  groupMatchesList.forEach(match => {
    if (match.status === 'finished' || match.status === 'live') {
      if (!teamsMap.has(match.homeTeam.code)) {
        teamsMap.set(match.homeTeam.code, { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0, team: match.homeTeam });
      }
      if (!teamsMap.has(match.awayTeam.code)) {
        teamsMap.set(match.awayTeam.code, { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0, team: match.awayTeam });
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

  return Array.from(teamsMap.values())
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
}

interface TournamentBracketProps {
  matches: Match[];
}

export default function TournamentBracket({ matches }: TournamentBracketProps) {
  const [selectedNode, setSelectedNode] = useState<BracketNode | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const allGroups = useMemo(() => {
    const groups = new Set<string>();
    matches.forEach(m => {
      if (m.stage === 'group' && m.group) {
        groups.add(m.group);
      }
    });
    const result = Array.from(groups).sort();
    const allLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    allLetters.forEach(letter => {
      if (!result.includes(letter)) {
        result.push(letter);
      }
    });
    return result.sort();
  }, [matches]);

  // 构建完整的2026世界杯淘汰赛结构（参考FIFA官网）
  const bracketStructure = useMemo((): BracketNode[][] => {
    // 左侧半区(M101)和右侧半区(M103)的32强对阵
    const leftRound32 = [
      { label: 'M71', date: '2026-06-30', time: '04:30', home: { rank: 1, groups: ['E'] }, away: { rank: 3, groups: ['A', 'B', 'C', 'D', 'F'] } },
      { label: 'M77', date: '2026-07-01', time: '05:00', home: { rank: 1, groups: ['I'] }, away: { rank: 3, groups: ['C', 'D', 'F', 'G', 'H'] } },
      { label: 'M73', date: '2026-06-29', time: '03:00', home: { rank: 2, groups: ['A'] }, away: { rank: 2, groups: ['B'] } },
      { label: 'M75', date: '2026-06-30', time: '09:00', home: { rank: 1, groups: ['F'] }, away: { rank: 2, groups: ['C'] } },
      { label: 'M83', date: '2026-07-03', time: '07:00', home: { rank: 2, groups: ['K'] }, away: { rank: 2, groups: ['L'] } },
      { label: 'M84', date: '2026-07-03', time: '03:00', home: { rank: 1, groups: ['H'] }, away: { rank: 2, groups: ['J'] } },
      { label: 'M81', date: '2026-07-02', time: '08:00', home: { rank: 1, groups: ['D'] }, away: { rank: 3, groups: ['B', 'E', 'F', 'I', 'J'] } },
      { label: 'M82', date: '2026-07-02', time: '04:00', home: { rank: 1, groups: ['G'] }, away: { rank: 3, groups: ['A', 'E', 'H', 'I', 'J'] } },
    ];

    const rightRound32 = [
      { label: 'M76', date: '2026-06-30', time: '01:00', home: { rank: 1, groups: ['C'] }, away: { rank: 2, groups: ['F'] } },
      { label: 'M78', date: '2026-07-01', time: '01:00', home: { rank: 2, groups: ['E'] }, away: { rank: 1, groups: ['I'] } },
      { label: 'M79', date: '2026-07-01', time: '09:00', home: { rank: 1, groups: ['A'] }, away: { rank: 3, groups: ['C', 'E', 'F', 'H', 'I'] } },
      { label: 'M80', date: '2026-07-02', time: '00:00', home: { rank: 1, groups: ['L'] }, away: { rank: 3, groups: ['E', 'H', 'I', 'J', 'K'] } },
      { label: 'M86', date: '2026-07-04', time: '06:00', home: { rank: 1, groups: ['J'] }, away: { rank: 2, groups: ['H'] } },
      { label: 'M88', date: '2026-07-04', time: '02:00', home: { rank: 2, groups: ['D'] }, away: { rank: 2, groups: ['G'] } },
      { label: 'M85', date: '2026-07-03', time: '11:00', home: { rank: 1, groups: ['B'] }, away: { rank: 3, groups: ['E', 'F', 'G', 'I', 'J'] } },
      { label: 'M87', date: '2026-07-04', time: '09:30', home: { rank: 1, groups: ['K'] }, away: { rank: 3, groups: ['D', 'E', 'I', 'J', 'L'] } },
    ];

    const leftSide: BracketNode[] = [];
    const rightSide: BracketNode[] = [];

    // 32强
    leftRound32.forEach((node, idx) => {
      leftSide.push({
        matchId: `left-r32-${idx}`,
        ...node,
        round: 'round32',
        side: 'left',
        homeSource: node.home,
        awaySource: node.away,
      });
    });

    rightRound32.forEach((node, idx) => {
      rightSide.push({
        matchId: `right-r32-${idx}`,
        ...node,
        round: 'round32',
        side: 'right',
        homeSource: node.home,
        awaySource: node.away,
      });
    });

    // 16强（占位，等待32强结果）
    const leftRound16Labels = ['W71', 'W77', 'W73', 'W75', 'W83', 'W84', 'W81', 'W82'];
    const rightRound16Labels = ['W76', 'W78', 'W79', 'W80', 'W86', 'W88', 'W85', 'W87'];
    
    leftRound16Labels.forEach((label, idx) => {
      leftSide.push({
        matchId: `left-r16-${idx}`,
        label,
        date: idx < 4 ? '2026-07-05' : '2026-07-07',
        time: idx % 2 === 0 ? '05:00' : '01:00',
        round: 'round16',
        side: 'left',
        homeSource: { rank: 0, groups: [] },
        awaySource: { rank: 0, groups: [] },
      });
    });

    rightRound16Labels.forEach((label, idx) => {
      rightSide.push({
        matchId: `right-r16-${idx}`,
        label,
        date: idx < 4 ? '2026-07-06' : '2026-07-08',
        time: idx % 2 === 0 ? '04:00' : '00:00',
        round: 'round16',
        side: 'right',
        homeSource: { rank: 0, groups: [] },
        awaySource: { rank: 0, groups: [] },
      });
    });

    // 四分之一决赛
    const leftQFLabels = ['W89', 'W90', 'W93', 'W94'];
    const rightQFLabels = ['W91', 'W92', 'W95', 'W96'];
    
    leftQFLabels.forEach((label, idx) => {
      leftSide.push({
        matchId: `left-qf-${idx}`,
        label,
        date: idx < 2 ? '2026-07-10' : '2026-07-11',
        time: '04:00',
        round: 'quarter',
        side: 'left',
        homeSource: { rank: 0, groups: [] },
        awaySource: { rank: 0, groups: [] },
      });
    });

    rightQFLabels.forEach((label, idx) => {
      rightSide.push({
        matchId: `right-qf-${idx}`,
        label,
        date: idx < 2 ? '2026-07-12' : '2026-07-13',
        time: idx % 2 === 0 ? '05:00' : '09:00',
        round: 'quarter',
        side: 'right',
        homeSource: { rank: 0, groups: [] },
        awaySource: { rank: 0, groups: [] },
      });
    });

    // 半决赛
    const leftSemiLabels = ['W97', 'W98'];
    const rightSemiLabels = ['W99', 'W100'];
    
    leftSemiLabels.forEach((label, idx) => {
      leftSide.push({
        matchId: `left-sf-${idx}`,
        label,
        date: '2026-07-15',
        time: '03:00',
        round: 'semi',
        side: 'left',
        homeSource: { rank: 0, groups: [] },
        awaySource: { rank: 0, groups: [] },
      });
    });

    rightSemiLabels.forEach((label, idx) => {
      rightSide.push({
        matchId: `right-sf-${idx}`,
        label,
        date: '2026-07-16',
        time: '03:00',
        round: 'semi',
        side: 'right',
        homeSource: { rank: 0, groups: [] },
        awaySource: { rank: 0, groups: [] },
      });
    });

    // 决赛和季军赛
    leftSide.push({
      matchId: 'final',
      label: 'W101 v W102',
      date: '2026-07-20',
      time: '03:00',
      round: 'final',
      side: 'left',
      homeSource: { rank: 0, groups: [] },
      awaySource: { rank: 0, groups: [] },
    });

    leftSide.push({
      matchId: 'third',
      label: 'RU101 v RU102',
      date: '2026-07-19',
      time: '05:00',
      round: 'third',
      side: 'left',
      homeSource: { rank: 0, groups: [] },
      awaySource: { rank: 0, groups: [] },
    });

    return [leftSide, rightSide];
  }, [allGroups]);

  const getNodeDisplayText = (node: BracketNode): string => {
    if (node.homeSource.rank === 0) return node.label;
    const homeText = `${node.homeSource.rank}${node.homeSource.groups.join('')}`;
    const awayText = `${node.awaySource.rank}${node.awaySource.groups.join('')}`;
    return `${homeText} v ${awayText}`;
  };

  const renderNode = (node: BracketNode) => {
    const displayText = getNodeDisplayText(node);
    
    return (
      <div
        key={node.matchId}
        onClick={() => setSelectedNode(node)}
        className="bg-gradient-to-br from-[#16213e] to-[#1a1a2e] border border-white/10 rounded-lg p-3 cursor-pointer hover:border-[#e94560] transition-all min-w-[140px]"
      >
        <div className="text-xs font-bold text-[#e94560] mb-1">{node.label}</div>
        <div className="text-sm font-medium text-white">{displayText}</div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          <Calendar className="w-3 h-3" />
          <span>{node.date.substring(5)}</span>
          <Clock className="w-3 h-3" />
          <span>{node.time} (北京时间)</span>
        </div>
      </div>
    );
  };

  const renderNodeDetail = (node: BracketNode | null) => {
    if (!node) return null;

    // 获取指定名次的球队
    const getTeamsAtRank = (groups: string[], rank: number) => {
      const result: { group: string; team: Team | null; points: number; gd: number }[] = [];
      groups.forEach(group => {
        const standings = getGroupStandings(matches, group);
        if (standings.length >= rank) {
          const team = standings[rank - 1];
          result.push({
            group,
            team: team.team,
            points: team.points,
            gd: team.gd,
          });
        } else {
          result.push({
            group,
            team: null,
            points: 0,
            gd: 0,
          });
        }
      });
      return result;
    };

    const homeTeams = getTeamsAtRank(node.homeSource.groups, node.homeSource.rank);
    const awayTeams = getTeamsAtRank(node.awaySource.groups, node.awaySource.rank);

    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedNode(null)}>
        <div className="bg-[#1a1a2e] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              {getRoundLabel(node.round)} - {node.label}
            </h3>
            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{node.date}</span>
            <Clock className="w-4 h-4" />
            <span>{node.time} (北京时间)</span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* 主队来源 */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="text-xs font-bold text-blue-400 mb-2">主队来源</div>
              <div className="text-lg font-bold text-white">
                {node.homeSource.rank}{node.homeSource.groups.join('')}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                第{node.homeSource.rank}名
              </div>
            </div>

            <div className="flex items-center justify-center text-2xl text-[#e94560]">
              v
            </div>

            {/* 客队来源 */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="text-xs font-bold text-green-400 mb-2">客队来源</div>
              <div className="text-lg font-bold text-white">
                {node.awaySource.rank}{node.awaySource.groups.join('')}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                第{node.awaySource.rank}名
              </div>
            </div>
          </div>

          {/* 详细表格 - 只显示要求名次的队伍 */}
          {node.homeSource.rank > 0 && (
            <div className="mb-6">
              <div className="text-sm font-bold text-blue-400 mb-2">
                {node.homeSource.groups.length === 1 ? `${node.homeSource.groups[0]}组第${node.homeSource.rank}名` : `各小组第${node.homeSource.rank}名球队`}
              </div>
              <div className="bg-white/5 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">组别</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">球队</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-300">积分</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-300">净胜球</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homeTeams.map(item => (
                      <tr key={item.group}>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">
                            {item.group}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {item.team ? (
                            <button
                              onClick={() => setSelectedTeam(item.team)}
                              className="flex items-center gap-2 text-left hover:opacity-75 transition-opacity group"
                            >
                              <span>{item.team.logo}</span>
                              <span className="text-white group-hover:underline">{item.team.name}</span>
                              <span className="text-gray-500 text-xs hidden sm:inline">{item.team.nameEn}</span>
                            </button>
                          ) : (
                            <span className="text-gray-500">比赛未开始</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-300">{item.points}</td>
                        <td className={`px-4 py-2 text-center font-medium ${item.gd > 0 ? 'text-green-400' : item.gd < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {item.gd > 0 ? '+' : ''}{item.gd}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {node.awaySource.rank > 0 && (
            <div>
              <div className="text-sm font-bold text-green-400 mb-2">
                {node.awaySource.groups.length === 1 ? `${node.awaySource.groups[0]}组第${node.awaySource.rank}名` : `各小组第${node.awaySource.rank}名球队`}
              </div>
              <div className="bg-white/5 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">组别</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">球队</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-300">积分</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-300">净胜球</th>
                    </tr>
                  </thead>
                  <tbody>
                    {awayTeams.map(item => (
                      <tr key={item.group}>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-sm font-bold">
                            {item.group}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {item.team ? (
                            <button
                              onClick={() => setSelectedTeam(item.team)}
                              className="flex items-center gap-2 text-left hover:opacity-75 transition-opacity group"
                            >
                              <span>{item.team.logo}</span>
                              <span className="text-white group-hover:underline">{item.team.name}</span>
                              <span className="text-gray-500 text-xs hidden sm:inline">{item.team.nameEn}</span>
                            </button>
                          ) : (
                            <span className="text-gray-500">比赛未开始</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-300">{item.points}</td>
                        <td className={`px-4 py-2 text-center font-medium ${item.gd > 0 ? 'text-green-400' : item.gd < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {item.gd > 0 ? '+' : ''}{item.gd}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 图例说明 */}
          <div className="mt-4 text-xs text-gray-500">
            <p><span className="text-blue-400">蓝色背景</span>：主队来源 | <span className="text-green-400">绿色背景</span>：客队来源</p>
            <p className="mt-1">注：3ABDF 表示从 A/B/D/F 组的第3名中选出成绩最好的球队晋级</p>
          </div>
        </div>
      </div>
    );
  };

  // 渲染球队对战历史子弹窗
  const renderTeamMatches = (team: Team | null) => {
    if (!team) return null;

    // 找到该队所有比赛（主队或客队）
    const teamMatches = matches.filter(
      m => m.homeTeam.code === team.code || m.awayTeam.code === team.code
    ).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    const finishedMatches = teamMatches.filter(m => m.status === 'finished');
    const liveMatches = teamMatches.filter(m => m.status === 'live');
    const upcomingMatches = teamMatches.filter(m => m.status === 'upcoming');

    const renderMatchRow = (match: Match) => {
      const isHome = match.homeTeam.code === team.code;
      const opponent = isHome ? match.awayTeam : match.homeTeam;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const oppScore = isHome ? match.awayScore : match.homeScore;
      let resultLabel = '';
      let resultColor = '';
      if (match.status === 'finished') {
        if (teamScore > oppScore) { resultLabel = '胜'; resultColor = 'text-green-400'; }
        else if (teamScore < oppScore) { resultLabel = '负'; resultColor = 'text-red-400'; }
        else { resultLabel = '平'; resultColor = 'text-yellow-400'; }
      } else if (match.status === 'live') {
        resultLabel = '进行中'; resultColor = 'text-yellow-400';
      } else {
        resultLabel = '未开始'; resultColor = 'text-blue-400';
      }

      return (
        <div key={match.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{match.date}</span>
              <Clock className="w-3 h-3" />
              <span>{match.time}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {match.stage === 'group' ? (
                <span className="bg-white/10 px-2 py-0.5 rounded">小组{match.group}</span>
              ) : (
                <span className="bg-[#e94560]/20 text-[#e94560] px-2 py-0.5 rounded">
                  {match.stage === 'round16' ? '16强' : match.stage === 'quarter' ? '八强' : match.stage === 'semi' ? '半决赛' : match.stage === 'final' ? '决赛' : '淘汰赛'}
                </span>
              )}
              <span className={`font-bold ${resultColor}`}>{resultLabel}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col items-center text-center flex-1">
              <div className="text-2xl mb-1">{team.logo}</div>
              <div className="text-white font-medium text-sm">{team.name}</div>
              <div className="text-gray-500 text-xs">{team.nameEn}</div>
            </div>

            <div className="flex flex-col items-center px-4">
              {match.status === 'upcoming' ? (
                <span className="text-2xl font-bold text-white">VS</span>
              ) : (
                <span className={`text-3xl font-bold ${match.status === 'live' ? 'text-[#e94560]' : 'text-white'}`}>
                  {teamScore} <span className="text-gray-500 text-xl">-</span> {oppScore}
                </span>
              )}
            </div>

            <div className="flex flex-col items-center text-center flex-1">
              <div className="text-2xl mb-1">{opponent.logo}</div>
              <div className="text-white font-medium text-sm">{opponent.name}</div>
              <div className="text-gray-500 text-xs">{opponent.nameEn}</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span>{match.venue}</span>
          </div>
        </div>
      );
    };

    return (
      <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedTeam(null)}>
        <div className="bg-[#1a1a2e] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{team.logo}</span>
              <div>
                <h3 className="text-xl font-bold text-white">{team.name} 对战历史</h3>
                <p className="text-sm text-gray-400">{team.nameEn}</p>
              </div>
            </div>
            <button onClick={() => setSelectedTeam(null)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{finishedMatches.length + liveMatches.length}</div>
              <div className="text-xs text-gray-400">已赛场次</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">
                {finishedMatches.filter(m => {
                  const isH = m.homeTeam.code === team.code;
                  const myScore = isH ? m.homeScore : m.awayScore;
                  const opScore = isH ? m.awayScore : m.homeScore;
                  return myScore > opScore;
                }).length}
              </div>
              <div className="text-xs text-gray-400">胜</div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">
                {finishedMatches.filter(m => {
                  const isH = m.homeTeam.code === team.code;
                  const myScore = isH ? m.homeScore : m.awayScore;
                  const opScore = isH ? m.awayScore : m.homeScore;
                  return myScore < opScore;
                }).length}
              </div>
              <div className="text-xs text-gray-400">负</div>
            </div>
          </div>

          {/* 比赛列表 */}
          <div className="space-y-3">
            {teamMatches.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">暂无比赛记录</p>
                <p className="text-sm mt-2">该队比赛尚未开始或数据暂无</p>
              </div>
            ) : (
              <>
                {liveMatches.length > 0 && (
                  <div>
                    <div className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                      进行中 ({liveMatches.length})
                    </div>
                    <div className="space-y-2">
                      {liveMatches.map(renderMatchRow)}
                    </div>
                  </div>
                )}
                {finishedMatches.length > 0 && (
                  <div>
                    <div className="text-sm font-bold text-green-400 mb-3 mt-4">已结束 ({finishedMatches.length})</div>
                    <div className="space-y-2">
                      {finishedMatches.map(renderMatchRow)}
                    </div>
                  </div>
                )}
                {upcomingMatches.length > 0 && (
                  <div>
                    <div className="text-sm font-bold text-blue-400 mb-3 mt-4">即将开始 ({upcomingMatches.length})</div>
                    <div className="space-y-2">
                      {upcomingMatches.map(renderMatchRow)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const leftSide = bracketStructure[0] || [];
  const rightSide = bracketStructure[1] || [];

  const leftRound32 = leftSide.filter(n => n.round === 'round32');
  const leftRound16 = leftSide.filter(n => n.round === 'round16');
  const leftQuarter = leftSide.filter(n => n.round === 'quarter');
  const leftSemi = leftSide.filter(n => n.round === 'semi');
  const finalMatch = leftSide.find(n => n.round === 'final');
  const thirdMatch = leftSide.find(n => n.round === 'third');

  const rightRound32 = rightSide.filter(n => n.round === 'round32');
  const rightRound16 = rightSide.filter(n => n.round === 'round16');
  const rightQuarter = rightSide.filter(n => n.round === 'quarter');
  const rightSemi = rightSide.filter(n => n.round === 'semi');

  return (
    <div>
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
        <span className="text-2xl">🏆</span>
        淘汰赛对阵图
        <span className="text-xs font-normal text-gray-400 ml-2">（2026年48队赛制 · 参考FIFA官网）</span>
      </h2>

      <div className="bg-white/5 rounded-xl p-4 overflow-x-auto">
        {/* 阶段标签 */}
        <div className="flex justify-between mb-4 px-8">
          <div className="text-xs text-gray-500">32强</div>
          <div className="text-xs text-gray-500">16强</div>
          <div className="text-xs text-gray-500">四分之一决赛</div>
          <div className="text-xs text-gray-500">半决赛</div>
          <div className="text-xs text-gray-500">决赛/季军赛</div>
        </div>

        <div className="flex gap-8 min-w-[1400px]">
          {/* 左侧半区 - 32强 */}
          <div className="flex flex-col gap-3">
            {leftRound32.map(node => renderNode(node))}
          </div>

          {/* 左侧半区 - 16强 */}
          <div className="flex flex-col gap-3">
            {leftRound16.map(node => (
              <div
                key={node.matchId}
                onClick={() => setSelectedNode(node)}
                className="bg-gradient-to-br from-[#16213e] to-[#1a1a2e] border border-white/10 rounded-lg p-3 cursor-pointer hover:border-[#e94560] transition-all min-w-[140px]"
              >
                <div className="text-xs font-bold text-[#e94560] mb-1">{node.label}</div>
                <div className="text-sm text-gray-500">待确定</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{node.date.substring(5)}</span>
                  <Clock className="w-3 h-3" />
                  <span>{node.time} (北京时间)</span>
                </div>
              </div>
            ))}
          </div>

          {/* 左侧半区 - 四分之一决赛 */}
          <div className="flex flex-col gap-3">
            {leftQuarter.map(node => (
              <div
                key={node.matchId}
                className="bg-gradient-to-br from-[#16213e] to-[#1a1a2e] border border-white/10 rounded-lg p-3 min-w-[140px] text-center"
              >
                <div className="text-xs font-bold text-[#e94560] mb-1">{node.label}</div>
                <div className="text-sm text-gray-500">待确定</div>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{node.date.substring(5)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 左侧半区 - 半决赛 */}
          <div className="flex flex-col gap-3">
            {leftSemi.map(node => (
              <div
                key={node.matchId}
                className="bg-gradient-to-br from-[#16213e] to-[#1a1a2e] border border-white/10 rounded-lg p-3 min-w-[140px] text-center"
              >
                <div className="text-xs font-bold text-[#e94560] mb-1">{node.label}</div>
                <div className="text-sm text-gray-500">待确定</div>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{node.date.substring(5)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 决赛和季军赛 */}
          <div className="flex flex-col items-center gap-4">
            {finalMatch && (
              <div
                className="bg-gradient-to-r from-[#16213e] via-[#e94560]/30 to-[#16213e] border-2 border-[#e94560] rounded-xl px-8 py-6 text-center min-w-[200px]"
              >
                <div className="text-lg font-bold text-[#e94560]">🏆 决赛</div>
                <div className="text-sm text-white mt-2">{finalMatch.label}</div>
                <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{finalMatch.date}</span>
                  <Clock className="w-4 h-4" />
                  <span>{finalMatch.time} (北京时间)</span>
                </div>
              </div>
            )}
            
            {thirdMatch && (
              <div
                className="bg-gradient-to-r from-[#16213e] via-blue-500/20 to-[#16213e] border border-blue-500/30 rounded-xl px-6 py-4 text-center min-w-[200px]"
              >
                <div className="text-sm font-bold text-blue-400">🥉 季军赛</div>
                <div className="text-xs text-gray-400 mt-1">{thirdMatch.label}</div>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{thirdMatch.date}</span>
                  <Clock className="w-3 h-3" />
                  <span>{thirdMatch.time} (北京时间)</span>
                </div>
              </div>
            )}
          </div>

          {/* 右侧半区 - 半决赛 */}
          <div className="flex flex-col gap-3">
            {rightSemi.map(node => (
              <div
                key={node.matchId}
                className="bg-gradient-to-br from-[#16213e] to-[#1a1a2e] border border-white/10 rounded-lg p-3 min-w-[140px] text-center"
              >
                <div className="text-xs font-bold text-[#e94560] mb-1">{node.label}</div>
                <div className="text-sm text-gray-500">待确定</div>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{node.date.substring(5)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 右侧半区 - 四分之一决赛 */}
          <div className="flex flex-col gap-3">
            {rightQuarter.map(node => (
              <div
                key={node.matchId}
                className="bg-gradient-to-br from-[#16213e] to-[#1a1a2e] border border-white/10 rounded-lg p-3 min-w-[140px] text-center"
              >
                <div className="text-xs font-bold text-[#e94560] mb-1">{node.label}</div>
                <div className="text-sm text-gray-500">待确定</div>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{node.date.substring(5)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 右侧半区 - 16强 */}
          <div className="flex flex-col gap-3">
            {rightRound16.map(node => (
              <div
                key={node.matchId}
                onClick={() => setSelectedNode(node)}
                className="bg-gradient-to-br from-[#16213e] to-[#1a1a2e] border border-white/10 rounded-lg p-3 cursor-pointer hover:border-[#e94560] transition-all min-w-[140px]"
              >
                <div className="text-xs font-bold text-[#e94560] mb-1">{node.label}</div>
                <div className="text-sm text-gray-500">待确定</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{node.date.substring(5)}</span>
                  <Clock className="w-3 h-3" />
                  <span>{node.time} (北京时间)</span>
                </div>
              </div>
            ))}
          </div>

          {/* 右侧半区 - 32强 */}
          <div className="flex flex-col gap-3">
            {rightRound32.map(node => renderNode(node))}
          </div>
        </div>

        {/* 图例说明 */}
        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>💡 点击32强节点查看该场比赛的详细分组信息</p>
          <p className="mt-1">节点格式：1E v 3ABCDF 表示 E组第1名 vs A/B/C/D/F组第3名之一</p>
        </div>
      </div>

      {renderNodeDetail(selectedNode)}
      {renderTeamMatches(selectedTeam)}
    </div>
  );
}
