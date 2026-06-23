import { Match, Team } from '../types';
import { syncConfigToBackend } from './proxyConfig';

// ====== 北京时间时间转换（UTC → Asia/Shanghai, UTC+8）======
// 用法: 传入 ISO 字符串 / Date 对象 / "YYYY-MM-DD HH:MM" 等
// 例: formatBeijingDateTime("2026-06-14T22:00:00Z") → {date:"2026-06-15", time:"06:00"}

function parseDate(input: string | Date | undefined | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  // 处理字符串格式 - 让浏览器解析
  // "2026-06-14T22:00:00Z" → UTC时间 → 让new Date直接解析
  // "2026-06-14 22:00:00" → 当作北京时间处理 (+08:00)
  // "2026-06-14" → 当作北京时间 18:00
  if (typeof input === 'string') {
    // 包含 Z 或 +(如+08:00) → 已是标准格式，让Date直接解析
    if (input.includes('Z') || /[+\-]\d{2}:\d{2}/.test(input)) {
      const d = new Date(input);
      return isNaN(d.getTime()) ? null : d;
    }
    // 只包含日期
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return new Date(`${input}T18:00:00+08:00`);
    }
    // 日期 + 时间 (但无时区信息) → 当作北京时间
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{1,2}:\d{2}/.test(input)) {
      const s = input.replace(' ', 'T');
      return new Date(`${s}+08:00`);
    }
    // 其它格式 → 让 Date 尝试
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toBeijingParts(date: Date | null): { date: string; time: string } {
  if (!date) return { date: '—', time: '—' };
  // 使用 Intl + 'Asia/Shanghai' 时区转换
  const datePart = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return { date: datePart, time: timePart };
}

// 统一入口：输入任何时间字符串，输出 {date, time} 的北京时间
function formatBeijingDateTime(input: string | Date | undefined | null): { date: string; time: string } {
  const result = toBeijingParts(parseDate(input));
  console.log(`[时间转换] 输入: ${input} → 北京: ${result.date} ${result.time}`);
  return result;
}

export async function fetchLiveMatches(): Promise<Match[]> {
  // 页面加载时，如果有保存的配置，同步到后端
  await syncConfigToBackend();

  try {
    console.log('[数据] 正在请求 /api/matches (通过服务器代理)...');

    const response = await fetch('/api/matches', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[数据] 响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[数据] 请求失败:', errorText);
      return getMockMatches();
    }

    const data = await response.json();

    // 如果是回退数据（包含 groups 字段），用它来生成正确的分组赛程
    if (data.fallback && data.groups && data.groups.length > 0) {
      console.log('[数据] API返回回退数据，使用FIFA官方分组信息');
      return generateMatchesFromGroups(data.groups);
    }

    // 正常的 API 数据
    if (data.matches && data.matches.length > 0) {
      console.log('[数据] 返回真实比赛数据，共', data.matches.length, '场');
      return transformMatches(data.matches);
    }

    console.log('[数据] API未返回有效比赛数据，使用回退赛程');
    return getMockMatches();
  } catch (error) {
    console.error('[数据] 请求失败:', error);
    return getMockMatches();
  }
}

