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

<!-- <OAServers /> -->

## Operations

<template v-for="path in paths">

- <OAOperationLink :operationId="path.operationId" :method="path.verb" :title="path.summary" :href="`/backend/api/operations/${path.operationId}`" :key="path.operationId"/>

</template>
