import { create } from 'zustand';
import type { Meeting, MeetingsData, SearchResult, CameraTarget } from './types';
import { SearchEngine } from './utils/search';

interface OrreryState {
  // Data
  data: MeetingsData | null;
  searchEngine: SearchEngine | null;
  loading: boolean;

  // Search
  query: string;
  results: SearchResult[];
  relevanceMap: Map<string, number>; // meetingId -> relevance score
  momentRelevanceMap: Map<string, number>; // momentId -> relevance score

  // Camera
  cameraTarget: CameraTarget | null;
  isFlying: boolean;

  // Drill-in
  drilledMeeting: Meeting | null;

  // Answer
  answer: string;
  answerLoading: boolean;

  // Multi-hop synthesis
  synthesisEdges: [string, string][]; // pairs of meeting IDs for glowing edges
  synthesisCentroid: [number, number, number] | null;

  // Actions
  setData: (data: MeetingsData) => void;
  setQuery: (query: string) => void;
  flyTo: (target: CameraTarget) => void;
  setFlying: (flying: boolean) => void;
  drillInto: (meeting: Meeting | null) => void;
  setAnswer: (answer: string) => void;
  setAnswerLoading: (loading: boolean) => void;
  setSynthesis: (edges: [string, string][], centroid: [number, number, number] | null) => void;
  resetView: () => void;
}

export const useStore = create<OrreryState>((set, get) => ({
  data: null,
  searchEngine: null,
  loading: true,

  query: '',
  results: [],
  relevanceMap: new Map(),
  momentRelevanceMap: new Map(),

  cameraTarget: null,
  isFlying: false,

  drilledMeeting: null,

  answer: '',
  answerLoading: false,

  synthesisEdges: [],
  synthesisCentroid: null,

  setData: (data) => {
    const searchEngine = new SearchEngine(data);
    set({ data, searchEngine, loading: false });
  },

  setQuery: (query) => {
    const { searchEngine } = get();
    if (!searchEngine) return;

    const results = searchEngine.search(query, 20);

    // Build relevance maps
    const relevanceMap = new Map<string, number>();
    const momentRelevanceMap = new Map<string, number>();

    if (results.length > 0) {
      const maxScore = results[0].score;
      for (const r of results) {
        const normalized = maxScore > 0 ? r.score / maxScore : 0;
        relevanceMap.set(r.meeting.id, normalized);
        for (const ms of r.momentScores) {
          const mNorm = maxScore > 0 ? ms.score / maxScore : 0;
          momentRelevanceMap.set(ms.moment.id, mNorm);
        }
      }
    }

    set({ query, results, relevanceMap, momentRelevanceMap, synthesisEdges: [], synthesisCentroid: null });

    // Auto-fly to top result
    if (results.length > 0 && query.trim().length > 2) {
      const topResult = results[0];
      const pos = topResult.meeting.position;
      const offset = 4;
      set({
        cameraTarget: {
          position: [pos[0] + offset, pos[1] + offset * 0.5, pos[2] + offset],
          lookAt: pos,
          fov: 50,
        },
      });
    }
  },

  flyTo: (target) => set({ cameraTarget: target, isFlying: true }),
  setFlying: (flying) => set({ isFlying: flying }),

  drillInto: (meeting) => {
    if (meeting) {
      const pos = meeting.position;
      set({
        drilledMeeting: meeting,
        cameraTarget: {
          position: [pos[0] + 1.5, pos[1] + 1, pos[2] + 1.5],
          lookAt: pos,
          fov: 40,
        },
      });
    } else {
      set({ drilledMeeting: null });
    }
  },

  setAnswer: (answer) => set({ answer }),
  setAnswerLoading: (loading) => set({ answerLoading: loading }),

  setSynthesis: (edges, centroid) => {
    set({ synthesisEdges: edges, synthesisCentroid: centroid });
    if (centroid) {
      set({
        cameraTarget: {
          position: [centroid[0] + 5, centroid[1] + 3, centroid[2] + 5],
          lookAt: centroid,
          fov: 45,
        },
      });
    }
  },

  resetView: () => {
    set({
      query: '',
      results: [],
      relevanceMap: new Map(),
      momentRelevanceMap: new Map(),
      cameraTarget: {
        position: [0, 8, 25],
        lookAt: [0, 0, 0],
        fov: 60,
      },
      drilledMeeting: null,
      answer: '',
      synthesisEdges: [],
      synthesisCentroid: null,
    });
  },
}));
