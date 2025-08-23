import { ReconnectingTypedEventSource, TypedEventSource } from "@/lib/sse";
import React from "react";

interface UseEventStreamOptions extends EventSourceInit {
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
  backoffFactor?: number;
}

/**
 * React hook for consuming a server-sent events (SSE) stream with automatic reconnection.
 *
 * Wraps {@link ReconnectingTypedEventSource} and provides a declarative interface for subscribing
 * to the latest event of a stream
 *
 * @template Events - A record type describing the event names and their payload types.
 *
 * @param {string} url - The SSE endpoint URL.
 * @param {UseEventStreamOptions} [options] - Optional configuration for the connection and reconnection.
 * @param {number} [options.initialReconnectDelay=1000] - Delay (ms) before the first reconnect attempt.
 * @param {number} [options.maxReconnectDelay=30000] - Maximum backoff delay (ms) between reconnect attempts.
 * @param {number} [options.backoffFactor=2] - Multiplier applied to the reconnect delay after each failure.
 * @param {boolean} [options.withCredentials] - Whether the EventSource should send cookies/auth headers.
 *
 * @returns {{
 *   connected: boolean;
 *   events: { [K in keyof Events]: Events[K] | Events[K][] };
 *   subscribe: <K extends keyof Events>(type: keyof Events) => void;
 * }}
 *
 * Hook state and API:
 *
 * - `connected`: Whether the SSE connection is currently open.
 * - `events`: An object mapping event names to their last event payload
 * - `subscribe(type)`: Registers a handler for an event type
 *
 * @example
 * type MyEvents = {
 *   message: { text: string };
 *   status: { online: boolean };
 * };
 *
 * function Chat() {
 *   const { connected, events, subscribe } = useEventStream<MyEvents>("/api/stream", {
 *     withCredentials: true,
 *   });
 *
 *   useEffect(() => {
 *     subscribe("message"); // store all messages
 *     subscribe("status");   // keep only latest status
 *   }, [subscribe]);
 *
 *   return (
 *     <div>
 *       <p>Connected: {connected ? "✅" : "❌"}</p>
 *       <ul>
 *         {(events.message ?? []).map((msg, i) => (
 *           <li key={i}>{msg.text}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 */
export const useEventStream = <Events extends Record<string, unknown>>(
  url: string,
  reconnect = true,
  options: UseEventStreamOptions = {},
) => {
  const sourceRef = React.useRef<
    ReconnectingTypedEventSource<Events> | TypedEventSource<Events> | null
  >(null);
  const [isConnected, setIsConnected] = React.useState(false);

  const [eventData, setEventData] = React.useState<
    Partial<{ [K in keyof Events]: Events[K] }>
  >({});

  const {
    initialReconnectDelay,
    maxReconnectDelay,
    backoffFactor,
    withCredentials,
  } = options;
  // Memoize options to use in React.useEffect dependency array. If options was just added there and is an object
  // literal created inline (e.g. { initialReconnectDelay: 2000 }), a new reference is created on every render,
  // causing the effect to run on every render — defeating the point.
  const memoOptions = React.useMemo(
    () => ({
      initialReconnectDelay,
      maxReconnectDelay,
      backoffFactor,
      withCredentials,
    }),
    [initialReconnectDelay, maxReconnectDelay, backoffFactor, withCredentials],
  );

  React.useEffect(() => {
    const stream = reconnect
      ? new ReconnectingTypedEventSource<Events>(url, memoOptions)
      : new TypedEventSource<Events>(url, memoOptions);
    sourceRef.current = stream;

    stream.onOpen(() => {
      setIsConnected(true);
    });
    stream.onError(() => {
      setIsConnected(false);
    });

    return () => {
      stream.close();
      sourceRef.current = null;
      setIsConnected(false);
    };
  }, [url, memoOptions, reconnect]);

  // subscribe to events and push data into state
  const subscribe = React.useCallback((type: keyof Events) => {
    if (!sourceRef.current) return;

    sourceRef.current.on(type, (e) => {
      setEventData((prev) => ({
        ...prev,
        [type]: e.data,
      }));
    });
  }, []);

  return {
    isConnected,
    events: eventData as { [K in keyof Events]: Events[K] | undefined },
    subscribe,
  };
};
