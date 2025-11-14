import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import TimeSeriesChart from "../components/TimeSeriesChart";
import type { TimeSeriesData } from "../utils/types";

const API_BASE_URL = "http://localhost:5000/api";

interface ContextType {
  isDarkMode: boolean;
}

export default function MA1Generation() {
  const { isDarkMode } = useOutletContext<ContextType>();
  const [variance, setVariance] = useState<string>("1.0");
  const [nSamples, setNSamples] = useState<string>("100");
  const [phi1, setPhi1] = useState<string>("0.5");
  const [generatedData, setGeneratedData] = useState<TimeSeriesData | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-ma`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variance: parseFloat(variance),
          nSamples: parseInt(nSamples),
          phi1: parseFloat(phi1),
        }),
      });

      if (!response.ok) {
        throw new Error("خطا در تولید سری زمانی");
      }

      const data: TimeSeriesData = await response.json();
      setGeneratedData(data);
    } catch (error) {
      console.error("Error generating MA(1):", error);
      alert("خطا در تولید سری زمانی. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? "bg-gray-900" : "bg-white"
      }`}
    >
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1
              className={`text-4xl font-bold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              تولید سری زمانی MA(1)
            </h1>
            <p
              className={`text-lg ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              X_t = φ₁ × ε_(t-1) + ε_t &nbsp;&nbsp; where &nbsp; ε ~ N(0, σ²)
            </p>
          </div>

          {/* Input Form */}
          <Card
            className={`p-8 rounded-xl ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Variance Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="variance"
                  className={isDarkMode ? "text-gray-200" : "text-gray-900"}
                >
                  واریانس (σ²)
                </Label>
                <Input
                  id="variance"
                  type="number"
                  step="0.1"
                  value={variance}
                  onChange={(e) => setVariance(e.target.value)}
                  className={`rounded-lg ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>

              {/* Number of Samples Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="nSamples"
                  className={isDarkMode ? "text-gray-200" : "text-gray-900"}
                >
                  تعداد نمونه‌ها (n)
                </Label>
                <Input
                  id="nSamples"
                  type="number"
                  step="1"
                  value={nSamples}
                  onChange={(e) => setNSamples(e.target.value)}
                  className={`rounded-lg ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>

              {/* Phi_1 Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="phi1"
                  className={isDarkMode ? "text-gray-200" : "text-gray-900"}
                >
                  ضریب φ₁
                </Label>
                <Input
                  id="phi1"
                  type="number"
                  step="0.1"
                  value={phi1}
                  onChange={(e) => setPhi1(e.target.value)}
                  className={`rounded-lg ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`rounded-lg px-8 py-2 ${
                  isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white`}
              >
                {isGenerating ? "در حال تولید..." : "تولید سری زمانی"}
              </Button>
            </div>
          </Card>

          {/* Chart Display */}
          {generatedData && (
            <div className="space-y-4">
              <h2
                className={`text-2xl font-bold text-center ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                سری زمانی تولید شده
              </h2>
              <TimeSeriesChart
                data={generatedData}
                results={null}
                isDarkMode={isDarkMode}
              />

              {/* Statistics Card */}
              <Card
                className={`p-6 rounded-xl ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <h3
                  className={`text-lg font-bold mb-4 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  پارامترهای استفاده شده
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      واریانس
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {variance}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      تعداد نمونه‌ها
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {nSamples}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      ضریب φ₁
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {phi1}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      <footer
        className={`
          border-t mt-24 transition-colors duration-200
          ${
            isDarkMode
              ? "border-gray-800 bg-gray-900"
              : "border-gray-200 bg-white"
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-500" : "text-gray-500"
            }`}
          >
            MA(1) Generation - KNTU Time series analysis
          </p>
        </div>
      </footer>
    </div>
  );
}
