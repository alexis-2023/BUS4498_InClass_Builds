---
name: "professional-email-draft"
description: "Use provided details, facts, and professional tone, and structure. Use when the user asks to draft and email based on the provided details. This skill takes information and drafts a final email ready to be sent but has to be approved by user. This skill drafts an email in a professional structure and tone, but it depends on details and context."
---

# professional-email-draft

## User inputs
On each run the user supplies recipients contact, details for the email, and context for the email. 
If the recipients contact is missing, ask for the recipients email and contact information before continuing. 
If the details or context for the email is missing, ask the user for details or context before continuing. 
If the recipients contact is missing, ask who the user is writing this email to. 
If the email prompt is missing details or context, ask what the user wants to write the email about.

## Procedure
1. Read the provided contact information, details, and context. 
2. Select work that has contact information, details, and context. 
3. Add the contact information, details, and context to the email draft. 
5. Return the full drafted email with all the contact information, details, and context. 
6. Wait for User approval. 
7. When approved by user send email to recipient.

## Output
Return a final drafted email. Ask for user approval to send email to recipient.

## Boundaries
Do not send email to recipient without user approval of email draft.
