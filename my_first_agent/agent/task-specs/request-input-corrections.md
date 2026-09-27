# Request Input Corrections Task Specification

## Basic Information

- **Task ID:** T3
- **Task name:** Request input corrections
- **Task type:** Act
- **Task owner:** Event planning system

## 1. Task Description

This task informs the event organizer when required event information is missing, invalid, or incomplete. It uses the validation result from the previous task to identify what needs to be corrected and sends a clear correction request back to the organizer. The workflow then waits for corrected information before returning to validation.

## 2. Inputs

### Input 1

- **Input name:** validation_result
- **Contents and format:** A structured validation result identifying whether the event information is complete and valid and listing any missing or invalid fields.
- **Source:** T2 Validate inputs
- **If a required input is missing or invalid:** Record that the validation result is unavailable and hand the case to the event organizer for manual review. Do not send an unsupported correction request.

## 3. Outputs

### Output 1

- **Output name:** correction_request
- **Contents and format:** A message identifying the specific event information that is missing, invalid, or needs correction.
- **Next task or recipient:** Event organizer
- **Complete when:** The correction request has been delivered to the organizer and the workflow is waiting for corrected information to be resubmitted to T2 Validate inputs.

## 4. Planned Tools

### Tool 1

- **Tool name:** send_correction_request
- **Input:** validation_result
- **Output:** correction_request
- **Implementation Route:** application messaging or notification function
- **Integration approach:** direct integration
- **Role in this task:** Send the organizer a clear request identifying the event information that must be corrected before the workflow can continue.
- **Task timeout:** 15 seconds
- **Maximum retries:** 1
- **Retry only when:** A temporary delivery or connection error occurs and the system can first verify that the correction request was not already delivered.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the unresolved delivery status and hand the case to the event organizer or support role for manual follow-up. Do not send duplicate correction requests when delivery status is uncertain.
