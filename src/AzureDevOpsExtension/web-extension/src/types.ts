// Type definitions for Azure DevOps Extension SDK interfaces not covered in the package
export interface IExtendedPageContext {
  navigation?: {
    currentBuild?: {
      id: number;
    };
  };
}

export interface IPageDataService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPageData(): Promise<any>;
}

export interface IBuildService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getBuildArtifacts(projectId: string, buildId: number): Promise<any[]>;
  getArtifact(projectId: string, buildId: number, artifactName: string): Promise<string>;
}

export interface BuildArtifact {
  name: string;
  resource?: {
    downloadUrl: string;
    url: string;
    data: string;
  };
}

export interface ReportItem {
  name: string;
  content: string;
  error?: string;
}