// 从 groups 回退数据生成比赛赛程（用FIFA官方分组，时间为UTC时间）
function generateMatchesFromGroups(groups: { group: string; teams: string[] }[]): Match[] {
  const matches: Match[] = [];
  let matchId = 1;

  // 2026世界杯小组赛日期（UTC时间）
  // 参考FIFA官网：小组J阿根廷vs奥地利在达拉斯当地时间01:00 = UTC 06:00 = 北京时间14:00
  const matchDays = [
    { date: '2026-06-12', utcTime: '19:00' }, // Matchday 1
    { date: '2026-06-12', utcTime: '22:00' },
    { date: '2026-06-17', utcTime: '19:00' }, // Matchday 2
    { date: '2026-06-17', utcTime: '22:00' },
    { date: '2026-06-22', utcTime: '18:00' }, // Matchday 3
    { date: '2026-06-22', utcTime: '21:00' },
  ];

  for (const g of groups) {
    const groupLetter = g.group;
    const teams = g.teams;

    // Matchday 1: Team1 vs Team2, Team3 vs Team4
    const bj1 = formatBeijingDateTime(`${matchDays[0].date}T${matchDays[0].utcTime}:00Z`);
    matches.push({
      id: String(matchId++),
      date: bj1.date, time: bj1.time,
      stage: 'group', rawStage: 'FIRST_ROUND',
      group: groupLetter,
      homeTeam: transformTeam({ shortName: teams[0], name: teams[0] }, 'home'),
      awayTeam: transformTeam({ shortName: teams[1], name: teams[1] }, 'away'),
      homeScore: 0, awayScore: 0, status: 'upcoming',
      venue: '2026美加墨世界杯',
    });

    const bj2 = formatBeijingDateTime(`${matchDays[1].date}T${matchDays[1].utcTime}:00Z`);
    matches.push({
      id: String(matchId++),
      date: bj2.date, time: bj2.time,
      stage: 'group', rawStage: 'FIRST_ROUND',
      group: groupLetter,
      homeTeam: transformTeam({ shortName: teams[2], name: teams[2] }, 'home'),
      awayTeam: transformTeam({ shortName: teams[3], name: teams[3] }, 'away'),
      homeScore: 0, awayScore: 0, status: 'upcoming',
      venue: '2026美加墨世界杯',
    });

    // Matchday 2: Team1 vs Team3, Team2 vs Team4
    const bj3 = formatBeijingDateTime(`${matchDays[2].date}T${matchDays[2].utcTime}:00Z`);
    matches.push({
      id: String(matchId++),
      date: bj3.date, time: bj3.time,
      stage: 'group', rawStage: 'FIRST_ROUND',
      group: groupLetter,
      homeTeam: transformTeam({ shortName: teams[0], name: teams[0] }, 'home'),
      awayTeam: transformTeam({ shortName: teams[2], name: teams[2] }, 'away'),
      homeScore: 0, awayScore: 0, status: 'upcoming',
      venue: '2026美加墨世界杯',
    });

    const bj4 = formatBeijingDateTime(`${matchDays[3].date}T${matchDays[3].utcTime}:00Z`);
    matches.push({
      id: String(matchId++),
      date: bj4.date, time: bj4.time,
      stage: 'group', rawStage: 'FIRST_ROUND',
      group: groupLetter,
      homeTeam: transformTeam({ shortName: teams[1], name: teams[1] }, 'home'),
      awayTeam: transformTeam({ shortName: teams[3], name: teams[3] }, 'away'),
      homeScore: 0, awayScore: 0, status: 'upcoming',
      venue: '2026美加墨世界杯',
    });

    // Matchday 3: Team1 vs Team4, Team2 vs Team3
    const bj5 = formatBeijingDateTime(`${matchDays[4].date}T${matchDays[4].utcTime}:00Z`);
    matches.push({
      id: String(matchId++),
      date: bj5.date, time: bj5.time,
      stage: 'group', rawStage: 'FIRST_ROUND',
      group: groupLetter,
      homeTeam: transformTeam({ shortName: teams[0], name: teams[0] }, 'home'),
      awayTeam: transformTeam({ shortName: teams[3], name: teams[3] }, 'away'),
      homeScore: 0, awayScore: 0, status: 'upcoming',
      venue: '2026美加墨世界杯',
    });

    const bj6 = formatBeijingDateTime(`${matchDays[5].date}T${matchDays[5].utcTime}:00Z`);
    matches.push({
      id: String(matchId++),
      date: bj6.date, time: bj6.time,
      stage: 'group', rawStage: 'FIRST_ROUND',
      group: groupLetter,
      homeTeam: transformTeam({ shortName: teams[1], name: teams[1] }, 'home'),
      awayTeam: transformTeam({ shortName: teams[2], name: teams[2] }, 'away'),
      homeScore: 0, awayScore: 0, status: 'upcoming',
      venue: '2026美加墨世界杯',
    });
  }

  return matches;
}

