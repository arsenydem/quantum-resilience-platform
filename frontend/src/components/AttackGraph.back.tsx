import { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import dagre from "dagre";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
} from "react-flow-renderer";
import type { AnalysisResult, NetworkNode } from "../types";
import { getEdgeWeight, getNodeWeight } from "../../data/securityWeights";

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
}

interface DescriptorGraph {
  nodes: GraphNodeDescriptor[];
  edges: GraphEdgeDescriptor[];
  hasEdges: boolean;
}

const variantStyles: Record<Variant, CSSProperties> = {
  asset: {
    background: "linear-gradient(135deg,#eef2ff,#c7d2fe)",
    border: "1px solid #a5b4fc",
    borderRadius: 16,
    padding: 16,
    width: 240,
    boxShadow: "0 20px 25px -15px rgba(67,56,202,.5)",
  },
  control: {
    background: "#ecfdf5",
    border: "1px solid #6ee7b7",
    borderRadius: 12,
    padding: 14,
    width: 210,
    boxShadow: "0 10px 15px -12px rgba(16,185,129,.6)",
  },
  info: {
    background: "#f1f5f9",
    border: "1px solid #cbd5f5",
    borderRadius: 12,
    padding: 14,
    width: 210,
    boxShadow: "0 8px 12px -10px rgba(15,23,42,.4)",
  },
  risk: {
    background: "#fff1f2",
    border: "1px solid #fca5a5",
    borderRadius: 12,
    padding: 14,
    width: 210,
    boxShadow: "0 12px 16px -12px rgba(244,63,94,.55)",
  },
};

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
  none: "РЅРµС‚",
  daily: "РµР¶РµРґРЅРµРІРЅРѕ",
  weekly: "РµР¶РµРЅРµРґРµР»СЊРЅРѕ",
  monthly: "РµР¶РµРјРµСЃСЏС‡РЅРѕ",
};

const renderLabel = (descriptor: GraphNodeDescriptor): ReactNode => (
  <div style={{ textAlign: "left", lineHeight: 1.35 }}>
    <div style={{ fontWeight: 600 }}>{descriptor.title}</div>
    {descriptor.subtitle && (
      <div style={{ fontSize: 12, color: "#1f2937" }}>{descriptor.subtitle}</div>
    )}
    {typeof descriptor.weight === "number" && (
      <div style={{ fontSize: 11, fontWeight: 700, color: "#4338ca" }}>
        Р’РµСЃ: {descriptor.weight}
      </div>
    )}
  </div>
);

