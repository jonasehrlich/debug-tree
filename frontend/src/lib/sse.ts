import log from "loglevel";

const _logger = log.getLogger("sse");

export class TypedEventSource<Events extends Record<string, unknown>> {
  private source: EventSource;
  /**
   * Creates a new `TypedEventSource` instance.
   * @param url The URL to connect to.
   * @param options Optional `EventSourceInit` options.
   */
  constructor(url: string, options?: EventSourceInit) {
    this.source = new EventSource(url, options);
  }

  /**
   * Registers an event listener for a specific event type.
   * @param type The type of event to listen for.
   * @param listener The callback function to invoke when the event occurs.
   */
  on<K extends keyof Events>(
    type: K,
    listener: (event: MessageEvent<Events[K]>) => void,
  ) {
    this.source.addEventListener(type as string, (e) => {
      const messageEvent = e as MessageEvent<string>;
      let parsed: Events[K];
      try {
        parsed = JSON.parse(messageEvent.data) as Events[K];
      } catch {
        _logger.warn(
          `Failed to parse event ${type.toString()}`,
          messageEvent.data,
        );
        return;
      }
      listener(new MessageEvent(type as string, { data: parsed }));
    });
  }
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventSource/open_event) */
  onOpen(listener: (event: Event) => void) {
    this.source.onopen = listener;
  }
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventSource/error_event) */
  onError(listener: (event: Event) => void) {
    this.source.onerror = listener;
  }
  /**
   * Close the event source
   */
  close() {
    this.source.close();
  }

  isConnecting() {
    return this.source.readyState === this.source.CONNECTING;
  }

  isOpen() {
    return this.source.readyState === this.source.OPEN;
  }

  isClosed() {
    return this.source.readyState === this.source.CLOSED;
  }
}

interface ReconnectOptions extends EventSourceInit {
  /** Initial reconnect delay in ms (default: 1000) */
  initialReconnectDelay?: number;
  /** Maximum reconnect delay in ms (default: 30_000) */
  maxReconnectDelay?: number;
  /** Exponential backoff factor (default: 2) */
  backoffFactor?: number;
}

type EventHandler<
  Events extends Record<string, unknown>,
  Type extends keyof Events,
> = (event: MessageEvent<Events[Type]>) => void;

type EventHandlerMap<E extends Record<string, unknown>> = {
  [K in keyof E]?: EventHandler<E, K>[];
};

export class ReconnectingTypedEventSource<
  Events extends Record<string, unknown>,
> {
  private url: string;
  private options: ReconnectOptions;
  private reconnectDelay: number;
  private shouldReconnect = true;

  private source: TypedEventSource<Events>;
  private listeners: {
    open: ((e: Event) => void)[];
    error: ((e: Event) => void)[];
    events: EventHandlerMap<Events>;
  } = {
    open: [],
    error: [],
    events: {},
  };

  constructor(url: string, options: ReconnectOptions = {}) {
    this.url = url;
    this.options = options;
    this.reconnectDelay = options.initialReconnectDelay ?? 1000;
    this.source = this.createSource();
  }

  private createSource(): TypedEventSource<Events> {
    const src = new TypedEventSource<Events>(this.url, this.options);

    // Re-attach listeners by iterating over the events object
    for (const type in this.listeners.events) {
      const handlers = this.listeners.events[type as keyof Events];
      if (handlers) {
        handlers.forEach((h) => {
          src.on(
            type,
            h as (event: MessageEvent<Events[keyof Events]>) => void,
          );
        });
      }
    }

    this.listeners.open.forEach((h) => {
      src.onOpen(h);
    });
    this.listeners.error.forEach((h) => {
      src.onError(h);
    });

    // add our reconnect logic
    src.onError(() => {
      _logger.error(
        "Connection lost. Scheduling reconnect in",
        this.reconnectDelay,
        "ms",
      );
      this.scheduleReconnect();
    });

    return src;
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect) return;

    this.source.close();

    setTimeout(() => {
      if (!this.shouldReconnect) return;
      _logger.info("Reconnecting to", this.url);

      this.source = this.createSource();

      // exponential backoff
      this.reconnectDelay = Math.min(
        this.reconnectDelay * (this.options.backoffFactor ?? 2),
        this.options.maxReconnectDelay ?? 30_000,
      );
    }, this.reconnectDelay);
  }

  on<K extends keyof Events>(type: K, listener: EventHandler<Events, K>) {
    const listeners = this.listeners.events[type];
    if (listeners) {
      listeners.push(listener);
    } else {
      this.listeners.events[type] = [listener];
    }
    this.source.on(type, listener);
  }

  onOpen(listener: (event: Event) => void) {
    this.listeners.open.push(listener);
    this.source.onOpen(listener);
  }

  onError(listener: (event: Event) => void) {
    this.listeners.error.push(listener);
    this.source.onError(listener);
  }

  close() {
    this.shouldReconnect = false;
    this.source.close();
  }
}
