export class ExponentialBackoff {
  private currentDelay: number;

  constructor(
    private baseDelay: number,
    private factor: number,
  ) {
    this.currentDelay = baseDelay;
  }

  nextDelay(): number {
    const delay = this.currentDelay;
    this.currentDelay *= this.factor;
    return delay;
  }

  reset(): void {
    this.currentDelay = this.baseDelay;
  }
}
