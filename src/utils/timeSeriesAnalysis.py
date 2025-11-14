# Time Series Analysis Utilities

from typing import TypedDict, List


class TimeSeriesData(TypedDict):
    values: List[float]
    labels: List[str]


class AutocorrelationResult(TypedDict):
    lag: int
    value: float


class AnalysisResults(TypedDict):
    autocorrelations: List[AutocorrelationResult]
    trendCoefficient: float
    hasTrend: bool


def mean(values: List[float]) -> float:
    """Calculate mean of an array"""
    return sum(values) / len(values) if len(values) > 0 else 0


def calculate_autocorrelation(data: List[float], lag: int) -> float:
    """Calculate autocorrelation for a given lag"""
    n = len(data)
    if lag >= n:
        return 0

    data_mean = mean(data)

    numerator = sum((data[i] - data_mean) *
                    (data[i + lag] - data_mean) for i in range(n - lag))
    denominator = sum((data[i] - data_mean) ** 2 for i in range(n))

    return numerator / denominator if denominator != 0 else 0


def calculate_trend_coefficient(data: List[float]) -> float:
    """Calculate trend coefficient (â) using linear regression"""
    n = len(data)
    indices = list(range(1, n + 1))

    mean_x = mean(indices)
    mean_y = mean(data)

    numerator = sum((indices[i] - mean_x) * (data[i] - mean_y)
                    for i in range(n))
    denominator = sum((indices[i] - mean_x) ** 2 for i in range(n))

    return numerator / denominator if denominator != 0 else 0


def analyze_time_series(data: List[float]) -> AnalysisResults:
    """Perform full time series analysis"""
    # Calculate autocorrelations for lags 1-5
    autocorrelations = [
        {"lag": i + 1, "value": calculate_autocorrelation(data, i + 1)}
        for i in range(10)
    ]

    # Calculate trend coefficient
    trend_coefficient = calculate_trend_coefficient(data)

    # Determine if there's a significant trend (threshold: abs(â) > 0.1)
    has_trend = abs(trend_coefficient) > 0.1

    return {
        "autocorrelations": autocorrelations,
        "trendCoefficient": trend_coefficient,
        "hasTrend": has_trend,
    }


def parse_csv(content: str) -> TimeSeriesData:
    """Parse CSV data"""
    lines = content.strip().split('\n')
    values: List[float] = []
    labels: List[str] = []

    # Skip header if it exists
    start_index = 1 if lines and not _is_numeric(lines[0].split(',')[0]) else 0

    for i in range(start_index, len(lines)):
        parts = lines[i].split(',')
        if len(parts) >= 2:
            labels.append(parts[0].strip())
            try:
                values.append(float(parts[1].strip()))
            except ValueError:
                continue
        elif len(parts) == 1:
            labels.append(str(i))
            try:
                values.append(float(parts[0].strip()))
            except ValueError:
                continue

    return {"values": values, "labels": labels}


def _is_numeric(s: str) -> bool:
    """Check if a string is numeric"""
    try:
        float(s.strip())
        return True
    except ValueError:
        return False


def calculate_difference(data: List[float]) -> List[float]:
    """Calculate first difference: Y_t = X_t - X_(t-1)"""
    if len(data) < 2:
        return []

    return [data[i] - data[i - 1] for i in range(1, len(data))]


def generate_ma1(n_samples: int, phi_1: float, variance: float) -> List[float]:
    """
    Generate MA(1) time series: X_t = phi_1 * Eps_(t-1) + Eps_t
    where Eps ~ N(0, variance)

    Args:
        n_samples: Number of samples to generate
        phi_1: MA(1) coefficient
        variance: Variance of the normal distribution

    Returns:
        List of generated MA(1) values
    """
    import random
    import math

    # Generate white noise samples: Eps ~ N(0, variance)
    std_dev = math.sqrt(variance)
    epsilon = [random.gauss(0, std_dev) for _ in range(n_samples + 1)]

    # Generate MA(1) process: X_t = phi_1 * Eps_(t-1) + Eps_t
    ma1_series = []
    for t in range(1, n_samples + 1):
        x_t = phi_1 * epsilon[t - 1] + epsilon[t]
        ma1_series.append(x_t)

    return ma1_series
