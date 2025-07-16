import log from "loglevel";

const originalFactory = log.methodFactory;

log.methodFactory = (methodName, logLevel, loggerName) => {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (loggerName === undefined) {
    loggerName = "root";
  } else if (typeof loggerName !== "string") {
    loggerName = loggerName.description ?? loggerName.toString();
  }
  const prefix = "[" + loggerName + "]";
  return (...message: unknown[]) => {
    rawMethod(prefix, ...message);
  };
};
log.setDefaultLevel(process.env.NODE_ENV === "production" ? "warn" : "info");
log.rebuild();
