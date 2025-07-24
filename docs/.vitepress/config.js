import { defineConfig } from "vitepress";
import { useSidebar } from "vitepress-openapi";
import spec from "../../openapi-schema.json" with { type: "json" };

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "debug-flow",
  description: "Documentation for debug-flow",
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/`
    : "/",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/introduction/getting-started" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          {
            text: "What is debug-flow?",
            link: "/introduction/what-is-debug-flow",
          },
          { text: "Getting Started", link: "/introduction/getting-started" },
          { text: "Usage", link: "/introduction/usage" },
        ],
      },
      {
        text: "Development",
        link: "/dev/",
        items: [
          { text: "Frontend", link: "/dev/frontend" },
          { text: "Backend", link: "/dev/backend" },
          {
            text: "API",
            link: "/dev/api/",
            collapsed: true,
            items: [
              ...useSidebar({
                spec,
                linkPrefix: "/dev/api/operations/",
              }).generateSidebarGroups(),
            ],
          },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/jonasehrlich/debug-flow" },
    ],
  },
});
