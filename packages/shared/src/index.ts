export type RepoSource = {
  owner: string;
  name: string;
  branch?: string;
};

export type ChunkMetadata = {
  repo: string;
  path: string;
  language?: string;
  symbol?: string;
  startLine?: number;
  endLine?: number;
};
