import cors from "cors";
import express from "express";
import sqlite3 from "sqlite3";
import { v4 as uuidv4 } from "uuid";

const app = express();
const port = 8000;

app.use(express.json());
app.use(cors());

const db = new sqlite3.Database("mydatabase.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

const dbFantasy = new sqlite3.Database("fantasyDB.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS player_actions (
    id INTEGER PRIMARY KEY,
    playerName TEXT,
    actionType TEXT,
    actionValue INTEGER,
    actionCount INTEGER,
    mode TEXT,
    tournamentId INTEGER NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS player_games (
    playerName TEXT PRIMARY KEY,
    gamesPlayed INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS player_tournament_games (
    playerName TEXT PRIMARY KEY,
    gamesPlayed INTEGER DEFAULT 0,
    mode TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS player_standings (
    playerName TEXT,
    standing INTEGER,
    mode TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS player_matchups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    winner TEXT NOT NULL CHECK (winner IN (player1, player2)),
    ballsWon INTEGER NOT NULL,
    overtime BOOLEAN NOT NULL,
    mode TEXT,
    tournamentId INTEGER NOT NULL
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS season_map (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seasonName TEXT NOT NULL,
    startSinglesId INTEGER NOT NULL,
    endSinglesId INTEGER NOT NULL,
    startDoublesId INTEGER NOT NULL,
    endDoublesId INTEGER NOT NULL
  );`);
});

dbFantasy.serialize(() => {
  dbFantasy.run(
    `CREATE TABLE IF NOT EXISTS rosters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startTournamentId INTEGER NOT NULL,
    leagueId TEXT NOT NULL,
    playerId TEXT NOT NULL UNIQUE,
    T8BI TEXT,
    FPBI TEXT,
    OPBI TEXT,
    OBI TEXT,
    S TEXT,
    GSS TEXT
  )`,
    (err) => {
      if (err) {
        console.error(err.message);
      } else {
      }
    }
  );

  dbFantasy.run(
    `CREATE TABLE IF NOT EXISTS leagues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    leagueId TEXT NOT NULL,
    members TEXT
  )`,
    (err) => {
      if (err) {
        console.error(err.message);
      } else {
      }
    }
  );

  dbFantasy.run(
    `CREATE TABLE IF NOT EXISTS playerMap (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teamName TEXT NOT NULL,
    playerName TEXT NOT NULL,
    playerId TEXT NOT NULL,
    leagueId TEXT NOT NULL
  )`,
    (err) => {
      if (err) {
        console.error(err.message);
      } else {
      }
    }
  );

  dbFantasy.run(
    `CREATE TABLE IF NOT EXISTS matchups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team1Id TEXT NOT NULL,
    team2Id TEXT NOT NULL,
    score1 REAL NOT NULL DEFAULT 0.0,
    score2 REAL NOT NULL DEFAULT 0.0,
    winnerId TEXT,
    tournamentId INTEGER NOT NULL,
    leagueId TEXT NOT NULL
  )`,
    (err) => {
      if (err) {
        console.error(err.message);
      } else {
      }
    }
  );

  dbFantasy.run(
    `CREATE TABLE IF NOT EXISTS guesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playerId TEXT NOT NULL,
    guess REAL NOT NULL DEFAULT 0.0,
    tournamentId INTEGER NOT NULL,
    leagueId TEXT NOT NULL
  )`,
    (err) => {
      if (err) {
        console.error(err.message);
      } else {
      }
    }
  );
});

const incrementGamesPlayed = (playerNames: string[], mode: any) => {
  return new Promise<void>((resolve, reject) => {
    // Create an array of placeholders like "(?, 1)"
    const placeholders = playerNames.map(() => `(?, 1, '${mode}')`).join(", ");
    // Create an array of values [playerName1, playerName2, ...]
    const values = playerNames;
    const sql = `
      INSERT INTO player_games (playerName, gamesPlayed, mode)
      VALUES ${placeholders}
      ON CONFLICT(playerName, mode) DO UPDATE SET
      gamesPlayed = player_games.gamesPlayed + 1
  `;

    db.run(sql, values, (err) => {
      if (err) {
        reject(err.message);
      } else {
        resolve();
      }
    });
  });
};

const incrementMiniGamesPlayed = (a: any, mode: string) => {
  return new Promise<void>((resolve, reject) => {
    const playerNames = Object.entries(a);
    // Create an array of placeholders like "(?, 1)"

    const placeholders = playerNames.map(() => "(?, ?, ?)").join(", ");
    const values = playerNames.flatMap((a: any) => [a[0], a[1], mode]);

    const sql = `
    INSERT INTO player_tournament_games (playerName, gamesPlayed, mode)
    VALUES ${placeholders}
    ON CONFLICT (playerName, mode)
    DO UPDATE SET
    gamesPlayed = player_tournament_games.gamesPlayed + EXCLUDED.gamesPlayed,
    mode = EXCLUDED.mode;
  `;

    db.run(sql, values, (err) => {
      if (err) {
        reject(err.message);
      } else {
        resolve();
      }
    });
  });
};

interface Matchup {
  playerOne: string;
  playerTwo: string;
  winner: string;
  isOT: boolean;
  ballsWon: number;
}

async function getNextTournamentId(
  tableName: string,
  mode: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    let test = true;
    if (!mode.includes("'")) {
      test = false;
    }

    db.get(
      `SELECT MAX(tournamentId) AS maxTournamentId FROM ${tableName} WHERE mode = ${
        test ? mode : `'${mode}'`
      }`,
      [],
      (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          // If there has never been a tournament, MAX(tournamentId) will be NULL, so we start with 1.

          resolve(
            (row.maxTournamentId ? parseInt(row.maxTournamentId) : 0) + 1
          );
        }
      }
    );
  });
}

const insertMatchups = async (matchups: Matchup[], mode: string) => {
  const insertStatement = `INSERT INTO player_matchups (player1, player2, winner, ballsWon, overtime, mode, tournamentId) VALUES (?, ?, ?, ?, ?, ?, ?);`;

  const t = await getNextTournamentId("player_actions", mode);

  matchups.forEach((matchup) => {
    db.run(
      insertStatement,
      [
        matchup.playerOne,
        matchup.playerTwo,
        matchup.winner,
        matchup.ballsWon,
        matchup.isOT ? 1 : 0,
        mode,
        t,
      ],
      (err) => {
        if (err) {
          console.error("Error executing insert statement:", err);
        }
      }
    );
  });
};

interface PlayerAction {
  playerName: string;
  actionType: string;
  actionValue: number;
  actionCount: number;
  mode: string;
}

function calculateActionValue(actionType: string, actionCount: number): number {
  // Example calculation, adjust according to your needs
  if (actionType === "Ball In") {
    return actionCount * 1.5;
  } else if (actionType === "Scratch") {
    return actionCount * -1;
  }
  // Add other actionType cases as needed
  return actionCount;
}

function convertDataToPlayerActions(data: any, mode: string): PlayerAction[] {
  const playerActions: PlayerAction[] = [];

  Object.entries(data).forEach(([playerName, actions]) => {
    Object.entries(actions as any).forEach(([actionType, actionCount]) => {
      const actionValue = calculateActionValue(actionType, actionCount as any);
      playerActions.push({
        playerName,
        actionType,
        actionCount: actionCount as number,
        actionValue,
        mode,
      });
    });
  });

  return playerActions;
}

const scoreMap: { [a: string]: number } = {
  "No Result": 0,
  Scratch: -0.5,
  "Ball In": 1,
  "8 Ball In": 3,
  "Opp Ball In": -1,
  "2 Ball In": 2.25,
  "3 Ball In": 3.5,
  "4+ Ball In": 4.75,
  "Opp. 8 Ball In": -2,
};

const addPlayerActions = async (actions: PlayerAction[], mode: string) => {
  const newActions = convertDataToPlayerActions(actions, mode);

  if (newActions.length == 0) {
    return;
  }

  const t = await getNextTournamentId("player_actions", mode);

  return new Promise<void>((resolve, reject) => {
    const placeholders = newActions.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
    const values = newActions.flatMap((a) => [
      a.playerName,
      a.actionType,
      scoreMap[a.actionType],
      a.actionCount,
      a.mode,
      t,
    ]);

    const sql = `INSERT INTO player_actions (playerName, actionType, actionValue, actionCount, mode, tournamentId) VALUES ${placeholders}`;

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run(sql, values, (err) => {
        if (err) {
          db.run("ROLLBACK");
          reject(err.message);
        } else {
          db.run("COMMIT");
          resolve();
          console.log(`Player actions inserted successfully`);
        }
      });
    });
  });
};

const addPlayerStandings = async (standings: any, mode: string) => {
  return new Promise<void>((resolve, reject) => {
    let currentStandings = Object.entries(standings);
    let newStandings: any = [];

    for (const elem of currentStandings) {
      if (elem[1] == 0) {
        continue;
      }

      newStandings.push(elem);
    }

    const placeholders = newStandings.map(() => `(?, ?, '${mode}')`).join(", ");
    const values = newStandings.flatMap((a: any) => [a[0], a[1]]);

    const sql = `INSERT INTO player_standings (playerName, standing, mode) VALUES ${placeholders}`;

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run(sql, values, (err) => {
        if (err) {
          db.run("ROLLBACK");
          reject(err.message);
        } else {
          db.run("COMMIT");
          resolve();
          console.log(`Player actions inserted successfully`);
        }
      });
    });
  });
};

const endGame = async (actions: any) => {
  try {
    if (Object.keys(actions.playerActionCounts!).length == 0) {
      console.log("No Data Passed!");
      return;
    }

    await addPlayerActions(actions.playerActionCounts!, actions.mode!); // tid
    const playerNames = Object.keys(actions.playerActionCounts!);
    await incrementGamesPlayed(playerNames, actions.mode!);
    await incrementMiniGamesPlayed(actions.playerGameCounts!, actions.mode!);
    await addPlayerStandings(actions.standings!, actions.mode!);
    insertMatchups(actions.matches!, actions.mode!); // tid
    console.log("Game Ended!");
  } catch (error) {
    console.error("Error ending game:", error);
  }
  // db.close((err) => {
  //   if (err) {
  //     console.error(err.message);
  //   } else {
  //     console.log("Closed the database connection.");
  //   }
  // });
};

app.post("/api/end-game", async (req, res) => {
  try {
    const actions: PlayerAction[] = req.body;
    await endGame(actions);
    res.status(200).send("Game ended and actions saved successfully");
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/api/total-games-played", (req, res) => {
  const query = req.query;

  if (!query.mode) {
    res.status(404).json({ Error: "Invalid Request" });
    return;
  }

  const sql = `
    SELECT playerName, gamesPlayed
    FROM player_tournament_games
    WHERE mode = '${query.mode!}'
  `;

  db.all(sql, [], (err, rows: any) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      let obj: any = {};

      for (let entry of rows) {
        obj[entry.playerName] = entry.gamesPlayed;
      }

      res.status(200).json(obj);
    }
  });
});

app.get("/api/total-points", (req, res) => {
  const query = req.query;

  if (!query.mode) {
    res.status(404).json({ Error: "Invalid Request" });
    return;
  }

  const sql = `
    SELECT playerName, SUM(actionValue * actionCount) as totalPoints
    FROM player_actions WHERE mode = '${query.mode}'
    GROUP BY playerName
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      const totalPoints = rows.reduce((acc: any, row: any) => {
        acc[row.playerName] = row.totalPoints;
        return acc;
      }, {});
      res.status(200).json(totalPoints);
    }
  });
});

