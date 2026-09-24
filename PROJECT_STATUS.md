## Current Stage
Atmospheric Transport Graph Layer completed. Added a PyTorch Geometric based Graph Neural Network (GNN) to explicitly model atmospheric advection. Evaluated the computational footprint via the benchmark module. Ready for downstream integration.

## Completed Work (Stages 0-5)
- **Frontend Audit:** Inspected and stabilized the existing Next.js 14 frontend.
- **Backend Setup:** Initialized the FastAPI backend structure at `services/api`.
- **Backend Foundation:** Configured Pydantic settings, structured logging, global exception handling, and dependency injection.
- **API Parity (Placeholders):** Implemented Pydantic schemas mirroring all frontend TypeScript types and created routing placeholders.
- **Mathematical Foundation (Stage 2):** Read the RainMind Formula Handbook and implemented the foundational NumPy-based mathematical operations inside `services/api/app/ml/`.
- **Spatial Grid Engine (Stage 3):** Built the standalone geospatial handler at `services/spatial/`. Implemented stable 135x129 grid ID generation (`G_i_j`), 3x3/5x5 neighbourhood lookup logic, synthetic land/ocean masking, and defined interfaces for real district/terrain boundaries. Generated the `india_0_25_base.json` metadata.
- **Data Layer (Stage 4):** Built the `xarray`-powered data ingestion system at `services/data/`. Implemented interfaces for NWP (GRIB/NetCDF), observations (CSV/Parquet), time/coordinate normalization, missing-value interpolation, quality control flags, and extracted stacked feature tensors (Dynamic, Static, Temporal). Included synthetic datasets for testing.
- **Baseline Corrections (Stage 5):** Built statistical correction benchmarks inside `services/ml/`. Implemented `RawNWPBaseline`, `ClimatologyBaseline`, `SimpleBiasCorrection`, and `EmpiricalQuantileMapping` using a standardized interface with parameter saving (`joblib`). Built a `MetricsEngine` calculating RMSE, MAE, Bias, POD, FAR, and CSI.
- **Regime Classification (Stage 6):** Built `services/ml/regime/` containing Unsupervised Discovery (HDBSCAN/GMM) and Supervised Hierarchical Classification (LightGBM). Features cascading independent Heads (Season, Synoptic, Local), rigorous temperature scaling calibration, and analytical entropy/confidence metrics for capturing atmospheric uncertainty.

## Stage Progression
- [x] **Stage 0:** Repository Audit
- [x] **Stage 1:** Backend Foundation (FastAPI Setup)
- [x] **Stage 2:** Mathematical Foundation (NumPy implementations of Handbook)
- [x] **Stage 3:** Spatial Grid Engine (135x129 India Grid)
- [x] **Stage 4:** Data Ingestion Pipeline
- [x] **Stage 5:** Statistical Baselines & Evaluation
- [x] **Stage 6:** Hierarchical Regime Classification
