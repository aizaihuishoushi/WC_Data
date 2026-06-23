import { create } from 'zustand';
import { Match, Team } from '../types';
import { fetchLiveMatches } from '../data/api';
import { teams } from '../data/mockTeams';
import { getTeamHistory } from '../data/worldCupHistory';

interface AppState {
  matches: Match[];
  loading: boolean;
  selectedTeam: Team | null;
  teamHistory: any | null;
  activeGroup: string;
  setActiveGroup: (group: string) => void;
  setSelectedTeam: (team: Team | null) => void;
  fetchTeamHistory: (teamCode: string) => void;
  fetchMatches: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  matches: [],
  loading: true,
  selectedTeam: null,
  teamHistory: null,
  activeGroup: 'A',
  setActiveGroup: (group: string) => set({ activeGroup: group }),
  setSelectedTeam: (team: Team | null) => set({ selectedTeam: team }),
  fetchTeamHistory: (teamCode: string) => {
    const history = getTeamHistory(teamCode);
    set({ teamHistory: history || null });
  },
  fetchMatches: async () => {
    set({ loading: true });
    try {
      const matches = await fetchLiveMatches();
      set({ matches, loading: false });
    } catch (error) {
      console.error('获取比赛数据失败:', error);
      const mockMatches = await fetchLiveMatches();
      set({ matches: mockMatches, loading: false });
    }
  },
}));

export const getAllTeams = () => teams;
