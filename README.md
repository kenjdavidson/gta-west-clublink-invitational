# gta-west-clublink-invitational
Leaderboard for the GTA West Clublink Invitational

## Configuration

The configuration is split into **site-level** and **year-specific** files so that the project can be reused across multiple seasons without touching historical data.

### Site configuration — `config/site.json`

Contains information that applies across all seasons:

```json
{
  "league": {
    "name": "West GTA Clublink Men's Invitational",
    "currentYear": 2026,
    "githubRepo": "owner/repo-name"
  }
}
```

| Field | Description |
|-------|-------------|
| `league.name` | Display name of the league |
| `league.currentYear` | The active season year |
| `league.githubRepo` | `owner/repo` path used by the admin dues page to create GitHub issues |

### Year-specific configuration — `config/{year}/config.json`

Contains members, courses, and scoring rules for a single season:

```json
{
  "bonusRoundsCount": 3,
  "members": [
    { "name": "Player Name", "individualId": 1234567, "cardId": "...", "paid": true }
  ],
  "courses": [
    { "name": "Course Name", "clubId": "20599", "roundsCount": 1 }
  ]
}
```

| Field | Description |
|-------|-------------|
| `bonusRoundsCount` | Number of bonus rounds to count (default: 3) |
| `members[].individualId` | Golf Canada individual ID used to fetch score history |
| `members[].cardId` | Golf Canada card number (optional) |
| `members[].paid` | Whether the member has paid entry fees for this season |
| `courses[].clubId` | Golf Canada club ID |
| `courses[].roundsCount` | Required rounds at this course (`0` = bonus-eligible only) |

### Completed-season results — `config/{year}/results.json`

At the end of a season, generate a static snapshot of the leaderboard by running:

```bash
# Set Golf Canada credentials, then:
npx astro build
# Copy the generated YearlyScores object into config/{year}/results.json
```

When `config/{year}/results.json` is present, all future builds load the season data directly from that file without making any Golf Canada API calls. Only the season specified by `currentYear` in `site.json` makes live API requests.

Example structure:

```json
{
  "year": 2025,
  "generatedAt": "2025-09-01T00:00:00.000Z",
  "players": [...]
}
```

## Adding a new season

1. Increment `currentYear` in `config/site.json`
2. Create `config/{newYear}/config.json` with the members, courses, and scoring rules for the new season
3. The previous year's pages will continue to build from their `results.json` if one exists

## Development

```bash
npm install
npm run dev        # local dev server
npm run build      # production build (requires GOLFCANADA_USERNAME / GOLFCANADA_PASSWORD env vars)
npm run preview    # preview the production build
```

