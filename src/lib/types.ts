export type FsEntry = {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
  mtime?: number;
  children?: FsEntry[];
};

export type ApiError = { error: string };
