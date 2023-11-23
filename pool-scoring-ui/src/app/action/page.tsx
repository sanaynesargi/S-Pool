"use client";
import React, { useEffect, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import Navbar from "../../../components/Navbar";
import PlayerGrid, { PlayerActionCounts } from "../../../components/PlayerGrid";
import axios from "axios";

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
      await axios.post("http://localhost:8000/end-game", {
        playerActionCounts,
        mode: mode ? "singles" : "doubles",
        standings,
        playerGameCounts,
      });
      console.log("Game ended and actions saved successfully");
    } catch (error) {
      console.error("Error ending game:", error);
    }
  };

  const startGame = () => {
    setIsGameStarted(true);
  };

  return (
    <Box>
      <Navbar
        onAddPlayers={addPlayers}
        setGameStarted={startGame}
        isGameStarted={isGameStarted}
        onEndGame={sendData}
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
