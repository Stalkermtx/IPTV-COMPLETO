export type AspectRatio = '1:1' | '16:9' | '9:16' | '3:4' | '4:3' | '4:1' | '8:1' | '1:4' | '1:8' | '1138:1280';
export type ImageResolution = '1K' | '2K' | '4K' | '8K';

export interface GenerationConfig {
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
}

export interface GenerationResult {
  imageUrl: string | null;
  text?: string;
  loading: boolean;
  error: string | null;
}
