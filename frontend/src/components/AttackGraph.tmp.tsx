import { useMemo } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type cytoscape from "cytoscape";
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
  none: "нет",
  daily: "ежедневно",
  weekly: "еженедельно",
  monthly: "ежемесячно",
};

const cytoscapeStylesheet: cytoscape.Stylesheet[] = [
  {
    selector: "node",
    style: {
      width: "label",
      height: "label",
      padding: "18px",
      shape: "round-rectangle",
      "border-width": 1,
      "border-color": "#CBD5F5",
      "background-color": "#FFFFFF",
      label: "data(label)",
      color: "#111827",
      "font-size": 12,
      "font-weight": 600,
      "text-wrap": "wrap",
      "text-max-width": 200,
      "text-valign": "center",
      "text-halign": "center",
    },
  },
  {
    selector: ".node-asset",
    style: {
      "background-color": "#c7d2fe",
      "border-color": "#818cf8",
      "font-size": 13,
    },
  },
  {
    selector: ".node-control",
    style: {
      "background-color": "#d1fae5",
      "border-color": "#34d399",
    },
  },
  {
    selector: ".node-info",
    style: {
      "background-color": "#e2e8f0",
      "border-color": "#94a3b8",
    },
  },
  {
    selector: ".node-risk",
    style: {
      "background-color": "#fee2e2",
      "border-color": "#fca5a5",
      color: "#b91c1c",
    },
  },
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
  {
    selector: ".edge-control",
    style: {
      "line-color": edgeColors.control,
      "target-arrow-color": edgeColors.control,
    },
  },
  {
    selector: ".edge-info",
    style: {
      "line-color": edgeColors.info,
      "target-arrow-color": edgeColors.info,
    },
  },
  {
    selector: ".edge-risk",
    style: {
      "line-color": edgeColors.risk,
      "target-arrow-color": edgeColors.risk,
      "line-style": "dashed",
    },
  },
];

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
      title: asset.name || `Узел ${index + 1}`,
      subtitle: asset.type,
      weight: assetWeight,
      variant: "asset",
    });

    if (asset.security_policy) {
      edges.push({
        id: `policy-${assetId}`,
        source: assetId,
        target: `${assetId}-policy`,
        label: asset.security_policy.password_hashed ? "Пароли: хеш" : "Пароли: plain",
        variant: asset.security_policy.password_hashed ? "control" : "risk",
      });
      nodes.push({
        id: `${assetId}-policy`,
        title: asset.security_policy.password_hashed ? "Пароли хэшируются" : "Пароли хранятся открыто",
        subtitle: `Бэкап: ${backupLabels[asset.security_policy.backup_frequency || "none"]}`,
        weight: backupWeights[asset.security_policy.backup_frequency || "none"],
        variant: asset.security_policy.password_hashed ? "control" : "risk",
      });
      hasEdges = true;
    }

    const pwdFragment = asset.password_policy ? `Пароль ?${asset.password_policy.min_length}` : undefined;
    const soft = asset.professional_software?.length ? asset.professional_software.join(", ") : undefined;

    const addDescriptor = (
      title: string,
      subtitle: string | undefined,
      variant: Variant,
      customId?: string,
    ) => {
      const descriptorId = customId || `${assetId}-feature-${counter++}`;
      nodes.push({
        id: descriptorId,
        title,
        subtitle,
        variant,
      });
      edges.push({
        id: `${assetId}-${descriptorId}`,
        source: assetId,
        target: descriptorId,
        variant: variant === "risk" ? "risk" : "info",
      });
      hasEdges = true;
    };

    if (asset.os) {
      addDescriptor("ОС", asset.os, "info");
    }
    if (asset.antivirus) {
      addDescriptor("Антивирус", asset.antivirus, "control");
    }
    if (asset.encryption?.length) {
      addDescriptor("Шифрование", asset.encryption.join(", "), "control");
    }
    if (asset.vpn) {
      addDescriptor("VPN", asset.vpn, "control");
    }
    if (asset.wifi) {
      const wifiSecure = asset.wifi.password && asset.wifi.encryption;
      addDescriptor(
        "Wi-Fi",
        `${asset.wifi.encryption || ""} ${asset.wifi.password ? "(пароль задан)" : "(без пароля)"}`.trim(),
        wifiSecure ? "control" : "risk",
      );
    }
    if (pwdFragment) {
      addDescriptor("Пароли", pwdFragment, "info");
    }
    if (soft) {
      addDescriptor("ПО", soft, "info");
    }
    if (asset.personal_data?.enabled) {
      addDescriptor(
        "ПД",
        `~${asset.personal_data.count || "?"} записей",
        asset.encryption?.length ? "control" : "risk",
      );
    }
  });

  platformNodes.forEach((asset) => {
    if (!asset.connections?.length) {
      return;
    }
    const sourceId = assetIdMap.get(asset.id || "");
    if (!sourceId) {
      return;
    }
    asset.connections.forEach((targetId) => {
      const mappedTarget = assetIdMap.get(targetId);
      if (!mappedTarget) {
        return;
      }
      edges.push({
        id: `link-${sourceId}-${mappedTarget}`,
        source: sourceId,
        target: mappedTarget,
        label: "Связь",
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
    id: node.id,
    title: node.data?.label || node.id || `LLM node ${index + 1}`,
    variant: node.type === "threat" ? "risk" : node.type === "vulnerable" ? "info" : "control",
  }));
  const edges: GraphEdgeDescriptor[] = graph.edges.map((edge, index) => ({
    id: edge.id || `edge-${index}`,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    variant: "info",
  }));
  return { nodes, edges, hasEdges: edges.length > 0 };
};

const toCytoscapeElements = (
  graph: DescriptorGraph,
): cytoscape.ElementDefinition[] => {
  const elements: cytoscape.ElementDefinition[] = graph.nodes.map((descriptor) => {
    const labelParts = [descriptor.title];
    if (descriptor.subtitle) {
      labelParts.push(descriptor.subtitle);
    }
    if (typeof descriptor.weight === "number") {
      labelParts.push(`w=${descriptor.weight}`);
    }
    return {
      data: {
        id: descriptor.id,
        label: labelParts.join("\n"),
      },
      classes: `node-${descriptor.variant}`,
    };
  });

  graph.edges.forEach((edge) => {
    elements.push({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label || "",
      },
      classes: `edge-${edge.variant}`,
    });
  });

  return elements;
};

export default function AttackGraph({ platformNodes, fallbackGraph }: Props) {
  const securityGraph = useMemo(
    () => buildSecurityGraph(platformNodes),
    [platformNodes],
  );

  const fallback = useMemo(
    () => buildFallbackGraph(fallbackGraph),
    [fallbackGraph],
  );

  const graphToRender = platformNodes.length ? securityGraph : fallback;
  const elements = useMemo(() => toCytoscapeElements(graphToRender), [graphToRender]);
  const layout = useMemo(
    () => ({ name: "cose", animate: false, padding: 50, nodeDimensionsIncludeLabels: true }),
    [graphToRender.nodes.length, graphToRender.edges.length],
  );

  if (graphToRender.nodes.length === 0) {
    return (
      <div className="p-6 border rounded-xl bg-slate-50 text-sm text-slate-500">
        Нет данных для построения графа. Добавьте хотя бы один узел инфраструктуры.
      </div>
    );
  }

  const missingEdges = platformNodes.length > 0 && !graphToRender.hasEdges;

  return (
    <div>
      <div className="h-[520px] lg:h-[640px] border rounded-xl overflow-hidden bg-gray-50 shadow-inner">
        <CytoscapeComponent
          key={`${graphToRender.nodes.length}-${graphToRender.edges.length}`}
          elements={elements}
          layout={layout}
          stylesheet={cytoscapeStylesheet}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      {missingEdges && (
        <p className="mt-3 text-sm text-amber-600">
          Недостаточно введённых полей, чтобы отрисовать связи. Добавьте, например, антивирус, шифрование или настройки Wi?Fi.
        </p>
      )}
      {!platformNodes.length && fallbackGraph && (
        <p className="mt-3 text-xs text-slate-500">
          Показан граф из ответа LLM. Введите данные на предыдущих шагах, чтобы увидеть собственную топологию.
        </p>
      )}
    </div>
  );
}
