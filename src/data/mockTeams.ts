import { Team } from '../types';

export const teams: Team[] = [
  { code: 'BRA', name: '巴西', nameEn: 'Brazil', logo: '🇧🇷', founded: 1914 },
  { code: 'GER', name: '德国', nameEn: 'Germany', logo: '🇩🇪', founded: 1900 },
  { code: 'ARG', name: '阿根廷', nameEn: 'Argentina', logo: '🇦🇷', founded: 1893 },
  { code: 'FRA', name: '法国', nameEn: 'France', logo: '🇫🇷', founded: 1894 },
  { code: 'ITA', name: '意大利', nameEn: 'Italy', logo: '🇮🇹', founded: 1898 },
  { code: 'ESP', name: '西班牙', nameEn: 'Spain', logo: '🇪🇸', founded: 1909 },
  { code: 'ENG', name: '英格兰', nameEn: 'England', logo: '🏴', founded: 1863 },
  { code: 'NED', name: '荷兰', nameEn: 'Netherlands', logo: '🇳🇱', founded: 1889 },
  { code: 'POR', name: '葡萄牙', nameEn: 'Portugal', logo: '🇵🇹', founded: 1914 },
  { code: 'BEL', name: '比利时', nameEn: 'Belgium', logo: '🇧🇪', founded: 1895 },
  { code: 'URU', name: '乌拉圭', nameEn: 'Uruguay', logo: '🇺🇾', founded: 1900 },
  { code: 'CRO', name: '克罗地亚', nameEn: 'Croatia', logo: '🇭🇷', founded: 1912 },
  { code: 'MEX', name: '墨西哥', nameEn: 'Mexico', logo: '🇲🇽', founded: 1927 },
  { code: 'JPN', name: '日本', nameEn: 'Japan', logo: '🇯🇵', founded: 1921 },
  { code: 'KOR', name: '韩国', nameEn: 'South Korea', logo: '🇰🇷', founded: 1928 },
  { code: 'USA', name: '美国', nameEn: 'United States', logo: '🇺🇸', founded: 1913 },
  { code: 'SEN', name: '塞内加尔', nameEn: 'Senegal', logo: '🇸🇳', founded: 1960 },
  { code: 'MAR', name: '摩洛哥', nameEn: 'Morocco', logo: '🇲🇦', founded: 1956 },
  { code: 'SUI', name: '瑞士', nameEn: 'Switzerland', logo: '🇨🇭', founded: 1895 },
  { code: 'POL', name: '波兰', nameEn: 'Poland', logo: '🇵🇱', founded: 1919 },
  { code: 'AUS', name: '澳大利亚', nameEn: 'Australia', logo: '🇦🇺', founded: 1961 },
  { code: 'DEN', name: '丹麦', nameEn: 'Denmark', logo: '🇩🇰', founded: 1889 },
  { code: 'SWE', name: '瑞典', nameEn: 'Sweden', logo: '🇸🇪', founded: 1904 },
  { code: 'WAL', name: '威尔士', nameEn: 'Wales', logo: '🏴', founded: 1876 },
  { code: 'ECU', name: '厄瓜多尔', nameEn: 'Ecuador', logo: '🇪🇨', founded: 1924 },
  { code: 'QAT', name: '卡塔尔', nameEn: 'Qatar', logo: '🇶🇦', founded: 1974 },
  { code: 'KSA', name: '沙特阿拉伯', nameEn: 'Saudi Arabia', logo: '🇸🇦', founded: 1956 },
  { code: 'IRN', name: '伊朗', nameEn: 'Iran', logo: '🇮🇷', founded: 1920 },
  { code: 'SRB', name: '塞尔维亚', nameEn: 'Serbia', logo: '🇷🇸', founded: 1919 },
  { code: 'GHA', name: '加纳', nameEn: 'Ghana', logo: '🇬🇭', founded: 1920 },
  { code: 'CMR', name: '喀麦隆', nameEn: 'Cameroon', logo: '🇨🇲', founded: 1958 },
  { code: 'NGA', name: '尼日利亚', nameEn: 'Nigeria', logo: '🇳🇬', founded: 1940 },
  { code: 'COL', name: '哥伦比亚', nameEn: 'Colombia', logo: '🇨🇴', founded: 1924 },
  { code: 'CHI', name: '智利', nameEn: 'Chile', logo: '🇨🇱', founded: 1895 },
  { code: 'PER', name: '秘鲁', nameEn: 'Peru', logo: '🇵🇪', founded: 1922 },
  { code: 'PAR', name: '巴拉圭', nameEn: 'Paraguay', logo: '🇵🇾', founded: 1906 },
  { code: 'TUN', name: '突尼斯', nameEn: 'Tunisia', logo: '🇹🇳', founded: 1957 },
  { code: 'CAN', name: '加拿大', nameEn: 'Canada', logo: '🇨🇦', founded: 1912 },
  { code: 'CRI', name: '哥斯达黎加', nameEn: 'Costa Rica', logo: '🇨🇷', founded: 1921 },
];

// 获取球队历史数据（从真实历史数据源获取，作为备用入口）
import { getTeamHistory as getRealTeamHistory } from './worldCupHistory';

export function getTeamHistory(teamCode: string): any {
  return getRealTeamHistory(teamCode);
}
