# Workflow of Tasks

*Replace all bracketed prompts with information specific to your proposed system. Delete instructional text that does not belong in your final specification. Add or remove task sections as needed. Every task shown in the general workflow must have a corresponding task specification below.*

## 1. Workflow Overview
### 1.1 Workflow Goal
This workflow supports the system goal defined in `my_first_agent/README.md`.

### 1.2 Workflow Trigger
The workflow starts when a CPVC event organizer begins an attendance-planning run for an upcoming hackathon. The organizer provides the event date, current registration total, historical attendance information, and any approved aggregate attendance signals available for that event.


### 1.3 Completion Condition at Runtime

A run is complete when the system has produced an attendance forecast, a recommended range of food, drinks, and swag, and a summary of its assumptions and confidence level. The run must also record either organizer approval of the plan or a manual-review outcome. The system does not automatically purchase supplies or send repeated messages to participants.

### 1.4 General Workflow

The organizer starts a planning run and enters the event information and approved aggregate data. The system validates that the required inputs are complete and reasonable. If information is missing or invalid, the system asks the organizer to correct it before continuing.

Using historical attendance-to-registration patterns and the available event information, the system estimates likely attendance and creates recommended quantities for food, drinks, and swag. It explains the assumptions, uncertainty, and confidence level behind the recommendation. If the data is insufficient, inconsistent, or produces an unusually uncertain forecast, the system flags the run for manual review.

The organizer reviews the draft forecast and supply plan. The organizer may approve the plan or revise the inputs and assumptions, which sends the workflow back to the estimation step. Once approved, the system saves the forecast and planning summary. It does not make purchases, use sensitive personal data, or make the final decision without organizer approval.

### 1.5 Workflow Diagram

```mermaid
flowchart TD
    S([Start: Organizer starts planning run])
    T1[T1 Collect event inputs]
    T2[T2 Validate inputs]
    D1{D1 Inputs complete?}
    T3[T3 Request corrections]
    T4[T4 Estimate attendance]
    T5[T5 Generate supply recommendations]
    T6[T6 Explain assumptions and confidence]
    D2{D2 Forecast reliable?}
    T7[T7 Flag manual review]
    T8[T8 Present draft plan]
    D3{D3 Organizer approves plan?}
    T9[T9 Record organizer edits]
    T10[T10 Save approved plan]
    E1([End: Manual planning required])
    E2([End: Workflow complete])

    S --> T1
    T1 --> T2
    T2 --> D1

    D1 -- No --> T3
    T3 --> T2

    D1 -- Yes --> T4
    T4 --> T5
    T5 --> T6
    T6 --> D2

    D2 -- No --> T7
    T7 --> E1

    D2 -- Yes --> T8
    T8 --> D3

    D3 -- No --> T9
    T9 --> T4

    D3 -- Yes --> T10
    T10 --> E2
```

```mermaid
flowchart TD
    S(["Start: Organizer starts planning run"])
    T1["Collect event inputs"]
    T2["Validate input data"]
    D1{"Are inputs complete and valid?"}
    T3["Request input corrections"]
    T4["Estimate likely attendance"]
    T5["Generate supply recommendations"]
    T6["Explain assumptions and confidence"]
    D2{"Is the forecast reliable enough?"}
    T7["Flag manual review"]
    T8["Present draft plan"]
    D3{"Does organizer approve plan?"}
    T9["Record organizer revisions"]
    T10["Save approved forecast and supply plan"]
    E1(["End: Manual planning required"])
    E2(["End: Workflow complete"])

    S --> T1
    T1 --> T2
    T2 --> D1
    D1 -->|No| T3
    T3 --> T2
    D1 -->|Yes| T4
    T4 --> T5
    T5 --> T6
    T6 --> D2
    D2 -->|No| T7
    T7 --> E1
    D2 -->|Yes| T8
    T8 --> D3
    D3 -->|No| T9
    T9 --> T4
    D3 -->|Yes| T10
    T10 --> E2
```