const buildSecurityGraph = (platformNodes: NetworkNode[]): DescriptorGraph => {
  const nodes: GraphNodeDescriptor[] = [];
  const edges: GraphEdgeDescriptor[] = [];
  let hasEdges = false;
  let counter = 0;
  const assetIdMap = new Map<string, string>();

  platformNodes.forEach((asset, index) => {
    const assetKey = asset.id || `asset-${index}`;
    const assetId = `asset-${assetKey}`;
    assetIdMap.set(assetKey, assetId);
    const assetWeight = asset.weight ?? getNodeWeight(asset.name, asset.type);

    nodes.push({
      id: assetId,
      title: asset.name || `РЈР·РµР» ${index + 1}`,
      subtitle: asset.type,
      weight: assetWeight,
      variant: "asset",
    });

    const addFeature = (
      title: string,
      subtitle: string | undefined,
      variant: Variant,
      weight?: number,
    ) => {
      if (!subtitle) return;
      const nodeId = `${assetId}-f-${counter++}`;

      nodes.push({
        id: nodeId,
        title,
        subtitle,
        weight,
        variant,
      });

      edges.push({
        id: `${assetId}-${nodeId}`,
        source: assetId,
        target: nodeId,
        label: typeof weight === "number" ? `w=${weight}` : undefined,
        variant:
          variant === "risk"
            ? "risk"
            : variant === "info"
            ? "info"
            : "control",
      });

      hasEdges = true;
    };

    if (asset.os) {
      addFeature("РћРЎ", asset.os, "info", 5);
    }

    if (asset.antivirus) {
      addFeature(
        "РђРЅС‚РёРІРёСЂСѓСЃ",
        asset.antivirus,
        "control",
        getNodeWeight(asset.antivirus),
      );
    }

    asset.encryption?.forEach((scheme) => {
      addFeature(
        "РЁРёС„СЂРѕРІР°РЅРёРµ РґРёСЃРєР°",
        scheme,
        "control",
        getNodeWeight(scheme),
      );
    });

    if (asset.wifi) {
      addFeature(
        "Wi-Fi",
        asset.wifi.encryption,
        "control",
        getNodeWeight(asset.wifi.encryption),
      );
      addFeature(
        "Wi-Fi РїР°СЂРѕР»СЊ",
        asset.wifi.password ? "РїР°СЂРѕР»СЊ Р·Р°РґР°РЅ" : "Р±РµР· РїР°СЂРѕР»СЏ",
        asset.wifi.password ? "control" : "risk",
        asset.wifi.password ? 6 : 2,
      );
    }

    if (asset.vpn) {
      addFeature(
        "VPN / РєР°РЅР°Р» СЃРІСЏР·Рё",
        asset.vpn,
        "control",
        getEdgeWeight(asset.vpn),
      );
    }

    if (asset.security_policy) {
      addFeature(
        "РџР°СЂРѕР»Рё С…СЌС€РёСЂСѓСЋС‚СЃСЏ",
        asset.security_policy.password_hashed ? "РґР°" : "РЅРµС‚",
        asset.security_policy.password_hashed ? "control" : "risk",
        asset.security_policy.password_hashed ? 9 : 2,
      );

      const freq = asset.security_policy.backup_frequency || "none";
      addFeature(
        "Р РµР·РµСЂРІРЅС‹Рµ РєРѕРїРёРё",
        backupLabels[freq] || freq,
        backupWeights[freq] > 5 ? "control" : "risk",
        backupWeights[freq] ?? 3,
      );
    }

    const pd = asset.personal_data ?? { enabled: false, count: 0 };

    const personalDataLabel = pd.enabled
      ? `${pd.count} Р·Р°РїРёСЃРµР№`
      : "РЅРµ РѕР±СЂР°Р±Р°С‚С‹РІР°РµС‚СЃСЏ";

    addFeature(
      "РџРµСЂСЃРѕРЅР°Р»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ",
      personalDataLabel,
      pd.enabled ? "risk" : "info",
      pd.enabled
        ? Math.min(10, Math.max(3, pd.count / 10))
        : 3,
    );

    asset.professional_software?.forEach((soft) => {
      addFeature("РџРћ", soft, "info", getNodeWeight(soft));
    });
  });

  const seenConnections = new Set<string>();
  platformNodes.forEach((asset) => {
    if (!asset.connections?.length) {
      return;
    }
    const sourceKey = asset.id || "";
    const sourceId = sourceKey ? assetIdMap.get(sourceKey) : undefined;
    if (!sourceId) {
      return;
    }
    asset.connections.forEach((targetKey) => {
      const targetId = assetIdMap.get(targetKey);
      if (!targetId) {
        return;
      }
      const combo =
        sourceId < targetId
          ? `${sourceId}::${targetId}`
          : `${targetId}::${sourceId}`;
      if (seenConnections.has(combo)) {
        return;
      }
      seenConnections.add(combo);
      edges.push({
        id: `conn-${combo}`,
        source: sourceId,
        target: targetId,
        label: "РЎРІСЏР·СЊ",
        variant: "info",
      });
      hasEdges = true;
    });
  });

  return { nodes, edges, hasEdges };
};

const buildFallbackGraph = (
  graph?: AnalysisResult["attack_graph"],
): DescriptorGraph => {
  if (!graph) {
    return { nodes: [], edges: [], hasEdges: false };
  }

  const nodes: GraphNodeDescriptor[] = graph.nodes.map((node, index) => ({
    id: node.id || `llm-node-${index}`,
    title: node.data?.label || node.id || `LLM СѓР·РµР» ${index + 1}`,
    variant: node.type === "threat" ? "risk" : node.type === "vulnerable" ? "info" : "control",
  }));

  const edges: GraphEdgeDescriptor[] = graph.edges.map((edge, index) => ({
    id: edge.id || `llm-edge-${index}`,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    variant: "control",
  }));

  return { nodes, edges, hasEdges: edges.length > 0 };
};

