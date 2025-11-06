# S-Pool 🎱

**A Comprehensive 8-Ball Pool Scoring & Analytics System**

[![Version](https://img.shields.io/badge/version-2.1.6-blue.svg)](https://github.com/sanaynesargi/S-Pool)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 📖 Overview

S-Pool is a sophisticated pool scoring and analytics platform designed to transform casual 8-ball games into a data-driven competitive experience. Beyond simple scorekeeping, S-Pool provides deep statistical insights, fantasy scoring, power rankings, and comprehensive player analytics to help players track their performance, identify improvement areas, and add an exciting competitive layer to friendly matches.

### Key Features

- **🎮 Game Logging**: Record 8-ball pool games with detailed action tracking (singles and doubles)
- **📊 Advanced Statistics**: Comprehensive player stats including PPG (Points Per Game), PPT (Points Per Tournament), PPS (Points Per Stroke)
- **🏆 Power Rankings**: Advanced VIRAAJ rating system that evaluates players across multiple dimensions
- **👥 Head-to-Head Analysis**: Detailed matchup statistics and historical performance comparisons
- **🎯 Fantasy League**: Fantasy pool scoring system with roster management and weekly matchups
- **📈 Performance Tracking**: Season-based analytics with progression tracking
- **🏅 Awards & Accolades**: All-Star selections, player tags, and achievement tracking
- **📱 Modern UI**: Clean, responsive interface built with Next.js and Chakra UI

---

## 🏗️ Architecture

S-Pool follows a client-server architecture with clear separation of concerns:

```
S-Pool/
├── pool-scoring-server/     # Backend API (Express.js + SQLite)
│   ├── src/
│   │   ├── server.ts         # Main API server with 50+ endpoints
│   │   └── utils.ts          # Statistical calculations & utilities
│   └── package.json
│
├── pool-scoring-ui/          # Frontend (Next.js + Chakra UI)
│   ├── src/app/              # Next.js 14 app directory
│   │   ├── action/           # Game input interface
│   │   ├── leaderboard/      # Player standings
│   │   ├── rankings/         # Power rankings (VIRAAJ system)
│   │   ├── stats/            # Various statistics pages
│   │   ├── h2h/              # Head-to-head comparisons
│   │   ├── fantasy/          # Fantasy league management
│   │   ├── tournament/       # Tournament logs
│   │   ├── grades/           # Player report cards
│   │   └── admin/            # Admin panel
│   ├── components/           # Reusable React components
│   └── package.json
│
└── recaps/                   # Game recaps and summaries
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **SQLite3**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sanaynesargi/S-Pool.git
   cd S-Pool
   ```

2. **Install server dependencies:**
   ```bash
   cd pool-scoring-server
   npm install
   ```

3. **Install UI dependencies:**
   ```bash
   cd ../pool-scoring-ui
   npm install
   ```

### Running the Application

#### Start the Backend Server

```bash
cd pool-scoring-server
npm start
```
The server runs on **port 8000** with nodemon for hot-reloading.

#### Start the Frontend

```bash
cd pool-scoring-ui
npm run dev
```
The UI runs on **port 3001** (http://localhost:3001).

#### Production Build

```bash
cd pool-scoring-ui
npm run build
npm start
```

---

## 💾 Database Schema

S-Pool uses SQLite with two separate databases:

### Main Database (`mydatabase.db`)

#### Core Tables

**`player_actions`** - Individual player actions per tournament
```sql
- id: INTEGER PRIMARY KEY
- playerName: TEXT
- actionType: TEXT (Ball In, 8 Ball In, Scratch, etc.)
- actionValue: INTEGER (calculated score)
- actionCount: INTEGER
- mode: TEXT (singles/doubles/allstar)
- tournamentId: INTEGER
```

**`player_matchups`** - Game results
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- player1: TEXT
- player2: TEXT
- winner: TEXT
- ballsWon: INTEGER
- overtime: BOOLEAN
- mode: TEXT
- tournamentId: INTEGER
```

**`player_standings`** - Tournament placement history
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- playerName: TEXT
- standing: INTEGER
- mode: TEXT
```

**`season_map`** - Season definitions
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- seasonName: TEXT
- startSinglesId: INTEGER
- endSinglesId: INTEGER
- startDoublesId: INTEGER
- endDoublesId: INTEGER
```

**`awards`** - Player accolades
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- playerName: TEXT
- allStarSelections: INTEGER
- allNpa1/2/3Selections: INTEGER
- allStarSeasons: TEXT (comma-separated)
- allNpaSeasons: TEXT (comma-separated)
```

### Fantasy Database (`fantasyDB.db`)

**`rosters`** - Fantasy team rosters with position slots (T8BI, FPBI, OPBI, OBI, S, GSS)

**`leagues`** - Fantasy league definitions

**`matchups`** - Weekly fantasy matchups

**`guesses`** - Player performance predictions

---

## 📊 Scoring System

### Action Values

| Action Type | Points | Description |
|------------|--------|-------------|
| Ball In | +1.0 | Standard ball pocketed |
| 8 Ball In | +3.0 | Game-winning shot |
| 2 Ball In | +2.25 | Two balls in one turn |
| 3 Ball In | +3.5 | Three balls in one turn |
| 4+ Ball In | +4.75 | Four or more balls |
| Scratch | -0.5 | Foul penalty |
| Opp Ball In | -1.0 | Opponent's ball pocketed |
| Opp. 8 Ball In | -2.0 | Opponent wins by 8-ball sink |

### Power Rankings (VIRAAJ System)

The VIRAAJ rating system evaluates players across six dimensions:

1. **V - Victory Rate** (Win percentage normalized to 1-10 scale)
2. **I - Improvement/Integrity** (Mistake avoidance rate)
3. **R - Runs** (Multi-ball turn efficiency)
4. **A - Average Performance** (Overall action quality)
5. **A2 - Adjusted Competition** (Strength of schedule)
6. **J - Juggernaut Factor** (Clutch performance + finishing ability)

Each component is weighted and combined to produce a composite rating.

---

## 🎯 Key Features Explained

### Statistics Modules

#### Simple Stats
- Points Per Game (PPG)
- Points Per Tournament (PPT)
- Points Per Stroke (PPS)
- Win/Loss Records
- Season comparisons

#### Turn Statistics
- Action type breakdowns
- Averages per game
- Efficiency metrics
- Mistake analysis

#### Head-to-Head (H2H)
- Direct matchup records
- Last 5 games tracking
- Overall vs H2H performance
- Ball differential analysis

### Tournament System

- **Singles Mode**: 1v1 matches
- **Doubles Mode**: 2v2 team matches (semicolon-delimited player names)
- **All-Star Mode**: Special exhibition games
- **Season Tracking**: Group tournaments by season with configurable boundaries

### Fantasy League

Position-based scoring with roster management:
- **T8BI**: Top 8-Ball Specialist
- **FPBI**: First Position Ball-In
- **OPBI**: Overall Position Ball-In
- **OBI**: Overall Ball-In
- **S**: Specialist
- **GSS**: Game Score Specialist

### Admin Panel

- Season management (create, edit seasons)
- Tournament ID tracking
- Database maintenance
- Award management

---

## 🔌 API Reference

The backend exposes 50+ REST endpoints. Key routes:

### Game Management
- `POST /api/end-game` - Submit completed game data
- `GET /api/tournamentData` - Retrieve all tournament data

### Statistics
- `GET /api/total-points?mode={mode}` - Total points by player
- `GET /api/average-points-per-game?mode={mode}&seasonId={id}` - PPG stats
- `GET /api/player-ppt?mode={mode}&seasonId={id}` - PPT stats
- `GET /api/get-records?mode={mode}&seasonId={id}` - Win/loss records

### Matchups
- `GET /api/matchups?player1={name}&player2={name}&mode={mode}` - H2H stats
- `GET /api/matchups-p` - Partners-adjusted matchups (doubles)

### Rankings
- `GET /api/grades?mode={mode}&seasonId={id}` - VIRAAJ component grades

### Seasons & Awards
- `POST /api/addSeason` - Create new season
- `GET /api/getSeasons` - List all seasons
- `GET /api/getCurrentAllStars` - Current all-star roster
- `GET /api/getTags?mode={mode}` - Player achievement tags

### Fantasy
- Fantasy-specific endpoints for roster management, matchups, and scoring

---

## 🎨 UI Pages

### Main Navigation

1. **Home** (`/`) - Central dashboard with navigation
2. **Play a Game** (`/action`) - Input game results
3. **Leaderboard** (`/leaderboard`) - Overall standings
4. **Power Rankings** (`/rankings`) - VIRAAJ ratings
5. **Statistics** (`/stats/simpleStats`) - General stats
6. **Turn Statistics** (`/stats/actions`) - Action breakdowns
7. **H2H Statistics** (`/h2h`) - Player comparison
8. **Tournament Log** (`/tournament`) - Game history
9. **Report Card** (`/grades`) - Performance grades
10. **About** (`/about`) - Project information

### Additional Features

- **Player Profiles** - Detailed individual statistics
- **Accolades** - Awards and achievements display
- **Improvement Tracker** - Progress visualization
- **Season Selector** - Filter data by season
- **Mode Toggle** - Switch between singles/doubles/all-star

---

## 🛠️ Technology Stack

### Backend
- **Express.js** - RESTful API framework
- **SQLite3** - Lightweight embedded database
- **TypeScript** - Type-safe server code
- **Nodemon** - Development hot-reloading
- **CORS** - Cross-origin resource sharing

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI component library
- **Chakra UI** - Component library and design system
- **TypeScript** - Type-safe client code
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Framer Motion** - Animation library

---

## 🧮 Statistical Calculations

S-Pool implements sophisticated statistical models:

### Z-Score Normalization
Used for percentile rankings and comparative analysis.

### Weighted Averages
Strength of schedule adjustments in the A2 component.

### Percentile Calculations
Player ranking relative to the field using standard normal CDF.

### Trend Analysis
Historical performance tracking with visualization.

---

## 📝 Usage Examples

### Recording a Game

1. Navigate to "Play a Game"
2. Select mode (Singles/Doubles)
3. Add players to the tournament
4. Input actions for each player
5. Record matchup results (winner, balls won, overtime)
6. Set tournament standings
7. Submit to database

### Viewing Power Rankings

1. Go to "Power Rankings"
2. Select mode and season
3. View composite VIRAAJ scores
4. Click on components to see detailed breakdowns
5. Compare players side-by-side

### Checking Head-to-Head

1. Navigate to "H2H Statistics"
2. Enter two player names
3. Select mode
4. View all-time record, last 5 games, and overall stats

---

## 🔧 Configuration

### Environment Variables

Create `.env` files if needed:

**Server (.env)**
```
PORT=8000
DB_PATH=./mydatabase.db
FANTASY_DB_PATH=./fantasyDB.db
```

**UI (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Port Configuration

- Server: Port 8000 (configurable in `server.ts`)
- UI Dev: Port 3001 (set in `package.json` dev script)
- UI Prod: Port 3001 (set in `package.json` start script)

---

## 📈 Data Flow

```
User Input → Frontend (Next.js)
    ↓
HTTP Request (Axios)
    ↓
Backend API (Express)
    ↓
Database Operations (SQLite)
    ↓
Statistical Processing (Utils)
    ↓
JSON Response
    ↓
Frontend Rendering (Chakra UI + Recharts)
```

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain existing code style
- Add comments for complex logic
- Test database queries thoroughly
- Ensure responsive UI design

---

## 📜 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 👨‍💻 Author

**Sanay Nesargi**

- GitHub: [@sanaynesargi](https://github.com/sanaynesargi)
- Project Link: [https://github.com/sanaynesargi/S-Pool](https://github.com/sanaynesargi/S-Pool)

---

## 🙏 Acknowledgments

- Inspired by the competitive pool scene
- Built for players who love data as much as the game
- Special thanks to all contributors and testers

---

## 🐛 Known Issues & Future Enhancements

### Planned Features
- Mobile app version
- Real-time multiplayer scoring
- Video replay integration
- Advanced betting lines system
- Machine learning performance predictions
- Tournament bracket generation
- Social features (comments, reactions)
- Export/import functionality

### Current Limitations
- Local database only (no cloud sync)
- Manual game input required
- Limited to 8-ball pool format

---

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check existing documentation
- Review the codebase comments

---

## 🎉 Version History

**v2.1.6** (Current)
- Enhanced VIRAAJ rating system
- Improved fantasy league features
- UI/UX refinements
- Bug fixes and performance improvements

---

**Made with ❤️ for pool enthusiasts everywhere**
