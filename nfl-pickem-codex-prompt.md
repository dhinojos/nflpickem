# Codex Master Prompt — NFL Pick'em

## Objective

Build a complete, production-ready but intentionally simple **NFL Pick'em web application**.

The application is for **one private group of friends/users**.

It should be:

- Mobile-first
- Extremely easy to use
- Colorful and with images NFL logos, banners, etc
- Simple to deploy
- Free or as close to free as reasonably possible for a small private group
- Easy to maintain
- Easy to reuse every NFL season
- Written in TypeScript
- Entirely in **Spanish**
- No multilingual support
- No unnecessary enterprise architecture
- No PWA
- Accessed through a normal URL

Prioritize **working software and simplicity over abstraction**.

Do not over-engineer the solution.

---

# Preferred Technology Stack

Use:

- **Next.js**
- **TypeScript**
- **Supabase PostgreSQL**
- **Supabase Storage** for profile pictures
- **Vercel** for hosting
- A reliable free/public NFL schedule and scores data source

The NFL API/data source must be isolated behind a provider/service interface so that another source can be substituted later without changing the application.

Example concept:

```text
NFLDataProvider
  getSeason()
  getSchedule()
  getWeek()
  getGames()
  getGameScores()
```

Do not tightly couple business logic to a particular external API.

---

# Core Principle

This is a simple private NFL Pick'em.

For every NFL game, each user picks **one team to win**.

A correct selection is worth:

```text
1 point
```

There are:

- No confidence points
- No bonus points
- No spreads
- No betting odds

---

# Authentication / Access

Do NOT implement traditional authentication.

There are:

- No passwords
- No magic links
- No email verification codes
- No OAuth providers
- No registration page

The user enters only their **email address**.

The email must already exist in an allowlist stored in Supabase.

If the email is:

```text
active + allowed
```

allow access.

Otherwise deny access with a simple Spanish message.

Example:

```text
Este correo no está autorizado para participar.
```

Remember the authenticated user on the browser/device so they do not need to enter their email every visit.

Use an appropriately secure browser session mechanism rather than repeatedly trusting an arbitrary email stored in localStorage.

---

# First Login

The first time an allowed email accesses the site, require:

```text
Nickname
Profile picture — optional
```

Nickname must be unique.

The picture can be:

- Uploaded from the device
- Taken using the phone camera

Store images using Supabase Storage.

After first-time setup, take the user directly to the Pick'em application.

---

# User Profile

Users can later change:

- Nickname
- Profile picture

Nicknames must remain unique.

Users should NEVER see other users' email addresses.

Player-facing screens show only:

- Nickname
- Profile picture

Admins may see email addresses.

---

# User Status

Users should support at least:

```text
active
disabled
```

Do not hard-delete historical participation.

If an admin disables a user:

- Prevent future access
- Preserve all previous picks
- Preserve scores
- Preserve standings
- Preserve historical weeks

---

# Admin Access

Users should have an:

```text
is_admin
```

flag in Supabase.

I will manually configure the initial admin directly in Supabase.

Do not implement special admin bootstrap logic.

Regular users authenticate with email only.

Admin functionality must require an additional **shared admin PIN**.

Store that PIN securely as a server-side environment variable.

Never expose it to the browser bundle or database.

---

# Admin Functions

Create a very simple Admin page.

Admins should be able to:

- Add allowed emails
- Disable users
- Re-enable users
- View users
- Assign/remove admin status
- Force refresh NFL schedule
- Force refresh scores
- Synchronize a season
- Manually override the active week
- Remove an active-week override
- Manually lock a week
- Manually unlock a week
- Override game results if NFL data is incorrect
- Override the week's tiebreaker game if necessary

Keep this UI functional and simple.

Do not build an elaborate administration system.

---

# NFL Season Support

Support:

- Preseason
- Regular season
- Playoffs
- Super Bowl

The application must support multiple seasons:

```text
2026
2027
2028
...
```

Historical seasons must remain available.

Automatically determine the current NFL season.

When a new NFL season appears, automatically synchronize its schedule.

Also provide an Admin option:

```text
Sincronizar temporada
```

---

# Season Rules

All of these count toward season standings:

- Regular season
- Wild Card
- Divisional
- Conference Championships
- Super Bowl

