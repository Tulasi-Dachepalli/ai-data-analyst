from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ColumnProfile(BaseModel):
    name: str
    dtype: str
    nulls: int
    unique_count: int
    mean: Optional[float] = None
    median: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    outlier_count: int

class ProfileResponse(BaseModel):
    rows: int
    columns: int
    duplicate_rows: int
    missing_cells: int
    missing_percentage: float
    quality_score: float
    columns_info: List[ColumnProfile]
    rows_data: List[dict]
    columns_list: List[str]

class CleanRequest(BaseModel):
    rows: List[Dict[str, Any]]
    columns: List[str]

class CleanChanges(BaseModel):
    duplicates_removed: int
    missing_values_filled: int
    whitespace_normalized: int
    empty_columns_removed: int
    constant_columns_removed: int

class CleanResponse(BaseModel):
    success: bool
    original_rows: int
    cleaned_rows: int
    original_columns: int
    cleaned_columns: int
    changes: CleanChanges
    cleaned_data: List[Dict[str, Any]]
    columns_list: List[str]

class SingleChart(BaseModel):
    type: str
    title: str
    xAxis: str
    yAxis: str
    data: List[Dict[str, Any]]

class EdaResponse(BaseModel):
    charts: List[SingleChart]

class NumericStatSummary(BaseModel):
    count: int
    missing: int
    unique: int
    mean: Optional[float] = None
    median: Optional[float] = None
    mode: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    range: Optional[float] = None
    variance: Optional[float] = None
    std: Optional[float] = None
    q1: Optional[float] = None
    q2: Optional[float] = None
    q3: Optional[float] = None
    iqr: Optional[float] = None
    skewness: Optional[float] = None
    kurtosis: Optional[float] = None
    outlier_count: int

class CategoricalFrequency(BaseModel):
    value: str
    count: int
    percentage: float

class CategoricalStatSummary(BaseModel):
    unique: int
    missing: int
    most_frequent: Optional[str] = None
    frequencies: List[CategoricalFrequency]

from pydantic import Field

class CorrelationRelationship(BaseModel):
    column: str
    with_col: str = Field(..., alias="with")
    value: float
    strength: str
    direction: str

    class Config:
        allow_population_by_field_name = True
        populate_by_name = True

class CorrelationSummary(BaseModel):
    columns: List[str]
    matrix: List[List[float]]
    relationships: List[CorrelationRelationship]

class StatisticsResponse(BaseModel):
    row_count: int
    column_count: int
    numeric_count: int
    categorical_count: int
    datetime_count: int
    numeric_stats: Dict[str, NumericStatSummary]
    categorical_stats: Dict[str, CategoricalStatSummary]
    correlation: CorrelationSummary

class CandidateRecommendation(BaseModel):
    column: str
    confidence: float

class ClusteringRecommendation(BaseModel):
    available: bool
    numeric_features: List[str]
    reason: str

class MlAnalyzeResponse(BaseModel):
    classification_candidates: List[CandidateRecommendation]
    regression_candidates: List[CandidateRecommendation]
    clustering: ClusteringRecommendation

class MlTrainRequest(BaseModel):
    rows: List[Dict[str, Any]]
    columns: List[str]
    task_type: str
    target: Optional[str] = None
    features: List[str]
    model_id: int
    test_size: float = 0.2
    cv_folds: int = 5

class MlTrainResponse(BaseModel):
    success: bool
    model_id: int
    task_type: str
    best_model: str
    recommendation_reason: str
    comparisons: Dict[str, Dict[str, Any]]
    cluster_sizes: Dict[str, int]
    feature_importances: List[Dict[str, Any]]
    training_rows: int
    best_k: Optional[int] = None

class MlPredictRequest(BaseModel):
    model_id: int
    rows: List[Dict[str, Any]]

class MlPredictResponse(BaseModel):
    model_id: int
    predictions: List[Any]

class ForecastAnalyzeRequest(BaseModel):
    columns: List[str]
    rows: List[Dict[str, Any]]

class FrequencyDetails(BaseModel):
    frequency: str
    confidence: float
    median_interval_days: float
    irregularity: float
    warning: Optional[str] = None

