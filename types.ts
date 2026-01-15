
export enum Step {
  SubjectCapture = 1,
  PoseAdjustment = 2,
  SceneCapture = 3,
  Generating = 4,
  Result = 5
}

export interface PoseData {
  rotation: { x: number; y: number; z: number };
  perspective: number;
  bones: { [key: string]: { x: number; y: number; z: number } };
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
