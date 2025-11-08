import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../utils/utils";
import { Box, Heading, Text, VStack, Spinner, Button } from "@chakra-ui/react";

const AllStars: React.FC = () => {
  const [awardCounts, setAwardCounts] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/award_counts`);
        setAwardCounts(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching award counts:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Box>
      <Heading as="h2" mb={4}>
        Superlative Awards
      </Heading>
      {loading ? (
        <Spinner size="xl" />
      ) : (
        <VStack align="start" spacing={4}>
          {Object.keys(awardCounts).map((playerName) => (
            <Box key={playerName}>
              <Heading as="h3">{playerName}</Heading>

              <VStack
                alignContent="start"
                justifyContent="start"
                alignItems="start"
              >
                <Button colorScheme="blue">
                  All-Star Selections: {awardCounts[playerName].AS}
                </Button>
                <Button colorScheme="blue">
                  All-Star Seasons: {awardCounts[playerName].ASSe}
                </Button>
                <Button colorScheme="yellow">
                  All-NPA 1 Selections: {awardCounts[playerName].NPA1}
                </Button>
                <Button colorScheme="gray">
                  All-NPA 2 Selections: {awardCounts[playerName].NPA2}
                </Button>
                <Button colorScheme="red">
                  All-NPA 3 Selections: {awardCounts[playerName].NPA3}
                </Button>
                <Button colorScheme="teal">
                  All-NPA Seasons: {awardCounts[playerName].NPASe}
                </Button>
              </VStack>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default AllStars;