Preseason games are not imported or shown.

---

# Current Week

Users may make picks ONLY for the current active NFL week.

Do not allow users to submit picks for future weeks.

Past weeks are read-only.

The application should determine the active week automatically based on NFL schedule/status.

Admins can override the active week.

When the current week finishes, automatically advance to the next NFL week and open its picks when the schedule is available.

---

# Weekly Team Pick Locking

This is extremely important.

All team picks for the ENTIRE week lock when the **first NFL game of that week kicks off**.

Example:

```text
Thursday 7:20 PM — first game starts
```

At exactly that time:

```text
ALL team selections for that week become read-only.
```

Even Sunday and Monday games are already locked.

Users can change picks as many times as desired before the first kickoff.

Use server-side time validation.

Never depend only on the user's browser clock.

Store NFL kickoff timestamps in UTC.

Display them using the user's browser timezone.

---

# Missing Picks

Users are allowed to leave games unpicked.

An unpicked game earns:

```text
0 points
```

Before the weekly lock, clearly show:

```text
3 picks pendientes
```

or similar.

A user who submits no picks receives 0 points.

---

# Auto-Save

There should NOT be a global Submit Picks button.

When the user selects a team:

```text
save immediately
```

Provide subtle feedback such as:

```text
Guardado
```

or:

```text
Todos tus picks están guardados
```

Make picking fast on mobile.

---

# Pick Completion Status

Before the first game starts, players may see whether other players completed their weekly picks.

Show only something like:

```text
Carlos       Listo
David        Listo
Alex         Pendiente
```

"Listo" means:

```text
All game picks are completed.
```

The tiebreaker prediction is NOT required for the user to appear as "Listo".

Do NOT reveal which teams anyone selected before the first kickoff.

---

# Pick Visibility

Before kickoff of the first weekly game:

Users can see:

```text
their own picks
```

Users cannot see:

```text
any other user's team selections
```

Once the first game kicks off:

```text
all team picks for the week become visible to everyone
```

This includes picks for games that have not started yet.

This rule must be enforced server-side.

Do not rely only on hiding UI elements.

---

# Weekly Pick Grid

After the week locks, provide a simple view showing who picked which team for every matchup.

For example conceptually:

```text
             KC    BUF
David        ✓
Carlos             ✓
Alex          ✓
```

The actual UI can be mobile-friendly cards rather than a wide table.

Show player nickname/profile picture where appropriate.

---

# Pick Status

Once games begin, visually distinguish:

```text
Pending
Correct
Incorrect
```

Do not award a point while the game is still in progress.

Award the point only when the game is officially final.

---

# NFL Games Ending in a Tie

If an actual NFL game ends tied:

```text
Nobody receives a point.
```

Users still select one of the two teams.

---

# Live Scores

Display live scores during games.

Refresh NFL game scores automatically.

Target behavior:

```text
Approximately every 5 minutes while NFL games are active.
```

Use a less frequent sync when there are no active games.

Also provide:

```text
Admin → Actualizar resultados
```

Do not create an expensive real-time architecture.

Design this so it works reasonably within free hosting/service limits.

Prefer scheduled synchronization where available, but also make score synchronization safely triggerable on normal app requests so the system does not depend entirely on a paid scheduler.

Avoid unnecessary API calls.

---

# Weekly Tiebreaker

The tiebreaker is the **combined total score of the final scheduled game of the NFL week**.

Example:

```text
Chiefs 27
Bills 24

Actual total = 51
```

User predicts:

```text
47
```

Difference:

```text
abs(51 - 47) = 4
```

The closest prediction wins the tiebreaker.

---

# Tiebreaker Game Selection

Automatically determine the final game of the NFL week based on latest scheduled kickoff time.

Provide an admin override in case:

- Games are rescheduled
- NFL data is incorrect
- Special situations occur

---

# Tiebreaker Lock

Unlike normal picks, the tiebreaker remains editable after the first game begins.

Team picks:

```text
LOCK = kickoff of FIRST game
```

Tiebreaker:

```text
LOCK = kickoff of LAST game
```

After the final game kicks off, the tiebreaker becomes read-only.

Use server-side timestamps and validation.

---

# Tiebreaker Privacy

Before the final game's kickoff:

