import {
  Background,
  Controls,
  ControlButton,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type ColorModeClass,
  type Edge,
  type FitViewOptions,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodeDrag,
  type OnNodesChange,
} from '@xyflow/react';
import { Sun, Moon, Map } from "lucide-react";
import { useCallback, useEffect, useState } from 'react';
import { ActionNode, StatusNode } from "./components/nodes";
import { Toaster } from './components/ui/sonner';

import '@xyflow/react/dist/style.css';

const nodeTypes = {
  actionNode: ActionNode,
  statusNode: StatusNode,
};

const initialNodes: Node[] = [
  { id: '1', type: "actionNode", data: { title: 'Node 1', state: "not started" }, position: { x: 5, y: 5 } },
  { id: '2', type: "statusNode", data: { title: 'Node 2', state: "unknown", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla " }, position: { x: 250, y: 5 } },
  { id: '3', data: { label: 'Node 2' }, position: { x: 10, y: 200 } },
];

const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};


const onNodeDrag: OnNodeDrag = (_, node) => {
  console.log('drag event', node.data);
};

export default function App() {
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

  const [colorMode, setColorMode] = useState<ColorModeClass>(() => {
    if (typeof window !== 'undefined') { // Check if window is defined (for SSR safety)
      // Check the local storage for a theme
      const storedTheme = localStorage.getItem('app-theme') as ColorModeClass | undefined;
      // Get the theme that matches the system theme
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' as ColorModeClass;
      // If no theme is stored, use the system theme
      return storedTheme ?? systemTheme;
    }

    return 'light'; // Default for SSR or if window is not available
  });
  useEffect(() => {
    localStorage.setItem('app-theme', colorMode);
  }, [colorMode])

  const toggleColorMode = () => {
    const newTheme = colorMode === 'light' ? 'dark' : 'light';
    setColorMode(newTheme);
  }

  const [isMiniMapVisible, setIsMiniMapVisible] = useState<boolean>(() => {
    return localStorage.getItem('app-minimap-visible') === 'false' ? false : true;
  })
  useEffect(() => {
    localStorage.setItem('app-minimap-visible', String(isMiniMapVisible));
  }, [isMiniMapVisible]);

  const toggleMiniMap = () => {
    setIsMiniMapVisible(!isMiniMapVisible);
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={onNodeDrag}
        colorMode={colorMode}
        fitView
        fitViewOptions={fitViewOptions}
      >
        {isMiniMapVisible && (
          <MiniMap position="top-right" />
        )}
        <Background />
        <Controls>
          <ControlButton onClick={toggleColorMode}>
            {colorMode === "dark" ? (
              <Sun />
            ) : (<Moon />)}
          </ControlButton>
          <ControlButton onClick={toggleMiniMap}>
            <Map />
          </ControlButton>
        </Controls>
      </ReactFlow>
      <Toaster position="bottom-right" richColors expand={true} theme={colorMode} />
    </div>
  );
}
