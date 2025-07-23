// .vitepress/theme/index.ts
import type { Theme } from "vitepress";
import { theme, useOpenapi } from "vitepress-openapi/client";
import "vitepress-openapi/dist/style.css";
import DefaultTheme from "vitepress/theme";

import spec from "../../../openapi-schema.json";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Set the OpenAPI specification.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useOpenapi({
      spec,
    });

    // Use the theme.
    theme.enhanceApp({ app });
  },
} satisfies Theme;
