export interface Post {
  id: string;
  space: 'school' | 'class' | 'subject';
  type?: 'standard' | 'challenge';
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  timestamp: string;
  content: string;
  challenge?: {
    title: string;
    xp: number;
  };
  topicTag?: string;
  rewardBadge?: {
    icon: string;
    text: string;
  };
  media?: {
    type: 'image' | 'video' | 'poll' | 'document' | 'audio' | 'link';
    url?: string;
    title?: string;
    options?: { text: string; votes: number }[];
    linkPreview?: {
      title: string;
      description: string;
      image: string;
      domain: string;
    };
  };
  interactions: {
    insightful: number;
    helpful: number;
    love: number;
    celebration: number;
    thinking: number;
  };
  comments: {
    id: string;
    author: { name: string; avatar: string; role: string };
    content: string;
    timestamp: string;
  }[];
}