app.get("/api/latest-tournament-points", (req, res) => {
  const query = req.query;

  if (!query.mode) {
    res.status(404).json({ Error: "Invalid Request" });
    return;
  }

  const sql = `
    SELECT 
      pa.playerName,
      pa.actionValue * pa.actionCount AS points
    FROM 
      player_actions pa
    JOIN (
      SELECT 
        playerName, 
        MAX(id) AS latestTournament
      FROM 
        player_games
      WHERE 
        mode = '${query.mode}'
      GROUP BY 
        playerName
    ) pt ON pa.playerName = pt.playerName
    WHERE 
      pa.mode = '${query.mode}' 
      AND pa.tournamentDate = pt.latestTournament
  `;

  db.all(sql, [], (err, rows: any) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      // Assuming each player has only one action per tournament
      const latestTournamentPoints = rows.reduce((acc: any, row: any) => {
        acc[row.playerName] = row.points;
        return acc;
      }, {});

      res.status(200).json(latestTournamentPoints);
    }
  });
});

//   const query = req.query;

//   if (!query.mode) {
//     res.status(404).json({ Error: "Invalid Request" });
//     return;
//   }

//   const sql = `
//     SELECT a.playerName,
//            IFNULL(SUM(a.actionValue * a.actionCount), 0) as totalPoints,
//            IFNULL(b.gamesPlayed, 0) as gamesPlayed
//     FROM player_actions a
//     LEFT JOIN player_games b ON a.playerName = b.playerName
//     WHERE a.mode = '${query.mode}' AND b.mode = '${query.mode}'
//     GROUP BY a.playerName
//   `;

//   db.all(sql, [], (err, rows) => {
//     if (err) {
//       res.status(500).send(err.message);
//     } else {
//       const averagePointsPerGame = rows.reduce((acc: any, row: any) => {
//         acc[row.playerName] =
//           row.gamesPlayed > 0
//             ? (row.totalPoints / row.gamesPlayed).toFixed(2)
//             : 0;
//         return acc;
//       }, {});
//       res.status(200).json(averagePointsPerGame);
//     }
//   });
// });
app.get("/api/average-points-per-game", (req, res) => {
  const { mode, seasonId } = req.query;

  if (!mode) {
    return res
      .status(404)
      .json({ Error: "Invalid Request: mode parameter is required" });
  }

  const seasonFilter =
    typeof seasonId == "number"
      ? `JOIN (SELECT ${
          mode === "doubles"
            ? "startDoublesId, endDoublesId"
            : "startSinglesId, endSinglesId"
        } 
         FROM season_map WHERE id = ${seasonId}) sm 
     ON a.tournamentId BETWEEN sm.${
       mode === "doubles"
         ? "startDoublesId AND sm.endDoublesId"
         : "startSinglesId AND sm.endSinglesId"
     }`
      : "";

  const sql = `
    SELECT a.playerName, 
           IFNULL(SUM(a.actionValue * a.actionCount), 0) as totalPoints, 
           IFNULL(b.gamesPlayed, 0) as gamesPlayed
    FROM player_actions a
    LEFT JOIN player_games b ON a.playerName = b.playerName AND b.mode = a.mode
    ${seasonFilter}
    WHERE a.mode = '${mode}'
    GROUP BY a.playerName
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    } else {
      const averagePointsPerGame = rows.reduce((acc: any, row: any) => {
        acc[row.playerName] =
          row.gamesPlayed > 0
            ? (row.totalPoints / row.gamesPlayed).toFixed(2)
            : "0.00";
        return acc;
      }, {});
      res.status(200).json(averagePointsPerGame);
    }
  });
});

app.get("/api/average-points-per-tournament-game", (req, res) => {
  const { mode, seasonId } = req.query;

  if (!mode) {
    return res
      .status(404)
      .json({ Error: "Invalid Request: mode parameter is required" });
  }

  const seasonFilter =
    typeof seasonId == "number"
      ? `JOIN (SELECT ${
          mode === "doubles"
            ? "startDoublesId, endDoublesId"
            : "startSinglesId, endSinglesId"
        } 
         FROM season_map WHERE id = ${seasonId}) sm 
     ON pa.tournamentId BETWEEN sm.${
       mode === "doubles"
         ? "startDoublesId AND sm.endDoublesId"
         : "startSinglesId AND sm.endSinglesId"
     }`
      : "";

  const sql = `
    SELECT ptg.playerName, 
           IFNULL(SUM(pa.actionValue * pa.actionCount), 0) as totalPoints, 
           IFNULL(ptg.gamesPlayed, 0) as gamesPlayed
    FROM player_tournament_games ptg
    LEFT JOIN player_actions pa ON ptg.playerName = pa.playerName AND ptg.mode = pa.mode
    ${seasonFilter}
    WHERE ptg.mode = '${mode}'
    GROUP BY ptg.playerName
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      const averagePointsPerGame = rows.reduce((acc: any, row: any) => {
        acc[row.playerName] =
          row.gamesPlayed > 0
            ? (row.totalPoints / row.gamesPlayed).toFixed(2)
            : "0.00"; // Changed 0 to "0.00" to maintain consistency in the type of value returned
        return acc;
      }, {});
      res.status(200).json(averagePointsPerGame);
    }
  });
});

