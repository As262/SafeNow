import { useState, useEffect, useCallback, useRef } from "react";

const WS_BASE_URL =
  import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;

export const useWebSocket = (user) => {
  const [connected, setConnected] = useState(false);
  const [requests, setRequests] = useState([]);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

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
          console.log("WebSocket connected");
          setConnected(true);
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
          console.log("WebSocket disconnected");
          setConnected(false);
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          ws.close();
        };
      } catch (error) {
        console.error("WebSocket connection failed:", error);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    // Ping to keep alive every 30 seconds
    const pingInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
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
