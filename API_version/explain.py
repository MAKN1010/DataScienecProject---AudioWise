def generate_explanation(probability):

    reasons = []

    if probability >= 0.8:

        reasons.append(
            "Synthetic voice characteristics detected"
        )

        reasons.append(
            "Unnatural frequency transitions found"
        )

        reasons.append(
            "Spectral artifacts typical of AI-generated audio"
        )

    elif probability >= 0.6:

        reasons.append(
            "Moderate synthetic voice patterns"
        )

        reasons.append(
            "Pitch variation differs from natural speech"
        )

    else:

        reasons.append(
            "Natural speech characteristics observed"
        )

        reasons.append(
            "Frequency distribution matches human speech"
        )

    return reasons