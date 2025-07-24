---
aside: true
outline: [1, 2]
---

<!-- markdownlint-disable no-inline-html no-empty-links first-line-heading -->
<script setup>
import { useOpenapi } from 'vitepress-openapi/client'

const paths = useOpenapi().getPathsByVerbs()
</script>

<OAInfo />

## API

When running the application, the API documentation is also served through the same server using
[RapiDoc](https://rapidocweb.com/). It can be accessed on the _/api-docs_ path.

This allows interactive testing of the API directly in the browser.

<!-- <OAServers /> -->

## Operations

<template v-for="path in paths">

- <OAOperationLink :operationId="path.operationId" :method="path.verb" :title="path.summary" :href="`/dev/api/operations/${path.operationId}`" :key="path.operationId"/>

</template>
