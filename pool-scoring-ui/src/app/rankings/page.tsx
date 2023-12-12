"use client";

import {
  Box,
  Heading,
  List,
  ListItem,
  Container,
  VStack,
  Text,
  Badge,
  useColorModeValue,
  ScaleFade,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";

const getListItemStyle = (index: any) => {
  switch (index) {
    case 0:
      return { fontSize: "lg", padding: "7", boxShadow: "2xl" };
    case 1:
      return { fontSize: "md", padding: "6", boxShadow: "xl" };
    case 2:
      return { fontSize: "sm", padding: "5", boxShadow: "lg" };
    default:
      return { fontSize: "sm", padding: "3", boxShadow: "md" };
  }
};

const getListItemBg = (index: any, column: any) => {
  const colorPalettes = [
    ["red.400", "orange.400", "yellow.500"], // Palette for 1st Row
    ["green.300", "cyan.400", "teal.400"], // Palette for 2nd Row
    ["green.300", "cyan.400", "teal.400"], // Palette for 3rd Row
    ["red.400", "orange.400", "yellow.500"], // Palette for 4th Row
  ];

  if (index < 3) {
    return colorPalettes[column][index]; // Top 3 ranks
  }
  return "gray.600"; // Other ranks
};

const RankingsPage = () => {
  const bgColor = useColorModeValue("gray.700", "gray.800");
  const textColor = useColorModeValue("gray.100", "whiteAlpha.900");
  const badgeColor = "gray.900";

  const [singlesGameData, setSinglesGameData] = useState([]);
  const [doublesGameData, setDoublesGameData] = useState([]);
  const [singlesTournamentData, setSinglesTournamentGameData] = useState([]);
  const [doublesTournamentData, setDoublesTournamentGameData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const gamesResS = await axios.get(
        `http://localhost:8000/average-points-per-tournament-game`,
        { params: { mode: "singles" } }
      );

      const gamesResD = await axios.get(
        `http://localhost:8000/average-points-per-tournament-game`,
        { params: { mode: "doubles" } }
      );

      const tournamentsResS = await axios.get(
        `http://localhost:8000/average-points-per-game`,
        { params: { mode: "singles" } }
      );

      const tournamentsResD = await axios.get(
        `http://localhost:8000/average-points-per-game`,
        { params: { mode: "doubles" } }
      );

      // Sort the data
      const sortData = (data: any) => {
        // Convert the object into an array of [key, value] pairs
        let items = Object.entries(data).map(([name, number]) => ({
          name,
          number,
        }));

        // Sort the array based on the float value of the number property
        items.sort(
          (a: any, b: any) => parseFloat(b.number) - parseFloat(a.number)
        );

        return items;
      };

      setSinglesGameData(sortData(gamesResS.data) as any);
      setDoublesGameData(sortData(gamesResD.data) as any);
      setSinglesTournamentGameData(sortData(tournamentsResS.data) as any);
      setDoublesTournamentGameData(sortData(tournamentsResD.data) as any);
    };

    fetchData();
  }, []);

  return (
    <Container maxW="container.xl" py={5}>
      <VStack spacing={5}>
        <Heading color={textColor}>Power Rankings</Heading>
        <Box display="flex" justifyContent="space-around" width="100%">
          {["Singles PPG", "Singles PPT", "Doubles PPG", "Doubles PPT"].map(
            (category, columnIndex) => (
              <VStack key={category} spacing={4}>
                <Heading size="md" color={textColor}>
                  {category}
                </Heading>
                <List spacing={3}>
                  {[
                    singlesGameData,
                    singlesTournamentData,
                    doublesGameData,
                    doublesTournamentData,
                  ][columnIndex].map((team: any, index) => {
                    const { fontSize, padding, boxShadow } =
                      getListItemStyle(index);
                    return (
                      <ScaleFade key={index} initialScale={0.9} in={true}>
                        <ListItem
                          p={padding}
                          boxShadow={boxShadow}
                          borderRadius="lg"
                          bg={getListItemBg(index, columnIndex)}
                          _hover={{ transform: "scale(1.05)" }}
                          transition="all 0.2s ease-in-out"
                        >
                          <Text
                            fontSize={fontSize}
                            fontWeight="bold"
                            color={textColor}
                          >
                            {`${index + 1}. ${team.name}`}
                            <Badge ml={3} bg={badgeColor} borderRadius="5%">
                              {team.number}
                            </Badge>
                          </Text>
                        </ListItem>
                      </ScaleFade>
                    );
                  })}
                </List>
              </VStack>
            )
          )}
        </Box>
      </VStack>
    </Container>
  );
};

export default RankingsPage;
