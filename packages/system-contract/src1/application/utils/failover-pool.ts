import { NodeConfig } from "../../domain/types/chain-config";

interface NodeStatus {
  url: string;
  priority: number;
  transportType: string;
  healthy: boolean;
  lastChecked: number;
  failureCount: number;
}

export class FailoverPool {
  private nodes: NodeStatus[] = [];
  private currentIndex = 0;

  initialize(nodes: NodeConfig[]): void {
    if (nodes.length === 0) {
      throw new Error("FailoverPool requires at least one node");
    }

    this.nodes = nodes.map((n) => ({
      url: n.url,
      priority: n.priority ?? 10,
      transportType: n.transportType,
      healthy: true,
      lastChecked: Date.now(),
      failureCount: 0,
    }));

    // Sort by priority descending (cao nhất trước)
    this.nodes.sort((a, b) => b.priority - a.priority);
    this.currentIndex = 0;
  }

  /**
   * Lấy node khỏe tiếp theo theo cơ chế round-robin
   * @throws Error nếu không còn node nào khỏe
   */
  getNextHealthyNode(): NodeStatus {
    if (this.nodes.length === 0) {
      throw new Error("No nodes initialized in FailoverPool");
    }

    let attempts = 0;

    do {
      const node = this.nodes[this.currentIndex]!; // TypeScript biết chúng ta đã check length > 0

      this.currentIndex = (this.currentIndex + 1) % this.nodes.length;

      if (node.healthy) {
        return node;
      }

      attempts++;
      if (attempts >= this.nodes.length) {
        throw new Error("No healthy nodes available");
      }
    } while (true);
  }

  markNodeFailed(url: string): void {
    const node = this.nodes.find((n) => n.url === url);
    if (node) {
      node.healthy = false;
      node.failureCount++;
      node.lastChecked = Date.now();
    }
    // Không throw nếu không tìm thấy → idempotent
  }

  /**
   * Lấy node đang được sử dụng hiện tại (active candidate)
   * @returns NodeStatus hiện tại hoặc node đầu tiên nếu index không hợp lệ
   */
  getActiveNode(): NodeStatus {
    if (this.nodes.length === 0) {
      throw new Error("No nodes initialized");
    }

    // Đảm bảo index luôn hợp lệ
    if (this.currentIndex >= this.nodes.length || this.currentIndex < 0) {
      this.currentIndex = 0;
    }

    return this.nodes[this.currentIndex]!;
  }

  getNodeCount(): number {
    return this.nodes.length;
  }

  /**
   * Optional: Reset healthy status của tất cả node (dùng khi cần recover)
   */
  resetHealth(): void {
    this.nodes.forEach((node) => {
      node.healthy = true;
      node.failureCount = 0;
      node.lastChecked = Date.now();
    });
  }
}
