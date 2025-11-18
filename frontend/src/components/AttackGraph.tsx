import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
  } from "react-flow-renderer";
  import { AnalysisResult } from "../types";
  
  interface Props {
    graph: AnalysisResult["attack_graph"];
  }
  
  const nodeColor = (node: any) => {
    if (node.type === "threat") return "#ef4444";
    if (node.type === "vulnerable") return "#f59e0b";
    return "#10b981";
  };
  
  export default function AttackGraph({ graph }: Props) {
    const nodes: Node[] = graph.nodes.map(n => ({
      id: n.id,
      position: { x: 0, y: 0 }, // React Flow сам разложит
      data: { label: n.data.label },
      type: n.type === "threat" ? "input" : n.type === "vulnerable" ? "default" : "output",
      style: {
        background: nodeColor(n),
        color: "white",
        border: "none",
        padding: 15,
        borderRadius: 8,
        fontWeight: "bold",
      },
    }));
  
    const edges: Edge[] = graph.edges.map((e, i) => ({
      id: e.id || `e${i}`,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: true,
      style: { stroke: "#ef4444", strokeWidth: 3 },
      labelStyle: { fontWeight: "bold" },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: "#fef3c7", color: "#92400e" },
    }));
  
    return (
      <div className="h-96 lg:h-screen border rounded-xl overflow-hidden bg-gray-50">
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background color="#ccc" gap={16} />
          <Controls />
          <MiniMap nodeColor={nodeColor} />
        </ReactFlow>
      </div>
    );
  }