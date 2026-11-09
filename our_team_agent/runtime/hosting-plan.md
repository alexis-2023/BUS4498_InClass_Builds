# Hosting plan

Written in plain words with the BUS 4498 Agent Builder Kit. Our AI assistant turns it into a GitHub Pages website and a Supabase backend, following `runtime/hosting-rules.md`. Where this plan and our task specifications disagree, this plan wins.

## Our project

- GitHub repository: https://github.com/alexis-2023/BUS4498_InClass_Builds
- Our agent’s folder: `our_team_agent` (our plans are in `our_team_agent/runtime/`)
- Supabase project: https://uqhbwmwrpnoriwocwjua.supabase.co
- Owner of the repository and the Supabase project: Alexis Alonso

## What our agent does

The AI Customer Service Assistant helps small businesses manage customer inquiries by answering product questions, retrieving relevant information, and preparing customer responses or order requests. It remembers previous interactions and requires human approval before sending external communications or confirming orders.

## Our tasks

**These tasks replace the tasks in our task specifications** (`our_team_agent/agent/workflow-of-tasks.md` and `our_team_agent/agent/task-specs/`). Where they differ, this list wins; offer to update the specifications to match.

| # | Task | What it does | Who does it | When it runs |
|---|---|---|---|---|
| 1 | Handle Customer Inquiries | Analyzes customer questions, identifies their needs, and retrieves accurate product and pricing information to prepare a response. | (not sure) | When someone submits something |
| 2 | prepare order requests | Collects requested products and quantities, creates a draft order, and submits it for human review before confirmation. | (not sure) | After a person decides |
| 3 | Maintain Customer Memory | Stores relevant customer inquiry history and preferences in Supabase so the assistant can use previous interactions during future sessions. | (not sure) | After another task |

## Who can see or change what

Customers can submit inquiries, view their own conversations, and request orders, but cannot access other customers' information. The business owner can view and manage all customer inquiries, product information, and draft orders. The AI assistant can retrieve product information and prepare responses or orders, but cannot send external messages, confirm orders, or modify sensitive information without human approval. Customer data is stored securely in Supabase with access restricted by user role.

## External tools and applications

| # | Tool or application | What the agent uses it for | What it does with it | Most sensitive data it touches | How it connects |
|---|---|---|---|---|---|
| 1 | Gmail | Sends approved customer email responses and order confirmations. | Sends with it | Confidential | A sign-in (OAuth) |

## Files people upload

None, customers submit text based inquiries and order requests through the web application.
