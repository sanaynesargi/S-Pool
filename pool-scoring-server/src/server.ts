import cors from "cors";
import express from "express";
import sqlite3 from "sqlite3";

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

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS player_actions (
    id INTEGER PRIMARY KEY,
    playerName TEXT,
    actionType TEXT,
    actionValue INTEGER,
    actionCount INTEGER,
    mode TEXT
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
    mode TEXT
);`);
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

const insertMatchups = (matchups: Matchup[], mode: string) => {
  const insertStatement = `INSERT INTO player_matchups (player1, player2, winner, ballsWon, overtime, mode) VALUES (?, ?, ?, ?, ?, ?);`;

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

const addPlayerActions = (actions: PlayerAction[], mode: string) => {
  const newActions = convertDataToPlayerActions(actions, mode);

  if (newActions.length == 0) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const placeholders = newActions.map(() => "(?, ?, ?, ?, ?)").join(", ");
    const values = newActions.flatMap((a) => [
      a.playerName,
      a.actionType,
      scoreMap[a.actionType],
      a.actionCount,
      a.mode,
    ]);

    const sql = `INSERT INTO player_actions (playerName, actionType, actionValue, actionCount, mode) VALUES ${placeholders}`;

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

    await addPlayerActions(actions.playerActionCounts!, actions.mode!);
    const playerNames = Object.keys(actions.playerActionCounts!);
    await incrementGamesPlayed(playerNames, actions.mode!);
    await incrementMiniGamesPlayed(actions.playerGameCounts!, actions.mode!);
    await addPlayerStandings(actions.standings!, actions.mode!);
    insertMatchups(actions.matches!, actions.mode!);
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

app.post("api/end-game", async (req, res) => {
  try {
    const actions: PlayerAction[] = req.body;
    await endGame(actions);
    res.status(200).send("Game ended and actions saved successfully");
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("api/total-points", (req, res) => {
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

app.get("api/average-points-per-game", (req, res) => {
  const query = req.query;

  if (!query.mode) {
    res.status(404).json({ Error: "Invalid Request" });
    return;
  }

  const sql = `
    SELECT a.playerName, 
           IFNULL(SUM(a.actionValue * a.actionCount), 0) as totalPoints, 
           IFNULL(b.gamesPlayed, 0) as gamesPlayed
    FROM player_actions a
    LEFT JOIN player_games b ON a.playerName = b.playerName
    WHERE a.mode = '${query.mode}' AND b.mode = '${query.mode}'
    GROUP BY a.playerName
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      const averagePointsPerGame = rows.reduce((acc: any, row: any) => {
        acc[row.playerName] =
          row.gamesPlayed > 0
            ? (row.totalPoints / row.gamesPlayed).toFixed(2)
            : 0;
        return acc;
      }, {});
      res.status(200).json(averagePointsPerGame);
    }
  });
});

app.get("api/latest-tournament-points", (req, res) => {
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

app.get("api/average-points-per-tournament-game", (req, res) => {
  const query = req.query;

  if (!query.mode) {
    res.status(404).json({ Error: "Invalid Request" });
    return;
  }

  const sql = `
  SELECT ptg.playerName, 
         IFNULL(SUM(pa.actionValue * pa.actionCount), 0) as totalPoints, 
         IFNULL(ptg.gamesPlayed, 0) as gamesPlayed
  FROM player_tournament_games ptg
  LEFT JOIN player_actions pa ON ptg.playerName = pa.playerName AND ptg.mode = pa.mode
  WHERE ptg.mode = '${query.mode}'
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

app.get("api/average-standings-per-game", (req, res) => {
  const query = req.query;

  if (!query.mode) {
    res.status(404).json({ Error: "Invalid Request" });
    return;
  }

  const sql = `
    SELECT playerName, AVG(standing) AS average_standing
    FROM player_standings WHERE mode = '${query.mode}'
    GROUP BY playerName;
  `;

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

app.get("api/total-tournaments-played", (req, res) => {
  const query = req.query;

  if (!query.mode) {
    res.status(404).json({ Error: "Invalid Request" });
    return;
  }

  const sql = `
    SELECT playerName, gamesPlayed
    FROM player_games WHERE mode = '${query.mode}'
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

app.get("api/player-ppt", (req, res) => {
  const query = req.query;

  if (!query.mode) {
    res.status(404).json({ Error: "Invalid Request" });
    return;
  }

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
        mode = '${query.mode}'
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
        obj[entry.playerName] =
          Math.round(entry.averageValuePerAction * 1000) / 1000;
      }

      res.status(200).json(obj);
    }
  });
});

app.get("api/player-tt", (req, res) => {
  const query = req.query;

  if (!query.mode) {
    res.status(404).json({ Error: "Invalid Request" });
    return;
  }

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
        mode = '${query.mode}'
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

app.get("api/total-games-played", (req, res) => {
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

app.get("api/player-actions-stats", (req, res) => {
  const query = req.query;

  if (!query.mode) {
    res
      .status(404)
      .json({ Error: "Invalid Request: mode parameter is required" });
    return;
  }

  const sql = `
    SELECT 
        playerName, 
        actionType,
        SUM(actionCount) AS totalActionCount, 
        SUM(actionValue * actionCount) AS totalActionValue
    FROM 
        player_actions
    WHERE 
        mode = '${query.mode}'
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

app.get("api/player-actions-stats-averages", (req, res) => {
  const query = req.query;

  if (!query.mode) {
    res
      .status(404)
      .json({ Error: "Invalid Request: mode parameter is required" });
    return;
  }

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
        pa.mode = '${query.mode}'
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

app.get("api/player-actions-stats-average-tournaments", (req, res) => {
  const query = req.query;

  if (!query.mode) {
    res
      .status(404)
      .json({ Error: "Invalid Request: mode parameter is required" });
    return;
  }

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
        pa.mode = '${query.mode}'
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

app.get("api/matchups", (req, res) => {
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

  const overallStatsQuery = (player: string) => `
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
          overallStatsQuery(player1),
          overallStatsParams(player1),
          (err, overallStatsRow1: any) => {
            if (err) {
              return res.status(500).send("Error occurred: " + err.message);
            }

            db.get(
              overallStatsQuery(player2),
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

app.get("api/matchups-p", (req, res) => {
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/api);
});