Users may see:

```text
their own tiebreaker
```

Users must NOT see:

```text
other users' tiebreaker predictions
```

Once the final game kicks off:

```text
all tiebreaker predictions become visible
```

Enforce this server-side.

---

# Weekly Ranking

Primary weekly ranking:

```text
Number of correct picks
```

If players have different numbers of correct picks, the tiebreaker is irrelevant.

Only when multiple players have the same number of correct picks should the tiebreaker be evaluated.

Example:

```text
David   12 correct
Carlos  12 correct
Alex    11 correct
```

Only David and Carlos use the tiebreaker.

---

# Tiebreaker Calculation

Calculate:

```text
absolute_difference =
abs(predicted_total - actual_total)
```

Lowest difference wins.

Example:

```text
Actual = 46

David predicts 44 → difference 2
Carlos predicts 48 → difference 2
```

They remain tied.

The actual predicted numbers do not matter if the absolute difference is equal.

---

# Weekly Winner

The player with:

```text
Most correct picks
```

wins.

If tied:

```text
Closest tiebreaker
```

wins.

If multiple players remain tied after the tiebreaker:

```text
They are ALL weekly winners.
```

Each tied winner receives:

```text
1 weekly win
```

---

# Season Standings

Primary ranking:

```text
Total correct picks
```

First season tiebreaker:

```text
Total weekly wins
```

If still tied:

```text
Share the same season rank.
```

Do not invent another season tiebreaker.

Example:

```text
1 David      172 correct   5 weekly wins
2 Carlos     172 correct   4 weekly wins
3 Alex       169 correct   6 weekly wins
```

If David and Carlos had:

```text
172 correct
5 weekly wins
```

they share the same rank.

---

# Weekly Scoreboard

Create a simple weekly scoreboard.

Useful fields include:

```text
Jugador
Aciertos
Incorrectos
Pendientes
Desempate
Diferencia
Resultado semanal
```

Do not expose tiebreaker values before they are allowed to become public.

---

# Season Scoreboard

Show at minimum:

```text
Rank
Profile picture
Nickname
Total correct picks
Weekly wins
```

Preseason must not affect this table.

---

# History

Provide a simple History section.

Users can browse past weeks.

Past weeks are read-only.

Users should be able to see:

- Games
- Final scores
- Their picks
- Other players' picks
- Correct/incorrect picks
- Tiebreaker predictions
- Tiebreaker result
- Weekly standings
- Weekly winner(s)

Also allow switching historical NFL seasons when multiple seasons exist.

---

# Navigation

Mobile bottom navigation:

```text
Picks
Esta Semana
Temporada
Historial
Perfil
```

Use appropriate Spanish UI labels.

Admins can additionally access:

```text
Admin
```

Do not clutter the primary navigation for non-admins.

---

# UI Design

Use a clean sports-app style.

Mobile-first.

Single light theme.

No dark mode.

Do not implement theme switching.

Keep the UI visually polished but minimal.

Use:

- Team logo
- Team name
- Kickoff time
- Score when available
- Large tap-friendly pick targets
- Profile pictures
- Simple cards
- Clear typography
- Comfortable spacing

Avoid:

- Excessive gradients
- Huge dashboards
- Dense tables on mobile
- Unnecessary animations
- Betting-style interfaces
- Odds
- Advertisements
- Fantasy football complexity

Think:

```text
simple ESPN/Yahoo Pick'em experience
```

but even simpler.

---

# Matchup Card

A matchup should conceptually look like:

```text
Domingo · 11:00 AM

[Chiefs logo] Kansas City
            VS
[Bills logo] Buffalo
```

The entire team area should be easy to tap.

Selected team should have a strong but simple selected state.

---

# Timezones

Store all timestamps in UTC.

Display kickoff times using the user's local browser timezone automatically.

Example:

A user in Chihuahua should see Chihuahua-local time.

Another user elsewhere should see their own local time.

Do not ask users to select a timezone.

---

# Weekly Header

At the top of Picks show something similar to:

```text
Semana 4
Picks cierran: jueves 6:20 PM
```

Also show:

```text
12 de 16 picks completados
```

Before lock.

After lock:

```text
Picks cerrados
```

---

# Tiebreaker UI

Clearly separate the tiebreaker from normal picks.

