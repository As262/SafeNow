import { useState, useEffect, useCallback, useRef } from 'react';
import Constants from 'expo-constants';
import { User, SOSRequest } from '../types';

const WS_BASE_URL = Constants.expoConfig?.extra?.wsUrl || 'ws://10.49.250.225:8000/ws';

interface UseWebSocketReturn {
  connected: boolean;
  requests: SOSRequest[];
  lastUpdate: number;
  sendSOSRequest: (requestData: Partial<SOSRequest>) => SOSRequest;
  updateRequestStatus: (requestId: string | number, status: string) => void;
}

export const useWebSocket = (user: User | null): UseWebSocketReturn => {
  const [connected, setConnected] = useState(false);
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!user) return;

    mountedRef.current = true;

    const connectWebSocket = () => {
      if (!mountedRef.current) return;

      const params = new URLSearchParams({
        role: user.role || 'user',
        mobile: user.mobile || '',
      });

      const wsUrl = `${WS_BASE_URL}/sos/?${params.toString()}`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!mountedRef.current) return;
          console.log('✅ WebSocket connected (real-time mode)');
          setConnected(true);
          reconnectAttempts.current = 0;
          setLastUpdate(Date.now());
        };

        ws.onmessage = (event) => {
          if (!mountedRef.current) return;
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'initial_requests':
                setRequests(data.requests || []);
                setLastUpdate(Date.now());
                console.log(`📥 Received ${data.requests?.length || 0} initial requests`);
                break;
              case 'new_request':
                setRequests((prev) => {
                  // Avoid duplicates
                  const exists = prev.some((r) => r.id === data.request.id);
                  if (exists) return prev;
                  return [data.request, ...prev];
                });
                setLastUpdate(Date.now());
                console.log('🔔 New SOS request received:', data.request.id);
                break;
              case 'status_update':
                setRequests((prev) =>
                  prev.map((req) =>
                    req.id === data.request.id ? { ...data.request, ...req } : req
                  )
                );
                setLastUpdate(Date.now());
                console.log('🔄 Request status updated:', data.request.id, data.request.status);
                break;
              case 'request_deleted':
                setRequests((prev) => prev.filter((req) => req.id !== data.request_id));
                setLastUpdate(Date.now());
                console.log('🗑️ Request deleted:', data.request_id);
                break;
              case 'pong':
                // Keep-alive response
                break;
              default:
                console.log('Unknown WS message type:', data.type);
            }
          } catch (e) {
            console.error('WS message parse error:', e);
          }
        };

        ws.onclose = () => {
          if (!mountedRef.current) return;
          console.log('❌ WebSocket disconnected');
          setConnected(false);

          // Faster exponential backoff: 200ms, 500ms, 1s, 2s (max)
          const delay = Math.min(200 * Math.pow(2, reconnectAttempts.current), 2000);
          reconnectAttempts.current++;

          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          ws.close();
        };
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        const delay = Math.min(200 * Math.pow(2, reconnectAttempts.current), 2000);
        reconnectAttempts.current++;
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
      }
    };

    connectWebSocket();

    // Aggressive ping to keep connection alive every 10 seconds
    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 10000);

    return () => {
      mountedRef.current = false;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
      setConnected(false);
    };
  }, [user]);

  const sendSOSRequest = useCallback(
    (requestData: Partial<SOSRequest>): SOSRequest => {
      const newRequest: SOSRequest = {
        id: Date.now().toString(),
        user: user?.id || 0,
        type: requestData.type || 'Ambulance',
        status: 'pending',
        latitude: requestData.latitude || 0,
        longitude: requestData.longitude || 0,
        accuracy: requestData.accuracy,
        address: requestData.address || '',
        created_at: new Date().toISOString(),
      };

      if (user?.role === 'admin') {
        setRequests((prev) => [newRequest, ...prev]);
      }

      return newRequest;
    },
    [user]
  );

  const updateRequestStatus = useCallback((requestId: string | number, status: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status: status as any } : req))
    );
    setLastUpdate(Date.now());
  }, []);

  return {
    connected,
    requests,
    lastUpdate,
    sendSOSRequest,
    updateRequestStatus,
  };
};
