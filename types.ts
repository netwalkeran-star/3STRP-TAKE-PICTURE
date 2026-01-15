
export enum Step {
  SubjectCapture = 1,
  PoseAdjustment = 2,
  SceneCapture = 3,
  Generating = 4,
  Result = 5
}

export interface PoseData {
  drawingImage: string | null; // 現在儲存手繪的 Base64 圖片
  brushSize: number;
}

export interface AppState {
  step: Step;
  subjectImage: string | null;
  subjectStyle: string;
  pose: PoseData;
  sceneImage: string | null;
  atmosphere: string;
  resultImage: string | null;
}