Example:

```text
DESEMPATE

¿Cuántos puntos anotarán entre ambos equipos
en el último partido de la semana?

[ 47 ]

Puedes modificarlo hasta:
Lunes 6:15 PM
```

---

# NFL Data

The app should automatically synchronize:

- Season
- Week
- Game IDs
- Home team
- Away team
- Team abbreviations
- Team logos if available
- Kickoff timestamps
- Game status
- Scores
- Final status
- Schedule changes

Avoid scraping HTML if a practical structured data source exists.

Encapsulate external NFL data logic.

---

# Schedule Changes

If the NFL changes a game's kickoff:

Update the application automatically.

The weekly lock must follow the updated first-game kickoff as long as the week has not already legitimately locked.

Handle postponed games reasonably.

A game that remains assigned to the NFL week remains part of that week's scoring.

If a game is canceled and never played:

```text
0 points for everyone
```

Admin can override exceptional cases.

---

# Data Integrity

Critical business rules must be enforced server-side:

- Allowed email validation
- Disabled user validation
- Pick deadlines
- Tiebreaker deadlines
- Pick privacy
- Tiebreaker privacy
- Admin authorization
- Admin PIN
- Unique nicknames
- Scoring
- Weekly winner calculation
- Season leaderboard calculation

Do not trust the frontend for these rules.

---

# Suggested Data Model

Design the database yourself, but it will likely need concepts similar to:

```text
users
seasons
weeks
games
picks
tiebreakers
game_overrides
week_overrides
sync_metadata
```

Possible user fields:

```text
id
email
nickname
avatar_url
is_admin
status
created_at
updated_at
```

Possible season fields:

```text
id
year
status
```

Possible week fields:

```text
id
season_id
week_number
week_type
first_kickoff
last_kickoff
tiebreaker_game_id
status
```

Possible game fields:

```text
id
external_id
season_id
week_id
home_team
away_team
home_score
away_score
kickoff_at
status
winner
```

Possible picks:

```text
id
user_id
game_id
selected_team
created_at
updated_at
```

Use proper:

- Primary keys
- Foreign keys
- Unique indexes
- Useful database indexes
- Constraints

Avoid duplicating derived leaderboard information unnecessarily.

Calculate standings deterministically from source data unless caching is genuinely useful.

---

# Security

Even though this is a friendly private application, follow reasonable security practices.

Important:

- Never expose Supabase service-role keys
- Never expose admin PIN
- Validate all mutations server-side
- Use parameterized/database SDK operations
- Protect admin routes
- Validate file uploads
- Limit profile photo file size
- Accept only image formats
- Sanitize user-visible text where appropriate
- Treat the email session as access control, not strong identity authentication

Document the security limitation:

Because users authenticate only by entering an allowlisted email, anyone who knows another participant's allowed email could potentially impersonate them.

This limitation is intentional for this application.

Admin operations remain protected by the additional admin PIN.

---

# Performance

This application will have a small number of users.

Do not introduce:

- Redis
- Kafka
- RabbitMQ
- Kubernetes
- Microservices
- Event sourcing
- Complex caching layers

A normal Next.js + PostgreSQL architecture is enough.

---

# Spanish Language Requirement

ALL end-user UI text must be Spanish.

Examples:

```text
Mis Picks
Esta Semana
Temporada
Historial
Perfil
Administrador
Aciertos
Pendientes
Picks cerrados
Desempate
Clasificación
Guardar
Guardado
Actualizar resultados
Sincronizar temporada
```

Code, database columns, and developer documentation can remain English.

Do not build multilingual infrastructure.

---

# Responsive Requirements

Optimize first for approximately:

```text
375px–430px phone widths
```

Then adapt naturally for:

- Tablet
- Desktop

No horizontal scrolling should be required for primary workflows.

---

# Main User Flow

First visit:

```text
URL
 ↓
Enter email
 ↓
Email exists and active?
 ↓ yes
First login?
 ↓ yes
Choose nickname
Optional photo
 ↓
Picks
```

Returning user:

```text
URL
 ↓
Existing valid session
 ↓
Picks
```

---

# Picks Flow