// 英文 -> 中文球队名称对照表（FIFA 2026美加墨世界杯 48支参赛队）
const TEAM_NAME_ZH: Record<string, string> = {
  // A组
  'ARGENTINA': '阿根廷', 'ARG': '阿根廷',
  'AUSTRALIA': '澳大利亚', 'AUS': '澳大利亚',
  'AUSTRIA': '奥地利', 'AUT': '奥地利',
  'BELGIUM': '比利时', 'BEL': '比利时',
  'BRAZIL': '巴西', 'BRA': '巴西',
  'CANADA': '加拿大', 'CAN': '加拿大',
  'COLOMBIA': '哥伦比亚', 'COL': '哥伦比亚',
  'CROATIA': '克罗地亚', 'CRO': '克罗地亚',
  'DENMARK': '丹麦', 'DEN': '丹麦',
  'ECUADOR': '厄瓜多尔', 'ECU': '厄瓜多尔',
  'EGYPT': '埃及', 'EGY': '埃及',
  'ENGLAND': '英格兰', 'ENG': '英格兰',
  'FRANCE': '法国', 'FRA': '法国',
  'GERMANY': '德国', 'GER': '德国',
  'GHANA': '加纳', 'GHA': '加纳',
  'IR IRAN': '伊朗', 'IRAN': '伊朗', 'IRN': '伊朗',
  'ITALY': '意大利', 'ITA': '意大利',
  'IVORY COAST': '科特迪瓦', 'CIV': '科特迪瓦', "CÔTE D'IVOIRE": '科特迪瓦', 'COTE D IVOIRE': '科特迪瓦',
  'JAPAN': '日本', 'JPN': '日本',
  'JORDAN': '约旦', 'JOR': '约旦',
  'KOREA REPUBLIC': '韩国', 'KOR': '韩国', 'SOUTH KOREA': '韩国',
  'MEXICO': '墨西哥', 'MEX': '墨西哥',
  'MOROCCO': '摩洛哥', 'MAR': '摩洛哥',
  'NETHERLANDS': '荷兰', 'NED': '荷兰', 'NLD': '荷兰',
  'NEW ZEALAND': '新西兰', 'NZL': '新西兰',
  'NORWAY': '挪威', 'NOR': '挪威',
  'PANAMA': '巴拿马', 'PAN': '巴拿马',
  'PARAGUAY': '巴拉圭', 'PAR': '巴拉圭',
  'POLAND': '波兰', 'POL': '波兰',
  'PORTUGAL': '葡萄牙', 'POR': '葡萄牙',
  'QATAR': '卡塔尔', 'QAT': '卡塔尔',
  'SAUDI ARABIA': '沙特阿拉伯', 'KSA': '沙特阿拉伯',
  'SENEGAL': '塞内加尔', 'SEN': '塞内加尔',
  'SCOTLAND': '苏格兰', 'SCO': '苏格兰',
  'SPAIN': '西班牙', 'ESP': '西班牙',
  'SWEDEN': '瑞典', 'SWE': '瑞典',
  'SWITZERLAND': '瑞士', 'SUI': '瑞士', 'CHE': '瑞士',
  'TUNISIA': '突尼斯', 'TUN': '突尼斯',
  'UNITED STATES': '美国', 'USA': '美国',
  'URUGUAY': '乌拉圭', 'URU': '乌拉圭',
  // 新增球队（2026扩军）
  'SOUTH AFRICA': '南非', 'RSA': '南非',
  'CURACAO': '库拉索', 'CUR': '库拉索',
  'CAPE VERDE': '佛得角', 'CPV': '佛得角',
  'HAITI': '海地', 'HAI': '海地',
  'ALGERIA': '阿尔及利亚', 'ALG': '阿尔及利亚',
  'JAMAICA': '牙买加', 'JAM': '牙买加',
  'UZBEKISTAN': '乌兹别克斯坦', 'UZB': '乌兹别克斯坦',
  'IRAQ': '伊拉克', 'IRQ': '伊拉克',
  'TURKEY': '土耳其', 'TUR': '土耳其',
  'WALES': '威尔士', 'WAL': '威尔士',
};

// 将 API 的原始 stage 字段解析为业务语义
function parseStage(rawStage: string): Match['stage'] {
  if (!rawStage) return 'group';
  const s = rawStage.toUpperCase();

  if (s.includes('FIRST_ROUND') || s.includes('GROUP') || s === 'FIRST_ROUND' || s.includes('SECOND') || s.includes('THIRD')) {
    return 'group';
  }
  if (s.includes('ROUND_OF_16') || s.includes('RO16') || s.includes('1/8') || s.includes('EIGHTH')) {
    return 'round16';
  }
  if (s.includes('QUARTER') || s.includes('QF') || s.includes('1/4')) {
    return 'quarter';
  }
  if (s.includes('SEMI') || s.includes('SF')) {
    return 'semi';
  }
  if (s === 'FINAL' || s.includes('FINAL')) {
    return 'final';
  }
  if (s.includes('KNOCKOUT')) {
    return 'knockout';
  }
  return 'group';
}

