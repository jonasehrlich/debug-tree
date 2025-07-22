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

const _defaultLevelForEnv = {
  test: log.levels.SILENT,
  development: log.levels.INFO,
  production: log.levels.WARN,
} as const;

const getDefaultLevel = () => {
  const nodeEnv = process.env.NODE_ENV ?? "production";
  if (Object.prototype.hasOwnProperty.call(_defaultLevelForEnv, nodeEnv)) {
    return _defaultLevelForEnv[nodeEnv as keyof typeof _defaultLevelForEnv];
  }
  return log.levels.WARN;
};

log.setDefaultLevel(getDefaultLevel());
log.rebuild();

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  // @ts-expect-error For the debug env getLogger should be exposed in the debug console
  window.getLogger = (name: string) => {
    return log.getLogger(name);
  };
}
