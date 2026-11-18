import joblib

model = joblib.load("models/SVM.pkl")
scaler = joblib.load("models/standard_scaler.joblib")

print("Model loaded:", type(model))
print("Scaler loaded:", type(scaler))
print("Features expected:", scaler.n_features_in_)