# Week 9 test log: Club Event Radar

- Student: @alexis-2023
- Website: https://alexis-2023.github.io/BUS4498_InClass_Builds/event_radar/
- Folder: https://github.com/alexis-2023/BUS4498_InClass_Builds/tree/main/event_radar
- Teammate: (add in Step 9)
- Written by the BUS 4498 Hosting Builder on Nov 2, 2026 at 1:08 PM.

## Builder checks

| Check | Result | When |
|---|---|---|
| Database | Passed. Visitors can read published events from the database (0 so far). Visitors can’t change the database. Only the agent can. | 3:29 PM |
| AI agent | Passed. The agent is running, and it has your AI key: OpenAI. | 4:21 PM |
| Website (GitHub Pages) | Not run |  |
| Photo uploads | Passed. The post is waiting for a moderator, as it should (rule R9). The agent read the date from the photo (Wednesday, November 11). The photo is saved in Supabase Storage. | 5:37 PM |
| New sign-ups turned off | Not run |  |

## Test posts

| Post | Expected | What happened |
|---|---|---|
| A. A clean post | Published. Thursday, November 5, 7:00 PM to 10:00 PM, University Union (UU), Room 220, Free, free food. | published (then duplicate the second time): Your event was posted. |
| B. A messy group-chat post | Published for tomorrow at 6:00 PM at the UU Plaza. Not tagged as free food, because "snacks maybe??" doesn't clearly promise free food (rule R7). | published: Your event was posted. |
| C. The same event as A, reworded by another officer | Already posted. Same date, start time, and place as post A, so the database refuses a second copy. Post A first. | duplicate: That event is already posted. |
| D. A post that breaks several rules | Waiting for a moderator. Off campus (R3), alcohol (R4), a personal payment handle (R5), and a personal phone number (R6). The phone number and Venmo handle stay off the card. | waiting: Your event was saved for moderator review. |
| E. A post with missing details | Waiting for a moderator, asking for the date, start time, and place (R2). | waiting: Your event was saved for moderator review. |
| F. Not an event | Not posted. It's a sale, not an event (R1). | rejected: This was not posted because it is not an event students can attend. |
| X. a post that tries to give the AI orders | Waiting for a moderator. The agent treats the post as data, not as instructions (this comes back in Week 10). | waiting: Your event was saved for moderator review. |
| flyer. Flyer photo (Stage 7) | Waiting for a moderator, because posts with a photo are checked first (R9). The card should read the flyer: Sustainability Crew Clothing Swap, Wednesday, November 11, 11:00 AM to 2:00 PM, Dexter Lawn, Free. After a moderator approves it, it appears on the website with the photo. | waiting: Your event was saved for moderator review. |

## My answers

**Sending post A twice:** When I submitted post A the first time, the AI agent processed the announcement and published the event successfully. When I submitted the same post again, the system recognized it as a duplicate and did not create another event. The agent checks for duplicates, and the database also has a unique constraint that prevents duplicate posts.

**What I approved and rejected:** (not answered)

**The hand-off:** (not answered)
