# Permissions and boundaries plan

Written in plain words with the BUS 4498 Agent Builder Kit. Our AI assistant builds it following `runtime/permission-rules.md`. Where this plan and our task specifications disagree, this plan wins.

- Agent: The AI Customer Service Assistant helps small businesses manage customer inquiries by answering product questions, retrieving relevant information, and preparing customer responses or order requests. It remembers previous interactions and requires human approval before sending external communications or confirming orders. (`our_team_agent`)
- Owner, who answers for this agent: Alexis Alonso
- Written on: November 8, 2026

## 1. May (on its own)

| # | Action |
|---|---|
| 1 | Answer customer questions using approved product information. |
| 2 | Retrieve product prices and availability from the database. |
| 3 | Create draft responses and save customer inquiry history. |

## 2. May, with a limit

| # | What | The limit | Kind | Who can change it |
|---|---|---|---|---|
| 1 | Create draft order requests | Only for products listed in the approved catalog; no automatic confirmation. | Fixed: only the builders change it | Only the builders, by changing the code |
| 2 | Store customer interaction history | Store only necessary information; retain for up to 90 days. | Fixed: only the builders change it | Only the builders, by changing the code |

## 3. Ask first (hold for a person)

| # | When | What the agent does instead |
|---|---|---|
| 1 | Before sending a customer email | Hold the draft for owner approval, editing, or rejection. |
| 2 | Before confirming a customer order | Hold the order until the owner reviews product availability, quantities, and pricing. |
| 3 | When a customer requests an exception to business policy | Escalate to the owner with an explanation of the request. |

## 4. Never

| # | Never | Where it is enforced |
|---|---|---|
| 1 | Access or disclose another customer's private information. | Code and a database rule |
| 2 | Send emails or confirm orders without recorded human approval. | Code and a database rule |
| 3 | Change product prices or business policies without authorization. | Code and a database rule |

## 5. Who signs off

| Decision | Who | How |
|---|---|---|
| Sending customer emails | Business owner | Approve, edit, or reject in the app; save the decision in Supabase. |
| Confirming customer orders | Business owner | Record approval and order status in Supabase before confirmation. |

## The off switch

The business owner can pause or disable the AI assistant at any time using an administrator control in the application. When paused, the agent stops processing new inquiries, generating responses, and sending approved emails. Pending orders and messages remain saved in Supabase for review. Only the business owner can reactivate the agent.

## How mistakes are reported

Customers can report incorrect responses or order information using a Report Issue button in the application. Reports are saved in Supabase and reviewed by the business owner. The owner can correct errors, reject inaccurate responses, and approve lessons to improve future interactions. All reported issues and corrections are recorded for accountability.

## Rules we keep

- Every permission starts off. The agent may do only what this plan lists under *May* and *May, with a limit*.
- Writing a permission down does not enforce it. Every limit and every *Never* is enforced in code or in a database rule, never in instructions alone.
- A limit a person may change is a setting with an owner and a reason, which the code reads on every run.
- Asking means holding, not guessing: the record waits with a plain reason that names what is missing.
- A sign-off is a click in the app, recorded with who and when. A chat message is not a sign-off.
- Test mode never acts: with `dry_run`, the agent decides but saves nothing.
