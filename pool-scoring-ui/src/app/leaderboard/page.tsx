"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = React.useState<
    LeaderboardEntry[]
  >([]);

  const loadScores = () => {
    const data = localStorage.getItem("playerScores");
    if (data) {
      const playerScores = JSON.parse(data);
      const sortedData = Object.entries(playerScores)
        .map(([username, score]) => ({ username, score: Number(score) }))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
      setLeaderboardData(sortedData);
    }
  };

  React.useEffect(() => {
    loadScores();

    // Event listener for localStorage updates
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "playerScores") {
        loadScores();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const bg = useColorModeValue("white", "gray.800");
  const boxShadow = useColorModeValue("sm", "md");
  const router = useRouter();

  return (
    <Box overflowX="auto">
      {/* Table Headers */}
      <Flex
        direction="row"
        align="center"
        justify="space-between"
        p={4}
        m={2}
        bg={useColorModeValue("blue.500", "blue.200")}
        color={useColorModeValue("white", "gray.800")}
        borderRadius="lg"
      >
        <Button
          leftIcon={<ArrowBackIcon />}
          bg="blackAlpha.800"
          onClick={() => {
            router.push("/");
          }}
        >
          Back
        </Button>
        <Text fontWeight="bold">Rank</Text>
        <Text fontWeight="bold">Player</Text>
        <Text fontWeight="bold">Score</Text>
      </Flex>

      {/* Table Rows */}
      {leaderboardData.map((entry, index) => (
        <Flex
          key={entry.username}
          direction="row"
          align="center"
          justify="space-between"
          p={4}
          m={2}
          bg={
            entry.rank == 1
              ? "#FFD70095"
              : entry.rank == 2
              ? "#C0C0C0A0"
              : entry.rank == 3
              ? "#CD7F3233"
              : "gray.700"
          }
          boxShadow={boxShadow}
          borderRadius="lg"
        >
          <Text fontWeight="bold">{entry.rank}</Text>
          <Flex align="center">
            <Text ml={2} fontWeight="semibold">
              {entry.username}
            </Text>
          </Flex>
          <Text>{entry.score}</Text>
        </Flex>
      ))}
    </Box>
  );
};

export default Leaderboard;
