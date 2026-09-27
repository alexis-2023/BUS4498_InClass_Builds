# Explain Assumptions and Confidence Task Specification

## Basic Information

- **Task ID:** T6
- **Task name:** Explain assumptions and confidence
- **Task type:** Reason
- **Task owner:** Event planning system

## 1. Task Description

This task explains the main assumptions, uncertainty, and confidence behind the attendance estimate and supply recommendations. It helps make the planning result understandable before the workflow decides whether the forecast is reliable enough to present to the organizer. The task does not change the forecast or recommendations; it explains the evidence and limitations behind them.

## 2. Inputs

### Input 1

- **Input name:** attendance_estimate
- **Contents and format:** The estimated event attendance, including the expected attendance value or range produced by the attendance-estimation task.
- **Source:** T4 Estimate likely attendance
- **If a required input is missing or invalid:** Record that the attendance estimate is unavailable and route the case for manual review. Do not create a confidence explanation without a usable estimate.

### Input 2

- **Input name:** supply_recommendations
- **Contents and format:** The structured supply recommendations produced for the event, including recommended quantities or ranges for items such as food, drinks, and swag.
- **Source:** T5 Generate supply recommendations
- **If a required input is missing or invalid:** Record that the supply recommendations are unavailable and route the case for manual review rather than producing an incomplete explanation.

## 3. Outputs

### Output 1

- **Output name:** forecast_explanation
- **Contents and format:** A structured explanation of the main assumptions, uncertainty, confidence level, and important limitations associated with the attendance estimate and supply recommendations.
- **Next task or recipient:** Decision D2, which determines whether the forecast is reliable enough to continue.
- **Complete when:** The forecast and recommendations have a clear explanation of their assumptions, uncertainty, confidence, and limitations.

## 4. Planned Tools

### Tool 1

- **Tool name:** generate_forecast_explanation
- **Input:** attendance_estimate and supply_recommendations
- **Output:** forecast_explanation
- **Implementation Route:** application reasoning or explanation function
- **Integration approach:** direct integration
- **Role in this task:** Explain the assumptions, uncertainty, confidence, and limitations behind the forecast and recommendations so the workflow can determine whether the result is reliable enough to continue.
- **Task timeout:** 15 seconds
- **Maximum retries:** 0
- **Retry only when:** Not applicable because repeating the same explanation with unchanged inputs would not resolve missing evidence or uncertainty.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record that the explanation could not be completed and route the case for manual review. Do not continue to the reliability decision as if the explanation had been completed successfully.
