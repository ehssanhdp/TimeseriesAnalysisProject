"""
Flask API server for time series analysis
"""
from flask_cors import CORS
from flask import Flask, request, jsonify
import sys
from pathlib import Path
import numpy as np

# Add src/utils directory to path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir / 'src' / 'utils'))

app = Flask(__name__)
CORS(app)  # Enable CORS for React app

from timeSeriesAnalysis import (
    analyze_time_series,
    parse_csv,
    calculate_difference,
    generate_ma1,
    TimeSeriesData,
    AnalysisResults,
    estimate_ma_mme,
    estimate_ma_mse
)
from AI_engine import get_ai_feedback


# --------------------------------------------------
# Descriptive Statistics
# --------------------------------------------------
def calculate_descriptive_statistics(values):
    """
    Calculate basic descriptive statistics for time series data
    """
    data = np.array(values, dtype=float)

    return {
        "count": int(data.size),
        "mean": float(np.mean(data)),
        "variance": float(np.var(data, ddof=0))
    }


# --------------------------------------------------
# API Endpoints
# --------------------------------------------------
@app.route('/api/parse-csv', methods=['POST'])
def parse_csv_endpoint():
    try:
        data = request.get_json()
        content = data.get('content', '')

        if not content:
            return jsonify({'error': 'No content provided'}), 400

        result = parse_csv(content)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze', methods=['POST'])
def analyze_endpoint():
    try:
        data = request.get_json()
        values = data.get('values', [])

        if not values:
            return jsonify({'error': 'No values provided'}), 400

        analysis = analyze_time_series(values)
        descriptive_stats = calculate_descriptive_statistics(values)

        return jsonify({
            "analysis": analysis,
            "descriptiveStatistics": descriptive_stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/descriptive-stats', methods=['POST'])
def descriptive_stats_endpoint():
    """Standalone descriptive statistics report"""
    try:
        data = request.get_json()
        values = data.get('values', [])

        if not values:
            return jsonify({'error': 'No values provided'}), 400

        stats = calculate_descriptive_statistics(values)
        return jsonify({"descriptiveStatistics": stats})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ai-feedback', methods=['POST'])
def ai_feedback_endpoint():
    try:
        data = request.get_json()
        autocorrelations = data.get('autocorrelations', [])
        trend_coefficient = data.get('trendCoefficient', 0)

        if not autocorrelations:
            return jsonify({'error': 'No autocorrelations provided'}), 400

        feedback = get_ai_feedback(autocorrelations, trend_coefficient)
        return jsonify({'feedback': feedback})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/difference', methods=['POST'])
def difference_endpoint():
    try:
        data = request.get_json()
        values = data.get('values', [])
        labels = data.get('labels', [])

        if not values:
            return jsonify({'error': 'No values provided'}), 400

        differenced_values = calculate_difference(values)
        differenced_labels = labels[1:] if len(labels) > 1 else [
            str(i) for i in range(1, len(differenced_values) + 1)
        ]

        analysis_results = analyze_time_series(differenced_values)
        descriptive_stats = calculate_descriptive_statistics(differenced_values)

        return jsonify({
            'data': {
                'values': differenced_values,
                'labels': differenced_labels
            },
            'analysis': analysis_results,
            'descriptiveStatistics': descriptive_stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate-ma', methods=['POST'])
def generate_ma_endpoint():
    try:
        data = request.get_json()
        n_samples = data.get('nSamples', 100)
        phi_1 = data.get('phi1', 0.5)
        variance = data.get('variance', 1.0)

        if n_samples <= 0:
            return jsonify({'error': 'Number of samples must be positive'}), 400

        ma1_values = generate_ma1(n_samples, phi_1, variance)
        labels = [str(i + 1) for i in range(len(ma1_values))]

        descriptive_stats = calculate_descriptive_statistics(ma1_values)

        return jsonify({
            'values': ma1_values,
            'labels': labels,
            'descriptiveStatistics': descriptive_stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/estimate-ma-parameters', methods=['POST'])
def estimate_ma_parameters_endpoint():
    try:
        data = request.get_json()
        values = data.get('values', [])
        max_order = data.get('order', 3)

        if not values:
            return jsonify({'error': 'No values provided'}), 400

        if not isinstance(max_order, int) or max_order < 1:
            return jsonify({'error': 'Order must be a positive integer'}), 400

        mme_results = {
            f'ma{k}': estimate_ma_mme(values, order=k)
            for k in range(1, max_order + 1)
        }
        mse_results = {
            f'ma{k}': estimate_ma_mse(values, order=k)
            for k in range(1, max_order + 1)
        }

        return jsonify({
            'mme': mme_results,
            'mse': mse_results
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
