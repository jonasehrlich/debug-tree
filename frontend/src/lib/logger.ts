import log from "loglevel";

const originalFactory = log.methodFactory;

log.methodFactory = (methodName, logLevel, loggerName) => {
  console.log("Updating logger formatting");
  const rawMethod = originalFactory(methodName, logLevel, loggerName);
  return (message) => {
    rawMethod("[", loggerName, "]", message);
  };
};

if (process.env.NODE_ENV === "production") {
  log.setDefaultLevel("warn");
} else {
  log.setDefaultLevel("debug");
}

log.rebuild();
