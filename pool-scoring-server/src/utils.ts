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

const getPlayerMatchupInfo = (
  player: string,
  mode: string,
  tournamentIds: number[],
  db: any
) => {
  const sql = `SELECT id, player1, player2, winner, tournamentId FROM player_matchups WHERE (player1 = ? OR player2 = ?) AND mode = ? AND tournamentId BETWEEN ? AND ?;`;

  return new Promise((resolve, reject) => {
    db.all(
      sql,
      [
        player,
        player,
        mode,
        tournamentIds[0],
        tournamentIds[tournamentIds.length - 1],
      ],
      (err: any, rows: any) => {
        if (err) {
          reject(err);
        }

        resolve(rows);
      }
    );
  });
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
      let win = player == entry.winner;

      if (entry.player1 == player) {
        otherP = entry.player2;
      } else {
        otherP = entry.player1;
      }

      if (!recordInfo[otherP]) {
        recordInfo[otherP] = { wins: 0, total: 0 };
      }

      recordInfo[otherP].wins += win ? 1 : 0;
      recordInfo[otherP].total += 1;
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
