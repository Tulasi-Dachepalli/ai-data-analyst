import { z } from "zod";

// Canonical Column Statistics Schema
export const ColumnStatSchema = z.object({
  name: z.string(),
  type: z.enum(["numeric", "categorical", "date", "text"]),
  count: z.number().optional(),
  missing: z.number().optional(),
  mean: z.union([z.number(), z.string()]).optional(),
  median: z.union([z.number(), z.string()]).optional(),
  min: z.union([z.number(), z.string()]).optional(),
  max: z.union([z.number(), z.string()]).optional(),
  std: z.union([z.number(), z.string()]).optional(),
  unique: z.number().optional(),
  top: z.array(z.object({
    value: z.union([z.string(), z.number()]),
    count: z.number()
  })).optional()
});

// Canonical Data Quality Schema
export const QualitySchema = z.object({
  score: z.number().min(0).max(100),
  totalCells: z.number().optional(),
  missingCells: z.number().optional(),
  duplicateRows: z.number().optional()
});

// Canonical Statistics Report Schema
export const StatisticsSchema = z.object({
  numeric_count: z.number().default(0),
  categorical_count: z.number().default(0),
  datetime_count: z.number().default(0),
  numeric_stats: z.record(z.object({
    mean: z.union([z.number(), z.string()]).optional(),
    median: z.union([z.number(), z.string()]).optional(),
    min: z.union([z.number(), z.string()]).optional(),
    max: z.union([z.number(), z.string()]).optional(),
    std: z.union([z.number(), z.string()]).optional(),
    skewness: z.union([z.number(), z.string()]).optional(),
    outlier_count: z.number().optional()
  })).default({}),
  categorical_stats: z.record(z.object({
    unique: z.number().optional(),
    frequencies: z.array(z.object({
      value: z.string(),
      count: z.number(),
      percentage: z.number().optional()
    })).default([])
  })).default({}),
  correlation: z.object({
    columns: z.array(z.string()).default([]),
    matrix: z.array(z.any()).default([])
  }).optional()
});

// Canonical EDA Schema
export const EDASchema = z.object({
  success: z.boolean().optional(),
  charts: z.array(z.object({
    title: z.string(),
    type: z.string(),
    xAxis: z.string().optional(),
    yAxis: z.string().optional(),
    data: z.array(z.record(z.any()))
  })).default([])
});

// Canonical ML Task Analysis Schema
export const MLAnalysisSchema = z.object({
  classification_candidates: z.array(z.string()).default([]),
  regression_candidates: z.array(z.string()).default([]),
  recommended_tasks: z.array(z.object({
    task_type: z.string(),
    target: z.string(),
    description: z.string().optional()
  })).default([])
});

// Canonical ML Training Result Schema
export const MLTrainingSchema = z.object({
  success: z.boolean().default(true),
  model_id: z.string(),
  task_type: z.string(),
  target: z.string(),
  best_model: z.string(),
  best_score: z.number().optional(),
  leaderboard: z.array(z.record(z.any())).default([]),
  feature_importance: z.array(z.object({
    feature: z.string(),
    importance: z.number()
  })).default([]),
  data_split: z.object({
    train_samples: z.number().optional(),
    test_samples: z.number().optional()
  }).optional()
});

// Canonical Forecast Task Analysis Schema
export const ForecastAnalysisSchema = z.object({
  forecastable: z.boolean().default(true),
  date_column: z.string().default(""),
  target_column: z.string().default(""),
  frequency: z.string().default("D"),
  frequency_details: z.object({
    recommended_horizon: z.number().optional(),
    detected_frequency: z.string().optional()
  }).optional()
});

// Canonical Forecast Training Result Schema
export const ForecastTrainingSchema = z.object({
  success: z.boolean().default(true),
  best_model: z.string().default("Prophet"),
  horizon: z.number().default(12),
  metrics: z.record(z.any()).optional(),
  leaderboard: z.array(z.record(z.any())).default([]),
  forecast: z.array(z.object({
    ds: z.string(),
    yhat: z.number(),
    yhat_lower: z.number().optional(),
    yhat_upper: z.number().optional()
  })).default([])
});

// Canonical AI Insights Schema
export const InsightsSchema = z.object({
  executive_summary: z.string().default(""),
  key_takeaways: z.array(z.string()).default([]),
  anomalies_detected: z.array(z.string()).default([]),
  actionable_recommendations: z.array(z.string()).default([])
});
