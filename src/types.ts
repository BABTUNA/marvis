export interface Moment {
  id: string;
  text: string;
  keywords: string[];
  localPos: [number, number, number];
  timestamp: string;
  vector: number[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  account: string;
  cluster: string;
  clusterLabel: string;
  participants: string[];
  position: [number, number, number];
  moments: Moment[];
  summary: string;
  vector: number[];
}

export interface MeetingsData {
  meta: {
    generated: string;
    numMeetings: number;
    numMoments: number;
    vocabSize: number;
    vectorDim: number;
  };
  vocab: Record<string, number>;
  idf: Record<string, number>;
  meetings: Meeting[];
}

export interface SearchResult {
  meeting: Meeting;
  score: number;
  momentScores: { moment: Moment; score: number }[];
}

export interface CameraTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov?: number;
}
