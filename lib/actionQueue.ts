"use client";

interface QueuedAction {
  id: string;
  type: 'pausePrint' | 'resumePrint' | 'cancelPrint' | 'startPrint' | 'completeSetup' | 'setActivePrinter' | 'addPrinter' | 'removePrinter';
  payload?: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

class ActionQueue {
  private queue: QueuedAction[] = [];
  private isProcessing = false;
  private listeners: ((queue: QueuedAction[]) => void)[] = [];

  constructor() {
    // Load queue from localStorage on client side
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('printer_action_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load action queue from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('printer_action_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save action queue to storage:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener([...this.queue]);
      } catch (error) {
        console.error('Error in queue listener:', error);
      }
    });
  }

  addAction(type: QueuedAction['type'], payload?: any): string {
    const action: QueuedAction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3,
    };

    this.queue.push(action);
    this.saveToStorage();
    this.notifyListeners();
    
    console.log('Action queued:', action);
    return action.id;
  }

  removeAction(id: string): boolean {
    const index = this.queue.findIndex(action => action.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  clearQueue(): void {
    this.queue = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  getQueueCount(): number {
    return this.queue.length;
  }

  onQueueChange(callback: (queue: QueuedAction[]) => void) {
    this.listeners.push(callback);
    callback([...this.queue]);
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log('Processing action queue...');

    while (this.queue.length > 0) {
      const action = this.queue[0];
      
      try {
        await this.executeAction(action);
        // Action succeeded, remove from queue
        this.queue.shift();
        this.saveToStorage();
        this.notifyListeners();
        console.log('Action executed successfully:', action.type);
      } catch (error) {
        console.error('Action execution failed:', action.type, error);
        
        action.retries++;
        if (action.retries >= action.maxRetries) {
          // Max retries reached, remove from queue
          console.error('Max retries reached for action:', action.type);
          this.queue.shift();
          this.saveToStorage();
          this.notifyListeners();
        } else {
          // Retry later
          console.log(`Retrying action ${action.type} in ${action.retries * 1000}ms`);
          await new Promise(resolve => setTimeout(resolve, action.retries * 1000));
        }
      }
    }

    this.isProcessing = false;
    console.log('Action queue processing completed');
  }

  private async executeAction(action: QueuedAction): Promise<void> {
    const { usePrinterStore } = await import('@/store/printerStore');
    const store = usePrinterStore.getState();

    switch (action.type) {
      case 'pausePrint':
        await store.pausePrint();
        break;
      case 'resumePrint':
        await store.resumePrint();
        break;
      case 'cancelPrint':
        await store.cancelPrint();
        break;
      case 'startPrint':
        await store.startPrint(action.payload.filename);
        break;
      case 'completeSetup':
        await store.completeSetup();
        break;
      case 'setActivePrinter':
        store.setActivePrinter(action.payload.printer);
        break;
      case 'addPrinter':
        store.addPrinter(action.payload.printer);
        break;
      case 'removePrinter':
        store.removePrinter(action.payload.id);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
}

// Singleton instance
let actionQueueInstance: ActionQueue | null = null;

export function getActionQueue(): ActionQueue {
  if (!actionQueueInstance) {
    actionQueueInstance = new ActionQueue();
  }
  return actionQueueInstance;
}

export type { QueuedAction };
