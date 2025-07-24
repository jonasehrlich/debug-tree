---
aside: false
outline: false
---

<!-- markdownlint-disable no-inline-html first-line-heading-->

<script setup lang="ts">
import { useRoute } from 'vitepress'

const route = useRoute()

const operationId = route.data.params.operationId
</script>

<OAOperation :operationId="operationId" :hideBranding="true" />
