---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "debug-flow"
  # text: "Documentation for debug-flow"
  tagline: Flow charts with Git integration
  actions:
    - theme: brand
      text: What is debug-flow?
      link: /introduction/what-is-debug-flow/
    - theme: alt
      text: Development
      link: /dev/
    - theme: alt
      text: API Documentation
      link: /dev/api/

features:
  - icon:
      dark: /xyflow-white.svg
      light: /xyflow-1A192B.svg
    title: Interactive Flow Editor
    details: Interactive flow editor using React Flow
    link: https://reactflow.dev
    linkText: reactflow.dev
  - icon:
      light: /Git-Icon-1788C.svg
      dark: /Git-Icon-White.svg
    title: Git repository integration
    details: Integrates progress tracking with your local Git repository
---
