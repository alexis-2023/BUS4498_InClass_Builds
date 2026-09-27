# Generate Supply Recommendations Task Specification

## Basic Information

- **Task ID:** T5
- **Task name:** Generate supply recommendations
- **Task type:** Reason
- **Task owner:** Event planning system

## 1. Task Description

This task uses the estimated attendance and available event information to generate recommended supply quantities for the event. The recommendations may include items such as food, drinks, and swag within the approved planning scope. The task produces a structured recommendation set that can be explained and evaluated in the next step of the workflow.

## 2. Inputs

### Input 1

- **Input name:** attendance_estimate
- **Contents and format:** The estimated event attendance produced by the attendance-estimation task, including the expected attendance value or range.
- **Source:** T4 Estimate likely attendance
- **If a required input is missing or invalid:** Record that the attendance estimate is unavailable and route the case for manual review. Do not generate supply recommendations without a usable attendance estimate.

### Input 2

- **Input name:** event_details
- **Contents and format:** The validated event information needed to support supply planning, including relevant event characteristics and approved aggregate planning information.
- **Source:** T2 Validate inputs
- **If a required input is missing or invalid:** Record the missing information and route the case for manual review rather than producing unsupported recommendations.

## 3. Outputs

### Output 1

- **Output name:** supply_recommendations
- **Contents and format:** A structured set of recommended supply quantities or ranges for the event, such as food, drinks, and swag, based on the estimated attendance and available event information.
- **Next task or recipient:** T6 Explain assumptions and confidence
- **Complete when:** A complete set of supply recommendations has been generated and is available for explanation and confidence assessment.

## 4. Planned Tools

### Tool 1

- **Tool name:** calculate_supply_recommendations
- **Input:** attendance_estimate and event_details
- **Output:** supply_recommendations
- **Implementation Route:** application calculation or recommendation function
- **Integration approach:** direct integration
- **Role in this task:** Use the attendance estimate and validated event information to calculate recommended supply quantities within the approved planning scope.
- **Task timeout:** 15 seconds
- **Maximum retries:** 0
- **Retry only when:** Not applicable because repeating the same calculation with unchanged inputs would not produce new information.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record that the supply recommendations could not be produced and route the case for manual review. Do not continue as if valid recommendations were generated.
