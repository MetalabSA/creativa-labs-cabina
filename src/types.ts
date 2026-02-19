
export interface FormState {
  selectedIdentity: string | null;
  details: string;
  email: string;
  aspectRatio: string;
  resolution: string;
  outputFormat: string;
}

export type UploadType = 'character' | 'product';

export interface ParticleState {
  positions: Float32Array;
  velocities: Float32Array;
}
