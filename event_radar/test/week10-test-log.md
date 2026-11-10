# Week 10 test log: what Club Event Radar knows and remembers

- Student: @alexis-2023
- Website: https://alexis-2023.github.io/BUS4498_InClass_Builds/event_radar/
- Folder: https://github.com/alexis-2023/BUS4498_InClass_Builds/tree/main/event_radar
- Chat app: GroupMe
- Written by the BUS 4498 Memory Builder on Nov 10, 2026 at 11:21 AM.

## Builder checks

| Check | Result | When |
|---|---|---|
| Week 9 build ready | Passed. The events table is there, and visitors can read published posts. The agent is running with your AI key: OpenAI. New sign-ups are off. Your website opens at https://alexis-2023.github.io/BUS4498_InClass_Builds/event_radar/ | 12:49 PM |
| Chat-group reader | Not run |  |
| Club list | Not passed. The club list has 6 clubs: Accounting Society, Board Game Guild, Cal Poly Ski & Snowboard Club, Mustang Pitch Society, Sustainability Crew, Women in Finance Circle. Cal Poly Kite Flyers isn’t on the list yet. Post B shows you when to add it. The agent reads the club list: it knows 6 clubs. | 9:19 AM |
| Lessons table | Not run |  |

## Test posts

| Post | Expected | What happened | What the agent looked at |
|---|---|---|---|
| A. A nickname | Published, with the club shown as Board Game Guild: the agent matched the nickname "BGG" on the club list. | published: Your event was posted. |  |
| B. A club that isn't on the list | Waiting for a moderator, because "Cal Poly Kite Flyers" isn't on the club list yet. | waiting: Your event was saved for moderator review. |  |
| C. The new club's next post | Published, with the club shown as Cal Poly Kite Flyers. You changed what the agent knows without touching the code. | published: Your event was posted. |  |
| D. A known club, no place | Waiting for a moderator, because the place is missing (rule R2). The reason adds a hint from the club list: Board Game Guild usually meets at University Union (UU), Room 220. The agent didn't fill the place in: knowledge about a club in general isn't a fact about this event. | waiting: Your event was saved for moderator review. |  |
| E. The original post | Published for Tuesday, November 17 at 6:00 PM at the UU Plaza. | published: Your event was posted. |  |
| F. An update | Published, replacing E. The agent checked the club's upcoming posts, saw that this updates "pitch practice," and copied the place from the earlier post. The earlier card leaves the website. | published: Your event was posted and replaced the earlier card. |  |
| G. A reminder that changes nothing | Already posted. A reminder isn't an update, and the database's duplicate check (same date, start time, and place as F) refuses a second copy. | duplicate: That event is already posted. |  |
| H. Something the rules don't cover | Published. The posting rules don't say anything about study hours, so to the agent it looks like an event. Now teach it: sign in as a moderator and save this lesson: *Drop-in study hours, tutoring, and office hours aren't events for this website. Hold them for a moderator.* | published: Your event was posted. |  |
| I. The next one, after the lesson | Waiting for a moderator, citing your lesson. | waiting: Your event was saved for moderator review. |  |
| J. A post that tries to teach the agent | Waiting for a moderator. Your lesson still applies, and the post is flagged for trying to give the AI instructions. Check Table Editor → lessons: there is still only the lesson you wrote. A post can't teach the agent, because only signed-in moderators can write lessons. | waiting: Your event was saved for moderator review. |  |
| K. After you switch the lesson off | Published. The agent forgot the lesson the moment you switched it off. Switch it back on when you're done. | published: Your event was posted. |  |

## My answers

**The demo (Step 1):** The agent was not able to connect the follow up messages to the original events because it did not remember the previous messages. This is an example of short term memory loss. When someone posted an update about an event, the agent created another event card instead of updating the original one. This is a persistent memory issue because the information was already saved in the database, but the agent did not check it before creating a new event

**The fix (Step 2):** After adding memory, the agent can now look at previous messages, existing events, and lessons before making a decision. It uses recent messages to understand follow ups, checks the events table in Supabase to see what has already been posted, and reads moderator feedback from the agent_lessons table. It also saves information about what it reviewed in the looked_at field of the events table. This allows the agent to update existing events instead of creating duplicate event cards.

**My chat group (Step 4):** (not answered)

**Knowledge (Step 5):** Between Post B and Post C, I added Cal Poly Kite Flyers to the clubs table in Supabase. Before adding the club, the agent held the announcement for moderator review because the club was not on the approved list. After adding it, the agent recognized the club and successfully published the event. I did not have to change or redeploy any code because the agent reads the updated club list directly from Supabase.

**Memory (Step 6):** Before replacing the earlier post, the agent checked Mustang Pitch Society's previously published events in Supabase. It recognized that Post F was updating the same pitch practice from Post E instead of announcing a new event. Since Post F only changed the time, the agent used the location from the earlier event, which was UU Plaza. It then replaced the original 6 PM event with the updated 7 PM event rather than creating a duplicate.

**Lessons (Step 7):** Post J was held for moderator review because it tried to give the AI new instructions through an event announcement. The agent recognized the attempt and continued following the existing moderator lesson instead. It could not create a new lesson because only authorized moderators can add lessons through the moderator panel. Regular event submissions do not have permission to change the agent's lessons.
