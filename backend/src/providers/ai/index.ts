import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors.js';

/**
 * Optional AI image generation. The platform works fully without it: artists create
 * custom artwork manually. When a provider is connected, its output must be stored with
 * CustomArtImage.isAiGenerated = true and shown to customers labelled "AI-generated preview".
 */
export interface GenerationRequest {
  sourceImage: Buffer;
  style: string;
  instructions?: string;
  width?: number;
  height?: number;
}

export interface GenerationJob {
  jobId: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  error?: string;
}

export interface ImageGenerationProvider {
  readonly name: string;
  readonly enabled: boolean;
  generatePreview(req: GenerationRequest): Promise<GenerationJob>;
  generateVariation(jobId: string, instructions?: string): Promise<GenerationJob>;
  generateStyleTransfer(req: GenerationRequest): Promise<GenerationJob>;
  getGenerationStatus(jobId: string): Promise<GenerationJob>;
  downloadResult(jobId: string): Promise<{ buffer: Buffer; mimeType: string; isAiGenerated: true }>;
}

export class NoneImageGenerationProvider implements ImageGenerationProvider {
  readonly name = 'none';
  readonly enabled = false;
  private unavailable(): never {
    throw new AppError(501, 'AI_DISABLED', 'AI image generation is not enabled on this platform');
  }
  async generatePreview(): Promise<GenerationJob> {
    this.unavailable();
  }
  async generateVariation(): Promise<GenerationJob> {
    this.unavailable();
  }
  async generateStyleTransfer(): Promise<GenerationJob> {
    this.unavailable();
  }
  async getGenerationStatus(): Promise<GenerationJob> {
    this.unavailable();
  }
  async downloadResult(): Promise<{ buffer: Buffer; mimeType: string; isAiGenerated: true }> {
    this.unavailable();
  }
}

export function createImageGenerationProvider(name = config.AI_PROVIDER): ImageGenerationProvider {
  switch (name) {
    case 'none':
    case '':
      return new NoneImageGenerationProvider();
    default:
      throw new Error(`AI_PROVIDER "${name}" is not implemented. Implement ImageGenerationProvider in src/providers/ai.`);
  }
}

export const imageGeneration = createImageGenerationProvider();
