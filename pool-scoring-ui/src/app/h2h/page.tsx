"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Input,
  Button,
  Select,
  VStack,
  HStack,
  Text,
  useToast,
  Center,
  Divider,
  Progress,
  Heading,
  StatHelpText,
  Stat,
  StatNumber,
  StatLabel,
  Spacer,
  Badge,
} from "@chakra-ui/react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import { apiUrl } from "../../../utils/utils";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";

const LastFiveHeadToHead = ({ matches }: any) => {
  return (
    <VStack spacing={3} align="stretch" mt={5}>
      <Text fontSize="lg" fontWeight="bold">
        Last 5 Head to Head
      </Text>
      {matches.map((match: any, index: any) => (
        <Box key={index} p={3} borderWidth="1px" borderRadius="lg">
          <Text fontWeight="semibold">{match.winner} W</Text>
          <Badge colorScheme="green" mr={2}>
            Balls Won: {match.ballsWon}
          </Badge>
        </Box>
      ))}
    </VStack>
  );
};

const MatchupLookup = () => {
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [mode, setMode] = useState("singles");
  const [lookupType, setLookupType] = useState("player");
  const [matchupData, setMatchupData] = useState<any>();
  const [playerRanks, setPlayerRanks] = useState<any>({});
  const [playerTournaments, setPlayerTournaments] = useState<any>();
  const [playerGames, setPlayerGames] = useState<any>();
  const [cleared, setCleared] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchPlayerRanks = async () => {
      try {
        const pointsPerGameRes = await axios.get(
          `http://${apiUrl}/average-points-per-game`,
          { params: { mode } }
        );
        const pointsPerTournamentRes = await axios.get(
          `http://${apiUrl}/average-points-per-tournament-game`,
          { params: { mode } }
        );

        const totalTournamentPlayedRes = await axios.get(
          `http://${apiUrl}/total-tournaments-played`,
          { params: { mode } }
        );

        const totalGamesRes = await axios.get(
          `http://${apiUrl}/total-games-played`,
          { params: { mode } }
        );

        const pointsPeStrokeRes = await axios.get(
          `http://${apiUrl}/player-ppt`,
          {
            params: { mode },
          }
        );

        const ranks = {
          pointsPerGame: rankPlayers(pointsPerGameRes.data),
          pointsPerTournament: rankPlayers(pointsPerTournamentRes.data),
          pointsPerStroke: rankPlayers(pointsPeStrokeRes.data),
        };

        const tournamentsPlayed = totalTournamentPlayedRes.data;
        const gamesPlayed = totalGamesRes.data;

        setPlayerRanks(ranks);
        setPlayerTournaments(tournamentsPlayed);
        setPlayerGames(gamesPlayed);
      } catch (error: any) {
        toast({
          title: "Error fetching ranks",
          description: error.toString(),
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      }
    };

    fetchPlayerRanks();
  }, [mode]);

  const rankPlayers = (data: any) => {
    const playersArray = Object.entries(data).map(([playerName, average]) => ({
      playerName,
      average,
    }));
    playersArray.sort((a: any, b: any) => b.average - a.average);
    const a = playersArray.map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
    let obj: any = {};
    for (let entry of a) {
      obj[entry.playerName] = [entry.average, entry.rank];
    }

    return obj;
  };

  function capitalizeString(input: any) {
    // Function to capitalize the first letter of a string
    function capitalize(s: any) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }

    if (input.includes(";")) {
      // Split the string by ';' and capitalize each part
      return input
        .split(";")
        .map((part: any) => capitalize(part.trim()))
        .join("; ");
    } else {
      // Capitalize the first letter of the string
      return capitalize(input);
    }
  }

  const handleLookup = async () => {
    let endpoint = "/matchups";
    if (mode === "doubles" && lookupType === "player") {
      endpoint = "/matchups-p";
    } else if (mode == "doubles") {
      if (!player1.includes(";") || !player2.includes("")) {
        toast({
          title: "Error",
          description: "Please enter teams seperated by a ';'",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
        return;
      }
    }

    if (cleared) {
      return;
    }

    try {
      const response = await axios.get(`http://${apiUrl}${endpoint}`, {
        params: {
          player1: capitalizeString(player1),
          player2: capitalizeString(player2),
          mode,
        },
      });
      setMatchupData(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }

    setCleared(true);
  };

  const getChartData = (winPercentage: any) => [
    { name: "Wins", value: parseFloat(winPercentage) },
    { name: "Losses", value: 100 - parseFloat(winPercentage) },
  ];

  const [p1, p2] =
    mode == "doubles" && lookupType == "team" ? player1.split(";") : ["", ""];
  const [p3, p4] =
    mode == "doubles" && lookupType == "team" ? player2.split(";") : ["", ""];

  const router = useRouter();

  return (
    <VStack spacing={4} p={4} align="stretch">
      <Center p={4} borderRadius="md">
        <HStack w="100%">
          <Button
            leftIcon={<ArrowBackIcon />}
            p={6}
            bg="blackAlpha.800"
            onClick={() => {
              router.push("/");
            }}
          >
            Back
          </Button>
          <Input
            placeholder="Player 1"
            value={player1}
            onChange={(e) => setPlayer1(e.target.value)}
            maxW="md"
            isDisabled={cleared}
          />
          <Input
            placeholder="Player 2"
            value={player2}
            onChange={(e) => setPlayer2(e.target.value)}
            maxW="md"
            isDisabled={cleared}
          />
          <Select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              //setCleared(false);
            }}
          >
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
          </Select>
          {mode === "doubles" && (
            <Select
              value={lookupType}
              onChange={(e) => {
                setLookupType(e.target.value);
                //setCleared(false);
              }}
              isDisabled={cleared}
            >
              <option value="team">Team</option>
              <option value="player">Player</option>
            </Select>
          )}
          <Button onClick={handleLookup} p={6} isDisabled={cleared}>
            Lookup
          </Button>
          <Button onClick={() => setCleared(false)} p={6} isDisabled={!cleared}>
            Clear
          </Button>
        </HStack>
      </Center>

      {matchupData && cleared != false && (
        <VStack w="100%" h="70vh">
          <HStack spacing={10}>
            <VStack
              paddingLeft="5vw"
              paddingRight="5vw"
              bg="teal.700"
              borderRadius={"lg"}
              h="100%"
              w="32vw"
            >
              <Heading size="md" mt={5} mb={5}>
                {mode == "doubles" && lookupType == "player"
                  ? player1 + "'s Teams"
                  : player1}
              </Heading>

              <VStack>
                <Stat>
                  {p1 != "" ? (
                    <>
                      <Stat>
                        <HStack w="100%" justifyContent="space-between">
                          <HStack>
                            <StatLabel>{p1} PPG Rk.</StatLabel>
                            <StatNumber fontSize="15pt">
                              #{playerRanks.pointsPerTournament[p1][1]}:{" "}
                              {playerRanks.pointsPerTournament[p1][0]}
                            </StatNumber>
                          </HStack>
                          <HStack>
                            <StatLabel>{p2} PPG Rk.</StatLabel>
                            <StatNumber fontSize="15pt">
                              #{playerRanks.pointsPerTournament[p2][1]}:{" "}
                              {playerRanks.pointsPerTournament[p2][0]}
                            </StatNumber>
                          </HStack>
                        </HStack>
                      </Stat>
                      <Stat>
                        <HStack w="100%" justifyContent="space-between">
                          <HStack>
                            <StatLabel>{p1} PPT Rk.</StatLabel>
                            <StatNumber fontSize="15pt">
                              #{playerRanks.pointsPerGame[p1][1]}:{" "}
                              {playerRanks.pointsPerGame[p1][0]}
                            </StatNumber>
                          </HStack>
                          <HStack>
                            <StatLabel>{p2} PPT Rk.</StatLabel>
                            <StatNumber fontSize="15pt">
                              #{playerRanks.pointsPerGame[p2][1]}:{" "}
                              {playerRanks.pointsPerGame[p2][0]}
                            </StatNumber>
                          </HStack>
                        </HStack>
                      </Stat>
                      <Stat mb={2}>
                        <HStack w="100%" justifyContent="space-between">
                          <HStack>
                            <StatLabel>{p1} GP / TP</StatLabel>
                            <StatNumber fontSize="15pt">
                              {playerGames[p1]}
                              {"/"}
                              {playerTournaments[p1]}
                            </StatNumber>
                          </HStack>
                          <HStack>
                            <StatLabel>{p2} GP / TP</StatLabel>
                            <StatNumber fontSize="15pt">
                              {playerGames[p2]}
                              {"/"}
                              {playerTournaments[p2]}
                            </StatNumber>
                          </HStack>
                        </HStack>
                      </Stat>
                    </>
                  ) : player1.includes(";") || player2.includes(";") ? (
                    <Text>Error Fetching Data</Text>
                  ) : (
                    <>
                      <Stat>
                        <StatLabel>Points Per Game Rank</StatLabel>
                        <StatNumber fontSize="15pt">
                          #{playerRanks.pointsPerTournament[player1][1]}:{" "}
                          {playerRanks.pointsPerTournament[player1][0]} ppg
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Points Per Tournament Rank</StatLabel>
                        <StatNumber fontSize="15pt">
                          #{playerRanks.pointsPerGame[player1][1]}:{" "}
                          {playerRanks.pointsPerGame[player1][0]} ppt
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Points Per Stroke Rank</StatLabel>
                        <StatNumber fontSize="15pt">
                          #{playerRanks.pointsPerStroke[player1][1]}:{" "}
                          {playerRanks.pointsPerStroke[player1][0]} pps
                        </StatNumber>
                      </Stat>
                      <Stat mb={2}>
                        <StatLabel>GP / TP</StatLabel>
                        <StatNumber fontSize="15pt">
                          {playerGames[player1]}
                          {"/"}
                          {playerTournaments[player1]}
                        </StatNumber>
                      </Stat>
                    </>
                  )}
                  <Divider />

                  <Stat>
                    <StatLabel>H2H Record</StatLabel>
                    <StatNumber>
                      {matchupData.headToHeadAllTime.player1Record}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>H2H Avg. Balls Won</StatLabel>
                    <StatNumber>
                      {matchupData.headToHeadAllTime.player1AvgBallsWon}
                    </StatNumber>
                  </Stat>
                  <Divider mt={2} mb={2} />
                  <StatLabel mt={2}>Overall Win Rate</StatLabel>
                  <StatNumber>
                    {parseFloat(
                      matchupData.overallStatsPlayer1.winPercentage
                    ).toFixed(2)}
                    %
                  </StatNumber>
                  <Progress
                    w="20vw"
                    hasStripe
                    value={parseFloat(
                      matchupData.overallStatsPlayer1.winPercentage
                    )}
                    colorScheme="orange"
                    borderRadius={"full"}
                  />
                  <Stat mt={2}>
                    <StatLabel>Overall Record</StatLabel>
                    <StatNumber>
                      {matchupData.overallStatsPlayer1.player1RecordOverall}
                    </StatNumber>
                  </Stat>
                  {/* <Stat mt={2}>
                    <StatLabel>Overall Win %</StatLabel>
                    <StatNumber>
                      {matchupData.overallStatsPlayer1.winPercentage}%
                    </StatNumber>
                  </Stat> */}
                  <Stat mt={2}>
                    <StatLabel>Overall Avg. Balls Won</StatLabel>
                    <StatNumber>
                      {matchupData.overallStatsPlayer1.avgBallsWon}
                    </StatNumber>
                  </Stat>
                </Stat>
              </VStack>
            </VStack>
            <Center>
              <VStack>
                <Text fontWeight={"bold"} fontSize="lg">
                  H2H Win Rate
                </Text>
                <HStack spacing={2}>
                  <Text>
                    {(
                      (matchupData.headToHeadAllTime.player1Wins /
                        matchupData.headToHeadAllTime.totalMatches) *
                      100
                    ).toFixed(2)}
                    %
                  </Text>
                  <Progress
                    hasStripe
                    value={
                      (matchupData.headToHeadAllTime.player1Wins /
                        matchupData.headToHeadAllTime.totalMatches) *
                      100
                    }
                    w="17vw"
                    colorScheme="orange"
                    borderRadius={"full"}
                  />
                  <Text>
                    {(
                      100 -
                      (matchupData.headToHeadAllTime.player1Wins /
                        matchupData.headToHeadAllTime.totalMatches) *
                        100
                    ).toFixed(2)}
                    %
                  </Text>
                </HStack>
                <LastFiveHeadToHead matches={matchupData.lastFiveHeadToHead} />
              </VStack>
            </Center>
            <VStack
              paddingLeft="5vw"
              paddingRight="5vw"
              bg="teal.700"
              borderRadius={"lg"}
              w="32vw"
              justifyContent="start"
            >
              <Heading size="md" mt={5} mb={5}>
                {mode == "doubles" && lookupType == "player"
                  ? player2 + "'s Teams"
                  : player2}
              </Heading>

              {p1 != "" ? (
                <>
                  <Stat>
                    <HStack w="100%" justifyContent="space-between">
                      <HStack>
                        <StatLabel>{p3} PPG Rk.</StatLabel>
                        <StatNumber fontSize="15pt">
                          #{playerRanks.pointsPerTournament[p3][1]}:{" "}
                          {playerRanks.pointsPerTournament[p3][0]}
                        </StatNumber>
                      </HStack>
                      <HStack>
                        <StatLabel>{p4} PPG Rk.</StatLabel>
                        <StatNumber fontSize="15pt">
                          #{playerRanks.pointsPerTournament[p4][1]}:{" "}
                          {playerRanks.pointsPerTournament[p4][0]}
                        </StatNumber>
                      </HStack>
                    </HStack>
                  </Stat>
                  <Stat>
                    <HStack w="100%" justifyContent="space-between">
                      <HStack>
                        <StatLabel>{p3} PPT Rk.</StatLabel>
                        <StatNumber fontSize="15pt">
                          #{playerRanks.pointsPerGame[p3][1]}:{" "}
                          {playerRanks.pointsPerGame[p3][0]}
                        </StatNumber>
                      </HStack>
                      <HStack>
                        <StatLabel>{p4} PPT Rk.</StatLabel>
                        <StatNumber fontSize="15pt">
                          #{playerRanks.pointsPerGame[p4][1]}:{" "}
                          {playerRanks.pointsPerGame[p4][0]}
                        </StatNumber>
                      </HStack>
                    </HStack>
                  </Stat>
                  <Stat mb={2}>
                    <HStack w="100%" justifyContent="space-between">
                      <HStack>
                        <StatLabel>{p3} GP / TP</StatLabel>
                        <StatNumber fontSize="15pt">
                          {playerGames[p3]}
                          {"/"}
                          {playerTournaments[p3]}
                        </StatNumber>
                      </HStack>
                      <HStack>
                        <StatLabel>{p4} GP / TP</StatLabel>
                        <StatNumber fontSize="15pt">
                          {playerGames[p4]}
                          {"/"}
                          {playerTournaments[p4]}
                        </StatNumber>
                      </HStack>
                    </HStack>
                  </Stat>
                </>
              ) : player1.includes(";") || player2.includes(";") ? (
                <Text>Error Fetching Data</Text>
              ) : (
                <Box justifyContent="start" w="90%">
                  <Stat>
                    <StatLabel>Points Per Game Rank</StatLabel>
                    <StatNumber fontSize="15pt">
                      #{playerRanks.pointsPerTournament[player2][1]}:{" "}
                      {playerRanks.pointsPerTournament[player2][0]} ppg
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Points Per Tournament Rank</StatLabel>
                    <StatNumber fontSize="15pt">
                      #{playerRanks.pointsPerGame[player2][1]}:{" "}
                      {playerRanks.pointsPerGame[player2][0]} ppt
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Points Per Stroke Rank</StatLabel>
                    <StatNumber fontSize="15pt">
                      #{playerRanks.pointsPerStroke[player2][1]}:{" "}
                      {playerRanks.pointsPerStroke[player2][0]} pps
                    </StatNumber>
                  </Stat>
                  <Stat mb={2}>
                    <StatLabel>GP / TP</StatLabel>
                    <StatNumber fontSize="15pt">
                      {playerGames[player2]}
                      {"/"}
                      {playerTournaments[player2]}
                    </StatNumber>
                  </Stat>
                  <Divider />
                </Box>
              )}

              <VStack w="100%">
                <Stat>
                  <Stat>
                    <StatLabel>H2H Record</StatLabel>
                    <StatNumber>
                      {matchupData.headToHeadAllTime.player2Record}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>H2H Avg. Balls Won</StatLabel>
                    <StatNumber>
                      {matchupData.headToHeadAllTime.player2AvgBallsWon}
                    </StatNumber>
                  </Stat>
                  <Divider mt={2} mb={2} />
                  <StatLabel>Overall Win Rate</StatLabel>
                  <StatNumber>
                    {parseFloat(
                      matchupData.overallStatsPlayer2.winPercentage
                    ).toFixed(2)}
                    %
                  </StatNumber>
                  <Progress
                    w="20vw"
                    hasStripe
                    value={parseFloat(
                      matchupData.overallStatsPlayer2.winPercentage
                    )}
                    colorScheme="orange"
                    borderRadius={"full"}
                  />

                  <Stat mt={2}>
                    <StatLabel>Overall Record</StatLabel>
                    <StatNumber>
                      {matchupData.overallStatsPlayer2.player2RecordOverall}
                    </StatNumber>
                  </Stat>
                  {/* <Stat mt={2}>
                    <StatLabel>Overall Win %</StatLabel>
                    <StatNumber>
                      {matchupData.overallStatsPlayer2.winPercentage}%
                    </StatNumber>
                  </Stat> */}
                  <Stat mt={2}>
                    <StatLabel>Overall Avg. Balls Won</StatLabel>
                    <StatNumber>
                      {matchupData.overallStatsPlayer2.avgBallsWon}
                    </StatNumber>
                  </Stat>
                </Stat>
              </VStack>
            </VStack>
          </HStack>
        </VStack>
      )}
    </VStack>
  );
};

export default MatchupLookup;
