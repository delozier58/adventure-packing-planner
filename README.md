# Adventure Packing Planner

A collaborative packing checklist for outdoor trips.

Adventure Packing Planner helps you generate, customize, share, and reuse trip-specific packing lists for backpacking, kayaking, hut-to-hut trips, car camping, bikepacking, fastpacking, and city travel.

## Why I built this

My husband and I often pack for trips in stages and need to coordinate personal gear, shared gear, food, and last-minute tasks. A static checklist gets messy quickly, especially when the list changes by trip type, season, weather, and number of nights.

This project explores a lightweight workflow for turning trip details into a reusable shared packing list.

## Live Demo

https://adventure-packing-planner.vercel.app

## Features

- Generate a packing list from trip details
- Select multiple activities, season, nights, people, and weather conditions
- Separate items into personal, shared, food, and before-leaving sections
- Assign shared items to a person
- Track packing progress
- Add and remove custom items
- Filter the list by person
- Share a trip with a link or trip code
- Sync changes across people
- Duplicate a trip for reuse
- Clear packed status for a future trip

## Product Decisions

### Start with trip setup, not a giant checklist

The app asks a few structured questions first, then generates a relevant list. This keeps the main checklist from feeling overwhelming.

### Separate personal and shared gear

Outdoor trips often involve gear that only one person should bring, like a tent, stove, water filter, or first aid kit. Separating shared gear helps reduce duplicate packing and last-minute confusion.

### Make lists reusable

Most trips share a lot of the same gear. Duplicating a trip and clearing packed status makes it easier to reuse a previous list instead of starting over.

### Preserve lightweight collaboration

Anyone with a trip link can view and edit the list. This avoids account creation and keeps the workflow fast for small trusted groups.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Drizzle ORM
- PostgreSQL
- Vercel
- v0

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open:

```bash
http://localhost:3000
```

## AI-Assisted Development

This project was initially scaffolded with v0 and then iterated through product and implementation refinements.

I used AI to move quickly from idea to working prototype while making product decisions around the core workflow, checklist structure, sharing model, and reuse patterns.

## Future Ideas

- Add user-defined people instead of fixed names
- Save reusable gear templates
- Add weather-aware recommendations
- Add packing weight estimates
- Add offline support
- Support multiple saved gear libraries
- Add notes at the trip level
- Add export or print mode

## What I Learned

This project helped me explore how quickly AI-assisted tools can turn a personal workflow problem into a working product. It also surfaced useful tradeoffs around collaboration, persistence, account-free sharing, and keeping an MVP focused.
