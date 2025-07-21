// Type definitions for Azure DevOps Extension SDK interfaces not covered in the package
export interface IExtendedPageContext {
  navigation?: {
    currentBuild?: {
      id: number;
    };
  };
}

export interface IPageDataService {
  getPageData(): Promise<any>;
}

export interface IBuildService {
  getBuildAttachments(projectId: string, buildId: number, type: string): Promise<any[]>;
  getAttachment(projectId: string, buildId: number, type: string, name: string): Promise<string>;
}

export interface BuildAttachment {
  name: string;
  type: string;
}

export interface ReportItem {
  name: string;
  content: string;
  error?: string;
}
