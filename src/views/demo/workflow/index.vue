<template>
  <div class="workflow-container">
    <div class="viewer-toolbar">
      <div class="toolbar-left">
        工作流操作面板
      </div>

      <div class="toolbar-right">
        <n-button size="small" quaternary :focusable="false" @click="handleClose">
          <template #icon>
            <h-icon name="fa-compress" />
          </template>
        </n-button>
      </div>
    </div>

    <vue-flow :nodes="nodes" :edges="edges" :default-viewport="{ zoom: 0.5 }" :max-zoom="1.5" :min-zoom="0.4" :nodes-draggable="nodesDraggable" @pane-ready="handlePaneReady">
      <background :gap="15" :size="1" class="h-full w-full" pattern-color="#BDBDBD" />
      <template #node-special="specialNodeProps">
        <special-node v-bind="specialNodeProps" />
      </template>

      <template #edge-special="specialEdgeProps">
        <special-edge v-bind="specialEdgeProps" />
      </template>
    </vue-flow>
  </div>
</template>

<script setup>
import { Background } from '@vue-flow/background'
import { VueFlow } from '@vue-flow/core'
import SpecialEdge from './components/SpecialEdge.vue'
import SpecialNode from './components/SpecialNode.vue'

const router = useRouter()

// vueflow 实例
const vueFlowInstance = ref(null)
// 节点是否可拖动，如果 节点内 有 draggable 属性 会覆盖全局的
const nodesDraggable = ref(true)
// these are our nodes
const nodes = ref([
  {
    id: '1',
    type: 'input',
    position: { x: 250, y: 5 },
    data: { label: 'Node 1' },
  },

  {
    id: '2',
    type: 'default',
    position: { x: 100, y: 100 },
    data: { label: 'Node 2' },
  },

  {
    id: '3',
    type: 'output',
    position: { x: 400, y: 200 },
    data: { label: 'Node 3' },
  },

  {
    id: '4',
    type: 'output', // <-- this is the custom node type name
    position: { x: 600, y: 200 },
    data: {
      label: 'Node 4',
      hello: 'world',
    },
  },
])

// these are our edges
const edges = ref([
  {
    id: 'e1->2',
    source: '1',
    target: '2',

  },

  {
    id: 'e2->3',
    source: '2',
    target: '3',
    // animated: true,

  },

  {
    id: 'e3->4',
    // type: 'special',
    source: '3',
    target: '4',

  },
])

// 监听视图变化 适应视图让节点始终是可见的
function handlePaneReady(instance) {
  instance.fitView()
  vueFlowInstance.value = instance
}
//  返回上一页
function handleClose() {
  router.back()
}
</script>

<style scoped>
.workflow-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.viewer-toolbar {
  position: absolute;
  top: 5px;
  left: 5px;
  right: 5px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 10px;
}
.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 6px;
}
</style>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';
</style>
