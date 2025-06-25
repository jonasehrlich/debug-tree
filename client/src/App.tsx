import {
  Background,
  Controls,
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
import { useCallback, useState, type ChangeEventHandler } from 'react';

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
  animated: true,
};

const onNodeDrag: OnNodeDrag = (_, node) => {
  console.log('drag event', node.data);
};

export default function App() {
  const [colorMode, setColorMode] = useState<ColorMode>('system');
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

  const onColorModeChange: ChangeEventHandler<HTMLSelectElement> = (evt) => {
    setColorMode(evt.target.value as ColorMode);
  };

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
        <Controls />
        <Panel position="top-right">
          <select
            className="xy-theme__select"
            onChange={onColorModeChange}
            data-testid="colormode-select"
          >
            <option value="dark">dark</option>
            <option value="light">light</option>
            <option value="system">system</option>
          </select>
        </Panel>
      </ReactFlow>
    </div>
  );
}
