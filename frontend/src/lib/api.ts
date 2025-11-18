const API_URL = "http://localhost:8000";

export const api = {
  analyze: async (nodes: any[], threat: any) => {
    const res = await fetch(`${API_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, threat_model: threat }),
    });
    if (!res.ok) throw new Error("Ошибка анализа");
    return res.json();
  },
};