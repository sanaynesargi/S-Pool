"use client";
import React, { useEffect, useReducer, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Divider,
  VStack,
  Badge,
  Heading,
  Center,
  HStack,
} from "@chakra-ui/react";
import { apiUrl } from "../../../../utils/utils"; // Update this path according to your project structure

const positions = ["T8BI", "FPBI", "OPBI", "OBI", "S"];
const positionsMap = ["T8BI", "3+BI", "1+BI", "OBI", "S"];

const addScores = (scoresArr: any) => {
  let score = 0;

  for (const key of Object.keys(scoresArr)) {
    const value = scoresArr[key] ? scoresArr[key].value : 0;
    score += value;
  }

  return score;
};

const LineupPage = () => {
  const [team1Name, setTeam1Name] = useState("");
  const [team2Name, setTeam2Name] = useState("");
  const [rosterData, setRosterData] = useState<any>({});
  const [scores, setScores] = useState<any>({});
  const [scores2, setScores2] = useState<any>({});
  const [rosterData2, setRosterData2] = useState<any>({});

  useEffect(() => {
    const storedPlayerId = localStorage.getItem("lastSubmittedRoster");

    if (!storedPlayerId) {
      return;
    }

    const data = JSON.parse(storedPlayerId);

    if (data.playerId && data.leagueId) {
      loadRosterData(data.playerId, data.leagueId);
      // adder is set to 0 for example
    }
  }, []);

  const loadRosterData = async (
    playerId: string,
    leagueId: string,
    index?: number
  ) => {
    try {
      const response = await fetch(
        `http://${apiUrl}/fantasy/checkPlayerInRoster?playerId=${playerId}&leagueId=${leagueId}`
      );
      const data = await response.json();

      if (data.message === "Player exists in rosters") {
        if (index == 0) {
          setRosterData(data.roster);
          loadScores(playerId, leagueId, data.roster, 0, 0);
        } else if (index == 1) {
          setRosterData2(data.roster);
          loadScores(playerId, leagueId, data.roster, 0, 1);
        } else {
          setRosterData(data.roster);
          getMatchup(leagueId, playerId);
          loadScores(playerId, leagueId, data.roster, 0);
        }
      }
    } catch (error) {
      console.error("Error loading roster data:", error);
    }
  };
  const [, forceUpdate] = useReducer((x: any) => x + 1, 0);
  const getMatchup = async (leagueId: string, playerId: string) => {
    const response = await fetch(
      `http://${apiUrl}/fantasy/getCurrentMatchup?leagueId=${leagueId}&playerId=${playerId}`
    );
    const data = await response.json();

    if (playerId == data.team1Id) {
      loadRosterData(data.team2Id, leagueId, 1);
    } else {
      loadRosterData(data.team1Id, leagueId, 0);
    }

    setTeam1Name(data.team1Name);
    setTeam2Name(data.team2Name);
  };

  const loadScores = async (
    playerId: string,
    leagueId: string,
    roster: any,
    adder: any,
    index?: number
  ) => {
    if (!roster) {
      return;
    }

    try {
      const response = await fetch(`http://${apiUrl}/fantasy/getPlayerStats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roster, playerId, leagueId, adder }),
      });

      const data = await response.json();

      if (index == 0) {
        setScores(data);
      } else if (index == 1) {
        setScores2(data);
      } else {
        setScores(data);
      }
    } catch (error) {
      console.error("Error loading scores:", error);
    }
  };

  return (
    <Box maxW="lg" mx="auto" p={2} h="100vh">
      <VStack h="full" justify="space-around">
        <HStack w="full" justifyContent="space-around">
          <VStack>
            <Heading textAlign="center" size="lg">
              {team1Name}
            </Heading>
            <Heading size="lg" textAlign="center" fontWeight="semibold">
              {addScores(scores)}
            </Heading>
          </VStack>
          <VStack>
            <Heading textAlign="center" size="lg">
              {team2Name}
            </Heading>
            <Heading size="lg" textAlign="center" fontWeight="semibold">
              {addScores(scores2)}
            </Heading>
          </VStack>
        </HStack>
        {positions.map((position: any, index: any) => (
          <>
            <Flex
              key={index}
              align="center"
              w="full"
              bg="gray.900"
              p="15px"
              borderRadius="lg"
            >
              <Center flex="1">
                <Text mr={2} fontWeight="semibold">
                  {rosterData[position as string] || "Player"}
                </Text>
                <Text
                  fontSize="sm"
                  _hover={{ textDecoration: "underline", cursor: "pointer" }}
                >
                  {scores[position]
                    ? scores[position].value.toFixed(2)
                    : "0.00"}
                </Text>
              </Center>
              <Divider orientation="horizontal" flex="1" />
              <Badge colorScheme="blue" px={2} borderRadius="full" mx={2}>
                {positionsMap[index]}
              </Badge>
              <Divider orientation="horizontal" flex="1" />
              <Center flex="1">
                <Text
                  fontSize="sm"
                  _hover={{ textDecoration: "underline", cursor: "pointer" }}
                >
                  {scores2[position]
                    ? scores2[position].value.toFixed(2)
                    : "0.00"}
                </Text>
                <Text ml={2} fontWeight="semibold">
                  {rosterData2[position as string] || "Player"}
                </Text>
              </Center>
            </Flex>
          </>
        ))}
      </VStack>
    </Box>
  );
};

export default LineupPage;
