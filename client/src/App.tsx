import {
  Background,
  Controls,
  ControlButton,
  MiniMap,
  Panel,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type ColorMode,
  type DefaultEdgeOptions,
  type Edge,
  type FitViewOptions,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodeDrag,
  type OnNodesChange,
} from '@xyflow/react';
import { SunMoon } from "lucide-react";
import { useCallback, useState } from 'react';

import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  { id: '1', data: { label: 'Node 1' }, position: { x: 5, y: 5 } },
  { id: '2', data: { label: 'Node 2' }, position: { x: 5, y: 100 } },
];

const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
};

const onNodeDrag: OnNodeDrag = (_, node) => {
  console.log('drag event', node.data);
};

export default function App() {
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    if (typeof window !== 'undefined') { // Check if window is defined (for SSR safety)
      const storedTheme = localStorage.getItem('app-theme') as ColorMode | undefined;
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' as ColorMode;
      // If no theme is stored, use the system theme
      return storedTheme ?? systemTheme;
    }

    return 'light'; // Default for SSR or if window is not available
  });
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => { setNodes((nds) => applyNodeChanges(changes, nds)); },
    [setNodes],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => { setEdges((eds) => applyEdgeChanges(changes, eds)); },
    [setEdges],
  );
  const onConnect: OnConnect = useCallback(
    (connection) => { setEdges((eds) => addEdge(connection, eds)); },
    [setEdges],
  );

  const toggleColorMode = () => {
    const newTheme = colorMode === 'light' ? 'dark' : 'light';
    localStorage.setItem('app-theme', newTheme)
    setColorMode(newTheme);
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={onNodeDrag}
        colorMode={colorMode}
        fitView
        fitViewOptions={fitViewOptions}
        defaultEdgeOptions={defaultEdgeOptions}
      >
        <MiniMap />
        <Background />
        <Controls>
          <ControlButton onClick={toggleColorMode}>
            <SunMoon />
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  );
}