app.get("/api/average-standings-per-game", (req, res) => {
  const { mode } = req.query;

  if (!mode) {
    return res
      .status(404)
      .json({ Error: "Invalid Request: mode parameter is required" });
  }

  const sql = `
    SELECT playerName, AVG(standing) AS average_standing
    FROM player_standings WHERE mode = '${mode}'
    GROUP BY playerName;
  `;

  console.log(sql);

  db.all(sql, [], (err, rows: any) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      let obj: any = {};

      for (let entry of rows) {
        obj[entry.playerName] = entry.average_standing;
      }

      res.status(200).json(obj);
    }
  });
});

app.get("/api/total-tournaments-played", (req, res) => {
  const { mode } = req.query;

  if (!mode) {
    return res
      .status(404)
      .json({ Error: "Invalid Request: mode parameter is required" });
  }

  const sql = `
    SELECT playerName, gamesPlayed 
    FROM player_games WHERE mode = '${mode}'
    GROUP BY playerName;
  `;

  db.all(sql, [], (err, rows: any) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      let obj: any = {};

      for (let entry of rows) {
        obj[entry.playerName] = entry.gamesPlayed;
      }

      res.status(200).json(obj);
    }
  });
});

app.get("/api/player-ppt", (req, res) => {
  const { mode, seasonId } = req.query;

  if (!mode) {
    return res
      .status(404)
      .json({ Error: "Invalid Request: mode parameter is required" });
  }

  const seasonFilter =
    typeof seasonId == "number"
      ? `AND tournamentId BETWEEN 
       (SELECT ${
         mode === "doubles" ? "startDoublesId" : "startSinglesId"
       } FROM season_map WHERE id = ${seasonId})
       AND 
       (SELECT ${
         mode === "doubles" ? "endDoublesId" : "endSinglesId"
       } FROM season_map WHERE id = ${seasonId})`
      : "";

  const sql = `
    SELECT 
        playerName, 
        SUM(actionCount) AS totalActionCount, 
        SUM(actionValue * actionCount) AS totalActionValue,
        CASE 
            WHEN SUM(actionCount) = 0 THEN 0
            ELSE SUM(actionValue * actionCount) / SUM(actionCount)
        END AS averageValuePerAction
      FROM 
        player_actions
      WHERE 
        mode = '${mode}'
        ${seasonFilter}
      GROUP BY 
        playerName
      ORDER BY 
        averageValuePerAction DESC;
  `;
  console.log(sql);

  db.all(sql, [], (err, rows: any) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      let obj: any = {};

      for (let entry of rows) {
        obj[entry.playerName] =
          Math.round(entry.averageValuePerAction * 1000) / 1000;
      }

      res.status(200).json(obj);
    }
  });
});

app.get("/api/player-tt", (req, res) => {
  const { mode, seasonId } = req.query;

  if (!mode) {
    return res
      .status(404)
      .json({ Error: "Invalid Request: mode parameter is required" });
  }

  const seasonFilter =
    typeof seasonId == "number"
      ? `AND tournamentId BETWEEN 
       (SELECT ${
         mode === "doubles" ? "startDoublesId" : "startSinglesId"
       } FROM season_map WHERE id = ${seasonId})
       AND 
       (SELECT ${
         mode === "doubles" ? "endDoublesId" : "endSinglesId"
       } FROM season_map WHERE id = ${seasonId})`
      : "";

  const sql = `
    SELECT 
        playerName, 
        SUM(actionCount) AS totalActionCount, 
        SUM(actionValue * actionCount) AS totalActionValue,
        CASE 
            WHEN SUM(actionCount) = 0 THEN 0
            ELSE SUM(actionValue * actionCount) * 1.0 / SUM(actionCount)
        END AS averageValuePerAction
      FROM 
        player_actions
      WHERE 
        mode = '${mode}'
        ${seasonFilter}
      GROUP BY 
        playerName
      ORDER BY 
        averageValuePerAction DESC;
  `;

  db.all(sql, [], (err, rows: any) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      let obj: any = {};

      for (let entry of rows) {
        obj[entry.playerName] = entry.totalActionCount;
      }

      res.status(200).json(obj);
    }
  });
});

app.get("/api/player-actions-stats", (req, res) => {
  const { mode, seasonId } = req.query;

  if (!mode) {
    return res
      .status(404)
      .json({ Error: "Invalid Request: mode parameter is required" });
  }
  const seasonFilter =
    typeof seasonId == "number"
      ? `AND tournamentId BETWEEN 
       (SELECT ${
         mode === "doubles" ? "startDoublesId" : "startSinglesId"
       } FROM season_map WHERE id = ${seasonId})
       AND 
       (SELECT ${
         mode === "doubles" ? "endDoublesId" : "endSinglesId"
       } FROM season_map WHERE id = ${seasonId})`
      : "";

  const sql = `
    SELECT 
        playerName, 
        actionType,
        SUM(actionCount) AS totalActionCount, 
        SUM(actionValue * actionCount) AS totalActionValue
    FROM 
        player_actions
    WHERE 
        mode = '${mode}'
        ${seasonFilter}
    GROUP BY 
        playerName, actionType
    ORDER BY 
        playerName, actionType;
  `;

  db.all(sql, [], (err, rows: any) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      let stats: any = {};

      for (let entry of rows) {
        if (!stats[entry.playerName]) {
          stats[entry.playerName] = [];
        }
        stats[entry.playerName].push({
          actionType: entry.actionType,
          totalActionCount: entry.totalActionCount,
          totalActionValue: entry.totalActionValue,
        });
      }

      res.status(200).json(stats);
    }
  });
});

app.get("/api/player-actions-stats-averages", (req, res) => {
  const { mode, seasonId } = req.query;

  if (!mode) {
    return res
      .status(404)
      .json({ Error: "Invalid Request: mode parameter is required" });
  }

  const seasonFilter =
    typeof seasonId == "number"
      ? `AND pa.tournamentId BETWEEN 
       (SELECT ${
         mode === "doubles" ? "startDoublesId" : "startSinglesId"
       } FROM season_map WHERE id = ${seasonId})
       AND 
       (SELECT ${
         mode === "doubles" ? "endDoublesId" : "endSinglesId"
       } FROM season_map WHERE id = ${seasonId})`
      : "";

  const sql = `
    SELECT 
      pa.playerName, 
      pa.actionType,
      SUM(pa.actionCount) AS actionCount, 
      SUM(pa.actionValue * pa.actionCount) AS actionValue,
      pg.gamesPlayed
    FROM 
      player_actions pa
    JOIN 
      player_tournament_games pg ON pa.playerName = pg.playerName AND pa.mode = pg.mode
    WHERE 
      pa.mode = '${mode}'
      ${seasonFilter}
    GROUP BY 
      pa.playerName, pa.actionType, pg.gamesPlayed
    ORDER BY 
      pa.playerName, pa.actionType;
  `;

  db.all(sql, [], (err, rows: any) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      let stats: any = {};

      for (let entry of rows) {
        if (!stats[entry.playerName]) {
          stats[entry.playerName] = [];
        }
        stats[entry.playerName].push({
          actionType: entry.actionType,
          gamesPlayed: entry.gamesPlayed,
          count: entry.actionCount,

          averageActionCount: entry.actionCount / entry.gamesPlayed,
          averageActionValue:
            (entry.actionCount / entry.gamesPlayed) * entry.actionValue,
        });
      }

      res.status(200).json(stats);
    }
  });
});