const toFlowElements = (graph: DescriptorGraph) => {
  const nodes: Node[] = graph.nodes.map((descriptor) => ({
    id: descriptor.id,
    data: { label: renderLabel(descriptor) },
    position: { x: 0, y: 0 },
    style: variantStyles[descriptor.variant],
  }));

  const edges: Edge[] = graph.edges.map((descriptor) => ({
    id: descriptor.id,
    source: descriptor.source,
    target: descriptor.target,
    label: descriptor.label,
    animated: descriptor.variant === "control",
    style: {
      stroke: edgeColors[descriptor.variant],
      strokeWidth: 2,
    },
    labelStyle: { fontWeight: 600, fill: "#111827", fontSize: 11 },
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.85, strokeWidth: 0 },
  }));

  return { nodes, edges };
};

const applyLayout = (nodes: Node[], edges: Edge[]) => {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 90 });
  graph.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    const width = typeof node.style?.width === "number" ? node.style.width : 220;
    const height = typeof node.style?.height === "number" ? node.style.height : 80;
    graph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => graph.setEdge(edge.source, edge.target));

  dagre.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    const { x, y } = graph.node(node.id);
    return {
      ...node,
      position: { x, y },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function AttackGraph({ platformNodes, fallbackGraph }: Props) {
  const securityGraph = useMemo(
    () => toFlowElements(buildSecurityGraph(platformNodes)),
    [platformNodes],
  );

  const fallback = useMemo(
    () => toFlowElements(buildFallbackGraph(fallbackGraph)),
    [fallbackGraph],
  );

  const graphToRender = platformNodes.length ? securityGraph : fallback;

  if (graphToRender.nodes.length === 0) {
    return (
      <div className="p-6 border rounded-xl bg-slate-50 text-sm text-slate-500">
        РќРµС‚ РґР°РЅРЅС‹С… РґР»СЏ РїРѕСЃС‚СЂРѕРµРЅРёСЏ РіСЂР°С„Р°. Р”РѕР±Р°РІСЊС‚Рµ С…РѕС‚СЏ Р±С‹ РѕРґРёРЅ СѓР·РµР» РёРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂС‹.
      </div>
    );
  }

  const layouted = useMemo(
    () => applyLayout(graphToRender.nodes, graphToRender.edges),
    [graphToRender],
  );

  const missingEdges =
    platformNodes.length > 0 && layouted.edges.length === 0;

  return (
    <div>
      <div className="h-[520px] lg:h-[640px] border rounded-xl overflow-hidden bg-gray-50 shadow-inner">
        <ReactFlow nodes={layouted.nodes} edges={layouted.edges} fitView>
          <Background color="#d1d5db" gap={18} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.style?.background?.toString().includes("#fff1f2")) {
                return "#f97316";
              }
              if (node.style?.background?.toString().includes("#ecfdf5")) {
                return "#10b981";
              }
              if (node.style?.background?.toString().includes("#eef2ff")) {
                return "#6366f1";
              }
              return "#94a3b8";
            }}
          />
        </ReactFlow>
      </div>
      {missingEdges && (
        <p className="mt-3 text-sm text-amber-600">
          РќРµРґРѕСЃС‚Р°С‚РѕС‡РЅРѕ РІРІРµРґС‘РЅРЅС‹С… РїРѕР»РµР№, С‡С‚РѕР±С‹ РѕС‚СЂРёСЃРѕРІР°С‚СЊ СЃРІСЏР·Рё. Р”РѕР±Р°РІСЊС‚Рµ,
          РЅР°РїСЂРёРјРµСЂ, Р°РЅС‚РёРІРёСЂСѓСЃ, С€РёС„СЂРѕРІР°РЅРёРµ РґРёСЃРєР° РёР»Рё РЅР°СЃС‚СЂРѕР№РєРё WiвЂ‘Fi.
        </p>
      )}
      {!platformNodes.length && fallbackGraph && (
        <p className="mt-3 text-xs text-slate-500">
          РџРѕРєР°Р·Р°РЅ РіСЂР°С„ РёР· РѕС‚РІРµС‚Р° LLM. Р’РІРµРґРёС‚Рµ РґР°РЅРЅС‹Рµ РЅР° РїСЂРµРґС‹РґСѓС‰РёС… С€Р°РіР°С…, С‡С‚РѕР±С‹
          СѓРІРёРґРµС‚СЊ СЃРѕР±СЃС‚РІРµРЅРЅСѓСЋ С‚РѕРїРѕР»РѕРіРёСЋ.
        </p>
      )}
    </div>
  );
}
