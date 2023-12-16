"use client";
import React, { useEffect, useState } from "react";
import { Box, HStack, Text, useToast } from "@chakra-ui/react";
import Navbar from "../../../components/Navbar";
import PlayerGrid, { PlayerActionCounts } from "../../../components/PlayerGrid";
import axios from "axios";
import MatchupsPage from "../../../components/MatchupCreator";
import { apiUrl } from "../../../utils/utils";

const clearNameGridStateStorage = () => {
  localStorage.removeItem("nameGridState");
};

const Home: React.FC = () => {
  const [players, setPlayers] = useState<string[]>([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [playerActionCounts, setPlayerActionCounts] =
    useState<PlayerActionCounts>({});
  const [mode, setMode] = useState(false);
  const [standings, setStandings] = useState<any>({});
  const [playerGameCounts, setPlayerGameCounts] = useState<any>({});

  const addPlayers = (players: string[]) => {
    setPlayers(players);

    let s: any = {};
    for (let name of players) {
      s[name] = 0;
    }

    setStandings(s);
  };

  const sendData = async () => {
    clearNameGridStateStorage();

    try {
      let matches = localStorage.getItem("matches");

      if (!matches) {
        return;
      }

      matches = JSON.parse(matches);

      await axios.post(`http://${apiUrl}/end-game`, {
        playerActionCounts,
        mode: mode ? "singles" : "doubles",
        standings,
        playerGameCounts,
        matches,
      });
      console.log("Game ended and actions saved successfully");
    } catch (error) {
      console.error("Error ending game:", error);
    }
  };

  const startGame = () => {
    setIsGameStarted(true);
  };

  const errorToast = useToast();

  return (
    <Box>
      <Navbar
        onAddPlayers={addPlayers}
        setGameStarted={startGame}
        isGameStarted={isGameStarted}
        onEndGame={() => {
          for (let player of players) {
            console.log(player);
            if (standings[player] == 0) {
              errorToast({
                title: "Error Ending Game",
                description: "Please Finalize Ranks",
                status: "error",
                duration: 3000,
                isClosable: true,
              });
              return;
            } else if (playerGameCounts[player] == 0) {
              errorToast({
                title: "Error Ending Game",
                description: "Please Finalize Game Counts",
                status: "error",
                duration: 3000,
                isClosable: true,
              });
              return;
            }
          }

          sendData();
        }}
        mode={mode}
        setMode={setMode}
      />
      {players.length == 0 ? null : (
        <PlayerGrid
          standings={standings}
          setStandings={setStandings}
          isGameStarted={isGameStarted}
          names={players}
          onNameClick={() => {}}
          playerActionCounts={playerActionCounts}
          setPlayerActionCounts={setPlayerActionCounts}
          updateGameCountsCallback={(e: any) => setPlayerGameCounts(e)}
        />
      )}
    </Box>
  );
};

export default Home;
