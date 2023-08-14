export interface AuthResponse {
  user: User;
  base_url: string;
  token: string;
  status: number;
}

export interface User {
  allowed_downloads: number;
  allowed_translations: number;
  level: string;
  user_id: number;
  ext_installed: boolean;
  vip: boolean;
}

export interface AuthPostData {
  username: string;
  password: string;
}

export interface SearchParams {
  query: string;
  ln?: string;
  season?: number;
  episode?: number;
  page?: number;
}

const commandList = ["auth", "download", "search"] as const;
export type Command = (typeof commandList)[number];

// deno-lint-ignore no-explicit-any
export function isValidCommand(commandLike: any): commandLike is Command {
  return commandList.includes(commandLike);
}

export interface SearchData {
  total_pages: number;
  total_count: number;
  per_page: number;
  page: number;
  data: Subtitle[];
}

export interface Subtitle {
  id: string;
  type: string;
  attributes: Attributes;
}

interface Attributes {
  subtitle_id: string;
  language: string;
  download_count: number;
  new_download_count: number;
  hearing_impaired: boolean;
  hd: boolean;
  fps: number;
  votes: number;
  ratings: number;
  from_trusted: boolean;
  foreign_parts_only: boolean;
  upload_date: string;
  ai_translated: boolean;
  machine_translated: boolean;
  release: string;
  comments: string;
  legacy_subtitle_id: number;
  uploader: {
    uploader_id: number;
    name: string;
    rank: string;
  };
  feature_details: {
    feature_id: number;
    feature_type: string;
    year: number;
    title: string;
    movie_name: string;
    imdb_id: number;
    tmdb_id: number;
    season_number: number;
    episode_number: number;
    parent_imdb_id: number;
    parent_title: string;
    parent_tmdb_id: number;
    parent_feature_id: number;
  };
  url: string;
  related_links: RelatedLinks[];
  files: Files[];
}

export interface Files {
  file_id: number;
  cd_number: number;
  file_name: string;
}

export interface RelatedLinks {
  label: string;
  url: string;
  img_url?: string;
}

export interface DownloadResponse {
  link: string;
  file_name: string;
  requests: number;
  remaining: number;
  message: string;
  reset_time: string;
  reset_time_utc: string;
}

export interface DownloadParams {
    path: string;
    fileId: number;
    renameTo?: string;
}

export interface ToshoResult {
  id: number
  title: string
  link: string
  timestamp: number
  status: string
  tosho_id: any
  nyaa_id: number
  nyaa_subdom: any
  anidex_id: any
  torrent_url: string
  torrent_name: string
  info_hash: string
  info_hash_v2: any
  magnet_uri: string
  seeders: number
  leechers: number
  torrent_downloaded_count: number
  tracker_updated?: number
  nzb_url: string
  total_size: number
  num_files: number
  anidb_aid: number
  anidb_eid: any
  anidb_fid: any
  article_url: any
  article_title: any
  website_url?: string
}

