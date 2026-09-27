# Flag Manual Review Task Specification

## Basic Information

- **Task ID:** T7
- **Task name:** Flag manual review
- **Task type:** Act
- **Task owner:** Event planning system

## 1. Task Description

This task identifies cases where the attendance forecast or supply recommendations are not reliable enough to continue automatically. It creates a manual-review case so the event organizer can review the uncertainty, missing information, or conflicting evidence before making the planning decision. This task does not treat the forecast as successfully completed when the reliability threshold has not been met.

## 2. Inputs

### Input 1

- **Input name:** forecast_explanation
- **Contents and format:** The explanation of the assumptions, uncertainty, confidence, and limitations associated with the attendance estimate and supply recommendations.
- **Source:** T6 Explain assumptions and confidence
- **If a required input is missing or invalid:** Record that the reliability information is unavailable and route the case directly to the event organizer for manual review.

### Input 2

- **Input name:** unreliable_forecast_status
- **Contents and format:** A decision result indicating that the forecast is not reliable enough to continue automatically.
- **Source:** Decision D2
- **If a required input is missing or invalid:** Do not create a successful workflow result. Record the unresolved status and hand the case to the event organizer.

## 3. Outputs

### Output 1

- **Output name:** manual_review_case
- **Contents and format:** A structured review case containing the attendance estimate, supply recommendations, relevant assumptions, uncertainty, limitations, and the reason manual review is required.
- **Next task or recipient:** Event organizer
- **Complete when:** The manual-review case has been created and made available to the event organizer for review.

## 4. Planned Tools

### Tool 1

- **Tool name:** create_manual_review_case
- **Input:** forecast_explanation and unreliable_forecast_status
- **Output:** manual_review_case
- **Implementation Route:** application record creation and notification function
- **Integration approach:** direct integration
- **Role in this task:** Create a review case containing the information the event organizer needs to evaluate an unreliable or uncertain forecast.
- **Task timeout:** 15 seconds
- **Maximum retries:** 1
- **Retry only when:** A temporary connection or record-creation error occurs and the system can verify that the manual-review case was not already created.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the unresolved status and notify the event organizer or support role that the review case could not be confirmed. Do not create duplicate review cases and do not mark the workflow as successfully completed.
