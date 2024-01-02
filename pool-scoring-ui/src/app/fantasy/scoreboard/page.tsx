"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  Select,
  Heading,
  useColorModeValue,
  useColorMode,
  Spacer,
} from "@chakra-ui/react";
import { apiUrl } from "../../../../utils/utils"; // Update this path according to your project structure

const MatchupPage = () => {
  const { colorMode } = useColorMode();
  const bg = useColorModeValue("gray.50", "gray.800");
  const color = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const [matchups, setMatchups] = useState([]);
  const [filteredMatchups, setFilteredMatchups] = useState([]);
  const [tournamentIds, setTournamentIds] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");

  useEffect(() => {
    const storedRosterData = localStorage.getItem("lastSubmittedRoster");
    const rosterData = storedRosterData ? JSON.parse(storedRosterData) : null;
    const leagueId = rosterData ? rosterData.leagueId : null;

    if (leagueId) {
      fetch(`http://${apiUrl}/fantasy/getMatchups?leagueId=${leagueId}`) // Ensure the endpoint is correct
        .then((response) => response.json())
        .then((data) => {
          setMatchups(data);
          const uniqueTournamentIds = [
            ...new Set(data.map((item: any) => item.tournamentId)),
          ];
          setTournamentIds(uniqueTournamentIds as any);
        })
        .catch((error) => console.error("Error fetching matchups:", error));
    } else {
      console.error("League ID not found in localStorage");
    }
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      setFilteredMatchups(
        matchups.filter(
          (matchup: any) =>
            matchup.tournamentId.toString() === selectedTournamentId
        )
      );
    } else {
      setFilteredMatchups(matchups);
    }
  }, [selectedTournamentId, matchups]);

  return (
    <VStack spacing={4} p={4} bg={bg}>
      <Select
        placeholder="Select Tournament"
        onChange={(e) => setSelectedTournamentId(e.target.value)}
        variant={colorMode === "dark" ? "filled" : "outline"}
        bg={colorMode === "dark" ? "gray.700" : "white"}
        color={color}
        maxW="md"
      >
        {tournamentIds.map((id: any) => (
          <option key={id} value={id.toString()}>{`Tournament ${id}`}</option>
        ))}
      </Select>
      {!selectedTournamentId
        ? null
        : filteredMatchups.map((matchup: any, index) => (
            <Flex
              key={index}
              direction="column"
              justify="space-between"
              align="center"
              w="full"
              maxW="md"
              bg={bg}
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
              color={color}
            >
              <Flex
                direction="row"
                flex="1"
                alignItems="center"
                w="full"
                justifyContent="space-around"
              >
                <Text fontWeight="bold" fontSize="xl">
                  {matchup.team1Name}
                </Text>
                <Text
                  fontSize="2xl"
                  fontWeight="semibold"
                >{`${matchup.score1.toFixed(2)}`}</Text>
              </Flex>
              <Spacer h="150px" />
              <Flex
                direction="row"
                flex="1"
                alignItems="center"
                justifyContent="space-around"
                w="full"
              >
                <Text fontWeight="bold" fontSize="xl">
                  {matchup.team2Name}
                </Text>
                <Text
                  fontSize="2xl"
                  fontWeight="semibold"
                >{`${matchup.score2.toFixed(2)}`}</Text>
              </Flex>
            </Flex>
          ))}
    </VStack>
  );
};

export default MatchupPage;
