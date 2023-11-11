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

          axios.get("http://localhost:8000/average-standings-per-game"),

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

          axios.get("http://localhost:8000/total-tournaments-played"),

          axios.get("http://localhost:8000/player-tt?mode=singles"),
          axios.get("http://localhost:8000/player-tt?mode=doubles"),
        ]);

        const [
          totalPointsSingles,
          totalPointsDoubles,
          avgPointsPerGameSingles,
          avgPointsPerGameDoubles,
          avgStandingsPerGame,
          avgPPTSingles,
          avgPPTDoubles,
          avgStandingsPerTGameSingles,
          avgStandingsPerTGameDoubles,
          totalGamesPlayedSingles,
          totalGamesPlayedDoubles,
          totalTournamentsPlayed,
          TTSingles,
          TTDoubles,
        ] = responses.map((res) => res.data);

        setStats({
          totalPointsSingles,
          totalPointsDoubles,
          avgPointsPerGameSingles,
          avgPointsPerGameDoubles,
          avgStandingsPerGame,
          avgPPTSingles,
          avgPPTDoubles,
          avgStandingsPerTGameSingles,
          avgStandingsPerTGameDoubles,
          totalGamesPlayedSingles,
          totalGamesPlayedDoubles,
          totalTournamentsPlayed,
          TTSingles,
          TTDoubles,
        });

        const playersArray = Object.keys(totalPointsSingles).map((player) => ({
          name: player,
          totalPointsS: totalPointsSingles[player],
          totalPointsD: totalPointsDoubles[player],
          avgPointsPerGameS: avgPointsPerGameSingles[player],
          avgPointsPerGameD: avgPointsPerGameDoubles[player],
          avgStandingsPerGame: avgStandingsPerGame[player],
          avgPPTSingles: avgPPTSingles[player],
          avgPPTDoubles: avgPPTDoubles[player],
          avgStandingsPerTGameS: avgStandingsPerTGameSingles[player],
          avgStandingsPerTGameD: avgStandingsPerTGameDoubles[player],
          totalGamesPlayedS: totalGamesPlayedSingles[player],
          totalGamesPlayedD: totalGamesPlayedDoubles[player],
          totalTournamentsPlayed: totalTournamentsPlayed[player],
          TTSingles: TTSingles[player],
          TTDoubles: TTDoubles[player],
        }));

        setPlayers(playersArray as any);
        setFilteredPlayers(playersArray as any);
      } catch (error) {
        console.error("Error fetching player stats:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filtered = players
      .filter((player: any) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (
          filter == "avgStandingsPerGame" ||
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
          <option value="totalTournamentsPlayed">
            Total Tournaments Played
          </option>
          <option value="avgPointsPerGameS">
            Average Points Per Tournament (Singles)
          </option>
          <option value="avgPointsPerGameD">
            Average Points Per Tournament (Doubles)
          </option>
          <option value="avgStandingsPerGame">
            Average Standings Per Tournament
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
              <Td isNumeric>{player[filter]}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </VStack>
  );
};

export default PlayerStats;
