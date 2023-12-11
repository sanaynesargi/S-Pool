"use client";

import React, { useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Flex,
  Text,
  Container,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

const HomePage: React.FC = () => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  useEffect(() => {
    localStorage.setItem("chakra-ui-color-mode", "dark");
  }, []);

  return (
    <Flex
      width="100vw"
      height="100vh"
      alignItems="center"
      justifyContent="center"
      direction="column"
    >
      <Container centerContent>
        <Heading mb={6} size="2xl" color="teal.500">
          Welcome to S-Pool!
        </Heading>
        <Text fontSize="xl" mb={10} color="gray.600">
          Choose a page to get started
        </Text>
        <VStack spacing={8}>
          <Button
            size="lg"
            colorScheme="blue"
            width="200px"
            height="60px"
            onClick={() => handleNavigation("/action")}
          >
            Play a Game
          </Button>
          <Button
            size="lg"
            colorScheme="teal"
            width="200px"
            height="60px"
            onClick={() => handleNavigation("/leaderboard")}
          >
            View Leaderboard
          </Button>
          <Button
            size="lg"
            colorScheme="green"
            width="200px"
            height="60px"
            onClick={() => handleNavigation("/stats")}
          >
            View Statistics
          </Button>
          <Button
            size="lg"
            colorScheme="orange"
            width="200px"
            height="60px"
            onClick={() => handleNavigation("/stats/actions")}
          >
            View Adv. Statistics
          </Button>
          <Button
            size="lg"
            colorScheme="purple"
            width="200px"
            height="60px"
            onClick={() => handleNavigation("/h2h")}
          >
            View H2H Statistics
          </Button>
        </VStack>
      </Container>
    </Flex>
  );
};

export default HomePage;
