"use client";

import { useEffect } from 'react';
import { getWebSocketClient, WebSocketMessage } from '@/lib/ws';
import { usePrinterStore } from '@/store/printerStore';
import { getActionQueue } from '@/lib/actionQueue';

export function useWebSocketSync() {
  const setWsConnected = usePrinterStore((state) => state.setWsConnected);
  const setIsOnline = usePrinterStore((state) => state.setIsOnline);
  const setConnectionStatus = usePrinterStore((state) => state.setConnectionStatus);
  const updateLastSyncTime = usePrinterStore((state) => state.updateLastSyncTime);
  const setData = usePrinterStore((state) => state.setData);

  useEffect(() => {
    // Only initialize WebSocket on client side
    if (typeof window === 'undefined') return;

    const wsClient = getWebSocketClient();

    // Handle connection state changes
    wsClient.onConnectionChange((connected) => {
      setWsConnected(connected);
      setConnectionStatus(connected ? 'connected' : 'disconnected');
      if (connected) {
        updateLastSyncTime();
      }
    });

    // Handle network state changes
    wsClient.onNetworkChange((online) => {
      setIsOnline(online);
      if (!online) {
        setConnectionStatus('disconnected');
      } else {
        // When coming back online, process any queued actions
        const actionQueue = getActionQueue();
        if (actionQueue.getQueueCount() > 0) {
          console.log('Network restored, processing queued actions...');
          actionQueue.processQueue();
        }
      }
    });

    // Handle incoming messages
    wsClient.onMessage((message: WebSocketMessage) => {
      handleMessage(message);
      updateLastSyncTime(); // Update sync time on any message
    });

    // Cleanup on unmount
    return () => {
      // Note: We don't disconnect here since WebSocket is singleton
      // The connection persists across component mounts
    };
  }, [setWsConnected, setIsOnline, setConnectionStatus, updateLastSyncTime, setData]);

  // Message handler function
  function handleMessage(message: WebSocketMessage) {
    try {
      switch (message.type) {
        case 'status_update':
          // Update printer state, temperatures, progress
          if (message.data) {
            setData({
              state: message.data.state || 'ready',
              progress: message.data.progress || 0,
              nozzleTemp: message.data.nozzleTemp || 0,
              bedTemp: message.data.bedTemp || 0,
              connected: message.data.connected !== false,
            });
          }
          break;

        case 'printer_update':
          // Update active printer and job info
          if (message.data) {
            const currentActivePrinter = usePrinterStore.getState().activePrinter;
            setData({
              activePrinter: {
                ...currentActivePrinter,
                ...message.data.printer,
                progress: message.data.progress || currentActivePrinter.progress,
                currentFile: message.data.currentFile || currentActivePrinter.currentFile,
                timeRemaining: message.data.timeRemaining || currentActivePrinter.timeRemaining,
                layer: message.data.layer || currentActivePrinter.layer,
                totalLayers: message.data.totalLayers || currentActivePrinter.totalLayers,
              },
              state: message.data.state || usePrinterStore.getState().state,
              progress: message.data.progress || usePrinterStore.getState().progress,
            });
          }
          break;

        case 'error':
          // Handle error messages
          console.error('WebSocket error message:', message.data);
          setData({
            state: 'error',
            loading: false,
          });
          break;

        case 'connection_status':
          // Handle connection status updates
          if (message.data?.connected !== undefined) {
            setWsConnected(message.data.connected);
          }
          break;

        default:
          console.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }
}

// Export a hook for components that need to send messages
export function useWebSocketSender() {
  const wsClient = getWebSocketClient();
  
  return {
    sendMessage: (message: WebSocketMessage) => {
      wsClient.send(message);
    },
    isConnected: () => wsClient.isConnected(),
  };
}