class SeasonalityDetails(BaseModel):
    seasonality_detected: bool
    seasonal_period: Optional[int] = None
    strength: float
    reason: str

class ForecastAnalyzeResponse(BaseModel):
    forecastable: bool
    confidence: float
    date_column: Optional[str] = None
    target_column: Optional[str] = None
    frequency: Optional[str] = None
    observations: Optional[int] = None
    frequency_details: Optional[FrequencyDetails] = None
    seasonality_details: Optional[SeasonalityDetails] = None
    reason: Optional[str] = None

class ForecastTrainRequest(BaseModel):
    rows: List[Dict[str, Any]]
    columns: List[str]
    date_column: str
    target_column: str
    frequency: str
    horizon: int
    model_id: int

class ForecastPoint(BaseModel):
    date: str
    predicted: float
    lower: float
    upper: float

class HistoricalPoint(BaseModel):
    date: str
    actual: float

class PreprocessingMetadata(BaseModel):
    missing_periods: int
    largest_gap: int
    interpolation_used: bool
    warning: Optional[str] = None
    frequency_used: str
    total_observations: int

class ForecastInsights(BaseModel):
    trend: str
    expected_growth: float
    uncertainty: str
    seasonal_period: Optional[int] = None

class ForecastTrainResponse(BaseModel):
    success: bool
    model_id: int
    algorithm: str
    frequency: str
    metrics: Dict[str, Any]
    comparisons: Dict[str, Dict[str, Any]]
    historical: List[HistoricalPoint]
    forecast: List[ForecastPoint]
    preprocessing_metadata: PreprocessingMetadata
    insights: ForecastInsights
    training_rows: int
    validation_rows: int
    training_start: str
    training_end: str

class AnomalyItem(BaseModel):
    type: str # "outlier" | "spike" | "drop"
    column: str
    row_index: Optional[int] = None
    date: Optional[str] = None
    value: Optional[float] = None
    previous_value: Optional[float] = None
    current_value: Optional[float] = None
    change_percent: Optional[float] = None
    method: str
    severity: str # "high" | "medium" | "low"

class RelationshipItem(BaseModel):
    column_a: str
    column_b: str
    correlation: float
    strength: str # "Very Strong" | "Strong" | "Moderate" | "Weak" | "Very Weak"
    direction: str # "Positive" | "Negative" | "Neutral"
    interpretation: str
    causation_claim: bool = False
    sample_size: int

class KpiItem(BaseModel):
    column: str
    semantic_type: str
    confidence: float
    metric_label: str
    value: float
    formatted_value: str

class RecommendationItem(BaseModel):
    recommendation: str # "DATA_CLEANING" | "AUTOML_CLASSIFICATION" | "AUTOML_REGRESSION" | "FORECASTING" | "EDA" | "CLUSTERING"
    priority: str # "high" | "medium" | "low"
    reason: str
    action: str
    why: List[str]

class TargetRecommendation(BaseModel):
    column: str
    confidence: float

class InsightRequest(BaseModel):
    rows: List[Dict[str, Any]]
    columns: List[str]
    profile: Dict[str, Any]
    statistics: Dict[str, Any]

class InsightsResponse(BaseModel):
    success: bool
    quality_score: float
    anomalies: List[AnomalyItem]
    relationships: List[RelationshipItem]
    kpis: List[KpiItem]
    recommendations: List[RecommendationItem]
    target_recommendations: List[TargetRecommendation]
    summary: str
    generated_at: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    question: str
    history: List[ChatMessage] = Field(default_factory=list)
    rows: List[Dict[str, Any]] = Field(default_factory=list)
    columns: List[str] = Field(default_factory=list)
    profile: Dict[str, Any] = Field(default_factory=dict)
    statistics: Dict[str, Any] = Field(default_factory=dict)

class ChatResponse(BaseModel):
    success: bool
    answer: str
    intent: str
    supporting_values: List[Dict[str, Any]] = Field(default_factory=list)
    relevant_columns: List[str] = Field(default_factory=list)
    confidence_score: float
    association_disclaimer: str
    dataset_context: Dict[str, Any] = Field(default_factory=dict)
