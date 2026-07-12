export class SovereigntyError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'SovereigntyError';
  }
}

export class AssetInsecureError extends SovereigntyError {
  constructor(detail: string) {
    super(`Security Degradation Detected: ${detail}`, 403);
  }
}
