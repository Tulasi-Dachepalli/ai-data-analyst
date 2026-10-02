import unittest
import io
import os
import openpyxl
import pandas as pd
from fastapi.testclient import TestClient
from main import app

class TestDataScienceAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        
    def test_01_health_check(self):
        """Test GET /health check endpoint"""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["service"], "python-data-science")
        self.assertEqual(data["version"], "1.0.0")
        
    def test_02_csv_profile_success(self):
        """Test CSV profile with duplicates, missing values, and outliers"""
        csv_data = "A,B\n1,100\n2,200\n2,200\n,300\n5,10000\n"
        file = io.BytesIO(csv_data.encode("utf-8"))
        response = self.client.post(
            "/profile",
            files={"file": ("test_dataset.csv", file, "text/csv")}
        )
        self.assertEqual(response.status_code, 200)
        profile = response.json()
        
        # Verify shape
        self.assertEqual(profile["rows"], 5)
        self.assertEqual(profile["columns"], 2)
        
        # Verify duplicates: (2, 200) is duplicate
        self.assertEqual(profile["duplicate_rows"], 1)
        
        # Verify missing cells: A has one missing cell
        self.assertEqual(profile["missing_cells"], 1)
        
        # Verify columns info
        col_a = next(c for c in profile["columns_info"] if c["name"] == "A")
        col_b = next(c for c in profile["columns_info"] if c["name"] == "B")
        
        # Verify statistics on Col B
        self.assertEqual(col_b["nulls"], 0)
        self.assertEqual(col_b["min"], 100)
        self.assertEqual(col_b["max"], 10000)
        self.assertGreater(col_b["outlier_count"], 0)
        
        # Col A is numeric but has a missing value
        self.assertEqual(col_a["nulls"], 1)
        self.assertGreaterEqual(profile["quality_score"], 0)
        self.assertLessEqual(profile["quality_score"], 100)

    def test_03_categorical_columns_stats_isolation(self):
        """Test that categorical columns have mean/median/min/max/outliers set to None/0"""
        csv_data = "Name,Region\nAlice,North\nBob,South\nCharlie,North\n"
        file = io.BytesIO(csv_data.encode("utf-8"))
        response = self.client.post(
            "/profile",
            files={"file": ("test_cat.csv", file, "text/csv")}
        )
        self.assertEqual(response.status_code, 200)
        profile = response.json()
        
        self.assertEqual(profile["rows"], 3)
        self.assertEqual(profile["columns"], 2)
        
        for col in profile["columns_info"]:
            self.assertEqual(col["mean"], None)
            self.assertEqual(col["median"], None)
            self.assertEqual(col["min"], None)
            self.assertEqual(col["max"], None)
            self.assertEqual(col["outlier_count"], 0)
            self.assertEqual(col["unique_count"], 2 if col["name"] == "Region" else 3)

    def test_04_excel_profile_success(self):
        """Test Excel .xlsx profiling parse"""
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["Fruit", "Count"])
        ws.append(["Apple", 10])
        ws.append(["Banana", 15])
        ws.append(["Orange", 20])
        
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        
        response = self.client.post(
            "/profile",
            files={"file": ("fruits.xlsx", buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        self.assertEqual(response.status_code, 200)
        profile = response.json()
        
        self.assertEqual(profile["rows"], 3)
        self.assertEqual(profile["columns"], 2)
        
        col_count = next(c for c in profile["columns_info"] if c["name"] == "Count")
        self.assertEqual(col_count["min"], 10)
        self.assertEqual(col_count["max"], 20)
        self.assertEqual(col_count["mean"], 15)

    def test_05_unsupported_file_extension(self):
        """Test profile rejects unsupported file types with 400 error"""
        txt_data = "Hello World\nLine 2"
        file = io.BytesIO(txt_data.encode("utf-8"))
        response = self.client.post(
            "/profile",
            files={"file": ("test.txt", file, "text/plain")}
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("detail", data)

    def test_06_empty_file_handling(self):
        """Test profile handles empty uploaded files gracefully"""
        file = io.BytesIO(b"")
        response = self.client.post(
            "/profile",
            files={"file": ("empty.csv", file, "text/csv")}
        )
        self.assertEqual(response.status_code, 400)

    def test_07_clean_dataset_success(self):
        """Test POST /clean endpoint for whitespace, duplicates, nulls, and constant/empty columns"""
        payload = {
            "columns": ["Name", "Region", "Sales", "EmptyCol", "ConstantCol"],
            "rows": [
                {"Name": "  Hyderabad  ", "Region": "South", "Sales": 100, "EmptyCol": None, "ConstantCol": "India"},
                {"Name": "hyderabad", "Region": "North", "Sales": 200, "EmptyCol": None, "ConstantCol": "India"},
                {"Name": "hyderabad", "Region": "North", "Sales": 200, "EmptyCol": None, "ConstantCol": "India"},  # Duplicate
                {"Name": "Mumbai", "Region": None, "Sales": None, "EmptyCol": None, "ConstantCol": "India"},  # Nulls
            ]
        }
        response = self.client.post("/clean", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        
        self.assertTrue(res["success"])
        self.assertEqual(res["original_rows"], 4)
        self.assertEqual(res["cleaned_rows"], 3) # Duplicate dropped
        
        # Verify columns count: EmptyCol and ConstantCol should be dropped
        self.assertEqual(res["cleaned_columns"], 3)
        self.assertNotIn("EmptyCol", res["columns_list"])
        self.assertNotIn("ConstantCol", res["columns_list"])
        
        changes = res["changes"]
        self.assertEqual(changes["duplicates_removed"], 1)
        self.assertEqual(changes["empty_columns_removed"], 1)
        self.assertEqual(changes["constant_columns_removed"], 1)
        self.assertEqual(changes["whitespace_normalized"], 1) # "  Hyderabad  " to "Hyderabad"
        self.assertEqual(changes["missing_values_filled"], 2) # Sales null (filled with median=200), Region null (filled with mode="North")

        # Verify Mumbai row has filled values
        mumbai_row = next(r for r in res["cleaned_data"] if r["Name"] == "Mumbai")
        self.assertEqual(mumbai_row["Region"], "North") # Mode
        self.assertEqual(mumbai_row["Sales"], 200.0) # Median

    def test_08_profile_json_success(self):
        """Test POST /profile-json endpoint accepts JSON payload and profiles correctly"""
        payload = {
            "columns": ["A", "B"],
            "rows": [
                {"A": 10, "B": "North"},
                {"A": 20, "B": "South"},
                {"A": 30, "B": "North"}
            ]
        }
        response = self.client.post("/profile-json", json=payload)
        self.assertEqual(response.status_code, 200)
        profile = response.json()
        
        self.assertEqual(profile["rows"], 3)
        self.assertEqual(profile["columns"], 2)
        col_a = next(c for c in profile["columns_info"] if c["name"] == "A")
        self.assertEqual(col_a["mean"], 20.0)
        self.assertEqual(col_a["median"], 20.0)

    def test_09_eda_generation_success(self):
        """Test POST /eda endpoint generates dynamic charts from column dtypes"""
        payload = {
            "columns": ["Date", "Category", "Sales"],
            "rows": [
                {"Date": "2026-01-01", "Category": "Office", "Sales": 100},
                {"Date": "2026-01-02", "Category": "Furniture", "Sales": 200},
                {"Date": "2026-01-03", "Category": "Office", "Sales": 150}
            ]
        }
        response = self.client.post("/eda", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        
        self.assertIn("charts", res)
        self.assertGreater(len(res["charts"]), 0)
        
        # Verify first chart structure
        chart = res["charts"][0]
        self.assertIn("type", chart)
        self.assertIn("title", chart)
        self.assertIn("xAxis", chart)
        self.assertIn("yAxis", chart)
        self.assertIn("data", chart)
        self.assertGreater(len(chart["data"]), 0)

    def test_10_statistics_success(self):
        """Test POST /statistics returns descriptive stats, skewness, kurtosis, and symmetric correlation matrix"""
        payload = {
            "columns": ["A", "B", "C"],
            "rows": [
                {"A": 10, "B": "North", "C": 100},
                {"A": 20, "B": "South", "C": 200},
                {"A": 30, "B": "North", "C": 150}
            ]
        }
        response = self.client.post("/statistics", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        
        # Verify row and column metadata counts
        self.assertEqual(res["row_count"], 3)
        self.assertEqual(res["column_count"], 3)
        self.assertEqual(res["numeric_count"], 2)
        self.assertEqual(res["categorical_count"], 1)
        
        # Verify numeric stats
        self.assertIn("A", res["numeric_stats"])
        stat_a = res["numeric_stats"]["A"]
        self.assertEqual(stat_a["count"], 3)
        self.assertEqual(stat_a["mean"], 20.0)
        self.assertEqual(stat_a["median"], 20.0)
        self.assertIn("skewness", stat_a)
        self.assertIn("kurtosis", stat_a)
        
        # Verify categorical stats
        self.assertIn("B", res["categorical_stats"])
        stat_b = res["categorical_stats"]["B"]
        self.assertEqual(stat_b["unique"], 2)
        self.assertEqual(stat_b["most_frequent"], "North")
        self.assertEqual(len(stat_b["frequencies"]), 2)
        
        # Verify correlation structure
        corr = res["correlation"]
        self.assertIn("A", corr["columns"])
        self.assertIn("C", corr["columns"])
        
        # Verify diagonal elements are 1
        idx_a = corr["columns"].index("A")
        idx_c = corr["columns"].index("C")
        self.assertEqual(corr["matrix"][idx_a][idx_a], 1.0)
        self.assertEqual(corr["matrix"][idx_c][idx_c], 1.0)
        
        # Verify symmetry: correlation(A, C) == correlation(C, A)
        val_ac = corr["matrix"][idx_a][idx_c]
        val_ca = corr["matrix"][idx_c][idx_a]
        self.assertEqual(val_ac, val_ca)

    def test_11_statistics_empty_dataset(self):
        """Test POST /statistics returns 400 for empty rows"""
        payload = {
            "columns": ["A"],
            "rows": []
        }
        response = self.client.post("/statistics", json=payload)
        self.assertEqual(response.status_code, 400)

    def test_12_ml_analyze(self):
        """Test task detector classifies classification vs regression candidates"""
        payload = {
            "columns": ["A", "B", "C", "D"],
            "rows": [
                {"A": 10, "B": "North", "C": 100.5, "D": "2026-08-08"},
                {"A": 20, "B": "South", "C": 200.7, "D": "2026-08-09"},
                {"A": 10, "B": "North", "C": 150.3, "D": "2026-08-10"},
                {"A": 20, "B": "East", "C": 250.2, "D": "2026-08-11"},
                {"A": 10, "B": "West", "C": 300.9, "D": "2026-08-12"},
                {"A": 20, "B": "North", "C": 350.4, "D": "2026-08-13"}
            ]
        }
        response = self.client.post("/ml/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        
        # A should be a classification candidate due to low integer cardinality
        class_cols = [c["column"] for c in res["classification_candidates"]]
        self.assertIn("A", class_cols)
        
        # C should be a regression candidate (numeric float, high cardinality)
        reg_cols = [r["column"] for r in res["regression_candidates"]]
        self.assertIn("C", reg_cols)
        
        # Clustering should be available (multiple numeric columns A and C)
        self.assertTrue(res["clustering"]["available"])

    def test_13_ml_train_classification(self):
        """Test classification training, cross validation, and model recommendations"""
        rows = [
            {"target": "Yes", "income": 50000, "age": 25},
            {"target": "No", "income": 60000, "age": 30},
            {"target": "Yes", "income": 45000, "age": 22},
            {"target": "No", "income": 70000, "age": 35},
            {"target": "Yes", "income": 80000, "age": 40},
            {"target": "No", "income": 90000, "age": 45}
        ]
        payload = {
            "rows": rows,
            "columns": ["target", "income", "age"],
            "task_type": "classification",
            "target": "target",
            "features": ["income", "age"],
            "model_id": 9991,
            "test_size": 0.3,
            "cv_folds": 2
        }
        response = self.client.post("/ml/train", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        
        self.assertTrue(res["success"])
        self.assertEqual(res["model_id"], 9991)
        self.assertEqual(res["task_type"], "classification")
        self.assertIn(res["best_model"], ["Random Forest", "Logistic Regression"])
        self.assertIn("Random Forest", res["comparisons"])
        self.assertIn("accuracy", res["comparisons"]["Random Forest"])
        self.assertIn("f1", res["comparisons"]["Random Forest"])
        self.assertIn("cv_f1", res["comparisons"]["Random Forest"])
        self.assertGreater(len(res["feature_importances"]), 0)

    def test_14_ml_train_regression(self):
        """Test regression model metrics and outputs"""
        rows = [
            {"target": 100.5, "income": 50000, "age": 25},
            {"target": 120.3, "income": 60000, "age": 30},
            {"target": 90.1, "income": 45000, "age": 22},
            {"target": 140.7, "income": 70000, "age": 35},
            {"target": 160.2, "income": 80000, "age": 40},
            {"target": 180.9, "income": 90000, "age": 45}
        ]
        payload = {
            "rows": rows,
            "columns": ["target", "income", "age"],
            "task_type": "regression",
            "target": "target",
            "features": ["income", "age"],
            "model_id": 9992,
            "test_size": 0.3,
            "cv_folds": 2
        }
        response = self.client.post("/ml/train", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        
        self.assertTrue(res["success"])
        self.assertEqual(res["task_type"], "regression")
        self.assertIn("mae", res["comparisons"]["Linear Regression"])
        self.assertIn("rmse", res["comparisons"]["Linear Regression"])
        self.assertIn("r2", res["comparisons"]["Linear Regression"])

    def test_15_ml_train_clustering(self):
        """Test clustering Silhouette optimization recommendations"""
        rows = [
            {"income": 50000, "age": 25},
            {"income": 60000, "age": 30},
            {"income": 45000, "age": 22},
            {"income": 70000, "age": 35},
            {"income": 80000, "age": 40}
        ]
        payload = {
            "rows": rows,
            "columns": ["income", "age"],
            "task_type": "clustering",
            "features": ["income", "age"],
            "model_id": 9993
        }
        response = self.client.post("/ml/train", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        
        self.assertTrue(res["success"])
        self.assertEqual(res["task_type"], "clustering")
        self.assertIn("best_k", res)
        self.assertIn("cluster_sizes", res)
        total_clusters_count = sum(res["cluster_sizes"].values())
        self.assertEqual(total_clusters_count, 5)

    def test_16_ml_predict(self):
        """Test predictions generation through loaded serialized model pipelines"""
        train_payload = {
            "rows": [
                {"target": 10.0, "x": 1},
                {"target": 20.0, "x": 2},
                {"target": 30.0, "x": 3},
                {"target": 40.0, "x": 4},
                {"target": 50.0, "x": 5}
            ],
            "columns": ["target", "x"],
            "task_type": "regression",
            "target": "target",
            "features": ["x"],
            "model_id": 9994,
            "test_size": 0.2,
            "cv_folds": 2
        }
        train_res = self.client.post("/ml/train", json=train_payload)
        self.assertEqual(train_res.status_code, 200)
        
        predict_payload = {
            "model_id": 9994,
            "rows": [
                {"x": 1.5},
                {"x": 2.5}
            ]
        }
        response = self.client.post("/ml/predict", json=predict_payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        
        self.assertEqual(res["model_id"], 9994)
        self.assertEqual(len(res["predictions"]), 2)
        self.assertIsInstance(res["predictions"][0], float)

    def test_17_ml_invalid_inputs(self):
        """Test ML safety error handlers for small datasets, missing columns, and empty values"""
        payload_empty = {
            "rows": [],
            "columns": ["x"],
            "task_type": "clustering",
            "features": ["x"],
            "model_id": 9995
        }
        r1 = self.client.post("/ml/train", json=payload_empty)
        self.assertEqual(r1.status_code, 400)
        
        payload_few = {
            "rows": [{"x": 1}, {"x": 2}],
            "columns": ["x"],
            "task_type": "clustering",
            "features": ["x"],
            "model_id": 9996
        }
        r2 = self.client.post("/ml/train", json=payload_few)
        self.assertEqual(r2.status_code, 400)

    def test_18_forecast_analyze(self):
        """Test suitability checking of date/target/freq detection"""
        payload = {
            "columns": ["date", "revenue"],
            "rows": [
                {"date": "2026-01-01", "revenue": 100},
                {"date": "2026-02-01", "revenue": 120},
                {"date": "2026-03-01", "revenue": 110},
                {"date": "2026-04-01", "revenue": 130},
                {"date": "2026-05-01", "revenue": 125},
                {"date": "2026-06-01", "revenue": 140}
            ]
        }
        res = self.client.post("/forecast/analyze", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["forecastable"])
        self.assertEqual(data["date_column"], "date")
        self.assertEqual(data["target_column"], "revenue")
        self.assertEqual(data["frequency"], "monthly")
        
    def test_19_forecast_train_and_predict(self):
        """Test Naive, MA, ARIMA pipeline fitting and future projections"""
        payload = {
            "columns": ["date", "revenue"],
            "rows": [
                {"date": "2026-01-01", "revenue": 100},
                {"date": "2026-02-01", "revenue": 120},
                {"date": "2026-03-01", "revenue": 110},
                {"date": "2026-04-01", "revenue": 130},
                {"date": "2026-05-01", "revenue": 125},
                {"date": "2026-06-01", "revenue": 140},
                {"date": "2026-07-01", "revenue": 150},
                {"date": "2026-08-01", "revenue": 160}
            ],
            "date_column": "date",
            "target_column": "revenue",
            "frequency": "monthly",
            "horizon": 3,
            "model_id": 7777
        }
        res = self.client.post("/forecast/train", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["model_id"], 7777)
        self.assertIn(data["algorithm"], ["Naive", "Moving Average", "ARIMA", "SARIMA"])
        self.assertEqual(len(data["forecast"]), 3)
        self.assertIn("lower", data["forecast"][0])
        self.assertIn("upper", data["forecast"][0])
        self.assertIn("predicted", data["forecast"][0])
        
    def test_20_forecast_safety_invalid_inputs(self):
        """Test forecasting safety constraints for negative horizons and missing columns"""
        # 1. Negative horizon check
        payload_neg = {
            "columns": ["date", "revenue"],
            "rows": [{"date": "2026-01-01", "revenue": 100}],
            "date_column": "date",
            "target_column": "revenue",
            "frequency": "monthly",
            "horizon": -2,
            "model_id": 7778
        }
        res1 = self.client.post("/forecast/train", json=payload_neg)
        self.assertEqual(res1.status_code, 400)
        
        # 2. Missing columns check
        payload_missing = {
            "columns": ["date", "revenue"],
            "rows": [{"date": "2026-01-01", "revenue": 100}],
            "date_column": "nonexistent",
            "target_column": "revenue",
            "frequency": "monthly",
            "horizon": 2,
            "model_id": 7779
        }
        res2 = self.client.post("/forecast/train", json=payload_missing)
        self.assertEqual(res2.status_code, 400)
        
    def test_21_forecasting_metrics_edge_cases(self):
        """Test MAPE zeros bypass and sMAPE safety limits"""
        from forecasting.evaluation import calculate_forecasting_metrics
        # Actual contains a zero
        actual = [0, 100, 200]
        predicted = [10, 110, 190]
        metrics = calculate_forecasting_metrics(actual, predicted)
        self.assertIsNone(metrics["mape"])
        self.assertFalse(metrics["mape_valid"])
        self.assertGreater(metrics["smape"], 0)
        
        # Actual has no zeros
        actual_no_zero = [50, 100, 200]
        metrics_no_zero = calculate_forecasting_metrics(actual_no_zero, predicted)
        self.assertIsNotNone(metrics_no_zero["mape"])
        self.assertTrue(metrics_no_zero["mape_valid"])
        
    def test_22_forecasting_gap_handling(self):
        """Test threshold differences for small gaps vs large missing gap warnings"""
        from forecasting.preprocessing import prepare_time_series
        df = pd.DataFrame([
            {"date": "2026-01-01", "revenue": 100},
            {"date": "2026-01-02", "revenue": 120},
            # Missing 2026-01-03, 2026-01-04, 2026-01-05 (largest gap of 3)
            {"date": "2026-01-06", "revenue": 150},
            {"date": "2026-01-07", "revenue": 160}
        ])
        series, meta = prepare_time_series(df, "date", "revenue", "daily")
        self.assertEqual(meta["missing_periods"], 3)
        self.assertEqual(meta["largest_gap"], 3)
        self.assertIsNone(meta["warning"]) # gap of 3 is small (<= 3)
        
        # Large gap (gap of 4)
        df_large = pd.DataFrame([
            {"date": "2026-01-01", "revenue": 100},
            {"date": "2026-01-02", "revenue": 120},
            # Missing 2026-01-03, 04, 05, 06 (largest gap of 4)
            {"date": "2026-01-07", "revenue": 150},
            {"date": "2026-01-08", "revenue": 160}
        ])
        series_large, meta_large = prepare_time_series(df_large, "date", "revenue", "daily")
        self.assertEqual(meta_large["largest_gap"], 4)
        self.assertIsNotNone(meta_large["warning"])

    def test_23_anomaly_detector_logic(self):
        """Test IQR outliers and step spike/drop chronological anomalies"""
        from insights.anomaly_detector import detect_anomalies
        df = pd.DataFrame([
            {"date": "2026-01-01", "revenue": 100},
            {"date": "2026-01-02", "revenue": 105},
            {"date": "2026-01-03", "revenue": 103},
            {"date": "2026-01-04", "revenue": 108},
            {"date": "2026-01-05", "revenue": 950}, # spike!
            {"date": "2026-01-06", "revenue": 110}
        ])
        profile = {
            "columns_info": [
                {"name": "revenue", "dtype": "float64", "outlier_count": 1},
                {"name": "date", "dtype": "object", "outlier_count": 0}
            ]
        }
        res = detect_anomalies(df, profile)
        self.assertGreater(len(res), 0)
        types = [a["type"] for a in res]
        self.assertIn("spike", types)
        
    def test_24_relationship_engine_logic(self):
        """Test correlation class strength boundaries and causation disclaimers"""
        from insights.relationship_engine import interpret_relationships
        stats = {
            "correlation": {
                "relationships": [
                    {"column": "revenue", "with_col": "units", "value": 0.91, "strength": "", "direction": ""}
                ]
            }
        }
        # Large sample
        res_large = interpret_relationships(stats, 1500)
        self.assertEqual(res_large[0]["strength"], "Very Strong")
        self.assertEqual(res_large[0]["direction"], "Positive")
        self.assertFalse(res_large[0]["causation_claim"])
        
        # Small sample confidence modifier
        res_small = interpret_relationships(stats, 15)
        self.assertIn("low confidence", res_small[0]["interpretation"])
        
    def test_25_business_metrics_kpi_alias(self):
        """Test semantic column alias matcher and KPIs calculators"""
        from insights.business_metrics import calculate_business_kpis, detect_semantic_columns
        cols = ["Net Revenue Amount", "Operating Profit Margin", "Total Transactions Count"]
        matched = detect_semantic_columns(cols)
        self.assertEqual(matched["Net Revenue Amount"][0], "revenue")
        self.assertEqual(matched["Operating Profit Margin"][0], "profit")
        self.assertEqual(matched["Total Transactions Count"][0], "orders")
        
        df = pd.DataFrame([
            {"Net Revenue Amount": 1000, "Operating Profit Margin": 200, "Total Transactions Count": 50},
            {"Net Revenue Amount": 1200, "Operating Profit Margin": 240, "Total Transactions Count": 60}
        ])
        kpis = calculate_business_kpis(df, cols)
        labels = [k["metric_label"] for k in kpis]
        self.assertIn("Total Revenue", labels)
        self.assertIn("Profit Margin", labels)
        self.assertIn("Average Order Value (AOV)", labels)
        
    def test_26_recommendation_logic(self):
        """Test prioritized action paths logic based on quality score and datetime columns"""
        from insights.recommendation_engine import generate_recommendations
        profile = {
            "quality_score": 45.0,
            "columns_info": [
                {"name": "revenue", "dtype": "float64", "unique_count": 50},
                {"name": "date", "dtype": "datetime64", "unique_count": 50}
            ]
        }
        recs, targets = generate_recommendations(profile, ["revenue", "date"])
        rec_actions = [r["recommendation"] for r in recs]
        self.assertIn("DATA_CLEANING", rec_actions)
        self.assertEqual(recs[0]["recommendation"], "DATA_CLEANING") # high priority first
        self.assertEqual(recs[0]["priority"], "high")
        self.assertIsNotNone(recs[0]["action"])
        
    def test_27_insights_http_endpoint(self):
        """Test insights POST API endpoint payloads validation and 10000 row limits"""
        # 1. Valid request
        payload = {
            "rows": [{"date": "2026-01-01", "revenue": 100}, {"date": "2026-01-02", "revenue": 120}],
            "columns": ["date", "revenue"],
            "profile": {
                "quality_score": 88.0,
                "columns_info": [{"name": "revenue", "dtype": "float64", "outlier_count": 0}]
            },
            "statistics": {
                "correlation": {"relationships": []}
            }
        }
        res = self.client.post("/insights", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("anomalies", data)
        self.assertIn("relationships", data)
        self.assertIn("summary", data)
        
        # 2. Empty validation check
        payload_empty = payload.copy()
        payload_empty["rows"] = []
        res_empty = self.client.post("/insights", json=payload_empty)
        self.assertEqual(res_empty.status_code, 400)

    def test_28_intent_classification_rules(self):
        """Test keyword intent classification routing rules"""
        from chat.nlq_engine import classify_query_intent
        self.assertEqual(classify_query_intent("Forecast sales next month"), "FORECASTING")
        self.assertEqual(classify_query_intent("Show me anomalies in units"), "ANOMALY_INVESTIGATION")
        self.assertEqual(classify_query_intent("Build an AutoML classifier"), "ML")
        self.assertEqual(classify_query_intent("Clean missing values from column"), "CLEANING_RECOMMENDATION")
        self.assertEqual(classify_query_intent("What is correlation of sales and cost"), "STATISTICS")
        self.assertEqual(classify_query_intent("Plot a histogram chart of age"), "EDA")
        self.assertEqual(classify_query_intent("top 5 highest categories"), "DESCRIPTIVE")
        self.assertEqual(classify_query_intent("What is the average price?"), "AGGREGATION")
        self.assertEqual(classify_query_intent("Tell me about the weather"), "GENERAL")

    def test_29_aggregation_calculations(self):
        """Test pandas groupby and mean aggregations inside nlp engine"""
        from chat.nlq_engine import run_chat_nlp_engine
        rows = [
            {"region": "North", "sales": 100},
            {"region": "North", "sales": 200},
            {"region": "South", "sales": 150}
        ]
        res = run_chat_nlp_engine(
            question="What is the average sales by region?",
            history=[],
            rows=rows,
            columns=["region", "sales"],
            profile={"quality_score": 100.0, "columns_info": []},
            statistics={"correlation": {"relationships": []}}
        )
        self.assertEqual(res["intent"], "AGGREGATION")
        self.assertIn("sales", res["relevant_columns"])
        self.assertIn("region", res["relevant_columns"])
        # North avg = 150
        vals = res["supporting_values"]
        self.assertEqual(len(vals), 2)
        self.assertEqual(vals[0]["sales"], 150)

    def test_30_top_n_sorting_calculation(self):
        """Test sorting and limiting rows for Descriptive intent queries"""
        from chat.nlq_engine import run_chat_nlp_engine
        rows = [
            {"product": "A", "sales": 10},
            {"product": "B", "sales": 50},
            {"product": "C", "sales": 30}
        ]
        res = run_chat_nlp_engine(
            question="top 2 products by sales",
            history=[],
            rows=rows,
            columns=["product", "sales"],
            profile={"quality_score": 100.0, "columns_info": []},
            statistics={"correlation": {"relationships": []}}
        )
        self.assertEqual(res["intent"], "DESCRIPTIVE")
        vals = res["supporting_values"]
        self.assertEqual(len(vals), 2)
        # B should be first (50)
        self.assertEqual(vals[0]["product"], "B")

    def test_31_column_soft_extraction(self):
        """Test soft-matching column aliases in user queries"""
        from chat.nlq_engine import extract_columns
        cols = ["Order Date", "Customer_ID", "SalesAmount"]
        self.assertEqual(extract_columns("average sales amount by customer id", cols), ["Customer_ID", "SalesAmount"])

    def test_32_unknown_column_graceful_fallback(self):
        """Test fallback behavior when no dataset columns match the question"""
        from chat.nlq_engine import run_chat_nlp_engine
        res = run_chat_nlp_engine(
            question="What is the average weight?",
            history=[],
            rows=[{"sales": 100}],
            columns=["sales"],
            profile={"quality_score": 100.0, "columns_info": []},
            statistics={"correlation": {"relationships": []}}
        )
        # Should gracefully fall back to general aggregation calculations
        self.assertEqual(res["intent"], "AGGREGATION")
        self.assertEqual(res["relevant_columns"], [])
        self.assertTrue(res["success"])

    def test_33_empty_dataset_boundary(self):
        """Test HTTP 400 response for empty dataset payloads"""
        payload = {
            "question": "average sales",
            "history": [],
            "rows": [], # empty!
            "columns": ["sales"],
            "profile": {"quality_score": 90.0, "columns_info": []},
            "statistics": {"correlation": {"relationships": []}}
        }
        res = self.client.post("/chat", json=payload)
        self.assertEqual(res.status_code, 400)

    def test_34_row_slicing_cap_10000(self):
        """Test that excessive row arrays are cap-sliced to 10,000 defensively"""
        from chat.nlq_engine import run_chat_nlp_engine
        rows = [{"sales": 10}] * 12000
        res = run_chat_nlp_engine(
            question="average sales",
            history=[],
            rows=rows,
            columns=["sales"],
            profile={"quality_score": 100.0, "columns_info": []},
            statistics={"correlation": {"relationships": []}}
        )
        self.assertEqual(res["dataset_context"]["rows_evaluated"], 10000)

    def test_35_malformed_request_validation(self):
        """Test HTTP 400 response for empty or missing question fields"""
        payload = {
            "question": "   ", # whitespace only
            "rows": [{"sales": 100}],
            "columns": ["sales"],
            "profile": {"quality_score": 90.0, "columns_info": []},
            "statistics": {"correlation": {"relationships": []}}
        }
        res = self.client.post("/chat", json=payload)
        self.assertEqual(res.status_code, 400)

    def test_36_disclaimer_rule_enforced(self):
        """Test disclaimer field inclusion and strict correlation interpretation"""
        from chat.nlq_engine import run_chat_nlp_engine
        res = run_chat_nlp_engine(
            question="does price cause sales?",
            history=[],
            rows=[{"price": 10, "sales": 20}],
            columns=["price", "sales"],
            profile={"quality_score": 100.0, "columns_info": []},
            statistics={"correlation": {"relationships": []}}
        )
        self.assertIsNotNone(res["association_disclaimer"])
        self.assertIn("Correlation does not imply causation", res["association_disclaimer"])

    def test_37_fastapi_chat_endpoint_response(self):
        """Test POST /chat routing, validation, and response schema mapping"""
        payload = {
            "question": "anomalies",
            "history": [{"role": "user", "content": "hello"}],
            "rows": [{"sales": 100}],
            "columns": ["sales"],
            "profile": {"quality_score": 95.0, "columns_info": []},
            "statistics": {"correlation": {"relationships": []}}
        }
        res = self.client.post("/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["intent"], "ANOMALY_INVESTIGATION")
        self.assertIn("answer", data)
        self.assertIn("supporting_values", data)
        self.assertIn("dataset_context", data)

    def test_38_concurrency_mutation_success_creates_version(self):
        """Test CONCURRENCY: First user mutation with expected v1 succeeds and creates v2"""
        self.client.post("/datasets/reset-state")
        payload = {
            "dataset_id": "ds_test_101",
            "expected_dataset_version": "v1",
            "operation": "deduplicate",
            "raw_hash": "sha256-canonical-abc123",
            "user_id": "user_a",
            "role": "data_analyst"
        }
        res = self.client.post("/datasets/mutate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["previous_version"], "v1")
        self.assertEqual(data["new_version"], "v2")
        self.assertEqual(data["raw_hash"], "sha256-canonical-abc123")

    def test_39_concurrency_conflict_returns_409(self):
        """Test CONCURRENCY: Second user with stale expected version v1 receives HTTP 409 Conflict"""
        payload = {
            "dataset_id": "ds_test_101",
            "expected_dataset_version": "v1", # Stale! current is v2
            "operation": "impute",
            "raw_hash": "sha256-canonical-abc123",
            "user_id": "user_b",
            "role": "data_analyst"
        }
        res = self.client.post("/datasets/mutate", json=payload)
        self.assertEqual(res.status_code, 409)
        err = res.json()["detail"]
        self.assertIn("Version conflict detected", err["error"])
        self.assertEqual(err["current_version"], "v2")
        self.assertEqual(err["expected_version"], "v1")

    def test_40_concurrency_sequential_mutation_advances_version(self):
        """Test CONCURRENCY: User B refreshes to v2 and succeeds, creating v3"""
        payload = {
            "dataset_id": "ds_test_101",
            "expected_dataset_version": "v2", # Fresh! matches current
            "operation": "impute",
            "raw_hash": "sha256-canonical-abc123",
            "user_id": "user_b",
            "role": "data_analyst"
        }
        res = self.client.post("/datasets/mutate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["new_version"], "v3")
        self.assertEqual(data["history_count"], 3)

    def test_41_concurrency_restore_creates_forward_branch(self):
        """Test CONCURRENCY: Restoring historical v1 creates v4 without altering v1/v2/v3"""
        payload = {
            "dataset_id": "ds_test_101",
            "expected_dataset_version": "v3",
            "operation": "restore",
            "restore_target_version": "v1",
            "raw_hash": "sha256-canonical-abc123",
            "user_id": "user_a",
            "role": "data_analyst"
        }
        res = self.client.post("/datasets/mutate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["new_version"], "v4")

    def test_42_concurrency_rbac_rejection(self):
        """Test CONCURRENCY: Unauthorized recruiter role receives HTTP 403 Forbidden"""
        payload = {
            "dataset_id": "ds_test_101",
            "expected_dataset_version": "v4",
            "operation": "filter",
            "raw_hash": "sha256-canonical-abc123",
            "user_id": "user_recruiter",
            "role": "recruiter"
        }
        res = self.client.post("/datasets/mutate", json=payload)
        self.assertEqual(res.status_code, 403)
        self.assertIn("Unauthorized", res.json()["detail"])

    def test_43_concurrency_cross_tenant_isolation_rejection(self):
        """Test CONCURRENCY: Cross-tenant mutation request receives HTTP 403 Forbidden"""
        payload = {
            "dataset_id": "ds_test_101",
            "expected_dataset_version": "v4",
            "operation": "filter",
            "raw_hash": "sha256-canonical-abc123",
            "user_id": "tenant_b_user",
            "role": "data_analyst",
            "company_id": "company_2",
            "target_tenant_id": "company_1"
        }
        res = self.client.post("/datasets/mutate", json=payload)
        self.assertEqual(res.status_code, 403)
        self.assertIn("Cross-tenant mutation rejected", res.json()["detail"])

    def test_44_concurrency_audit_trail_recorded(self):
        """Test CONCURRENCY: Audit endpoint retains history of both successful mutations and conflicts"""
        res = self.client.get("/datasets/audit-events")
        self.assertEqual(res.status_code, 200)
        events = res.json()["audit_events"]
        actions = [e["action"] for e in events]
        self.assertIn("MUTATION_APPLIED", actions)
        self.assertIn("MUTATION_CONFLICT", actions)
        self.assertIn("MUTATION_BLOCKED_RBAC", actions)
        self.assertIn("MUTATION_BLOCKED_TENANT_ISOLATION", actions)

    def test_45_streaming_session_init(self):
        """Test STREAMING: Initialize chunked upload session"""
        payload = {
            "upload_id": "sess_stream_01",
            "file_name": "large_sales.csv",
            "total_chunks": 2,
            "expected_size_bytes": 100000000
        }
        res = self.client.post("/streaming/init", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "session_initialized")
        self.assertEqual(data["upload_id"], "sess_stream_01")
        self.assertEqual(data["total_chunks"], 2)

    def test_46_streaming_chunk_upload_and_finalize(self):
        """Test STREAMING: Upload sequential chunks and finalize stream profiling"""
        # Chunk 0: Header and first 2 rows
        chunk_0_data = "transaction_id,amount,region\nTX_001,500.0,North\nTX_002,750.5,South\n"
        res_0 = self.client.post(
            "/streaming/chunk",
            data={"upload_id": "sess_stream_01", "chunk_index": 0},
            files={"chunk": ("chunk_0.csv", io.BytesIO(chunk_0_data.encode("utf-8")), "text/csv")}
        )
        self.assertEqual(res_0.status_code, 200)
        self.assertEqual(res_0.json()["received_chunks"], 1)

        # Chunk 1: Next 2 rows
        chunk_1_data = "TX_003,1200.0,East\nTX_004,310.25,West\n"
        res_1 = self.client.post(
            "/streaming/chunk",
            data={"upload_id": "sess_stream_01", "chunk_index": 1},
            files={"chunk": ("chunk_1.csv", io.BytesIO(chunk_1_data.encode("utf-8")), "text/csv")}
        )
        self.assertEqual(res_1.status_code, 200)
        self.assertEqual(res_1.json()["received_chunks"], 2)

        # Finalize session
        res_fin = self.client.post("/streaming/finalize", json={"upload_id": "sess_stream_01"})
        self.assertEqual(res_fin.status_code, 200)
        data = res_fin.json()
        self.assertTrue(data["success"])
        profile = data["profile"]
        self.assertEqual(profile["rows"], 4)
        self.assertEqual(profile["columns"], 3)
        self.assertTrue(profile["streaming_mode"])
        self.assertTrue(profile["raw_hash"].startswith("sha256-"))

    def test_47_streaming_out_of_order_chunk_rejected(self):
        """Test STREAMING: Out of order chunk is rejected with 400 Bad Request"""
        self.client.post("/streaming/init", json={
            "upload_id": "sess_stream_err",
            "file_name": "data.csv",
            "total_chunks": 3
        })
        # Sending chunk 1 before chunk 0
        res = self.client.post(
            "/streaming/chunk",
            data={"upload_id": "sess_stream_err", "chunk_index": 1},
            files={"chunk": ("c1.csv", io.BytesIO(b"data\n"), "text/csv")}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Out of order chunk", res.json()["detail"])

    def test_48_streaming_finalize_incomplete_rejected(self):
        """Test STREAMING: Finalize before all chunks uploaded is rejected"""
        res = self.client.post("/streaming/finalize", json={"upload_id": "sess_stream_err"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("Incomplete upload", res.json()["detail"])

    def test_49_streaming_memory_bounded_preview(self):
        """Test STREAMING: Dataset with 100 rows keeps memory bounded preview <= 50 rows"""
        self.client.post("/streaming/init", json={
            "upload_id": "sess_stream_large",
            "file_name": "stream_100.csv",
            "total_chunks": 1
        })
        # 100 rows CSV
        lines = ["id,val\n"] + [f"{i},{i*10}\n" for i in range(1, 101)]
        csv_bytes = "".join(lines).encode("utf-8")
        self.client.post(
            "/streaming/chunk",
            data={"upload_id": "sess_stream_large", "chunk_index": 0},
            files={"chunk": ("chunk_0.csv", io.BytesIO(csv_bytes), "text/csv")}
        )
        res = self.client.post("/streaming/finalize", json={"upload_id": "sess_stream_large"})
        self.assertEqual(res.status_code, 200)
        profile = res.json()["profile"]
        self.assertEqual(profile["rows"], 100)
        # Preview must be bounded to 50 items to protect browser heap
        self.assertLessEqual(len(profile["rows_data"]), 50)

    def test_50_streaming_sha256_canonical_hash_preservation(self):
        """Test STREAMING: Canonical SHA-256 hash encodes row count and column count"""
        self.client.post("/streaming/init", json={
            "upload_id": "sess_stream_hash",
            "file_name": "hash_check.csv",
            "total_chunks": 1
        })
        csv_bytes = b"col1,col2\nval1,val2\nval3,val4\n"
        self.client.post(
            "/streaming/chunk",
            data={"upload_id": "sess_stream_hash", "chunk_index": 0},
            files={"chunk": ("c0.csv", io.BytesIO(csv_bytes), "text/csv")}
        )
        res = self.client.post("/streaming/finalize", json={"upload_id": "sess_stream_hash"})
        self.assertEqual(res.status_code, 200)
        raw_hash = res.json()["profile"]["raw_hash"]
        self.assertTrue(raw_hash.startswith("sha256-"))
        self.assertTrue(raw_hash.endswith("2r2c"))

    def test_51_integrity_transactional_mutation_success(self):
        """Test INTEGRITY: Transactional mutation commits atomically and writes to PITR ledger"""
        self.client.post("/datasets/reset-state")
        self.client.post("/integrity/reset-ledger")
        payload = {
            "dataset_id": "ds_pitr_101",
            "expected_dataset_version": "v1",
            "operation": "normalize_columns",
            "raw_hash": "sha256-integrity-hash-999",
            "user_id": "analyst_alpha",
            "role": "data_analyst",
            "simulate_failure": False
        }
        res = self.client.post("/integrity/mutate-transactional", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertFalse(data["rolled_back"])
        self.assertEqual(data["previous_version"], "v1")
        self.assertEqual(data["new_version"], "v2")
        self.assertIn("ledger_id", data)

    def test_52_integrity_transactional_rollback_on_failure(self):
        """Test INTEGRITY: Simulated pipeline failure triggers atomic rollback with zero state mutation"""
        payload = {
            "dataset_id": "ds_pitr_101",
            "expected_dataset_version": "v2",
            "operation": "corrupting_step",
            "raw_hash": "sha256-integrity-hash-999",
            "user_id": "analyst_alpha",
            "role": "data_analyst",
            "simulate_failure": True,
            "failure_phase": "matrix_calculation"
        }
        res = self.client.post("/integrity/mutate-transactional", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["success"])
        self.assertTrue(data["rolled_back"])
        self.assertEqual(data["current_version"], "v2") # State unmutated!
        self.assertEqual(data["history_count"], 2) # History did not grow!
        self.assertIn("aborted and rolled back atomically", data["message"])

        # Check ledger records ROLLED_BACK
        ledger_res = self.client.get("/integrity/ledger/ds_pitr_101")
        entries = ledger_res.json()["ledger_entries"]
        rolled_back_entries = [e for e in entries if e["status"] == "ROLLED_BACK"]
        self.assertGreaterEqual(len(rolled_back_entries), 1)

    def test_53_integrity_transactional_conflict_409(self):
        """Test INTEGRITY: Version mismatch returns HTTP 409 Conflict within transactional boundary"""
        payload = {
            "dataset_id": "ds_pitr_101",
            "expected_dataset_version": "v1", # Outdated, current is v2
            "operation": "stale_step",
            "raw_hash": "sha256-integrity-hash-999",
            "user_id": "analyst_beta",
            "role": "data_analyst"
        }
        res = self.client.post("/integrity/mutate-transactional", json=payload)
        self.assertEqual(res.status_code, 409)

    def test_54_integrity_pitr_restore_to_point(self):
        """Test PITR: Point-in-time recovery reconstructs historical state and creates new v3"""
        # First commit v3 normally
        commit_payload = {
            "dataset_id": "ds_pitr_101",
            "expected_dataset_version": "v2",
            "operation": "feature_engineering",
            "raw_hash": "sha256-integrity-hash-999",
            "user_id": "analyst_alpha",
            "role": "data_analyst"
        }
        res_v3 = self.client.post("/integrity/mutate-transactional", json=commit_payload)
        self.assertEqual(res_v3.status_code, 200)
        self.assertEqual(res_v3.json()["new_version"], "v3")

        # Now execute PITR recovery to restore state back to v1
        restore_payload = {
            "dataset_id": "ds_pitr_101",
            "target_timestamp": "2020-01-01T00:00:00", # Timestamp in the past -> restores v1
            "user_id": "analyst_alpha",
            "role": "data_analyst"
        }
        res_pitr = self.client.post("/integrity/pitr-restore", json=restore_payload)
        self.assertEqual(res_pitr.status_code, 200)
        pitr_data = res_pitr.json()
        self.assertTrue(pitr_data["success"])
        self.assertEqual(pitr_data["restored_from_version"], "v1")
        self.assertEqual(pitr_data["new_version"], "v4") # Non-destructive forward advance!
        self.assertEqual(pitr_data["raw_hash"], "sha256-integrity-hash-999") # Hash preserved!
        self.assertEqual(pitr_data["history_count"], 4)

    def test_55_integrity_verification_deep_audit(self):
        """Test INTEGRITY: Full graph and cryptographic audit validates DAG continuity and SHA-256 hash"""
        res = self.client.get("/integrity/verify/ds_pitr_101")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["is_valid"])
        self.assertTrue(data["checks"]["raw_hash_immutability"])
        self.assertTrue(data["checks"]["sequence_continuity"])
        self.assertTrue(data["checks"]["head_matches_current"])
        self.assertTrue(data["checks"]["no_duplicate_versions"])
        self.assertEqual(data["orphaned_records"], 0)
        self.assertEqual(data["total_versions"], 4)

    def test_56_observability_apm_metrics(self):
        """Test OBSERVABILITY: APM latency percentiles and endpoint tracking"""
        res = self.client.get("/observability/metrics")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertGreater(data["total_requests"], 0)
        percentiles = data["latency_percentiles_ms"]
        self.assertIn("p50", percentiles)
        self.assertIn("p95", percentiles)
        self.assertIn("p99", percentiles)
        self.assertIn("avg", percentiles)

    def test_57_observability_siem_event_ingestion_and_export(self):
        """Test SIEM: Ingest structured ECS audit log and export with severity filtering"""
        self.client.post("/observability/reset")
        event_payload = {
            "event_category": "security",
            "event_action": "MUTATION_BLOCKED_TENANT_ISOLATION",
            "event_outcome": "failure",
            "severity": 80,
            "user_id": "unauthorized_user_99",
            "tenant_id": "company_malicious",
            "dataset_id": "ds_pitr_101",
            "dataset_version": "v1",
            "raw_hash": "sha256-integrity-hash-999",
            "details": {"attack_vector": "cross_tenant_manipulation"}
        }
        res_ingest = self.client.post("/observability/siem/ingest", json=event_payload)
        self.assertEqual(res_ingest.status_code, 200)
        self.assertTrue(res_ingest.json()["success"])

        # Query SIEM with min_severity filter
        res_export = self.client.get("/observability/siem/events?min_severity=50")
        self.assertEqual(res_export.status_code, 200)
        events = res_export.json()["events"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["event"]["severity"], 80)
        self.assertEqual(events[0]["event"]["action"], "MUTATION_BLOCKED_TENANT_ISOLATION")
        self.assertEqual(events[0]["ecs"]["version"], "8.11.0")

    def test_58_observability_siem_tenant_filtering(self):
        """Test SIEM: Multi-tenant export filters strictly by tenant organization"""
        # Ingest event for company_a and company_b
        self.client.post("/observability/siem/ingest", json={
            "event_category": "audit",
            "event_action": "EXPORT_TENANT_A",
            "user_id": "user_a",
            "tenant_id": "company_tenant_a"
        })
        self.client.post("/observability/siem/ingest", json={
            "event_category": "audit",
            "event_action": "EXPORT_TENANT_B",
            "user_id": "user_b",
            "tenant_id": "company_tenant_b"
        })

        res_a = self.client.get("/observability/siem/events?tenant_id=company_tenant_a")
        self.assertEqual(res_a.status_code, 200)
        events_a = res_a.json()["events"]
        self.assertTrue(all(e["organization"]["id"] == "company_tenant_a" for e in events_a))

    def test_59_observability_health_and_memory_bounded(self):
        """Test OBSERVABILITY: Health endpoint certifies memory safety and bounded limits"""
        res = self.client.get("/observability/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ok")
        self.assertTrue(data["memory_safe"])
        self.assertTrue(data["heap_bounded"])

    def test_60_stress_concurrency_race_condition(self):
        """Test STRESS: Simulating rapid concurrent mutations on the same version allows only 1 winner"""
        self.client.post("/datasets/reset-state")
        # Initialize ds_stress with v1
        self.client.post("/datasets/mutate", json={
            "dataset_id": "ds_stress_race",
            "expected_dataset_version": "v1",
            "operation": "setup",
            "raw_hash": "sha256-stress-hash",
            "user_id": "lead",
            "role": "data_analyst"
        })
        # Current version is now v2. Two concurrent workers both attempt to mutate from v2
        res1 = self.client.post("/datasets/mutate", json={
            "dataset_id": "ds_stress_race",
            "expected_dataset_version": "v2",
            "operation": "worker_1_op",
            "raw_hash": "sha256-stress-hash",
            "user_id": "worker_1",
            "role": "data_analyst"
        })
        res2 = self.client.post("/datasets/mutate", json={
            "dataset_id": "ds_stress_race",
            "expected_dataset_version": "v2",
            "operation": "worker_2_op",
            "raw_hash": "sha256-stress-hash",
            "user_id": "worker_2",
            "role": "data_analyst"
        })

        statuses = [res1.status_code, res2.status_code]
        self.assertIn(200, statuses) # Exactly one winner
        self.assertIn(409, statuses) # Exactly one conflict rejected

    def test_61_stress_cross_tenant_mutation_and_restore_penetration_blocked(self):
        """Test SECURITY PENETRATION: Cross-tenant barrier blocks unauthorized mutations and PITR restores"""
        # Mutation penetration test
        res_mut = self.client.post("/integrity/mutate-transactional", json={
            "dataset_id": "ds_tenant_restricted",
            "expected_dataset_version": "v1",
            "operation": "exfiltrate",
            "raw_hash": "sha256-secret-hash",
            "user_id": "attacker",
            "role": "data_analyst",
            "company_id": "attacker_corp",
            "target_tenant_id": "victim_corp"
        })
        self.assertEqual(res_mut.status_code, 403)

        # RBAC penetration test
        res_rbac = self.client.post("/integrity/pitr-restore", json={
            "dataset_id": "ds_tenant_restricted",
            "target_timestamp": "2026-09-27T12:00:00",
            "user_id": "guest_attacker",
            "role": "guest" # Unauthorized!
        })
        self.assertEqual(res_rbac.status_code, 403)

    def test_62_stress_high_throughput_streaming_integrity(self):
        """Test STRESS: Streaming session with sequential chunks maintains cryptographic checksum accuracy"""
        self.client.post("/streaming/init", json={
            "upload_id": "sess_stress_stream",
            "file_name": "stress_data.csv",
            "total_chunks": 3
        })
        for i in range(3):
            chunk_data = f"row_{i}_a,row_{i}_b\n" if i > 0 else "col_a,col_b\nrow_0_a,row_0_b\n"
            c_res = self.client.post(
                "/streaming/chunk",
                data={"upload_id": "sess_stress_stream", "chunk_index": i},
                files={"chunk": (f"c{i}.csv", io.BytesIO(chunk_data.encode("utf-8")), "text/csv")}
            )
            self.assertEqual(c_res.status_code, 200)

        finalize_res = self.client.post("/streaming/finalize", json={"upload_id": "sess_stress_stream"})
        self.assertEqual(finalize_res.status_code, 200)
        prof = finalize_res.json()["profile"]
        self.assertEqual(prof["rows"], 3)
        self.assertEqual(prof["columns"], 2)
        self.assertTrue(prof["raw_hash"].startswith("sha256-"))

if __name__ == "__main__":
    unittest.main()
