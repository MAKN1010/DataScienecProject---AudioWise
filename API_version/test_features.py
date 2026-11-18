from feature_extractor import extract_feature_vector

X = extract_feature_vector("sample.wav")

print(X.shape)