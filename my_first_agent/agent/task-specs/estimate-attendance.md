# Estimate Attendance Task Specification

Create one copy of this template for each Level 3 task identified in class (For this in-class build practice, having one Level 3 task is sufficient).

Save each copy in `my_first_agent/agent/task-specs/`. Rename the file using the task name in lowercase, with hyphens between words. Replace `&` with `and` and remove other punctuation.

Examples:

- `Grade Item Condition` becomes `grade-item-condition.md`
- `Customer Dispute & Compensation Assessment` becomes `customer-dispute-and-compensation-assessment.md`

Keep the **exact** task ID and task name from `workflow-of-tasks.md` inside the file. Replace all bracketed prompts. Leave Section 3 empty; tool permissions and boundaries will be added next week. 

*Remove this sentence and the instructions above before your submission.*

```yaml
# BASIC INFORMATION
task_id: "T4"
task_name: "Estimate attendance"
task_owner: "Event planning agent"

# Agent Inference Configuration
Provider: Groq
Model: openai/gpt-oss-120b
Role: Estimate expected event attendance using the available event information and historical planning records, while identifying uncertainty that may require human review.
Maximum inference requests per task run: 6
On inference failure or exhausted limits: Record the unresolved status and hand the case to the event organizer for manual review.
```

## 1. Task Goal

- **Objective:** Produce a reasonable attendance estimate for the event using the available event details and relevant historical information so the organizer can make informed supply-planning decisions.

## 2. Inbound Inputs


### Input 1

- **Input name:** event_details
- **What it contains:** The event type, date, location, expected audience or participant information, and other event characteristics needed to support attendance estimation.
- **Source:** The preceding event-input validation task.

### Input 2

- **Input name:** historical_event_records
- **What it contains:** Relevant historical attendance records from similar events when those records are available.
- **Source:** The planning-record retrieval process or available historical event records.

*Copy the “Input” block for each additional input.*

## 3. Tool Permissions and Boundaries
The tools below define the capabilities the agent may use while completing the task. Each tool is limited to the specific role and boundaries described below. These are proposed implementation capabilities; no working scripts or integrations are required.
### Task-Wide Limits

- **Total task timeout:** 120 seconds, including tool calls, retries, inference requests, and waiting.
- **Maximum tool calls:** 10 total tool calls during one task run, including retries.
### Tool 1

- **Tool name:** retrieve_event_records
- **Input:** event_details
- **Output:** historical_event_records
- **Implementation Route:** database query
- **Integration approach:** direct integration
- **Role in this task:** Retrieve relevant historical attendance records from similar events to support the attendance estimate.
- **Task timeout:** 15 seconds
- **Maximum retries:** 1
- **Retry only when:** A temporary database connection error or timeout prevents retrieval. Do not retry when no relevant records exist.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record that historical records were unavailable. Continue without them only when the remaining event information is sufficient to produce a reasonable estimate; otherwise hand the case to the event organizer for manual review.

### Tool 2

- **Tool name:** record_attendance_estimate
- **Input:** attendance_estimate
- **Output:** recorded_attendance_estimate
- **Implementation Route:** database record update
- **Integration approach:** direct integration
- **Role in this task:** Record the completed attendance estimate and supporting confidence information so the next workflow task can use the result.
- **Task timeout:** 15 seconds
- **Maximum retries:** 1
- **Retry only when:** A temporary connection failure occurs and the system can first verify that the attendance estimate was not already recorded.
- **On timeout, exhausted retries, or an error that cannot be retried:** Check whether the attendance estimate was already saved before making another write attempt. If the save status remains uncertain, record the unresolved state and hand the case to the event organizer. Do not create a duplicate estimate.
## 4. How the Agent Should Reason
### Permitted Subtask 1

- **Subtask name:** examine_event_information
- **Subtask description:** Review the validated event details and identify the information most relevant to estimating attendance.
- **Subtask boundary:** The agent may interpret the provided event information but may not invent missing event details or change organizer-provided information.
- **Retry limits:** 0 retries because this is an internal reasoning step.
### Permitted Subtask 2

- **Subtask name:** compare_historical_records
- **Subtask description:** Compare available historical event records with the current event to identify useful attendance patterns or comparable events.
- **Subtask boundary:** The agent may use only available relevant historical records and may not assume that historical attendance automatically represents the current event.
- **Retry limits:** 1 attempt to retrieve usable records. If no relevant records are available, the agent must determine whether the remaining evidence is sufficient or whether human review is required.
### Permitted Subtask 3

- **Subtask name:** assess_estimate_confidence
- **Subtask description:** Evaluate whether the available evidence supports a usable attendance estimate and identify important uncertainty.
- **Subtask boundary:** The agent may assess confidence based on available evidence but may not present an unsupported estimate as reliable.
- **Retry limits:** 0 retries because repeating the same reasoning without new evidence would not reduce uncertainty.

**

- **Decision guidance:** After each permitted subtask, use the findings to determine which permitted subtask is most likely to resolve the most important remaining uncertainty. The agent may skip, repeat, or combine permitted subtasks within the defined limits. If no permitted subtask can make useful progress, stop and hand the case to the event organizer.
## 5. When to Stop or Hand Off to a Human

- **Stop successfully when:** The agent has produced an attendance estimate supported by the available event information, documented its important assumptions, assessed confidence, and recorded the result for the next workflow task.
- **Hand off early when:** Required event information is missing, available evidence is too limited or conflicting to support a reasonable estimate, tool failures prevent necessary information from being retrieved, or the task moves outside the permitted scope.
- **Hand off to:** Event organizer for manual review.

Stop at the first applicable task limit or handoff condition. While awaiting review, take no further autonomous action.

## 6. Outbound Deliverable

*Remove this instruction before your submission.* Below are the default outbound deliverable items. Please revise as needed or leave them as they are if they fit your Level 3 task.

- **Status:** completed or escalated to human.
- **Result or recommendation:** The completed result. If the task was escalated before reaching a supported result, write undetermined.
- **Evidence summary:**  The most important evidence supporting the result or explaining why no result could be reached.
- **Subtasks performed:**  The permitted subtasks completed, including repeated attempts.
- **Unresolved issues:**  Remaining uncertainties or questions. Write none only when the task has been completed successfully.
- **Handoff note:** Reason for stopping, unresolved questions, and what the reviewer needs to decide; write “Not applicable” for a completed task.
- **Next task or recipient:** Who receives the completed output? Unresolved cases go to the handoff recipient above.
