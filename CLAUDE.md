# NextStep — Project Context

## What This App Does
NextStep guides parents of newly diagnosed autistic children through 6 intake questions and delivers a prioritized action plan specific to their child's age, diagnosis, and situation.

## Target User
Parents in panic mode right after an autism diagnosis. Many children also have co-occurring conditions (e.g., Intellectual Disability). Users are overwhelmed — every extra click costs us their trust.

## Current Problems to Fix
1. Mobile UX overload — too many elements visible at once (15+ decision points on one screen)
2. Sign-in prompt appears too early — first-time visitors should see value before being asked to create an account
3. Tools tab shows broken features (browser alerts not supported) — damages credibility
4. Reminder/Notes features hurt retention instead of helping because core flow isn't solid yet

## V2 Direction (priority order)
1. Fix mobile UX — one primary action visible at a time
2. Strengthen results quality using ABA/therapy knowledge
3. Add therapist finder: location → child profile → AI therapy recommendation → therapist matching
4. Re-introduce retention features (reminders, notes) only after core flow is trusted

## Tech Stack
- Next.js + TypeScript + Tailwind CSS
- Supabase (database + auth)
- Deployed on Vercel

## Rules for Claude
- Mobile-first always. Test every change at 390px width.
- Never add a new feature while a broken one is visible to users
- Keep the intake-to-results flow under 3 minutes
- No jargon in UI copy. Parents are stressed, not clinicians.
- Before building anything new, ask: does this reduce or add cognitive load?
- Commit messages must describe what changed and why
- Never ask parents to assess their child's severity or verbal ability — newly diagnosed parents cannot accurately self-report this. Use age as the primary clinical proxy instead.
