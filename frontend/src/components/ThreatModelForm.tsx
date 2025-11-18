import { useState } from "react";
import { AlertTriangle, DollarSign, Cpu } from "lucide-react";
import { ThreatModel } from "../types";

const capabilities = [
  { value: "CRQC 2030", label: "Квантовый компьютер 2030 года (ограниченная коррекция ошибок)" },
  { value: "CRQC 2035+", label: "CRQC 2035+ (полная коррекция ошибок, миллионы кубитов)" },
  { value: "Fault-tolerant 2040+", label: "Полностью отказоустойчивый квантовый компьютер 2040+" },
];

export default function ThreatModelForm({
  onSubmit,
  onBack,
}: {
  onSubmit: (data: ThreatModel) => Promise<void>;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ThreatModel>({
    quantum_capability: "CRQC 2035+",
    budget_usd: 1_000_000_000,
    has_error_correction: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <AlertTriangle className="w-10 h-10 text-red-600" />
        <h2 className="text-3xl font-bold">Модель квантового нарушителя</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Cpu className="w-6 h-6" />
            Возможности квантового компьютера
          </h3>
          <div className="space-y-4">
            {capabilities.map(c => (
              <label key={c.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="capability"
                  value={c.value}
                  checked={form.quantum_capability === c.value}
                  onChange={e => setForm({ ...form, quantum_capability: e.target.value })}
                  className="mt-1 w-5 h-5 text-red-600"
                />
                <div>
                  <div className="font-medium">{c.label}</div>
                  <div className="text-sm text-gray-600">
                    {c.value.includes("2030") && "Шор: ~2000 лог. кубитов, Гровер: ~10⁶"}
                    {c.value.includes("2035") && "Шор: >10⁴ лог. кубитов, Гровер: >10⁸, полная коррекция"}
                    {c.value.includes("2040") && "Неограниченные ресурсы"}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Бюджет нарушителя
          </h3>
          <input
            type="number"
            value={form.budget_usd}
            onChange={e => setForm({ ...form, budget_usd: Number(e.target.value) })}
            className="w-full px-4 py-3 text-2xl border rounded-lg"
            min="1000000"
            step="100000000"
          />
          <p className="text-sm text-gray-600 mt-2">
            {form.budget_usd >= 1e9
              ? "Государственный уровень"
              : form.budget_usd >= 1e8
              ? "Крупная корпорация"
              : "Исследовательская группа"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="error_correction"
            checked={form.has_error_correction}
            onChange={e => setForm({ ...form, has_error_correction: e.target.checked })}
            className="w-6 h-6 text-red-600"
          />
          <label htmlFor="error_correction" className="text-lg">
            Нарушитель имеет полноценную коррекцию ошибок (логические кубиты)
          </label>
        </div>

        <div className="flex justify-between pt-8">
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-4 border rounded-lg hover:bg-gray-50"
          >
            ← Назад к платформе
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-70 flex items-center gap-3"
          >
            {loading ? "Анализ..." : "Запустить анализ квантовых угроз"}
            <AlertTriangle className="w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
}