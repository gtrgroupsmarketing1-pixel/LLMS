export class ModeUnavailableError extends Error {
  constructor(
    public feature: string,
    public mode: string,
  ) {
    super(`Feature "${feature}" is unavailable in mode "${mode}"`);
    this.name = 'ModeUnavailableError';
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 401,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
