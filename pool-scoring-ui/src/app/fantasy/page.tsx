import React from "react";
import { Box, VStack, Heading, Button, Spacer } from "@chakra-ui/react";

const MainPage = () => {
  return (
    <Box
      maxW="sm"
      w="full"
      mx="auto"
      p={4}
      minH="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      bg="gray.800"
      color="white"
    >
      <VStack spacing={8}>
        <VStack spacing={2}>
          <Heading textAlign="center" size="xl">
            The Hub
          </Heading>
          <Heading textAlign="center" size="md" textColor="gray.500">
            An S-Pool Product
          </Heading>
        </VStack>
        <Spacer />
        <Button colorScheme="blue" w="full" size="lg">
          Enter Roster
        </Button>
        <Button colorScheme="blue" w="full" size="lg">
          Matchup
        </Button>
        <Button colorScheme="blue" w="full" size="lg">
          Scoreboard
        </Button>
        <Button colorScheme="blue" w="full" size="lg">
          Qualification
        </Button>
        <Spacer />
      </VStack>
    </Box>
  );
};

export default MainPage;
