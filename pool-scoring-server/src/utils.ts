export async function getAveragePointsPerTournament(
  mode: any,
  seasonId: any,
  db: any
) {
  if (!mode) {
    throw new Error("Invalid Request: mode parameter is required");
  }

  const seasonFilter =
    seasonId != ""
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
           IFNULL(b.gamesPlayed, 0) as gamesPlayed,
           COUNT(DISTINCT(a.tournamentId)) as tid
    FROM player_actions a
    LEFT JOIN player_games b ON a.playerName = b.playerName AND b.mode = a.mode
    ${seasonFilter}
    WHERE a.mode = '${mode}'
    GROUP BY a.playerName
  `;

  return new Promise((resolve, reject) => {
    db.all(sql, [], (err: any, rows: any) => {
      if (err) {
        reject(err);
      } else {
        const averagePointsPerGame = rows.reduce((acc: any, row: any) => {
          acc[row.playerName] =
            row.gamesPlayed > 0
              ? (row.totalPoints / (row.tid ?? row.gamesPlayed)).toFixed(2)
              : "0.00";
          return acc;
        }, {});
        resolve(averagePointsPerGame);
      }
    });
  });
}

export async function getAveragePointsPerGame(
  mode: any,
  seasonId: any,
  db: any
) {
  if (!mode) {
    throw new Error("Invalid Request: mode parameter is required");
  }

  const seasonFilter =
    seasonId != ""
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

  const addedJoin = `LEFT JOIN season_games sg ON ptg.playerName = sg.playerName AND ptg.mode = sg.mode AND sg.seasonId = ${seasonId}`;

  const sql = `
    SELECT ptg.playerName,
           IFNULL(SUM(pa.actionValue * pa.actionCount), 0) as totalPoints,
           IFNULL(ptg.gamesPlayed, 0) as gamesPlayed
           ${seasonId != "" ? ",sg.gamesPlayed as tid" : ""}
    FROM player_tournament_games ptg
    LEFT JOIN player_actions pa ON ptg.playerName = pa.playerName AND ptg.mode = pa.mode
    ${seasonId != "" ? addedJoin : ""}
    ${seasonFilter}
    WHERE ptg.mode = '${mode}'
    GROUP BY ptg.playerName
  `;

  return new Promise((resolve, reject) => {
    db.all(sql, [], (err: any, rows: any) => {
      if (err) {
        reject(err);
      } else {
        const averagePointsPerGame = rows.reduce((acc: any, row: any) => {
          acc[row.playerName] =
            row.tid > 0 || row.gamesPlayed > 0
              ? (row.totalPoints / (row.tid ?? row.gamesPlayed)).toFixed(2)
              : "0.00";

          return acc;
        }, {});
        resolve(averagePointsPerGame);
      }
    });
  });
}

export async function getAveragePointsPerStroke(
  mode: any,
  seasonId: any,
  db: any
) {
  if (!mode) {
    throw new Error("Invalid Request: mode parameter is required");
  }

  const seasonFilter =
    seasonId != ""
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

  return new Promise((resolve, reject) => {
    db.all(sql, [], (err: any, rows: any) => {
      if (err) {
        reject(err);
      } else {
        let obj: any = {};

        for (let entry of rows) {
          obj[entry.playerName] =
            Math.round(entry.averageValuePerAction * 1000) / 1000;
        }

        resolve(obj);
      }
    });
  });
}

export async function getTournamentScores(mode: any, seasonId: any, db: any) {
  const seasonFilter =
    seasonId != "" && mode != "allstar"
      ? `JOIN (SELECT ${
          mode === "doubles"
            ? "startDoublesId, endDoublesId"
            : "startSinglesId, endSinglesId"
        }
         FROM season_map WHERE id = ${seasonId}) sm
     ON tournamentId BETWEEN sm.${
       mode === "doubles"
         ? "startDoublesId AND sm.endDoublesId"
         : "startSinglesId AND sm.endSinglesId"
     }`
      : "";

  return new Promise((resolve, _) => {
    db.all(
      `SELECT pa.* FROM player_actions pa
   ${seasonFilter}
   WHERE pa.mode = ?`,
      [mode],
      (err: any, actions: any) => {
        if (err) {
          return;
        }

        const summaryMap = new Map();

        if (actions.length === 0) {
          return [];
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

        resolve(Object.fromEntries(summaryMap));
      }
    );
  });
}

export async function getTop3Tournaments(mode: any, seasonId: any, db: any) {
  const scores: any = await getTournamentScores(mode, seasonId, db);

  let tournaments: any = {};
  let newtournaments: any = {};

  for (let b of Object.values(scores as any)) {
    let blob: any = b;

    if (!tournaments[blob.playerName]) {
      tournaments[blob.playerName] = [
        { id: blob.tournamentId, score: blob.totalFpts },
      ];
    } else {
      tournaments[blob.playerName].push({
        id: blob.tournamentId,
        score: blob.totalFpts,
      });
    }
  }

  for (const player in tournaments) {
    tournaments[player].sort((a: any, b: any) => b.score - a.score); // Sorting in descending order
  }

  for (const player in tournaments) {
    newtournaments[player] = [];
    for (let i = 0; i < 3; i++) {
      if (!tournaments[player][i]) {
        continue;
      }

      newtournaments[player].push(tournaments[player][i]);
    }
  }

  return newtournaments;
}

export const average = (array: any[]) =>
  array.reduce((a, b) => a + b) / array.length;

export async function getPlayerTournamentIds(mode: any, db: any) {
  const sql = `SELECT id, playerName, tournamentId FROM player_actions WHERE mode = "${mode}" GROUP BY playerName, tournamentId`;

  return new Promise((resolve, reject) => {
    db.all(sql, [], (err: any, rows: any) => {
      if (err) {
        reject(err);
      }

      let retObj: any = {};

      for (const entry of rows) {
        if (!retObj[entry.playerName]) {
          retObj[entry.playerName] = [entry.tournamentId];
        } else {
          retObj[entry.playerName].push(entry.tournamentId);
        }
      }

      resolve(retObj);
    });
  });
}

export const getRecordsSinglesVJ = (tournamentIds: any, db: any) => {
  const mode: any = "singles";
  const seasonId: any = 1;

  return new Promise((resolve, reject) => {
    if (!mode) {
      reject("Missing required parameter: mode");
    }

    let playerNamesQuery = `
      SELECT DISTINCT player_name
      FROM (
        SELECT player1 AS player_name FROM player_matchups WHERE mode = ?
        UNION
        SELECT player2 AS player_name FROM player_matchups WHERE mode = ?
      )
    `;

    let queryParams = [mode, mode];

    // Modify the query and parameters if seasonId is provided
    if (seasonId != "" && mode != "allstar") {
      let s = `
          SELECT player1 AS player_name FROM player_matchups pm
          INNER JOIN season_map sm ON pm.tournamentId BETWEEN ${
            tournamentIds[0]
          } AND ${tournamentIds[tournamentIds.length - 1]}
          WHERE pm.mode = ? AND sm.id = ?
          UNION
          SELECT player2 AS player_name FROM player_matchups pm
          INNER JOIN season_map sm ON pm.tournamentId BETWEEN ${
            tournamentIds[0]
          } AND ${tournamentIds[tournamentIds.length - 1]}
          WHERE pm.mode = ? AND sm.id = ?`;

      playerNamesQuery = `
        SELECT DISTINCT player_name
        FROM (
          ${s}
        )
      `;
      queryParams = [mode, seasonId, mode, seasonId];
    }

    db.all(playerNamesQuery, queryParams, async (err: any, playerRows: any) => {
      if (err) {
        reject("Error occurred: " + err.message);
      }

      const playerStatsPromises = playerRows.map((playerRow: any) => {
        return new Promise((resolve, reject) => {
          const player = playerRow.player_name;
          let playerMatchupsQuery = `
            SELECT COUNT(*) AS totalMatches,
                   SUM(CASE WHEN winner = ? THEN 1 ELSE 0 END) AS wins,
                   SUM(CASE WHEN winner = ? THEN ballsWon ELSE 0 END) AS totalBallsWon
            FROM player_matchups pm
            INNER JOIN season_map sm ON pm.tournamentId BETWEEN ${
              tournamentIds[0]
            } AND ${tournamentIds[tournamentIds.length - 1]}
            WHERE (pm.player1 = ? OR pm.player2 = ?) AND pm.mode = ? ${
              seasonId != "" && mode != "allstar" ? "AND sm.id = ?" : ""
            }
          `;

          let matchParams = [player, player, player, player, mode];

          if (seasonId != "" && mode != "allstar") {
            matchParams.push(seasonId);
          }

          db.get(
            playerMatchupsQuery,
            matchParams,
            (err: any, playerMatchupRow: any) => {
              if (err) {
                reject(err);
              } else {
                const totalMatches = playerMatchupRow.totalMatches || 0;
                const wins = playerMatchupRow.wins || 0;
                const totalBallsWon = playerMatchupRow.totalBallsWon || 0;
                const winPercentage =
                  totalMatches > 0
                    ? ((wins / totalMatches) * 100).toFixed(2)
                    : 0;
                const avgBallsWon =
                  wins > 0 ? (totalBallsWon / wins).toFixed(2) : 0;

                resolve({
                  player,
                  totalMatches,
                  wins,
                  winPercentage,
                  record: `${wins}-${totalMatches - wins}`,
                  avgBallsWon,
                });
              }
            }
          );
        });
      });

      Promise.all(playerStatsPromises)
        .then((playerStats) => {
          resolve(playerStats);
        })
        .catch((error) => {
          reject("Error occurred: " + error.message);
        });
    });
  });
};

export const getRecordsDoublesPVJ = (tournamentIds: any, db: any) => {
  const mode: any = "doubles";
  const seasonId: any = 1;

  return new Promise((resolve, reject) => {
    let sql = `
      SELECT
        player1, player2, winner, ballsWon
      FROM player_matchups
      WHERE mode = ?
    `;

    let params = [mode];

    if (seasonId) {
      sql = `
        SELECT
          pm.player1, pm.player2, pm.winner, pm.ballsWon
        FROM player_matchups pm
        JOIN season_map sm ON pm.tournamentId >= ${
          tournamentIds[0]
        } AND pm.tournamentId <= ${tournamentIds[tournamentIds.length - 1]}
        WHERE pm.mode = ? AND sm.id = ?
      `;
      params.push(seasonId);
    }

    db.all(sql, params, (err: any, rows: any) => {
      if (err) {
        reject("Error occurred: " + err.message);
      }

      let totalMatches = 0;
      let playerStats: any[] = [];

      // Initialize players' wins, ballsWon, etc.
      const playerData: Record<string, any> = {};

      rows.forEach((row: any) => {
        const { player1, player2, winner, ballsWon } = row;

        const players1 = player1.split(";");
        const players2 = player2.split(";");
        const winners = winner.split(";");

        // Calculate statistics for each player
        [...players1, ...players2].forEach((player) => {
          if (!playerData[player]) {
            playerData[player] = {
              totalMatches: 0,
              wins: 0,
              ballsWon: 0,
            };
          }

          playerData[player].totalMatches++;

          if (winners.includes(player)) {
            playerData[player].wins++;
            playerData[player].ballsWon += ballsWon;
          }
        });

        totalMatches++;
      });

      // Calculate win percentage and record for each player
      Object.entries(playerData).forEach(([player, data]) => {
        const { wins, totalMatches, ballsWon } = data;
        const winPercentage =
          totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(2) : 0;
        const record = `${wins}-${totalMatches - wins}`;
        const avgBallsWon = wins > 0 ? (ballsWon / wins).toFixed(2) : 0;

        playerStats.push({
          player,
          totalMatches,
          wins,
          winPercentage,
          record,
          avgBallsWon,
        });
      });

      resolve(playerStats);
    });
  });
};

const modifyMatchupsDoubles = (player: any, rows: any) => {
  let newRows: any = [];

  let i = 0;
  for (const entry of rows) {
    let base: any = Object.fromEntries(Object.entries(entry));

    if (!entry.player1.includes(player) && !entry.player2.includes(player)) {
      continue;
    }

    if (entry.player1.includes(player)) {
      base.player1 = player;
      let others = base.player2.split(";");
      base.player2 = others[0];
      base.player3 = others[1];
    } else {
      base.player2 = player;
      let others = base.player1.split(";");
      base.player1 = others[0];
      base.player3 = others[1];
    }

    newRows.push(base);
    i += 1;
  }

  return newRows;
};

const getPlayerMatchupInfo = (
  player: string,
  mode: string,
  tournamentIds: number[],
  db: any
) => {
  let sql = ``;
  let params = [];

  if (mode != "doubles") {
    sql = `SELECT id, player1, player2, winner, tournamentId FROM player_matchups WHERE (player1 = ? OR player2 = ?) AND mode = ? AND tournamentId BETWEEN ? AND ?;`;
    params = [
      player,
      player,
      mode,
      tournamentIds[0],
      tournamentIds[tournamentIds.length - 1],
    ];
  } else {
    sql = `SELECT id, player1, player2, winner, tournamentId FROM player_matchups WHERE mode = ? AND tournamentId BETWEEN ? AND ?;`;
    params = [mode, tournamentIds[0], tournamentIds[tournamentIds.length - 1]];
  }

  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: any, rows: any) => {
      if (err) {
        reject(err);
      }

      resolve(mode == "singles" ? rows : modifyMatchupsDoubles(player, rows));
    });
  });
};

export const arrCount = (arr: any[], elem: any) => {
  let counts: any = {};

  for (const entry of arr) {
    if (!counts[entry]) {
      counts[entry] = 1;
    } else {
      counts[entry]++;
    }
  }

  return counts[elem];
};

export async function getPlayerOpponents(
  players: string[],
  tournamentIds: number[],
  mode: any,
  db: any
) {
  const retObj: any = {};

  for (const player of players) {
    const rawInfo: any = await getPlayerMatchupInfo(
      player,
      mode,
      tournamentIds,
      db
    );

    const recordInfo: any = {};

    for (const entry of rawInfo) {
      let otherP = "";
      let otherP2 = entry.player3;

      let win =
        mode == "singles"
          ? player == entry.winner
          : entry.winner.includes(player);

      if (entry.player1 == player) {
        otherP = entry.player2;
      } else {
        otherP = entry.player1;
      }

      if (otherP != player && !recordInfo[otherP]) {
        recordInfo[otherP] = { wins: 0, total: 0 };
      }
      if (mode == "doubles" && otherP2 != player && !recordInfo[otherP2]) {
        recordInfo[otherP2] = { wins: 0, total: 0 };
      }

      if (otherP != player) {
        recordInfo[otherP].wins += win ? 1 : 0;
        recordInfo[otherP].total += 1;
      }

      if (mode == "doubles" && otherP2 != player) {
        recordInfo[otherP2].wins += win ? 1 : 0;
        recordInfo[otherP2].total += 1;
      }
    }

    retObj[player] = recordInfo;
  }

  return retObj;
}

export async function getAverageStandings(
  tournamentIds: number[],
  mode: any,
  db: any
) {
  if (!mode) {
    return;
  }

  const sql = `
    SELECT playerName, standing
    FROM player_standings WHERE mode = '${mode}'
  `;

  return new Promise((resolve, reject) =>
    db.all(sql, [], async (err: any, rows: any) => {
      if (err) {
        reject(err);
      } else {
        let tInfo: any = {};

        for (let obj of rows) {
          const entry = tInfo[obj.playerName];

          if (!entry) {
            tInfo[obj.playerName] = [obj.standing];
          } else {
            tInfo[obj.playerName].push(obj.standing);
          }
        }

        const selectedInfo: any = {};
        const playerTIds: any = await getPlayerTournamentIds(mode, db);

        for (const key of Object.keys(tInfo)) {
          let playerIds = playerTIds[key];
          let selectedStandings: any = [];

          for (let i = 0; i < playerIds.length; i++) {
            if (!tournamentIds.includes(playerIds[i])) {
              continue;
            }

            selectedStandings.push(tInfo[key][i]);
          }

          if (selectedStandings.length > 0) {
            selectedInfo[key] = average(selectedStandings);
          }
        }

        resolve(selectedInfo);
      }
    })
  );
}

export const range = (start: number, stop: number) => {
  let out = [];
  for (let i = start; i <= stop; i++) {
    out.push(i);
  }

  return out;
};

export const getClutchGames = (tournamentIds: number[], mode: any, db: any) => {
  if (mode == "doubles") {
    return {};
  }

  const sql = `SELECT player1, player2, winner, tournamentId, ballsWon FROM player_matchups WHERE mode = ? AND ballsWon < ?`;

  return new Promise((resolve, reject) => {
    db.all(sql, [mode, mode == "singles" ? 2 : 3], (err: any, rows: any) => {
      if (err) {
        reject(err);
        return;
      }

      let playerClutchStats: any = {};

      for (const entry of rows) {
        if (!tournamentIds.includes(entry.tournamentId)) {
          continue;
        }
        if (!playerClutchStats[entry.player1]) {
          playerClutchStats[entry.player1] = { wins: 0, total: 0 };
        }
        if (!playerClutchStats[entry.player2]) {
          playerClutchStats[entry.player2] = { wins: 0, total: 0 };
        }

        let player1Win = entry.winner == entry.player1;

        if (player1Win) {
          playerClutchStats[entry.player1].wins += 1;
        } else {
          playerClutchStats[entry.player2].wins += 1;
        }

        playerClutchStats[entry.player1].total += 1;
        playerClutchStats[entry.player2].total += 1;
      }

      let playerClutchPcts: any = {};

      for (const key of Object.keys(playerClutchStats)) {
        const entry = playerClutchStats[key];
        playerClutchPcts[key] = (entry.wins / entry.total) * 100;
      }

      resolve(playerClutchPcts);
    });
  });
};

const getBallRates = async (
  tournamentIds: number[],
  mode: any,
  db: any,
  actionType: string
) => {
  const sql = `SELECT id, playerName, actionType, actionCount, tournamentId FROM player_actions WHERE mode = ? AND tournamentId BETWEEN ? AND ?`;

  return new Promise((resolve, reject) => {
    db.all(
      sql,
      [mode, tournamentIds[0], tournamentIds[tournamentIds.length - 1]],
      (err: any, rows: any) => {
        if (err) {
          reject(err);
          return;
        }
        const rates: any = {};

        for (const entry of rows) {
          if (!rates[entry.playerName]) {
            rates[entry.playerName] = { ballIn: 0, total: 0 };
          }

          if (entry.actionType == actionType) {
            rates[entry.playerName].ballIn += entry.actionCount;
          }

          rates[entry.playerName].total += entry.actionCount;
        }

        const pcts: any = {};
        for (const player of Object.keys(rates)) {
          pcts[player] = (rates[player].ballIn / rates[player].total) * 100;
        }

        resolve(pcts);
      }
    );
  });
};

export const get8BallFinishRates = async (
  tournamentIds: number[],
  mode: any,
  db: any
) => {
  const opps: any = await getBallRates(
    tournamentIds,
    mode,
    db,
    "Opp. 8 Ball In"
  );
  const fors: any = await getBallRates(tournamentIds, mode, db, "8 Ball In");

  let retObj: any = {};

  for (const key of Object.keys(opps)) {
    retObj[key] = { "8b": fors[key], O8b: opps[key] };
  }

  return retObj;
};

export const getTournamentPerformances = (
  tournamentIds: number[],
  mode: any,
  db: any
) => {
  const sql = `SELECT playerName, TOTAL(actionCount * actionValue) as pts, tournamentId FROM player_actions WHERE mode = ? AND tournamentId BETWEEN ? AND ? GROUP BY playerName, tournamentId;`;

  return new Promise((resolve, reject) => {
    db.all(
      sql,
      [mode, tournamentIds[0], tournamentIds[tournamentIds.length - 1]],
      (err: any, rows: any) => {
        if (err) {
          reject(err);
          return;
        }
        let averages: any = {};

        for (const entry of rows) {
          if (!averages[entry.playerName]) {
            averages[entry.playerName] = { pts: 0, total: 0, avg: 0 };
          }
          averages[entry.playerName].pts += entry.pts;
          averages[entry.playerName].total += 1;

          averages[entry.playerName].avg =
            averages[entry.playerName].pts / averages[entry.playerName].total;
        }

        resolve(averages);
      }
    );
  });
};
