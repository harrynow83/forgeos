"use client";

import { useCallback } from 'react';
import { usePrinterStore } from '@/store/printerStore';
import { getActionQueue } from '@/lib/actionQueue';

export function useOfflineActions() {
  const isOnline = usePrinterStore((state) => state.isOnline);
  const wsConnected = usePrinterStore((state) => state.wsConnected);
  const actionQueue = getActionQueue();

  const isOffline = !isOnline || !wsConnected;

  const executeAction = useCallback(async (
    type: 'pausePrint' | 'resumePrint' | 'cancelPrint' | 'startPrint' | 'completeSetup' | 'setActivePrinter' | 'addPrinter' | 'removePrinter',
    payload?: any
  ) => {
    const store = usePrinterStore.getState();

    if (isOffline) {
      // Queue the action for later execution
      const actionId = actionQueue.addAction(type, payload);
      console.log(`Action queued for offline execution: ${type}`);
      return { queued: true, actionId };
    } else {
      // Execute immediately
      try {
        switch (type) {
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
            await store.startPrint(payload.filename);
            break;
          case 'completeSetup':
            await store.completeSetup();
            break;
          case 'setActivePrinter':
            store.setActivePrinter(payload.printer);
            break;
          case 'addPrinter':
            store.addPrinter(payload.printer);
            break;
          case 'removePrinter':
            store.removePrinter(payload.id);
            break;
          default:
            throw new Error(`Unknown action type: ${type}`);
        }
        return { queued: false, success: true };
      } catch (error) {
        console.error('Action execution failed:', error);
        // Queue the action for retry
        const actionId = actionQueue.addAction(type, payload);
        return { queued: true, actionId, error };
      }
    }
  }, [isOffline, actionQueue]);

  const getQueuedActions = useCallback(() => {
    return actionQueue.getQueue();
  }, [actionQueue]);

  const clearQueuedActions = useCallback(() => {
    actionQueue.clearQueue();
  }, [actionQueue]);

  const getQueuedActionsCount = useCallback(() => {
    return actionQueue.getQueueCount();
  }, [actionQueue]);

  return {
    isOffline,
    executeAction,
    getQueuedActions,
    clearQueuedActions,
    getQueuedActionsCount,
  };
}
