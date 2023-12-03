"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Input,
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";

function arrayUnique(array: any) {
  var a = array.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j]) a.splice(j--, 1);
    }
  }

  return a;
}

const PlayerStats = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("totalPointsS");
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responses = await Promise.all([
          axios.get("http://localhost:8000/total-points?mode=singles"),
          axios.get("http://localhost:8000/total-points?mode=doubles"),

          axios.get(
            "http://localhost:8000/average-points-per-game?mode=singles"
          ),
          axios.get(
            "http://localhost:8000/average-points-per-game?mode=doubles"
          ),

          axios.get(
            "http://localhost:8000/average-standings-per-game?mode=singles"
          ),
          axios.get(
            "http://localhost:8000/average-standings-per-game?mode=doubles"
          ),

          axios.get("http://localhost:8000/player-ppt?mode=singles"),
          axios.get("http://localhost:8000/player-ppt?mode=doubles"),

          axios.get(
            "http://localhost:8000/average-points-per-tournament-game?mode=singles"
          ),
          axios.get(
            "http://localhost:8000/average-points-per-tournament-game?mode=doubles"
          ),

          axios.get("http://localhost:8000/total-games-played?mode=singles"),
          axios.get("http://localhost:8000/total-games-played?mode=doubles"),

          axios.get(
            "http://localhost:8000/total-tournaments-played?mode=singles"
          ),
          axios.get(
            "http://localhost:8000/total-tournaments-played?mode=doubles"
          ),

          axios.get("http://localhost:8000/player-tt?mode=singles"),
          axios.get("http://localhost:8000/player-tt?mode=doubles"),
        ]);

        const [
          totalPointsSingles,
          totalPointsDoubles,
          avgPointsPerGameSingles,
          avgPointsPerGameDoubles,
          avgStandingsPerGameSingles,
          avgStandingsPerGameDoubles,
          avgPPTSingles,
          avgPPTDoubles,
          avgStandingsPerTGameSingles,
          avgStandingsPerTGameDoubles,
          totalGamesPlayedSingles,
          totalGamesPlayedDoubles,
          totalTournamentsPlayedSingles,
          totalTournamentsPlayedDoubles,
          TTSingles,
          TTDoubles,
        ] = responses.map((res) => res.data);

        setStats({
          totalPointsSingles,
          totalPointsDoubles,
          avgPointsPerGameSingles,
          avgPointsPerGameDoubles,
          avgStandingsPerGameSingles,
          avgStandingsPerGameDoubles,
          avgPPTSingles,
          avgPPTDoubles,
          avgStandingsPerTGameSingles,
          avgStandingsPerTGameDoubles,
          totalGamesPlayedSingles,
          totalGamesPlayedDoubles,
          totalTournamentsPlayedSingles,
          totalTournamentsPlayedDoubles,
          TTSingles,
          TTDoubles,
        });

        const playersArray = arrayUnique(
          Object.keys(totalPointsSingles).concat(
            Object.keys(totalPointsDoubles)
          )
        ).map((player: any) => ({
          name: player,
          totalPointsS: totalPointsSingles[player] ?? 0,
          totalPointsD: totalPointsDoubles[player] ?? 0,
          avgPointsPerGameS: avgPointsPerGameSingles[player] ?? 0,
          avgPointsPerGameD: avgPointsPerGameDoubles[player] ?? 0,
          avgStandingsPerGameSingles: avgStandingsPerGameSingles[player] ?? 0,
          avgStandingsPerGameDoubles: avgStandingsPerGameDoubles[player] ?? 0,
          avgPPTSingles: avgPPTSingles[player] ?? 0,
          avgPPTDoubles: avgPPTDoubles[player] ?? 0,
          avgStandingsPerTGameS: avgStandingsPerTGameSingles[player] ?? 0,
          avgStandingsPerTGameD: avgStandingsPerTGameDoubles[player] ?? 0,
          totalGamesPlayedS: totalGamesPlayedSingles[player] ?? 0,
          totalGamesPlayedD: totalGamesPlayedDoubles[player] ?? 0,
          totalTournamentsPlayedSingles:
            totalTournamentsPlayedSingles[player] ?? 0,
          totalTournamentsPlayedDoubles:
            totalTournamentsPlayedDoubles[player] ?? 0,
          TTSingles: TTSingles[player] ?? 0,
          TTDoubles: TTDoubles[player] ?? 0,
        }));

        setPlayers(playersArray as any);
        setFilteredPlayers(playersArray as any);
      } catch (error) {
        console.error("Error fetching player stats:", error);
      }
    };

    fetchData();
  }, []);

  function roundTo(n: number, digits: number) {
    if (digits === undefined) {
      digits = 0;
    }

    var multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    var test = Math.round(n) / multiplicator;
    return +test.toFixed(digits);
  }

  useEffect(() => {
    const filtered = players
      .filter((player: any) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (
          filter.includes("avgStandingsPerGame") ||
          filter.includes("totalGamesPlayed")
        ) {
          return a[filter] - b[filter];
        }
        return b[filter] - a[filter];
      })
      .slice(0, 10);
    setFilteredPlayers(filtered);
  }, [searchTerm, filter, players]);

  return (
    <VStack spacing={4}>
      <Box>
        <Input
          placeholder="Search player..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>
      <Box>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="totalPointsS">Total Points (Singles)</option>
          <option value="totalPointsD">Total Points (Doubles)</option>
          <option value="totalGamesPlayedS">
            Total Games Played (Singles)
          </option>
          <option value="totalGamesPlayedD">
            Total Games Played (Doubles)
          </option>
          <option value="totalTournamentsPlayedSingles">
            Total Tournaments Played (Singles)
          </option>
          <option value="totalTournamentsPlayedDoubles">
            Total Tournaments Played (Doubles)
          </option>
          <option value="avgPointsPerGameS">
            Average Points Per Tournament (Singles)
          </option>
          <option value="avgPointsPerGameD">
            Average Points Per Tournament (Doubles)
          </option>
          <option value="avgStandingsPerGameSingles">
            Average Standings Per Tournament (Singles)
          </option>
          <option value="avgStandingsPerGameDoubles">
            Average Standings Per Tournament (Doubles)
          </option>
          <option value="avgPPTSingles">
            Average Points Per Stroke (Singles)
          </option>
          <option value="avgPPTDoubles">
            Average Points Per Stroke (Doubles)
          </option>
          <option value="avgStandingsPerTGameS">
            Average Points Per Game (Singles)
          </option>
          <option value="avgStandingsPerTGameD">
            Average Points Per Game (Doubles)
          </option>
          <option value="TTSingles">Total Strokes (Singles)</option>
          <option value="TTDoubles">Total Strokes (Doubles)</option>
        </Select>
      </Box>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Rank</Th>
            <Th>Player</Th>
            <Th isNumeric>Value</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredPlayers.map((player: any, index) => (
            <Tr key={player.name}>
              <Td>{index + 1}</Td>
              <Td>{player.name}</Td>
              <Td isNumeric>{roundTo(player[filter], 2)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </VStack>
  );
};

export default PlayerStats;