```text
Current week
 ↓
Select winner for each matchup
 ↓
Each selection auto-saves
 ↓
"12 de 16 picks completados"
 ↓
First game kicks off
 ↓
All team picks lock
 ↓
Everyone's picks become visible
 ↓
Games play
 ↓
Live scores update
 ↓
Final games award points
 ↓
Last game kicks off
 ↓
Tiebreakers become visible and lock
 ↓
Week finishes
 ↓
Weekly winner calculated
 ↓
Season standings updated
 ↓
Next week opens
```

---

# Admin Flow

```text
Admin user
 ↓
Enter Admin PIN
 ↓
Admin dashboard
```

Keep the PIN session reasonably short-lived or require it again for sensitive admin actions.

---

# Data Synchronization

Implement synchronization idempotently.

Running:

```text
syncSchedule()
```

multiple times must NOT create duplicate games.

Use the external NFL game ID as a unique reference.

Likewise score synchronization must safely update existing games.

Keep a record of:

```text
last_schedule_sync
last_score_sync
last_success
last_error
```

for troubleshooting.

---

# Error Handling

User-facing errors should be short and friendly.

Example:

```text
No pudimos actualizar los resultados.
Intenta nuevamente en unos minutos.
```

Do not display technical stack traces to users.

Log useful errors server-side.

---

# Loading States

Use simple skeleton/loading states.

Avoid full-screen spinners when possible.

Optimistic selection is acceptable for picks, but rollback and notify the user if saving fails.

---

# Accessibility

Use:

- Adequate touch target sizes
- Semantic buttons
- Form labels
- Keyboard navigation
- Reasonable contrast
- Alt text for team/profile images

---

# Testing

Implement tests for the business rules that matter most.

At minimum test:

1. Correct pick = 1 point
2. Incorrect pick = 0
3. NFL tie = 0 for both choices
4. Missing pick = 0
5. Picks editable before first kickoff
6. Picks locked at first kickoff
7. Team picks private before kickoff
8. Team picks public after kickoff
9. Tiebreaker editable until last kickoff
10. Tiebreaker private until last kickoff
11. Correct absolute tiebreaker difference
12. Equal tiebreaker difference produces tie
13. Multiple tied winners each receive weekly win
14. Season sorting by total correct
15. Season tiebreaking by weekly wins
16. Remaining season tie shares rank
17. Preseason excluded from season points
18. Preseason excluded from season weekly wins
19. Regular season counts
20. Playoffs count
21. Super Bowl counts
22. Disabled users cannot access
23. Historical picks remain after disabling user
24. Unique nicknames enforced
25. Active-week override works

Focus on business-rule tests rather than maximizing coverage percentage.

---

# Seed / Demo Data

Create optional local/demo seed data.

Include:

- Several fake users
- Several NFL games
- Completed games
- Pending games
- Sample picks
- A weekly tie
- Tiebreaker examples

This should make it easy to test the UI without waiting for real NFL games.

Do NOT insert fake data in production automatically.

---

# Local Development

The completed project should be easy to run with approximately:

```bash
npm install
npm run dev
```

Provide:

```text
.env.example
```

Document every required variable.

---

# Database Setup

Provide Supabase migrations.

Do not require me to manually create database tables through the Supabase UI.

I should be able to reproduce the entire schema from the repository.

Also provide any required Storage bucket configuration.

---

# Deployment

Target:

```text
GitHub
 ↓
Vercel
 ↓
Supabase
```

Provide clear deployment instructions.

Include:

1. Create Supabase project
2. Run database migrations
3. Configure Storage
4. Configure environment variables
5. Configure shared admin PIN
6. Deploy repository to Vercel
7. Configure NFL data source
8. Run first season synchronization
9. Add allowed emails
10. Mark an admin directly in Supabase
11. Verify synchronization
12. Test picks

Keep deployment compatible with free-tier services where reasonably possible.

If a background scheduler feature is not available on a free plan, design a graceful alternative and document it rather than requiring a paid service.

---

# README

Create a high-quality README containing:

## Overview

What the application does.

## Architecture

Very short architecture explanation.

## Stack

Technologies used.

## Local Setup

Exact commands.

## Supabase Setup

Exact steps.

## Environment Variables

Table of variables.

## NFL Provider

What source is being used and how to replace it.

## Deployment

Exact Vercel steps.

## Admin

