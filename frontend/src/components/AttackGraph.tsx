import { useMemo, useState, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type cytoscape from "cytoscape";
import type { AnalysisResult, NetworkNode } from "../types";
import { getNodeWeight } from "../../data/securityWeights";
import {
  INNER_GRAPH_TEMPLATES,
  type InnerGraphTemplate,
  type CommunicationLevel,
} from "../data/innerGraphTemplates";

interface Props {
  platformNodes: NetworkNode[];
  fallbackGraph?: AnalysisResult["attack_graph"];
}

type Variant = "asset" | "control" | "info" | "risk";

interface GraphNodeDescriptor {
  id: string;
  title: string;
  subtitle?: string;
  weight?: number;
  variant: Variant;
}

interface GraphEdgeDescriptor {
  id: string;
  source: string;
  target: string;
  label?: string;
  variant: Exclude<Variant, "asset">;
  weight?: number;
}

interface DescriptorGraph {
  nodes: GraphNodeDescriptor[];
  edges: GraphEdgeDescriptor[];
  hasEdges: boolean;
  nodeTypes: Record<string, string | undefined>;
  nodeLabels: Record<string, string>;
}

const edgeColors: Record<Exclude<Variant, "asset">, string> = {
  control: "#2563eb",
  info: "#0f172a",
  risk: "#f97316",
};

const backupWeights: Record<string, number> = {
  none: 2,
  daily: 8,
  weekly: 6,
  monthly: 4,
};

const backupLabels: Record<string, string> = {
  none: "none",
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
};

const communicationColors: Record<CommunicationLevel, string> = {
  physical: "#0ea5e9",
  linguistic: "#7c3aed",
  semantic: "#f97316",
};

const communicationWeights: Record<CommunicationLevel, number> = {
  physical: 6,
  linguistic: 7,
  semantic: 8,
};

const stylesheet: cytoscape.Stylesheet[] = [
  {
    selector: "node",
    style: {
      width: "label",
      height: "label",
      padding: "16px",
      shape: "round-rectangle",
      "border-width": 1,
      "border-color": "#CBD5F5",
      "background-color": "#FFFFFF",
      label: "data(label)",
      color: "#111827",
      "font-size": 12,
      "font-weight": 600,
      "text-wrap": "wrap",
      "text-max-width": 220,
      "text-valign": "center",
      "text-halign": "center",
      "box-shadow": "0 6px 12px rgba(15, 23, 42, 0.08)",
      "transition-property": "background-color, box-shadow",
      "transition-duration": "200ms",
      "cursor": "pointer",
    },
  },
  { selector: ".node-asset", style: { "background-color": "#c7d2fe", "border-color": "#818cf8" } },
  { selector: ".node-control", style: { "background-color": "#d1fae5", "border-color": "#34d399" } },
  { selector: ".node-info", style: { "background-color": "#e2e8f0", "border-color": "#94a3b8" } },
  { selector: ".node-risk", style: { "background-color": "#fee2e2", "border-color": "#fca5a5", color: "#b91c1c" } },
  {
    selector: "edge",
    style: {
      width: 2,
      "curve-style": "bezier",
      "target-arrow-shape": "triangle",
      "line-color": "#94a3b8",
      "target-arrow-color": "#94a3b8",
      label: "data(label)",
      "font-size": 11,
      color: "#111827",
      "text-background-color": "#ffffff",
      "text-background-padding": 4,
      "text-background-opacity": 0.9,
      "text-background-shape": "round-rectangle",
    },
  },
  { selector: ".edge-control", style: { "line-color": edgeColors.control, "target-arrow-color": edgeColors.control } },
  { selector: ".edge-info", style: { "line-color": edgeColors.info, "target-arrow-color": edgeColors.info } },
  { selector: ".edge-risk", style: { "line-color": edgeColors.risk, "target-arrow-color": edgeColors.risk, "line-style": "dashed" } },
  { selector: ".edge-level-physical", style: { "line-color": communicationColors.physical, "target-arrow-color": communicationColors.physical } },
  { selector: ".edge-level-linguistic", style: { "line-color": communicationColors.linguistic, "target-arrow-color": communicationColors.linguistic, "line-style": "dotted" } },
  { selector: ".edge-level-semantic", style: { "line-color": communicationColors.semantic, "target-arrow-color": communicationColors.semantic } },
];

const buildSecurityGraph = (platformNodes: NetworkNode[]): DescriptorGraph => {
  const nodes: GraphNodeDescriptor[] = [];
  const edges: GraphEdgeDescriptor[] = [];
  let hasEdges = false;
  let featureCounter = 0;
  const assetIdMap = new Map<string, string>();
  const nodeTypes: Record<string, string | undefined> = {};
  const nodeLabels: Record<string, string> = {};

  platformNodes.forEach((asset, index) => {
    const assetKey = asset.id || "asset-" + index;
    const assetId = "asset-" + assetKey;
    assetIdMap.set(assetKey, assetId);
    const assetWeight = asset.weight ?? getNodeWeight(asset.name, asset.type);

    nodes.push({
      id: assetId,
      title: asset.name || "Node " + (index + 1),
      subtitle: asset.type,
      weight: assetWeight,
      variant: "asset",
    });
    nodeTypes[assetId] = asset.type;
    nodeLabels[assetId] = asset.name || "Node " + (index + 1);

    if (asset.security_policy) {
      const backupKey = asset.security_policy.backup_frequency || "none";
      const policyNodeId = assetId + "-policy";
      nodes.push({
        id: policyNodeId,
        title: asset.security_policy.password_hashed ? "Passwords hashed" : "Passwords plain",
        subtitle: "Backup: " + backupLabels[backupKey],
        weight: backupWeights[backupKey],
        variant: asset.security_policy.password_hashed ? "control" : "risk",
      });
      nodeLabels[policyNodeId] = asset.security_policy.password_hashed ? "Passwords hashed" : "Passwords plain";
      edges.push({
        id: assetId + "-policy-edge",
        source: assetId,
        target: policyNodeId,
        label: "policy",
        variant: asset.security_policy.password_hashed ? "control" : "risk",
        weight: backupWeights[backupKey],
      });
      hasEdges = true;
    }

    const addDescriptor = (
      title: string,
      subtitle: string | undefined,
      variant: Variant,
    ) => {
      const descriptorId = assetId + "-feature-" + featureCounter++;
      const descriptorWeight = subtitle ? getNodeWeight(subtitle, asset.type) : undefined;
      nodes.push({ id: descriptorId, title, subtitle, variant, weight: descriptorWeight });
      nodeLabels[descriptorId] = title;
      edges.push({
        id: assetId + "-" + descriptorId,
        source: assetId,
        target: descriptorId,
        label: variant === "risk" ? "gap" : "detail",
        variant: variant === "risk" ? "risk" : "info",
        weight: descriptorWeight,
      });
      hasEdges = true;
    };

    if (asset.os) addDescriptor("OS", asset.os, "info");
    if (asset.antivirus) addDescriptor("Antivirus", asset.antivirus, "control");
    if (asset.encryption?.length) addDescriptor("Encryption", asset.encryption.join(", "), "control");
    if (asset.vpn) addDescriptor("VPN", asset.vpn, "control");
    if (asset.wifi) {
      const secure = asset.wifi.password && asset.wifi.encryption;
      const wifiLabel = ((asset.wifi.encryption || "") + " " + (asset.wifi.password ? "(password set)" : "(open)")).trim();
      addDescriptor("Wi-Fi", wifiLabel, secure ? "control" : "risk");
    }
    if (asset.professional_software?.length) addDescriptor("Software", asset.professional_software.join(", "), "info");
    if (asset.personal_data?.enabled) {
      addDescriptor(
        "Personal data",
        "~" + (asset.personal_data.count || "?") + " entries",
        asset.encryption?.length ? "control" : "risk",
      );
    }
  });

  platformNodes.forEach((asset) => {
    if (!asset.connections?.length) return;
    const sourceId = assetIdMap.get(asset.id || "");
    if (!sourceId) return;
    const sourceWeight = nodes.find((n) => n.id === sourceId)?.weight ?? 5;
    asset.connections.forEach((targetId) => {
      const mappedTarget = assetIdMap.get(targetId);
      if (!mappedTarget) return;
      const targetWeight = nodes.find((n) => n.id === mappedTarget)?.weight ?? 5;
      edges.push({
        id: "link-" + sourceId + "-" + mappedTarget,
        source: sourceId,
        target: mappedTarget,
        label: "link",
        variant: "info",
        weight: Math.round((sourceWeight + targetWeight) / 2),
      });
      hasEdges = true;
    });
  });

  return { nodes, edges, hasEdges, nodeTypes, nodeLabels };
};

const buildFallbackGraph = (
  graph?: AnalysisResult["attack_graph"],
): DescriptorGraph => {
  if (!graph) {
    return { nodes: [], edges: [], hasEdges: false, nodeTypes: {}, nodeLabels: {} };
  }
  const nodes: GraphNodeDescriptor[] = graph.nodes.map((node, index) => ({
    id: node.id,
    title: node.data?.label || node.id || "LLM node " + (index + 1),
    variant: node.type === "threat" ? "risk" : node.type === "vulnerable" ? "info" : "control",
  }));
  const nodeLabels: Record<string, string> = {};
  nodes.forEach((n) => (nodeLabels[n.id] = n.title));
  const edges: GraphEdgeDescriptor[] = graph.edges.map((edge, index) => ({
    id: edge.id || "edge-" + index,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    variant: "info",
  }));
  return { nodes, edges, hasEdges: edges.length > 0, nodeTypes: {}, nodeLabels };
};

const toElements = (graph: DescriptorGraph): cytoscape.ElementDefinition[] => {
  const weights = new Map<string, number>();
  const nodeElements = graph.nodes.map((descriptor) => {
    const nodeWeight = typeof descriptor.weight === "number" ? descriptor.weight : 5;
    weights.set(descriptor.id, nodeWeight);
    const parts = [descriptor.title];
    if (descriptor.subtitle) parts.push(descriptor.subtitle);
    parts.push("w=" + nodeWeight);
    return {
      data: { id: descriptor.id, label: parts.join("\n") },
      classes: "node-" + descriptor.variant,
    };
  });

  const edgeElements = graph.edges.map((edge) => {
    const sourceWeight = weights.get(edge.source) ?? 5;
    const targetWeight = weights.get(edge.target) ?? 5;
    const weight = edge.weight ?? Math.round((sourceWeight + targetWeight) / 2);
    const label = edge.label ? edge.label + " (w=" + weight + ")" : "w=" + weight;
    return {
      data: { id: edge.id, source: edge.source, target: edge.target, label },
      classes: "edge-" + edge.variant,
    };
  });

  return [...nodeElements, ...edgeElements];
};

const innerToElements = (template: InnerGraphTemplate): cytoscape.ElementDefinition[] => {
  const nodeElements = template.nodes.map((node) => {
    const nodeWeight = typeof node.weight === "number" ? node.weight : 5;
    return {
      data: { id: node.id, label: node.label + "\nw=" + nodeWeight },
      classes: "node-" + (node.variant || "info"),
    };
  });
  const edgeElements = template.edges.map((edge) => {
    const weight = typeof edge.weight === "number" ? edge.weight : communicationWeights[edge.level] || 5;
    const label = edge.level + " (w=" + weight + ")";
    return {
      data: { id: edge.id, source: edge.source, target: edge.target, label },
      classes: "edge-level-" + edge.level,
    };
  });
  return [...nodeElements, ...edgeElements];
};

export default function AttackGraph({ platformNodes, fallbackGraph }: Props) {
  const securityGraph = useMemo(() => buildSecurityGraph(platformNodes), [platformNodes]);
  const fallback = useMemo(() => buildFallbackGraph(fallbackGraph), [fallbackGraph]);
  const graphToRender = platformNodes.length ? securityGraph : fallback;
  const elements = useMemo(() => toElements(graphToRender), [graphToRender]);
  const layout = useMemo(
    () => ({ name: "cose", animate: false, padding: 60, nodeDimensionsIncludeLabels: true }),
    [graphToRender.nodes.length, graphToRender.edges.length],
  );

  const [innerGraph, setInnerGraph] = useState<InnerGraphTemplate | null>(null);
  const [innerNodeTitle, setInnerNodeTitle] = useState<string>("");

  useEffect(() => {
    setInnerGraph(null);
  }, [platformNodes.length]);

  if (graphToRender.nodes.length === 0) {
    return (
      <div className="p-6 border rounded-xl bg-slate-50 text-sm text-slate-500">
        No data to render a graph yet. Please add at least one node.
      </div>
    );
  }

  const missingEdges = platformNodes.length > 0 && !graphToRender.hasEdges;

  return (
    <div>
      <div className="h-[520px] lg:h-[640px] border rounded-xl overflow-hidden bg-gray-50 shadow-inner">
        <CytoscapeComponent
          key={graphToRender.nodes.length + "-" + graphToRender.edges.length}
          elements={elements}
          layout={layout}
          stylesheet={stylesheet}
          style={{ width: "100%", height: "100%" }}
          cy={(cy) => {
            cy.off("tap");
            cy.on("tap", "node", (event) => {
              const nodeId = event.target.id();
              const nodeType = graphToRender.nodeTypes[nodeId];
              if (!nodeType) return;
              const template = INNER_GRAPH_TEMPLATES[nodeType as keyof typeof INNER_GRAPH_TEMPLATES];
              if (!template) return;
              setInnerNodeTitle(graphToRender.nodeLabels[nodeId] || template.title);
              setInnerGraph(template);
            });
          }}
        />
      </div>
      {missingEdges && (
        <p className="mt-3 text-sm text-amber-600">
          Not enough fields were filled in to build connections. Add, for example, antivirus, encryption or Wi-Fi settings.
        </p>
      )}
      {!platformNodes.length && fallbackGraph && (
        <p className="mt-3 text-xs text-slate-500">
          Showing the graph returned by LLM. Fill in your nodes to see the actual topology.
        </p>
      )}

      {innerGraph && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => setInnerGraph(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-2xl font-bold">{innerGraph.title}</h3>
                <p className="text-sm text-slate-500">{innerNodeTitle}</p>
              </div>
              <button
                onClick={() => setInnerGraph(null)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="h-[420px] border rounded-xl bg-slate-50">
              <CytoscapeComponent
                elements={innerToElements(innerGraph)}
                layout={{ name: "concentric", animate: false, padding: 40, nodeDimensionsIncludeLabels: true }}
                stylesheet={stylesheet}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
