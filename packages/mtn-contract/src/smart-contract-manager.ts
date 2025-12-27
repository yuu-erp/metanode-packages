export class SmartContractManager {
  private isRunning: boolean = false;
  private queue: Array<{ id: string; func: () => Promise<void> }> = [];
  private currentGroupId: string = window.location.pathname;

  async execute(func: () => Promise<void>, groupId?: string): Promise<void> {
    const effectiveGroupId = groupId || window.location.pathname;
    if (effectiveGroupId !== this.currentGroupId) {
      this.setGroupId();
    }
    this.queue.push({ id: effectiveGroupId, func });
    console.log(
      `Hàm được thêm vào queue. Số lượng hàm trong queue: ${this.queue.length}, groupId: ${effectiveGroupId}`,
    );
    if (!this.isRunning) {
      await this.processQueue();
    }
  }

  setGroupId(newGroupId: string = window.location.pathname) {
    console.log(
      `Chuyển sang groupId mới: ${newGroupId}. Hủy bỏ các hàm của groupId cũ: ${this.currentGroupId}`,
    );
    this.currentGroupId = newGroupId;
    this.queue = this.queue.filter((item) => item.id === this.currentGroupId);
    console.log("Queue sau khi lọc:", this.queue.length);
  }

  private async processQueue(): Promise<void> {
    this.isRunning = true;

    while (this.queue.length > 0) {
      console.log("Số hàm của mảng queue còn lại: ", this.queue);
      const currentItem = this.queue.shift();
      console.log("currentItem: ", currentItem);

      try {
        if (currentItem) {
          if (currentItem.id !== this.currentGroupId) {
            console.log(
              `Bỏ qua hàm thuộc groupId cũ: ${currentItem.id}, groupId hiện tại: ${this.currentGroupId}`,
            );
            continue;
          }
          console.log(
            "Đang thực thi hàm của groupId:",
            currentItem.id,
            "Số hàm còn lại trong queue:",
            this.queue.length,
          );
          await currentItem.func();
        }
      } catch (error) {
        console.log("error: ", error);
        console.log("currentItem: ", currentItem);
        console.error(error);
      }
    }

    this.isRunning = false;
    console.log("Tất cả hàm trong queue đã được thực thi.");
  }

  clearQueue() {
    this.queue = [];
  }
}