function transformMatches(apiMatches: any[]): Match[] {
  if (!apiMatches || apiMatches.length === 0) {
    return getMockMatches();
  }

  return apiMatches.map((match, index) => {
    const rawStage = (match.stage || '').toUpperCase();
    const parsedStage = parseStage(rawStage);
    const apiGroup = match.group?.replace('GROUP_', '') || undefined;

    let homeScore = 0, awayScore = 0;
    if (match.score?.fullTime) {
      homeScore = match.score.fullTime.home ?? 0;
      awayScore = match.score.fullTime.away ?? 0;
    }
    if (match.score?.extraTime) {
      homeScore = match.score.extraTime.home ?? homeScore;
      awayScore = match.score.extraTime.away ?? awayScore;
    }
    if (match.score?.penalties) {
      homeScore = match.score.penalties.home ?? homeScore;
      awayScore = match.score.penalties.away ?? awayScore;
    }

    // 使用北京时间格式化（UTC → Asia/Shanghai, UTC+8）
    const bj = formatBeijingDateTime(match.utcDate);

    return {
      id: match.id?.toString() || String(index),
      date: bj.date,
      time: bj.time,
      stage: parsedStage,
      rawStage: rawStage,
      group: apiGroup,
      homeTeam: transformTeam(match.homeTeam, 'home'),
      awayTeam: transformTeam(match.awayTeam, 'away'),
      homeScore,
      awayScore,
      status: transformStatus(match.status),
      venue: match.venue || '世界杯赛场',
    };
  });
}

function transformTeam(apiTeam: any, position: string): Team {
  const englishName = apiTeam?.shortName || apiTeam?.name || (position === 'home' ? 'Home Team' : 'Away Team');
  const fullEnglishName = apiTeam?.name || englishName;
  
  // 查找中文翻译
  const upperName = englishName.toUpperCase().trim();
  const upperFull = fullEnglishName.toUpperCase().trim();
  let chineseName = TEAM_NAME_ZH[upperName];
  if (!chineseName) {
    // 尝试用全名查找
    chineseName = TEAM_NAME_ZH[upperFull];
  }
  if (!chineseName) {
    // 部分匹配
    for (const [key, zh] of Object.entries(TEAM_NAME_ZH)) {
      if (upperName.includes(key) || upperFull.includes(key)) {
        chineseName = zh;
        break;
      }
    }
  }
  if (!chineseName) {
    chineseName = englishName; // 如果找不到翻译，用英文
  }

  return {
    code: englishName.substring(0, 3).toUpperCase(),
    name: chineseName,
    nameEn: fullEnglishName,
    logo: getFlagEmoji(englishName),
    founded: 1900,
  };
}

function transformStatus(status: string): Match['status'] {
  switch (status) {
    case 'IN_PLAY':
    case 'PAUSED':
    case 'LIVE':
      return 'live';
    case 'FINISHED':
    case 'AWARDED':
      return 'finished';
    case 'SCHEDULED':
    case 'TIMED':
    case 'POSTPONED':
      return 'upcoming';
    default:
      return 'upcoming';
  }
}

