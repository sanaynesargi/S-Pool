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
  HStack,
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
          S-Pool v.2.1.6
        </Heading>

        <HStack spacing={8}>
          {/* First Column of Buttons */}
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
              colorScheme="red"
              width="200px"
              height="60px"
              onClick={() => handleNavigation("/rankings")}
            >
              View Power Rankings
            </Button>
            <Button
              size="lg"
              colorScheme="green"
              width="200px"
              height="60px"
              onClick={() => handleNavigation("/stats/simpleStats")}
            >
              View Statistics
            </Button>
          </VStack>

          {/* Second Column of Buttons */}
          <VStack spacing={8}>
            <Button
              size="lg"
              colorScheme="orange"
              width="200px"
              height="60px"
              onClick={() => handleNavigation("/stats/actions")}
            >
              View Turn Statistics
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
            <Button
              size="lg"
              colorScheme="teal"
              width="200px"
              height="60px"
              onClick={() => handleNavigation("/tournament")}
            >
              View Tournament Log
            </Button>
            <Button
              size="lg"
              colorScheme="cyan"
              width="200px"
              height="60px"
              onClick={() => handleNavigation("/grades")}
            >
              Report Card
            </Button>
          </VStack>
        </HStack>
        <Button
          colorScheme="gray"
          width="200px"
          height="60px"
          onClick={() => handleNavigation("/about")}
          pos="absolute"
          bottom={10}
          right={10}
        >
          About
        </Button>
      </Container>
    </Flex>
  );
};

export default HomePage;