app.get("/api/player-actions-stats-average-tournaments", (req, res) => {
  const { mode, seasonId } = req.query;

  if (!mode) {
    return res
      .status(404)
      .json({ Error: "Invalid Request: mode parameter is required" });
  }

  const seasonFilter =
    typeof seasonId == "number"
      ? `AND pa.tournamentId BETWEEN 
       (SELECT ${
         mode === "doubles" ? "startDoublesId" : "startSinglesId"
       } FROM season_map WHERE id = ${seasonId})
       AND 
       (SELECT ${
         mode === "doubles" ? "endDoublesId" : "endSinglesId"
       } FROM season_map WHERE id = ${seasonId})`
      : "";

  const sql = `
    SELECT 
      pa.playerName, 
      pa.actionType,
      SUM(pa.actionCount) AS actionCount, 
      SUM(pa.actionValue * pa.actionCount) AS actionValue,
      pg.gamesPlayed
    FROM 
      player_actions pa
    JOIN 
      player_games pg ON pa.playerName = pg.playerName AND pa.mode = pg.mode
    WHERE 
      pa.mode = '${mode}'
      ${seasonFilter}
    GROUP BY 
      pa.playerName, pa.actionType, pg.gamesPlayed
    ORDER BY 
      pa.playerName, pa.actionType;
  `;

  db.all(sql, [], (err, rows: any) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      let stats: any = {};

      for (let entry of rows) {
        if (!stats[entry.playerName]) {
          stats[entry.playerName] = [];
        }
        stats[entry.playerName].push({
          actionType: entry.actionType,
          gamesPlayed: entry.gamesPlayed,
          count: entry.actionCount,

          averageActionCount: entry.actionCount / entry.gamesPlayed,
          averageActionValue:
            (entry.actionCount / entry.gamesPlayed) * entry.actionValue,
        });
      }
      res.status(200).json(stats);
    }
  });
});

app.get("/api/matchups", (req, res) => {
  const { player1, player2, mode } = req.query as {
    player1: string;
    player2: string;
    mode: string;
  };

  if (!player1 || !player2 || !mode) {
    return res
      .status(400)
      .send("Missing required parameters: player1, player2, and mode");
  }

  const headToHeadAllTimeQuery = `
    SELECT 
      COUNT(*) AS totalMatches,
      SUM(CASE WHEN winner LIKE ? THEN 1 ELSE 0 END) AS player1Wins,
      SUM(CASE WHEN winner LIKE ? THEN 1 ELSE 0 END) AS player2Wins,
      AVG(CASE WHEN winner LIKE ? THEN ballsWon ELSE NULL END) AS player1AvgBallsWon,
      AVG(CASE WHEN winner LIKE ? THEN ballsWon ELSE NULL END) AS player2AvgBallsWon
    FROM player_matchups
    WHERE ((INSTR(player1 || ';' || player2, ?) > 0 AND INSTR(player1 || ';' || player2, ?) > 0))
          AND mode = ?
  `;

  const lastFiveHeadToHeadQuery = `
    SELECT winner, ballsWon
    FROM player_matchups
    WHERE ((INSTR(player1 || ';' || player2, ?) > 0 AND INSTR(player1 || ';' || player2, ?) > 0))
          AND mode = ?
    ORDER BY id DESC
    LIMIT 5
  `;

  const overallStatsQuery = () => `
    SELECT 
      COUNT(*) AS totalMatches,
      SUM(CASE WHEN winner = ? THEN 1 ELSE 0 END) AS wins,
      AVG(CASE WHEN winner = ? THEN ballsWon ELSE NULL END) AS avgBallsWon
    FROM player_matchups
    WHERE (INSTR(player1 || ';' || player2, ?) > 0)
          AND mode = ?
  `;

  const headToHeadParams = [
    player1,
    player2,
    player1,
    player2,
    player1,
    player2,
    mode,
  ];
  const h2h5Params = [player1, player2, mode];
  const overallStatsParams = (player: string) => [player, player, player, mode];

  db.get(
    headToHeadAllTimeQuery,
    headToHeadParams,
    (err, headToHeadRow: any) => {
      if (err) {
        return res.status(500).send("Error occurred: " + err.message);
      }

      db.all(lastFiveHeadToHeadQuery, h2h5Params, (err, lastFiveMatches) => {
        if (err) {
          return res.status(500).send("Error occurred: " + err.message);
        }

        db.get(
          overallStatsQuery(),
          overallStatsParams(player1),
          (err, overallStatsRow1: any) => {
            if (err) {
              return res.status(500).send("Error occurred: " + err.message);
            }

            db.get(
              overallStatsQuery(),
              overallStatsParams(player2),
              (err, overallStatsRow2: any) => {
                if (err) {
                  return res.status(500).send("Error occurred: " + err.message);
                }

                const h2hRecord1 = `${parseInt(headToHeadRow.player1Wins)}-${
                  parseInt(headToHeadRow.totalMatches) -
                  parseInt(headToHeadRow.player1Wins)
                }`;
                const h2hRecord2 = `${parseInt(headToHeadRow.player2Wins)}-${
                  parseInt(headToHeadRow.totalMatches) -
                  parseInt(headToHeadRow.player2Wins)
                }`;

                const overallRecord1 = `${parseInt(overallStatsRow1.wins)}-${
                  parseInt(overallStatsRow1.totalMatches) -
                  parseInt(overallStatsRow1.wins)
                }`;
                const overallRecord2 = `${parseInt(overallStatsRow2.wins)}-${
                  parseInt(overallStatsRow2.totalMatches) -
                  parseInt(overallStatsRow2.wins)
                }`;

                res.json({
                  headToHeadAllTime: {
                    totalMatches: headToHeadRow.totalMatches,
                    player1Wins: headToHeadRow.player1Wins,
                    player2Wins: headToHeadRow.player2Wins,
                    player1Record: h2hRecord1,
                    player2Record: h2hRecord2,
                    player1AvgBallsWon: headToHeadRow.player1AvgBallsWon
                      ? headToHeadRow.player1AvgBallsWon.toFixed(2)
                      : 0,
                    player2AvgBallsWon: headToHeadRow.player2AvgBallsWon
                      ? headToHeadRow.player2AvgBallsWon.toFixed(2)
                      : 0,
                  },
                  lastFiveHeadToHead: lastFiveMatches,
                  overallStatsPlayer1: {
                    totalMatches: overallStatsRow1.totalMatches,
                    winPercentage: (
                      (overallStatsRow1.wins / overallStatsRow1.totalMatches) *
                      100
                    ).toFixed(2),
                    avgBallsWon: overallStatsRow1.avgBallsWon
                      ? overallStatsRow1.avgBallsWon.toFixed(2)
                      : 0,
                    player1RecordOverall: overallRecord1,
                  },
                  overallStatsPlayer2: {
                    totalMatches: overallStatsRow2.totalMatches,
                    winPercentage: (
                      (overallStatsRow2.wins / overallStatsRow2.totalMatches) *
                      100
                    ).toFixed(2),
                    avgBallsWon: overallStatsRow2.avgBallsWon
                      ? overallStatsRow2.avgBallsWon.toFixed(2)
                      : 0,
                    player2RecordOverall: overallRecord2,
                  },
                });
              }
            );
          }
        );
      });
    }
  );
});

