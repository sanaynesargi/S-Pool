"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Center,
  HStack,
  Text,
  useToast,
} from "@chakra-ui/react";
import Navbar from "../../../components/Navbar";
import PlayerGrid, { PlayerActionCounts } from "../../../components/PlayerGrid";
import axios from "axios";
import MatchupsPage from "../../../components/MatchupCreator";
import { apiUrl } from "../../../utils/utils";
import SlideshowModal from "../../../components/SlideshowModal";

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
  const prod = process.env.NODE_ENV === "production";

  const addPlayers = (players: string[]) => {
    setPlayers(players);

    let s: any = {};
    for (let name of players) {
      s[name] = 0;
    }

    setStandings(s);
  };

  const errorToast = useToast();

  const sendData = async () => {
    try {
      let matches = localStorage.getItem("matches");

      if (!matches) {
        return;
      }

      matches = JSON.parse(matches);

      const obj = await axios.post(`${apiUrl}/end-game`, {
        playerActionCounts,
        mode: mode ? "singles" : "doubles",
        standings,
        playerGameCounts,
        matches,
      });

      if (obj.status == 200) {
        console.log("Game ended and actions saved successfully");
        errorToast({
          title: "Game Ended",
          description: "Game Ended Successfully!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      clearNameGridStateStorage();
    } catch (error) {
      console.error("Error ending game:", error);
      errorToast({
        title: "Game Ended",
        description: "Game End Error! " + error?.toString(),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const startGame = () => {
    setIsGameStarted(true);
  };

  return (
    <>
      {prod ? (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Action Not Available!</AlertTitle>
          <AlertDescription>
            Not Allowed to Alter Stats Remotely
          </AlertDescription>
        </Alert>
      ) : (
        <Box>
          <SlideshowModal
            mode={!mode ? "doubles" : "singles"}
            players={players}
            isGameStarted={isGameStarted}
          />
          <Navbar
            onAddPlayers={addPlayers}
            setGameStarted={startGame}
            isGameStarted={isGameStarted}
            onEndGame={() => {
              for (let player of players) {
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
              mode={!mode ? "doubles" : "singles"}
            />
          )}
        </Box>
      )}
    </>
  );
};

export default Home;
