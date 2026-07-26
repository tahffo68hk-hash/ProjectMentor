export {};

declare global {
  interface Window {
    projectMentor: {
      getAppVersion(): Promise<string>;
    };
  }
}
