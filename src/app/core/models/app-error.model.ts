export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly userMessage: string,
    public readonly details: string[] = [],
  ) {
    super(userMessage);
    this.name = 'AppError';
  }
}
