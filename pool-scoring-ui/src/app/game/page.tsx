"use client";
import {
  Box,
  Center,
  Flex,
  HStack,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";

const MatchupScore = ({
  player1,
  player2,
  headToHead,
  overallRecords,
  winProbability,
}: any) => {
  return (
    <Center h="100vh">
      <Box
        bg="blackAlpha.600"
        shadow="lg"
        borderRadius="lg"
        w="650px"
        h="450px"
      >
        <HStack>
          <VStack w="100%" justifyContent="space-around">
            <Heading>{player1.name}</Heading>
            <Heading fontWeight="semibold">{(0.0).toFixed(2)}</Heading>
          </VStack>
          <Text fontSize={"2xl"} fontWeight={"bold"}>
            v.s.
          </Text>
          <VStack w="100%" justifyContent="space-around">
            <Heading>{player2.name}</Heading>
            <Heading fontWeight={"semibold"}>{(0.0).toFixed(2)}</Heading>
          </VStack>
        </HStack>
      </Box>
    </Center>
  );
};

const IndexPage = () => {
  const [matchupData, setMatchupData] = useState<any>();

  useEffect(() => {
    // Fetch matchup data from API or set it from state
    const data: any = {
      player1: { id: 1, name: "Player One" },
      player2: { id: 2, name: "Player Two" },
      headToHead: { 1: 5, 2: 3 }, // Sample head-to-head data
      overallRecords: { 1: 20, 2: 15 }, // Sample overall records data
      winProbability: 60, // Sample win probability
    };
    setMatchupData(data);
  }, []);

  return (
    <div>
      {matchupData && (
        <MatchupScore
          player1={matchupData.player1}
          player2={matchupData.player2}
          headToHead={matchupData.headToHead}
          overallRecords={matchupData.overallRecords}
          winProbability={matchupData.winProbability}
        />
      )}
    </div>
  );
};

export default IndexPage;
