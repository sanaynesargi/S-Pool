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

app.post("/end-game", async (req, res) => {
  try {
    const actions: PlayerAction[] = req.body;
    await endGame(actions);
    res.status(200).send("Game ended and actions saved successfully");
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/total-points", (req, res) => {
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

app.get("/average-points-per-game", (req, res) => {
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

app.get("/average-points-per-tournament-game", (req, res) => {
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

app.get("/average-standings-per-game", (req, res) => {
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

app.get("/total-tournaments-played", (req, res) => {
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

app.get("/player-ppt", (req, res) => {
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

app.get("/player-tt", (req, res) => {
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

app.get("/total-games-played", (req, res) => {
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

app.get("/player-actions-stats", (req, res) => {
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

app.get("/player-actions-stats-averages", (req, res) => {
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

      // console.log(stats);

      res.status(200).json(stats);
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
