export interface RecentProject {
  path: string;
  name: string;
  lastOpened: Date;
}

export interface ProjectCreateOptions {
  name: string;
  location: string;
  ignoreCloudWarning?: boolean; // User chose to proceed despite warning
}

export interface CloudWarning {
  provider: string;
  message: string;
  recommendedLocation: string;
}

export type CreateProjectResult =
  | {
      success: true;
      path: string;
      needsMigration?: boolean;
    }
  | {
      success: false;
      error: string;
    }
  | {
      success: false;
      cloudWarning: CloudWarning;
    };

export type OpenProjectResult =
  | {
      success: true;
      path: string;
      name: string;
      needsMigration?: boolean;
    }
  | {
      success: false;
      error: string;
    };
