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
}
