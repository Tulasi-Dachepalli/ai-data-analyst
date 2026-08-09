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

if __name__ == "__main__":
    unittest.main()
