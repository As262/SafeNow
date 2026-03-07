import { useState, useEffect, useCallback, useRef } from "react";

const WS_BASE_URL =
  import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;

export const useWebSocket = (user) => {
  const [connected, setConnected] = useState(false);
  const [requests, setRequests] = useState([]);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const pingIntervalRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const connectWebSocket = () => {
      const params = new URLSearchParams({
        role: user.role || "user",
        mobile: user.mobile || "",
      });

      const wsUrl = `${WS_BASE_URL}/sos/?${params.toString()}`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log("✅ WebSocket connected");
          setConnected(true);
          reconnectAttempts.current = 0; // Reset attempts on successful connection
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case "initial_requests":
                setRequests(data.requests || []);
                break;
              case "new_request":
                setRequests((prev) => [data.request, ...prev]);
                break;
              case "status_update":
                setRequests((prev) =>
                  prev.map((req) =>
                    req.id === data.request.id ? data.request : req,
                  ),
                );
                break;
              case "pong":
                break;
              default:
                console.log("Unknown WS message type:", data.type);
            }
          } catch (e) {
            console.error("WS message parse error:", e);
          }
        };

        ws.onclose = () => {
          console.log("❌ WebSocket disconnected");
          setConnected(false);
          
          // Exponential backoff: 500ms, 1s, 2s, 5s (max)
          const delay = Math.min(500 * Math.pow(2, reconnectAttempts.current), 5000);
          reconnectAttempts.current++;
          
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          ws.close();
        };
      } catch (error) {
        console.error("WebSocket connection failed:", error);
        const delay = Math.min(500 * Math.pow(2, reconnectAttempts.current), 5000);
        reconnectAttempts.current++;
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
      }
    };

    connectWebSocket();

    // Faster ping to keep alive every 15 seconds (reduced from 30s)
    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 15000);

    return () => {
      clearInterval(pingIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
      setConnected(false);
    };
  }, [user]);

  const sendSOSRequest = useCallback(
    (requestData) => {
      const newRequest = {
        id: Date.now().toString(),
        ...requestData,
        timestamp: new Date().toISOString(),
        status: "pending",
      };

      if (user?.role === "admin") {
        setRequests((prev) => [newRequest, ...prev]);
      }

      return newRequest;
    },
    [user],
  );

  const updateRequestStatus = useCallback((requestId, status) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status } : req)),
    );

    // In production, emit through socket
    // socketRef.current?.emit('update-request', { requestId, status });
  }, []);

  return {
    connected,
    requests,
    sendSOSRequest,
    updateRequestStatus,
  };
};