function getFlagEmoji(teamName: string): string {
  if (!teamName) return '⚽';

  const flags: Record<string, string> = {
    'BRAZIL': '🇧🇷', 'BRA': '🇧🇷',
    'GERMANY': '🇩🇪', 'GER': '🇩🇪',
    'ARGENTINA': '🇦🇷', 'ARG': '🇦🇷',
    'FRANCE': '🇫🇷', 'FRA': '🇫🇷',
    'SPAIN': '🇪🇸', 'ESP': '🇪🇸',
    'ENGLAND': '🏴', 'ENG': '🏴',
    'NETHERLANDS': '🇳🇱', 'NED': '🇳🇱', 'NLD': '🇳🇱',
    'PORTUGAL': '🇵🇹', 'POR': '🇵🇹',
    'BELGIUM': '🇧🇪', 'BEL': '🇧🇪',
    'URUGUAY': '🇺🇾', 'URU': '🇺🇾',
    'CROATIA': '🇭🇷', 'CRO': '🇭🇷',
    'MEXICO': '🇲🇽', 'MEX': '🇲🇽',
    'JAPAN': '🇯🇵', 'JPN': '🇯🇵',
    'KOREA REPUBLIC': '🇰🇷', 'KOR': '🇰🇷', 'SOUTH KOREA': '🇰🇷',
    'UNITED STATES': '🇺🇸', 'USA': '🇺🇸',
    'SENEGAL': '🇸🇳', 'SEN': '🇸🇳',
    'MOROCCO': '🇲🇦', 'MAR': '🇲🇦',
    'SWITZERLAND': '🇨🇭', 'SUI': '🇨🇭', 'CHE': '🇨🇭',
    'POLAND': '🇵🇱', 'POL': '🇵🇱',
    'AUSTRALIA': '🇦🇺', 'AUS': '🇦🇺',
    'DENMARK': '🇩🇰', 'DEN': '🇩🇰',
    'WALES': '🏴', 'WAL': '🏴',
    'ECUADOR': '🇪🇨', 'ECU': '🇪🇨',
    'QATAR': '🇶🇦', 'QAT': '🇶🇦',
    'SAUDI ARABIA': '🇸🇦', 'KSA': '🇸🇦',
    'IR IRAN': '🇮🇷', 'IRAN': '🇮🇷', 'IRN': '🇮🇷',
    'TUNISIA': '🇹🇳', 'TUN': '🇹🇳',
    'CANADA': '🇨🇦', 'CAN': '🇨🇦',
    'COSTA RICA': '🇨🇷', 'CRC': '🇨🇷',
    'GHANA': '🇬🇭', 'GHA': '🇬🇭',
    'COLOMBIA': '🇨🇴', 'COL': '🇨🇴',
    'ITALY': '🇮🇹', 'ITA': '🇮🇹',
    'PANAMA': '🇵🇦', 'PAN': '🇵🇦',
    'NORWAY': '🇳🇴', 'NOR': '🇳🇴',
    'NEW ZEALAND': '🇳🇿', 'NZL': '🇳🇿',
    'EGYPT': '🇪🇬', 'EGY': '🇪🇬',
    'SERBIA': '🇷🇸', 'SRB': '🇷🇸',
    'SWEDEN': '🇸🇪', 'SWE': '🇸🇪',
    'IVORY COAST': '🇨🇮', 'CIV': '🇨🇮',
    'CÔTE D\'IVOIRE': '🇨🇮', 'COTE D IVOIRE': '🇨🇮',
    'HONDURAS': '🇭🇳', 'HON': '🇭🇳',
    'PERU': '🇵🇪', 'PER': '🇵🇪',
    'AUSTRIA': '🇦🇹', 'AUT': '🇦🇹',
    'SOUTH AFRICA': '🇿🇦', 'RSA': '🇿🇦',
    'CURACAO': '🇨🇼', 'CUR': '🇨🇼',
    'CAPE VERDE': '🇨🇻', 'CPV': '🇨🇻',
    'HAITI': '🇭🇹', 'HAI': '🇭🇹',
    'ALGERIA': '🇩🇿', 'ALG': '🇩🇿',
    'JAMAICA': '🇯🇲', 'JAM': '🇯🇲',
    'UZBEKISTAN': '🇺🇿', 'UZB': '🇺🇿',
    'IRAQ': '🇮🇶', 'IRQ': '🇮🇶',
    'TURKEY': '🇹🇷', 'TUR': '🇹🇷',
    'JORDAN': '🇯🇴', 'JOR': '🇯🇴',
    'PARAGUAY': '🇵🇾', 'PAR': '🇵🇾',
    'SCOTLAND': '🏴', 'SCO': '🏴',
  };

  const upperName = teamName.toUpperCase();
  for (const [key, emoji] of Object.entries(flags)) {
    if (upperName.includes(key)) return emoji;
  }
  return '⚽';
}

// FIFA 2026美加墨世界杯官方分组（FIFA 2025年12月5日抽签结果）
// 官方分组: https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026
export function getMockMatches(): Match[] {
  const groups: { group: string; teams: string[] }[] = [
    // A组: 墨西哥 (东道主)
    { group: 'A', teams: ['Mexico', 'South Africa', 'Korea Republic', 'Denmark'] },
    // B组: 加拿大 (东道主)
    { group: 'B', teams: ['Canada', 'Italy', 'Qatar', 'Switzerland'] },
    // C组: 巴西
    { group: 'C', teams: ['Brazil', 'Morocco', 'Haiti', 'Scotland'] },
    // D组: 美国 (东道主)
    { group: 'D', teams: ['United States', 'Paraguay', 'Australia', 'Turkey'] },
    // E组: 德国
    { group: 'E', teams: ['Germany', 'Curacao', "Côte d'Ivoire", 'Ecuador'] },
    // F组: 荷兰
    { group: 'F', teams: ['Netherlands', 'Japan', 'Poland', 'Tunisia'] },
    // G组: 比利时
    { group: 'G', teams: ['Belgium', 'Egypt', 'IR Iran', 'New Zealand'] },
    // H组: 西班牙
    { group: 'H', teams: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'] },
    // I组: 法国 (姆巴佩)
    { group: 'I', teams: ['France', 'Senegal', 'Iraq', 'Norway'] },
    // J组: 阿根廷 (卫冕冠军)
    { group: 'J', teams: ['Argentina', 'Algeria', 'Austria', 'Jordan'] },
    // K组: 葡萄牙
    { group: 'K', teams: ['Portugal', 'Jamaica', 'Uzbekistan', 'Colombia'] },
    // L组: 英格兰
    { group: 'L', teams: ['England', 'Croatia', 'Ghana', 'Panama'] },
  ];
  return generateMatchesFromGroups(groups);
}
