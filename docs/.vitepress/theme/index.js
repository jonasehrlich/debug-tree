// .vitepress/theme/index.ts
import { theme, useOpenapi } from "vitepress-openapi/client";
import "vitepress-openapi/dist/style.css";
import DefaultTheme from "vitepress/theme";
import spec from "../../../openapi-schema.json" with { type: "json" };
import "./styles.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Set the OpenAPI specification.
    useOpenapi({
      spec,
    });

    // Use the theme.
    theme.enhanceApp({ app });
  },
};
