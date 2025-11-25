import { useState } from "react";
import { AlertTriangle, Cpu } from "lucide-react";
import { ThreatModel } from "../types";

const capabilities = [
  { value: "UsualAttack", label: "Атака с использованием классических методов" },
  { value: "QuantumAttack", label: "Атака с использованием квантовых устройств" },
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
    quantum_capability: "QuantumAttack",     // чтобы совпадало с одним из value
    budget_usd: 1_000_000_000,
    has_error_correction: true,
    is_fstec_compliant: false,
    has_large_pd_storage: false,
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
            Тип атаки
          </h3>
          <div className="space-y-4">
            {capabilities.map(c => (
              <label key={c.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="capability"
                  value={c.value}
                  checked={form.quantum_capability === c.value}
                  onChange={e =>
                    setForm(prev => ({ ...prev, quantum_capability: e.target.value }))
                  }
                  className="mt-1 w-5 h-5 text-red-600"
                />
                <div>
                  <div className="font-medium">{c.label}</div>
                  <div className="text-sm text-gray-600">
                    {c.value === "UsualAttack" &&
                      "Классический атакующий без применения квантовых алгоритмов"}
                    {c.value === "QuantumAttack" &&
                      "Нарушитель с квантовыми алгоритмами (алгоритм Шора/Гровера)"}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="fstec"
              checked={form.is_fstec_compliant}
              onChange={e =>
                setForm(prev => ({ ...prev, is_fstec_compliant: e.target.checked }))
              }
              className="w-6 h-6 text-red-600"
            />
            <label htmlFor="fstec" className="text-lg">
              Соответствие стандартам ФСТЭК
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="data_storage"
              checked={form.has_large_pd_storage}
              onChange={e =>
                setForm(prev => ({ ...prev, has_large_pd_storage: e.target.checked }))
              }
              className="w-6 h-6 text-red-600"
            />
            <label htmlFor="data_storage" className="text-lg">
              Хранится более 100 тысяч записей субъектов персональных данных
            </label>
          </div>
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
            {loading ? "Анализ..." : "Запустить анализ устойчивости системы"}
            <AlertTriangle className="w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
}
