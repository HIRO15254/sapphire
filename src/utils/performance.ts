export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  rerenderCount: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMeasurement(componentName: string): void {
    performance.mark(`${componentName}-start`);
  }

  endMeasurement(componentName: string): PerformanceMetrics {
    performance.mark(`${componentName}-end`);
    performance.measure(
      `${componentName}-render`,
      `${componentName}-start`,
      `${componentName}-end`
    );

    const measure = performance.getEntriesByName(`${componentName}-render`)[0];
    const metrics: PerformanceMetrics = {
      renderTime: measure.duration,
      memoryUsage:
        (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize || 0,
      rerenderCount: 1,
    };

    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, []);
    }
    this.metrics.get(componentName)!.push(metrics);

    return metrics;
  }

  getMetrics(componentName: string): PerformanceMetrics[] {
    return this.metrics.get(componentName) || [];
  }

  clearMetrics(): void {
    this.metrics.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}
