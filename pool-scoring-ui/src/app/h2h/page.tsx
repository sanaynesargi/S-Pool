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
          H2H Options
        </Heading>

        <HStack spacing={8}>
          {/* First Column of Buttons */}
          <VStack spacing={8}>
            <Button
              size="lg"
              colorScheme="blue"
              width="200px"
              height="60px"
              onClick={() => handleNavigation("/h2h/lookup")}
            >
              Lookup
            </Button>
            <Button
              size="lg"
              colorScheme="teal"
              width="200px"
              height="60px"
              onClick={() => handleNavigation("/h2h/stats")}
            >
              Player H2H Table
            </Button>
            <Button
              size="lg"
              colorScheme="yellow"
              width="200px"
              height="60px"
              onClick={() => handleNavigation("/h2h/accolades")}
            >
              Player Accolades
            </Button>
            <Button
              size="lg"
              colorScheme="orange"
              width="200px"
              height="60px"
              onClick={() => handleNavigation("/h2h/improvement")}
            >
              Player Improvement
            </Button>
          </VStack>
        </HStack>
      </Container>
    </Flex>
  );
};

export default HomePage;