app.get("/api/matchups-p", (req, res) => {
  const { player1, player2, mode } = req.query;

  if (!player1 || !player2 || !mode) {
    return res
      .status(400)
      .send("Missing required parameters: player1, player2, and mode");
  }

  const sql = `
    SELECT 
      player1, player2, winner, ballsWon
    FROM player_matchups
    WHERE mode = ?
  `;

  db.all(sql, [mode], (err, rows) => {
    if (err) {
      return res.status(500).send("Error occurred: " + err.message);
    }

    let totalMatches = 0;
    let player1Wins = 0;
    let player2Wins = 0;
    let player1BallsWon = 0;
    let player2BallsWon = 0;
    let lastFiveMatches: any[] = [];
    let overallStatsRow1 = { wins: 0, totalMatches: 0, ballsWon: 0 };
    let overallStatsRow2 = { wins: 0, totalMatches: 0, ballsWon: 0 };

    rows.forEach((row: any, index) => {
      const players1 = row.player1.split(";");
      const players2 = row.player2.split(";");
      const winners = row.winner.split(";");

      if (
        (players1.includes(player1) && players2.includes(player2)) ||
        (players1.includes(player2) && players2.includes(player1))
      ) {
        totalMatches++;
        if (winners.includes(player1)) {
          player1Wins++;
          player1BallsWon += row.ballsWon;
        }
        if (winners.includes(player2)) {
          player2Wins++;
          player2BallsWon += row.ballsWon;
        }

        // Accumulate overall stats
        overallStatsRow1.totalMatches++;
        overallStatsRow2.totalMatches++;
        if (winners.includes(player1)) {
          overallStatsRow1.wins++;
          overallStatsRow1.ballsWon += row.ballsWon;
        }
        if (winners.includes(player2)) {
          overallStatsRow2.wins++;
          overallStatsRow2.ballsWon += row.ballsWon;
        }

        // Last five matches
        if (index < 5) {
          lastFiveMatches.push({ winner: row.winner, ballsWon: row.ballsWon });
        }
      }
    });

    // Calculate averages
    const player1AvgBallsWon =
      player1Wins > 0 ? (player1BallsWon / player1Wins).toFixed(2) : 0;
    const player2AvgBallsWon =
      player2Wins > 0 ? (player2BallsWon / player2Wins).toFixed(2) : 0;
    const overallPlayer1AvgBallsWon =
      overallStatsRow1.wins > 0
        ? (overallStatsRow1.ballsWon / overallStatsRow1.wins).toFixed(2)
        : 0;
    const overallPlayer2AvgBallsWon =
      overallStatsRow2.wins > 0
        ? (overallStatsRow2.ballsWon / overallStatsRow2.wins).toFixed(2)
        : 0;

    const h2hRecord1 = `${player1Wins}-${totalMatches - player1Wins}`;
    const h2hRecord2 = `${player2Wins}-${totalMatches - player2Wins}`;
    const overallRecord1 = `${overallStatsRow1.wins}-${
      overallStatsRow1.totalMatches - overallStatsRow1.wins
    }`;
    const overallRecord2 = `${overallStatsRow2.wins}-${
      overallStatsRow2.totalMatches - overallStatsRow2.wins
    }`;

    res.json({
      headToHeadAllTime: {
        totalMatches,
        player1Wins,
        player2Wins,
        player1Record: h2hRecord1,
        player2Record: h2hRecord2,
        player1AvgBallsWon,
        player2AvgBallsWon,
      },
      lastFiveHeadToHead: lastFiveMatches,
      overallStatsPlayer1: {
        totalMatches: overallStatsRow1.totalMatches,
        winPercentage: (
          (overallStatsRow1.wins / overallStatsRow1.totalMatches) *
          100
        ).toFixed(2),
        avgBallsWon: overallPlayer1AvgBallsWon,
        player1RecordOverall: overallRecord1,
      },
      overallStatsPlayer2: {
        totalMatches: overallStatsRow2.totalMatches,
        winPercentage: (
          (overallStatsRow2.wins / overallStatsRow2.totalMatches) *
          100
        ).toFixed(2),
        avgBallsWon: overallPlayer2AvgBallsWon,
        player2RecordOverall: overallRecord2,
      },
    });
  });
});

app.get("/api/tournamentData/", (req, res) => {
  const mode = req.query.mode;

  db.all(
    "SELECT * FROM player_actions WHERE mode = ?",
    [mode],
    (err, actions) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }

      const summaryMap = new Map();
      const matchupsSet = new Set();

      if (actions.length === 0) {
        return res.json({ playerSummaries: [], matchups: [] });
      }

      actions.forEach((action: any) => {
        const playerTournamentKey = `${action.playerName}-${action.tournamentId}`;
        if (!summaryMap.has(playerTournamentKey)) {
          summaryMap.set(playerTournamentKey, {
            playerName: action.playerName,
            tournamentId: action.tournamentId,
            totalFpts: 0,
            actions: [],
          });
        }
        const playerSummary = summaryMap.get(playerTournamentKey);

        const actionFpts = action.actionCount * action.actionValue;
        playerSummary.totalFpts += actionFpts;

        playerSummary.actions.push({
          ...action,
          fpts: actionFpts,
          count: action.actionCount,
        });
      });

      db.all(
        "SELECT * FROM player_matchups WHERE mode = ?",
        [mode],
        (err, matchups) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Internal Server Error");
          }

          matchups.forEach((matchup) => {
            matchupsSet.add(matchup);
          });

          const playerSummaries = Array.from(summaryMap.values());
          const uniqueMatchups = Array.from(matchupsSet);
          res.json({ playerSummaries, matchups: uniqueMatchups });
        }
      );
    }
  );
});

app.get("/api/tournamentBestWorst/", (req, res) => {
  const mode = req.query.mode;

  db.all(
    "SELECT * FROM player_actions WHERE mode = ?",
    [mode],
    (err, actions) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }

      const summaryMap = new Map();

      if (actions.length === 0) {
        return res.json({ playerSummaries: [] });
      }

      actions.forEach((action: any) => {
        const playerTournamentKey = `${action.playerName}-${action.tournamentId}`;
        if (!summaryMap.has(playerTournamentKey)) {
          summaryMap.set(playerTournamentKey, {
            playerName: action.playerName,
            tournamentId: action.tournamentId,
            totalFpts: 0,
          });
        }
        const playerSummary = summaryMap.get(playerTournamentKey);
        const actionFpts = action.actionCount * action.actionValue;
        playerSummary.totalFpts += actionFpts;
      });

      const playerBestWorst: any = {};

      summaryMap.forEach((value, key) => {
        const [playerName, tournamentId] = key.split("-");
        if (!playerBestWorst[playerName]) {
          playerBestWorst[playerName] = {
            best: { tournamentId, totalFpts: -Infinity },
            worst: { tournamentId, totalFpts: Infinity },
          };
        }

        if (value.totalFpts > playerBestWorst[playerName].best.totalFpts) {
          playerBestWorst[playerName].best = {
            tournamentId,
            totalFpts: value.totalFpts,
          };
        }

        if (value.totalFpts < playerBestWorst[playerName].worst.totalFpts) {
          playerBestWorst[playerName].worst = {
            tournamentId,
            totalFpts: value.totalFpts,
          };
        }
      });

      res.json({ playerBestWorst });
    }
  );
});

