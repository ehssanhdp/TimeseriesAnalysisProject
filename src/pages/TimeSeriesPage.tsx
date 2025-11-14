import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import FileUploadArea from "../components/FileUploadArea";
import AnalysisControls from "../components/AnalysisControls";
import ResultsDisplay from "../components/ResultsDisplay";
import TimeSeriesChart from "../components/TimeSeriesChart";
import { Button } from "../components/ui/button";
import type { TimeSeriesData, AnalysisResults } from "../utils/types";
import * as XLSX from "xlsx";

const API_BASE_URL = "http://localhost:5000/api";

interface ContextType {
  isDarkMode: boolean;
}

export default function TimeSeriesPage() {
  const { isDarkMode } = useOutletContext<ContextType>();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(
    null
  );
  const [analysisResults, setAnalysisResults] =
    useState<AnalysisResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [differencedData, setDifferencedData] = useState<TimeSeriesData | null>(
    null
  );
  const [differencedResults, setDifferencedResults] =
    useState<AnalysisResults | null>(null);
  const [isDifferencing, setIsDifferencing] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setAnalysisResults(null);
    setDifferencedData(null);
    setDifferencedResults(null);

    try {
      let csvContent: string;

      if (file.name.endsWith(".csv")) {
        csvContent = await file.text();
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        csvContent = XLSX.utils.sheet_to_csv(firstSheet);
      } else {
        throw new Error("فرمت فایل پشتیبانی نمی‌شود");
      }

      const response = await fetch(`${API_BASE_URL}/parse-csv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: csvContent }),
      });

      if (!response.ok) {
        throw new Error("خطا در پردازش فایل");
      }

      const parsedData: TimeSeriesData = await response.json();
      setTimeSeriesData(parsedData);
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("خطا در خواندن فایل. لطفاً فایل معتبر بارگذاری کنید.");
    }
  };

  const handleCalculate = async () => {
    if (!timeSeriesData) return;

    setIsCalculating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: timeSeriesData.values }),
      });

      if (!response.ok) {
        throw new Error("خطا در محاسبه");
      }

      const results: AnalysisResults = await response.json();

      try {
        const aiResponse = await fetch(`${API_BASE_URL}/ai-feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            autocorrelations: results.autocorrelations,
            trendCoefficient: results.trendCoefficient,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          results.aiFeedback = aiData.feedback;
        }
      } catch (aiError) {
        console.error("Error fetching AI feedback:", aiError);
      }

      setAnalysisResults(results);
    } catch (error) {
      console.error("Error analyzing data:", error);
      alert("خطا در محاسبه. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleDifference = async () => {
    if (!timeSeriesData) return;

    setIsDifferencing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/difference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: timeSeriesData.values,
          labels: timeSeriesData.labels,
        }),
      });

      if (!response.ok) {
        throw new Error("خطا در دیفرانسیل گیری");
      }

      const result = await response.json();
      setDifferencedData(result.data);
      setDifferencedResults(result.analysis);
    } catch (error) {
      console.error("Error differencing data:", error);
      alert("خطا در دیفرانسیل گیری. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsDifferencing(false);
    }
  };

  return (
    <>
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {!uploadedFile && (
            <FileUploadArea
              onFileUpload={handleFileUpload}
              isDarkMode={isDarkMode}
            />
          )}

          {uploadedFile && (
            <div
              className={`
              text-center p-4 rounded-lg
              ${isDarkMode ? "bg-gray-800/50" : "bg-gray-50"}
            `}
            >
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                فایل بارگذاری شده:{" "}
                <span
                  className={isDarkMode ? "text-gray-200" : "text-gray-900"}
                >
                  {uploadedFile.name}
                </span>
              </p>
              <button
                onClick={() => {
                  setUploadedFile(null);
                  setTimeSeriesData(null);
                  setAnalysisResults(null);
                  setDifferencedData(null);
                  setDifferencedResults(null);
                }}
                className={`text-sm mt-2 ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                } hover:underline`}
              >
                بارگذاری فایل جدید
              </button>
            </div>
          )}

          {timeSeriesData && (
            <TimeSeriesChart
              data={timeSeriesData}
              results={analysisResults}
              isDarkMode={isDarkMode}
            />
          )}

          {timeSeriesData && !analysisResults && (
            <AnalysisControls
              onCalculate={handleCalculate}
              isDarkMode={isDarkMode}
              isCalculating={isCalculating}
            />
          )}

          {analysisResults && (
            <>
              <ResultsDisplay
                results={analysisResults}
                isDarkMode={isDarkMode}
              />
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleCalculate}
                  variant="outline"
                  className={`
                    rounded-lg
                    ${
                      isDarkMode
                        ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  محاسبه مجدد
                </Button>
                <Button
                  onClick={handleDifference}
                  variant="outline"
                  disabled={isDifferencing}
                  className={`
                    rounded-lg
                    ${
                      isDarkMode
                        ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  {isDifferencing ? "در حال پردازش..." : "دیفرانسیل گیری"}
                </Button>
              </div>
            </>
          )}

          {differencedData && differencedResults && (
            <>
              <div
                className={`border-t pt-12 ${
                  isDarkMode ? "border-gray-800" : "border-gray-200"
                }`}
              >
                <h2
                  className={`text-2xl font-bold mb-6 text-center ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  داده‌های دیفرانسیل شده
                </h2>
                <TimeSeriesChart
                  data={differencedData}
                  results={differencedResults}
                  isDarkMode={isDarkMode}
                />
              </div>
              <ResultsDisplay
                results={differencedResults}
                isDarkMode={isDarkMode}
              />
            </>
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
            ابزارهای تحلیل بیشتر به زودی...
          </p>
        </div>
      </footer>
    </>
  );
}
