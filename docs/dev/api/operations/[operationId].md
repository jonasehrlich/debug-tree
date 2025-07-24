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

<OAOperation :operationId="operationId" :hideBranding="true">
  <!-- Provide custom playground slot doing nothing,
  as the documentation will not run from the same server as the application -->
  <template #playground />
  </OAOperation>
