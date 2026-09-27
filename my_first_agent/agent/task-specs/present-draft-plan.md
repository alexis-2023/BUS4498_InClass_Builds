# Present Draft Plan Task Specification

## Basic Information

- **Task ID:** T8
- **Task name:** Present draft plan
- **Task type:** Act
- **Task owner:** Event planning system

## 1. Task Description

This task presents the completed draft event plan to the event organizer after the forecast has been determined to be reliable enough to continue. The draft includes the attendance estimate, supply recommendations, assumptions, confidence information, and important limitations so the organizer can review the plan before approving it or requesting revisions.

## 2. Inputs

### Input 1

- **Input name:** attendance_estimate
- **Contents and format:** The estimated event attendance, including the expected attendance value or range.
- **Source:** T4 Estimate likely attendance
- **If a required input is missing or invalid:** Record the missing estimate and route the case for manual review. Do not present an incomplete draft plan.

### Input 2

- **Input name:** supply_recommendations
- **Contents and format:** The structured supply recommendations for the event, including recommended quantities or ranges.
- **Source:** T5 Generate supply recommendations
- **If a required input is missing or invalid:** Record the missing recommendations and route the case for manual review rather than presenting an incomplete plan.

### Input 3

- **Input name:** forecast_explanation
- **Contents and format:** The assumptions, uncertainty, confidence, and important limitations associated with the forecast and recommendations.
- **Source:** T6 Explain assumptions and confidence
- **If a required input is missing or invalid:** Record that the supporting explanation is unavailable and route the case for manual review.

## 3. Outputs

### Output 1

- **Output name:** draft_plan
- **Contents and format:** A structured draft plan containing the attendance estimate, supply recommendations, assumptions, confidence information, and relevant limitations.
- **Next task or recipient:** Event organizer for approval decision D3.
- **Complete when:** The organizer can review the complete draft plan and decide whether to approve it or request revisions.

## 4. Planned Tools

### Tool 1

- **Tool name:** present_draft_plan
- **Input:** attendance_estimate, supply_recommendations, and forecast_explanation
- **Output:** draft_plan
- **Implementation Route:** application display or report-generation function
- **Integration approach:** direct integration
- **Role in this task:** Combine the completed planning information into a clear draft plan and present it to the event organizer for review.
- **Task timeout:** 15 seconds
- **Maximum retries:** 1
- **Retry only when:** A temporary display, report-generation, or connection error occurs and the system can confirm that the draft was not already presented successfully.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record that the draft could not be presented and hand the case to the event organizer or support role for manual follow-up. Do not treat the plan as reviewed or approved.
