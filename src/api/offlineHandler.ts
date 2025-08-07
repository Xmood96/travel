import { toast } from "react-toastify";

export interface OfflineAction {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

class OfflineHandler {
  private readonly STORAGE_KEY = "offline_actions";
  private isOnline: boolean = navigator.onLine;
  private retryInterval: number | null = null;

  constructor() {
    this.setupEventListeners();
    this.startRetryProcess();
  }

  private setupEventListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.handleOnlineStatus();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.handleOfflineStatus();
    });
  }

  private handleOnlineStatus() {
    toast.success("🟢 تم استعادة الاتصال بالإنترنت");
    this.processOfflineActions();
  }

  private handleOfflineStatus() {
    toast.warning("🔴 انقطع الاتصال بالإنترنت. سيتم حفظ التغييرات محلياً", {
      autoClose: 5000,
    });
  }

  public queueAction(
    action: Omit<OfflineAction, "id" | "timestamp" | "retryCount">,
  ) {
    if (this.isOnline) {
      return; // Don't queue if online
    }

    const offlineAction: OfflineAction = {
      ...action,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      retryCount: 0,
    };

    const existingActions = this.getOfflineActions();
    existingActions.push(offlineAction);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingActions));

    toast.info("📤 تم حفظ العملية محلياً. سيتم تنفيذها عند استعادة الاتصال");
  }

  private getOfflineActions(): OfflineAction[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error reading offline actions:", error);
      return [];
    }
  }

  private saveOfflineActions(actions: OfflineAction[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(actions));
    } catch (error) {
      console.error("Error saving offline actions:", error);
    }
  }

  public async processOfflineActions() {
    if (!this.isOnline) return;

    const actions = this.getOfflineActions();
    if (actions.length === 0) return;

    toast.info(`🔄 معالجة ${actions.length} عملية محفوظة...`);

    const remainingActions: OfflineAction[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const action of actions) {
      try {
        await this.executeAction(action);
        successCount++;
      } catch (error) {
        console.error("Failed to execute offline action:", error);

        action.retryCount++;

        // Keep action for retry if it hasn't exceeded max retries
        if (action.retryCount < 3) {
          remainingActions.push(action);
        } else {
          failCount++;
          console.warn("Max retries exceeded for action:", action);
        }
      }
    }

    // Save remaining actions
    this.saveOfflineActions(remainingActions);

    // Show results
    if (successCount > 0) {
      toast.success(`✅ تم تنفيذ ${successCount} عملية بنجاح`);
    }

    if (failCount > 0) {
      toast.error(`❌ فشل في تنفيذ ${failCount} عملية`);
    }

    if (remainingActions.length > 0) {
      toast.info(
        `⏳ ${remainingActions.length} عملية في انتظار إعادة المحاولة`,
      );
    }
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    // This would be implemented based on your specific action types
    // For now, we'll just simulate the execution
    console.log("Executing offline action:", action);

    // Simulate API call
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.3) {
          // 70% success rate
          resolve(true);
        } else {
          reject(new Error("Simulated network error"));
        }
      }, 1000);
    });
  }

  private startRetryProcess() {
    // Periodically try to process offline actions when online
    this.retryInterval = setInterval(() => {
      if (this.isOnline) {
        this.processOfflineActions();
      }
    }, 30000); // Every 30 seconds
  }

  public destroy() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }
    window.removeEventListener("online", this.handleOnlineStatus);
    window.removeEventListener("offline", this.handleOfflineStatus);
  }

  public getQueuedActionsCount(): number {
    return this.getOfflineActions().length;
  }

  public clearOfflineActions() {
    localStorage.removeItem(this.STORAGE_KEY);
    toast.info("🗑️ تم مسح جميع العمليات المحفوظة");
  }
}

// Export singleton instance
export const offlineHandler = new OfflineHandler();