How admin access works.

## Scoring Rules

Summarize Pick'em rules.

## Season Rules

Explain that each season includes regular season and postseason games.

## Troubleshooting

Common issues.

Do not make the README unnecessarily verbose.

---

# Implementation Approach

Do NOT try to produce the entire application as one giant unverified code dump.

Work incrementally.

Use this sequence:

## Phase 1 — Foundation

Create:

- Project structure
- Database schema
- Supabase integration
- Environment configuration

Verify it works.

## Phase 2 — Users

Implement:

- Email allowlist
- Session
- First login
- Nickname
- Avatar upload/camera
- Profile

Verify it works.

## Phase 3 — NFL Data

Implement:

- Provider abstraction
- Schedule synchronization
- Seasons
- Weeks
- Games
- Scores

Verify synchronization.

## Phase 4 — Picks

Implement:

- Current week
- Matchup cards
- Auto-save
- Server-side locking
- Completion status

Verify deadlines.

## Phase 5 — Visibility

Implement:

- Private picks before kickoff
- Public picks afterward
- Weekly matchup grid

Verify privacy server-side.

## Phase 6 — Tiebreaker

Implement:

- Automatic final game
- Prediction
- Separate locking deadline
- Privacy
- Admin override

Verify edge cases.

## Phase 7 — Scoring

Implement:

- Correct/incorrect
- Weekly leaderboard
- Weekly winners
- Season leaderboard
- Preseason exclusion

Verify with automated tests.

## Phase 8 — History

Implement past weeks and seasons.

## Phase 9 — Admin

Implement minimal admin functionality.

## Phase 10 — Deployment

Complete:

- README
- Migrations
- `.env.example`
- Deployment instructions
- Production verification checklist

---

# Code Quality

Prefer:

```text
clear code
small modules
obvious names
limited dependencies
```

over clever abstractions.

Avoid unnecessary generic frameworks inside the application.

Use TypeScript types for core concepts such as:

```text
Season
Week
Game
User
Pick
Tiebreaker
GameStatus
WeekType
```

Centralize scoring and locking rules so they are not duplicated throughout the application.

---

# Important Date Logic

Create explicit domain functions similar to:

```text
canEditTeamPicks(week, now)
canViewOtherTeamPicks(week, now)
canEditTiebreaker(week, now)
canViewOtherTiebreakers(week, now)
```

And scoring functions such as:

```text
calculatePickResult()
calculateWeeklyStandings()
calculateTiebreakerDifference()
calculateWeeklyWinners()
calculateSeasonStandings()
```

These must be deterministic and unit tested.

---

# Definition of Done

The application is complete when I can:

1. Deploy it to Vercel.
2. Connect it to Supabase.
3. Add allowed emails.
4. Mark one user as admin directly in Supabase.
5. Visit the URL from a phone.
6. Enter an allowed email.
7. Create a nickname and profile photo.
8. See the current NFL week.
9. Pick one team for every game.
10. Change picks before the first kickoff.
11. See picks automatically lock at the correct time.
12. Not see other people's picks before kickoff.
13. See everyone else's picks after kickoff.
14. Enter/change a tiebreaker until the last game's kickoff.
15. Not see other people's tiebreakers before that kickoff.
16. Follow live scores.
17. See picks turn correct/incorrect when games become final.
18. See the weekly leaderboard.
19. See weekly winner(s).
20. See season standings.
21. See regular season + playoffs + Super Bowl contribute to the season.
22. Browse previous weeks.
23. Browse historical seasons.
24. Manage users and synchronization through Admin.
25. Repeat the application for future NFL seasons without resetting the database.

---

# Final Instruction

Start by inspecting this entire specification and creating a short implementation checklist.

Then build the application.

Do not ask me to make technical architecture decisions unless there is a genuine blocker.

When a minor implementation choice is unspecified:

```text
choose the simplest reasonable solution
```

When choosing dependencies:

```text
prefer mature, widely-used dependencies
```

When choosing between elegance and simplicity:

```text
choose simplicity
```

When choosing between a paid feature and a reasonable free-tier alternative:

```text
choose the free-tier alternative
```

Keep the design focused on the actual purpose:

**A small group of people quickly making NFL picks from their phones and enjoying the weekly competition.**