app.get("/api/allPlayers/", (req, res) => {
  const { mode } = req.query;

  if (!mode) {
    return res.status(400).send("Missing required parameters: mode");
  }

  const sql = `
    SELECT 
      DISTINCT(playerName)
    FROM player_actions
    WHERE mode = ?
  `;

  db.all(sql, [mode], (err, rows) => {
    if (err) {
      return res.status(500).send("Error occurred: " + err.message);
    }

    let names: string[] = [];

    rows.forEach((row: any) => {
      names.push(row.playerName);
    });

    return res.json({ names });
  });
});

app.post("/api/addSeason/", (req, res) => {
  const {
    seasonName,
    startSinglesId,
    endSinglesId,
    startDoublesId,
    endDoublesId,
  } = req.body;

  if (
    !seasonName ||
    typeof startSinglesId !== "number" ||
    typeof endSinglesId !== "number" ||
    typeof startDoublesId !== "number" ||
    typeof endDoublesId !== "number"
  ) {
    return res.status(400).send({
      error: "All fields are required and must be correctly formatted",
    });
  }

  const checkSql = `SELECT COUNT(*) AS count FROM season_map WHERE seasonName = ?`;

  db.get(checkSql, [seasonName], (err, row: any) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send({ error: err.message });
    }

    if (row.count > 0) {
      return res.status(200).send({ error: "Season name already exists" });
    }

    const insertSql = `INSERT INTO season_map (seasonName, startSinglesId, endSinglesId, startDoublesId, endDoublesId) VALUES (?, ?, ?, ?, ?)`;

    db.run(
      insertSql,
      [seasonName, startSinglesId, endSinglesId, startDoublesId, endDoublesId],
      function (err) {
        if (err) {
          console.error(err.message);
          res.status(500).send({ error: err.message });
        } else {
          res
            .status(201)
            .send({ message: "Season added successfully", id: this.lastID });
        }
      }
    );
  });
});

app.get("/api/getSeasons", (_, res) => {
  const sql = `SELECT id, seasonName FROM season_map`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      // Handle the error
      res.status(500).send({ error: err.message });
      return;
    }

    // Create an object with season names and their IDs
    const seasons = rows.reduce((acc: any, row: any) => {
      acc[row.id] = row.seasonName;
      return acc;
    }, {});

    // Send the response
    res.status(200).json(seasons);
  });
});

/*  _______________________ FANTASY GAME ENDPOINTS _________________________ */

app.get("/api/fantasy/createLeague", (req, res) => {
  const members = req.query.members;
  if (!members) {
    return res.status(400).send({ error: "Members string is required." });
  }

  const leagueId = uuidv4();

  dbFantasy.run(
    `INSERT INTO leagues (leagueId, members) VALUES (?, ?)`,
    [leagueId, members],
    (err) => {
      if (err) {
        console.error(err.message);
        res.status(500).send({ error: "Failed to create league" });
      } else {
        res.status(200).send({ leagueId: leagueId });
      }
    }
  );
});

app.post("/api/fantasy/addPlayer", async (req, res) => {
  const { leagueId, playerName, teamName, ...rosterDetails } = req.body;

  const t = (await getNextTournamentId("player_actions", "'singles'")) - 1;

  // Validate leagueId exists
  dbFantasy.get(
    `SELECT members FROM leagues WHERE leagueId = ?`,
    [leagueId],
    (err, row: any) => {
      if (err) {
        return res.status(500).send({ error: "Error querying leagues" });
      }
      if (!row) {
        return res.status(404).send({ error: "League not found" });
      }

      // Validate playerName is a member
      const members = row.members.split("|");
      if (!members.includes(playerName)) {
        return res
          .status(400)
          .send({ error: "Player is not a member of the league" });
      }

      // Insert into playerMap and rosters
      const playerId = uuidv4();
      dbFantasy.run(
        `INSERT INTO playerMap (teamName, playerName, playerId, leagueId) VALUES (?, ?, ?, ?)`,
        [teamName, playerName, playerId, leagueId],
        (err) => {
          if (err) {
            return res
              .status(500)
              .send({ error: "Error inserting into playerMap" });
          }

          dbFantasy.run(
            `INSERT INTO rosters (playerId, startTournamentId, leagueId, T8BI, FPBI, OPBI, OBI, S, GSS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              playerId,
              t,
              leagueId,
              rosterDetails.T8BI,
              rosterDetails.FPBI,
              rosterDetails.OPBI,
              rosterDetails.OBI,
              rosterDetails.S,
              rosterDetails.GSS,
            ],
            (err) => {
              if (err) {
                return res.status(500).send({
                  error: `Error inserting into rosters: ${err.toString()}`,
                });
              }

              res.status(201).send({ leagueId: leagueId, playerId: playerId });
            }
          );
        }
      );
    }
  );
});

app.get("/api/fantasy/checkPlayerInRoster", (req, res) => {
  const { playerId, leagueId } = req.query;

  // First, get the team name from the playerMap
  dbFantasy.get(
    `SELECT teamName FROM playerMap WHERE playerId = ? AND leagueId = ?`,
    [playerId, leagueId],
    (err, playerMapRow: any) => {
      if (err) {
        return res.status(500).send({ error: err.toString() });
      }
      if (!playerMapRow) {
        return res
          .status(404)
          .send({ message: "Player not found in playerMap" });
      }

      const teamName = playerMapRow.teamName;

      // Then, get the roster details
      dbFantasy.get(
        `SELECT * FROM rosters WHERE playerId = ? AND leagueId = ?`,
        [playerId, leagueId],
        (err, rosterRow: any) => {
          if (err) {
            return res.status(500).send({ error: err.toString() });
          }
          if (!rosterRow) {
            return res
              .status(404)
              .send({ message: "Player not found in rosters" });
          }

          // Send back the roster details along with the team name
          res.status(200).send({
            message: "Player exists in rosters",
            teamName: teamName,
            playerId: playerId,
            roster: {
              T8BI: rosterRow.T8BI,
              FPBI: rosterRow.FPBI,
              OPBI: rosterRow.OPBI,
              OBI: rosterRow.OBI,
              S: rosterRow.S,
              GSS: rosterRow.GSS,
              // Include other roster fields if necessary
            },
          });
        }
      );
    }
  );
});

app.post("/api/fantasy/getPlayerStats", (req, res) => {
  const { playerId, leagueId, adder, roster } = req.body;

  if (!playerId || !leagueId || typeof adder !== "number" || !roster) {
    return res.json({ error: "Invalid Request" });
  }

  dbFantasy.get(
    `SELECT startTournamentId FROM rosters WHERE playerId = ? AND leagueId = ?`,
    [playerId, leagueId],
    (err, row: any) => {
      if (err) {
        return res.status(500).send({ error: err.message });
      }
      if (!row) {
        return res.status(404).send({ message: "Roster not found" });
      }

      const promises = Object.keys(roster).map((fantasyStat) => {
        let newTournamentId = parseInt(row.startTournamentId) + adder;
        let playerName = roster[fantasyStat];

        return new Promise((resolve, reject) => {
          db.all(
            `SELECT * FROM player_actions WHERE tournamentId = ? AND playerName = ?`,
            [newTournamentId, playerName],
            (err, actions) => {
              if (err) {
                reject(err);
              } else {
                resolve(actions);
              }
            }
          );
        });
      });

      Promise.all(promises)
        .then((allActions) => {
          let FPBI = { count: [0, 0], value: 0, player: "" };
          let OPBI = { count: [0, 0], value: 0, player: "" };
          let T8BI = { count: [0, 0], value: 0, player: "" };
          let OBI = { count: 0, value: 0, player: "" };
          let S = { count: 0, value: 0, player: "" };

          let x = Object.keys(roster);
          for (let i = 0; i < x.length; i++) {
            const fp = roster[x[i]];
            const stat = x[i];

            allActions.flat().forEach((action: any) => {
              if (action.playerName != fp) {
                return;
              }

              if (stat == "FPBI") {
                FPBI.player = fp;
              } else if (stat == "T8BI") {
                T8BI.player = fp;
              } else if (stat == "OPBI") {
                OPBI.player = fp;
              } else if (stat == "OBI") {
                OBI.player = fp;
              } else if (stat == "S") {
                S.player = fp;
              }

              switch (action.actionType) {
                case "3 Ball In":
                  if (stat != "FPBI") {
                    break;
                  }
                  FPBI.count[0] += action.actionCount;
                  FPBI.value += Math.abs(
                    action.actionCount * action.actionValue
                  );
                  FPBI.player = action.playerName;
                  break;
                case "4+ Ball In":
                  if (stat != "FPBI") {
                    break;
                  }
                  FPBI.count[1] += action.actionCount;
                  FPBI.value += Math.abs(
                    action.actionCount * action.actionValue
                  );
                  FPBI.player = action.playerName;
                  break;
                case "Ball In":
                  if (stat != "OPBI") {
                    break;
                  }
                  OPBI.count[0] += action.actionCount;
                  OPBI.value += Math.abs(
                    action.actionCount * action.actionValue
                  );
                  OPBI.player = action.playerName;
                  break;
                case "2 Ball In":
                  if (stat != "OPBI") {
                    break;
                  }
                  OPBI.count[1] += action.actionCount;
                  OPBI.value += Math.abs(
                    action.actionCount * action.actionValue
                  );
                  OPBI.player = action.playerName;
                  break;
                case "8 Ball In":
                  if (stat != "T8BI") {
                    break;
                  }
                  T8BI.count[0] += action.actionCount;
                  T8BI.value += action.actionCount * action.actionValue;
                  T8BI.player = action.playerName;
                  break;
                case "Opp. 8 Ball In":
                  if (stat != "T8BI") {
                    break;
                  }
                  T8BI.count[1] += action.actionCount;
                  T8BI.value += action.actionCount * action.actionValue;
                  T8BI.player = action.playerName;
                  break;
                case "Opp Ball In":
                  if (stat != "OBI") {
                    break;
                  }
                  OBI.count += action.actionCount;
                  OBI.value += Math.abs(
                    action.actionCount * action.actionValue
                  );
                  OBI.player = action.playerName;
                  break;
                case "Scratch":
                  if (stat != "S") {
                    break;
                  }
                  S.count += action.actionCount;
                  S.value += Math.abs(action.actionCount * action.actionValue);
                  S.player = action.playerName;
                  break;
              }
            });
          }

          res.status(200).send({ FPBI, OPBI, T8BI, OBI, S });
        })
        .catch((error) => {
          res.status(500).send({ error: error.message });
        });
    }
  );
});

app.get("/api/fantasy/createMatchups", (req, res) => {
  const leagueId = req.query.leagueId;
  const numWeeks = parseInt(req.query.numWeeks as string);

  if (!leagueId || isNaN(numWeeks)) {
    return res.status(400).send({ error: "Invalid input" });
  }

  dbFantasy.all(
    `SELECT playerId, startTournamentId FROM rosters WHERE leagueId = ?`,
    [leagueId],
    (err, rosters: any) => {
      if (err) {
        return res.status(500).send({ error: err.message });
      }

      if (rosters.length < 2) {
        return res.status(400).send({ error: "Not enough teams for matchups" });
      }

      let matchups = [];

      for (let week = 1; week <= numWeeks; week++) {
        for (let i = 0; i < rosters.length; i += 2) {
          // Ensuring not to exceed array bounds
          if (i + 1 >= rosters.length) {
            break;
          }

          const team1 = rosters[i];
          const team2 = rosters[i + 1];

          matchups.push({
            leagueId: leagueId,
            team1Id: team1.playerId,
            team2Id: team2.playerId,
            tournamentId: team1.startTournamentId + week - 1,
          });
        }
      }

      // Insert matchups into the database
      const insertMatchup = dbFantasy.prepare(
        `INSERT INTO matchups (team1Id, team2Id, winnerId, tournamentId, leagueId) VALUES (?, ?, '', ?, ?)`
      );
      matchups.forEach((matchup) => {
        insertMatchup.run([
          matchup.team1Id,
          matchup.team2Id,
          matchup.tournamentId,
          matchup.leagueId,
        ]);
      });

      insertMatchup.finalize();

      res.status(200).send({ message: "Matchups created successfully" });
    }
  );
});

app.get("/api/fantasy/getMatchups", (req, res) => {
  const leagueId = req.query.leagueId;

  if (!leagueId) {
    return res.status(400).send({ error: "League ID is required" });
  }

  dbFantasy.all(
    `SELECT * FROM matchups WHERE leagueId = ?`,
    [leagueId],
    (err, matchups: any) => {
      if (err) {
        return res.status(500).send({ error: err.message });
      }

      let matchupPromises = matchups.map((matchup: any) => {
        return new Promise((resolve, reject) => {
          dbFantasy.get(
            `SELECT teamName FROM playerMap WHERE playerId = ? AND leagueId = ?`,
            [matchup.team1Id, leagueId],
            (err, team1: any) => {
              if (err) {
                reject(err);
              } else {
                dbFantasy.get(
                  `SELECT teamName FROM playerMap WHERE playerId = ? AND leagueId = ?`,
                  [matchup.team2Id, leagueId],
                  (err, team2: any) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve({
                        ...matchup,
                        team1Name: team1 ? team1.teamName : "Unknown Team 1",
                        team2Name: team2 ? team2.teamName : "Unknown Team 2",
                      });
                    }
                  }
                );
              }
            }
          );
        });
      });

      Promise.all(matchupPromises)
        .then((result) => {
          res.status(200).send(result);
        })
        .catch((error) => {
          res.status(500).send({ error: error.message });
        });
    }
  );
});

app.get("/api/fantasy/getCurrentMatchup", async (req, res) => {
  const leagueId = req.query.leagueId;
  const playerId = req.query.playerId;

  if (!leagueId) {
    return res.status(400).send({ error: "League ID is required" });
  }

  if (!playerId) {
    return res.status(400).send({ error: "Player ID is required" });
  }

  try {
    const currentTournamentId =
      (await getNextTournamentId("player_actions", "'singles'")) - 1;

    dbFantasy.get(
      `SELECT * FROM matchups WHERE leagueId = ? AND tournamentId = ? AND (team1Id = ? OR team2Id = ?)`,
      [leagueId, currentTournamentId, playerId, playerId],
      (err, matchup: any) => {
        if (err) {
          return res.status(500).send({ error: err.message });
        }

        if (!matchup) {
          return res.status(404).send({ message: "Matchup not found" });
        }

        // Fetch team names from playerMap using the player IDs from the matchup
        const team1Promise = new Promise((resolve, reject) => {
          dbFantasy.get(
            `SELECT teamName FROM playerMap WHERE playerId = ? AND leagueId = ?`,
            [matchup.team1Id, leagueId],
            (err, team1) => {
              if (err) reject(err);
              else resolve(team1);
            }
          );
        });

        const team2Promise = new Promise((resolve, reject) => {
          dbFantasy.get(
            `SELECT teamName FROM playerMap WHERE playerId = ? AND leagueId = ?`,
            [matchup.team2Id, leagueId],
            (err, team2) => {
              if (err) reject(err);
              else resolve(team2);
            }
          );
        });

        Promise.all([team1Promise, team2Promise])
          .then(([team1, team2]: any) => {
            res.status(200).send({
              ...matchup,
              team1Name: team1 ? team1.teamName : "Unknown Team 1",
              team2Name: team2 ? team2.teamName : "Unknown Team 2",
            });
          })
          .catch((error) => {
            res.status(500).send({ error: error.message });
          });
      }
    );
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

const scorePlayer = (roster: any, allActions: any) => {
  let FPBI = { count: [0, 0], value: 0, player: "" };
  let OPBI = { count: [0, 0], value: 0, player: "" };
  let T8BI = { count: [0, 0], value: 0, player: "" };
  let OBI = { count: 0, value: 0, player: "" };
  let S = { count: 0, value: 0, player: "" };

  let x = Object.keys(roster);
  for (let i = 0; i < x.length; i++) {
    const fp = roster[x[i]];
    const stat = x[i];

    allActions.flat().forEach((action: any) => {
      if (action.playerName != fp) {
        return;
      }

      if (stat == "FPBI") {
        FPBI.player = fp;
      } else if (stat == "T8BI") {
        T8BI.player = fp;
      } else if (stat == "OPBI") {
        OPBI.player = fp;
      } else if (stat == "OBI") {
        OBI.player = fp;
      } else if (stat == "S") {
        S.player = fp;
      }

      switch (action.actionType) {
        case "3 Ball In":
          if (stat != "FPBI") {
            break;
          }
          FPBI.count[0] += action.actionCount;
          FPBI.value += Math.abs(action.actionCount * action.actionValue);
          FPBI.player = action.playerName;
          break;
        case "4+ Ball In":
          if (stat != "FPBI") {
            break;
          }
          FPBI.count[1] += action.actionCount;
          FPBI.value += Math.abs(action.actionCount * action.actionValue);
          FPBI.player = action.playerName;
          break;
        case "Ball In":
          if (stat != "OPBI") {
            break;
          }
          OPBI.count[0] += action.actionCount;
          OPBI.value += Math.abs(action.actionCount * action.actionValue);
          OPBI.player = action.playerName;
          break;
        case "2 Ball In":
          if (stat != "OPBI") {
            break;
          }
          OPBI.count[1] += action.actionCount;
          OPBI.value += Math.abs(action.actionCount * action.actionValue);
          OPBI.player = action.playerName;
          break;
        case "8 Ball In":
          if (stat != "T8BI") {
            break;
          }
          T8BI.count[0] += action.actionCount;
          T8BI.value += action.actionCount * action.actionValue;
          T8BI.player = action.playerName;
          break;
        case "Opp. 8 Ball In":
          if (stat != "T8BI") {
            break;
          }
          T8BI.count[1] += action.actionCount;
          T8BI.value += action.actionCount * action.actionValue;
          T8BI.player = action.playerName;
          break;
        case "Opp Ball In":
          if (stat != "OBI") {
            break;
          }
          OBI.count += action.actionCount;
          OBI.value += Math.abs(action.actionCount * action.actionValue);
          OBI.player = action.playerName;
          break;
        case "Scratch":
          if (stat != "S") {
            break;
          }
          S.count += action.actionCount;
          S.value += Math.abs(action.actionCount * action.actionValue);
          S.player = action.playerName;
          break;
      }
    });
  }

  return { FPBI, OPBI, T8BI, OBI, S };
};

async function scoreMatchup(
  playerId1: string,
  playerId2: string,
  leagueId: string,
  tournamentId: number
) {
  try {
    const rosters: any = await getRosters([playerId1, playerId2], leagueId);
    let scores: any = {};

    for (const roster of rosters) {
      const actions = await getPlayerActions(tournamentId, leagueId);
      let totalScore = calculateTotalScore(actions, roster);
      scores[roster.playerId] = totalScore;
    }

    return scores;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
}

function getRosters(playerIds: any, leagueId: any) {
  return new Promise((resolve, reject) => {
    dbFantasy.all(
      `SELECT * FROM rosters WHERE leagueId = ? AND playerId IN (?, ?)`,
      [leagueId, ...playerIds],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function getPlayerActions(tournamentId: any, leagueId: any) {
  return new Promise(async (resolve, reject) => {
    db.all(
      `SELECT * FROM player_actions WHERE tournamentId = ?`,
      [tournamentId],
      (err, actions) => {
        if (err) reject(err);
        else resolve(actions);
      }
    );
  });
}

function calculateTotalScore(actions: any, roster: any) {
  let scores = scorePlayer(roster, actions);
  let totalScore = 0;

  for (const action of Object.values(scores)) {
    // Replace with actual scoring logic
    totalScore += action.value;
  }
  return totalScore;
}

function getPlayerNameFromId(playerId: string, leagueId: string) {
  return new Promise((resolve, reject) => {
    dbFantasy.get(
      `SELECT playerName FROM playerMap WHERE playerId = ? AND leagueId = ?`,
      [playerId, leagueId],
      (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(row);
        } else {
          reject("");
        }
      }
    );
  });
}

function getPlayerIdFromName(playerName: string, leagueId: string) {
  return new Promise((resolve, reject) => {
    dbFantasy.get(
      `SELECT playerId FROM playerMap WHERE playerName = ? AND leagueId = ?`,
      [playerName, leagueId],
      (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(row);
        } else {
          reject("");
        }
      }
    );
  });
}

app.get("/api/fantasy/scoreCurrentMatchup", async (req, res) => {
  const leagueId = req.query.leagueId;

  if (!leagueId) {
    return res.status(400).send({ error: "League ID is required" });
  }

  try {
    const currentTournamentId =
      (await getNextTournamentId("player_actions", "'singles'")) - 1;

    // Step 2: Fetch all league members
    dbFantasy.get(
      `SELECT members FROM leagues WHERE leagueId = ?`,
      [leagueId],
      async (err, league: any) => {
        if (err) {
          return res.status(500).send({ error: err.message });
        }

        if (!league) {
          return res.status(404).send({ message: "League not found" });
        }

        const members = league.members.split("|");

        const scorePromises = members.map((memberId: any) => {
          // Step 3: Find the member's matchup
          return new Promise(async (matchupResolve, matchupReject) => {
            const mid: any = await getPlayerIdFromName(
              memberId,
              leagueId as string
            );

            let memId = mid.playerId;

            dbFantasy.get(
              `SELECT * FROM matchups WHERE leagueId = ? AND tournamentId = ? AND (team1Id = ? OR team2Id = ?)`,
              [leagueId, currentTournamentId, memId, memId],
              (err, matchup: any) => {
                if (err) {
                  matchupReject(err);
                } else {
                  // Proceed with scoring if matchup exists
                  if (matchup && matchup.winnerId === "") {
                    // Assuming empty string means unscored
                    // Step 4: Use the scoring functionality (assume it's a function that returns a promise)
                    scoreMatchup(
                      matchup.team1Id,
                      matchup.team2Id,
                      leagueId as string,
                      currentTournamentId
                    )
                      .then(async (data) => {
                        const sql = `UPDATE matchups 
                        SET score1 = ?, score2 = ?, winnerId = ?
                        WHERE leagueId = ? AND tournamentId = ? AND team1Id = ? AND team2Id = ?`;

                        let player1Score = 0;
                        let player2Score = 0;
                        let winner: any = "";

                        const player1Id = Object.keys(data)[0];
                        const player2Id = Object.keys(data)[1];

                        if (Object.keys(data)[0] == matchup.team1Id) {
                          player1Score = data[player1Id];
                          player2Score = data[player2Id];
                        } else {
                          player1Score = data[player2Id];
                          player2Score = data[player1Id];
                        }

                        winner =
                          player1Score > player2Score ? player1Id : player2Id;

                        const items = [
                          player1Score,
                          player2Score,
                          winner,
                          leagueId,
                          currentTournamentId,
                          player1Id,
                          player2Id,
                        ];

                        dbFantasy.run(sql, items, function (err) {
                          console.log(`ERR: ${err}`);
                        });
                      })
                      .catch(matchupReject);
                  } else {
                    matchupResolve(null); // No action needed for this member
                  }
                }
              }
            );
          });
        });

        Promise.all(scorePromises)
          .then((results) => {
            // Filter null results and return the scored matchups
            res.status(200).send(results.filter((matchup) => matchup !== null));
          })
          .catch((error) => {
            res.status(500).send({ error: error.message });
          });
      }
    );
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
  res.send({ success: true });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/api`);
});
