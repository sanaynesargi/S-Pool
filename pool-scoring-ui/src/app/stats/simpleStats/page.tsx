"use client";

import { ArrowForwardIcon, ArrowRightIcon } from "@chakra-ui/icons";
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Container,
  Flex,
  Image,
  Center,
  Tooltip,
} from "@chakra-ui/react";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useReducer, useState } from "react";
import { apiUrl } from "../../../../utils/utils";

const getNameIndex = (name: string, arr: any) => {
  let index = 0;
  for (const entry of arr) {
    if (entry.name == name) {
      return index;
    }
    index += 1;
  }

  return -1;
};

const createPlayers = (a: any, b: any, c: any, d: any, e: any, f: any) => {
  let objS: any = [];
  let objD: any = [];

  for (const entry of a) {
    const bInd = getNameIndex(entry.name, b);
    const eInd = getNameIndex(entry.name, e);

    objS.push({
      name: entry.name,
      PPG: parseFloat(entry.number),
      PPT: parseFloat(b[bInd].number),
      PPS: parseFloat(e[eInd].number),
    });
  }

  for (const entry of c) {
    const dInd = getNameIndex(entry.name, d);
    const fInd = getNameIndex(entry.name, f);

    objD.push({
      name: entry.name,
      PPG: parseFloat(entry.number),
      PPT: parseFloat(d[dInd].number),
      PPS: parseFloat(f[fInd].number),
    });
  }

  return [objS, objD];
};

// A type for the player data for better type checking
type Player = {
  name: string;
  PPG: number;
  PPT: number;
  PPS: number;
};

// A utility type for the sorting order
type SortOrder = "asc" | "desc";

const PlayerList = () => {
  const [singlesGameData, setSinglesGameData] = useState([]);
  const [doublesGameData, setDoublesGameData] = useState([]);
  const [singlesTournamentData, setSinglesTournamentGameData] = useState([]);
  const [doublesTournamentData, setDoublesTournamentGameData] = useState([]);
  const [pptSinglesData, setPPTSinglesData] = useState([]);
  const [pptDoublesData, setPPTDoublesData] = useState([]);
  const [mode, setMode] = useState(true);
  const [players, setPlayers] = useState([]);
  const [, forceUpdate] = useReducer((x: any) => x + 1, 0);
  const [sortField, setSortField] = useState<keyof Player | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    const fetchData = async () => {
      const gamesResS = await axios.get(
        `http://${apiUrl}/average-points-per-tournament-game`,
        { params: { mode: "singles" } }
      );

      const gamesResD = await axios.get(
        `http://${apiUrl}/average-points-per-tournament-game`,
        { params: { mode: "doubles" } }
      );

      const tournamentsResS = await axios.get(
        `http://${apiUrl}/average-points-per-game`,
        { params: { mode: "singles" } }
      );

      const tournamentsResD = await axios.get(
        `http://${apiUrl}/average-points-per-game`,
        { params: { mode: "doubles" } }
      );

      const pptSingles = await axios.get(
        `http://${apiUrl}/player-ppt?mode=singles`
      );
      const pptDoubles = await axios.get(
        `http://${apiUrl}/player-ppt?mode=doubles`
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
      setPPTSinglesData(sortData(pptSingles.data) as any);
      setPPTDoublesData(sortData(pptDoubles.data) as any);
    };

    fetchData();
  }, []);

  const router = useRouter();

  const [playersS, playersD] = createPlayers(
    singlesGameData,
    singlesTournamentData,
    doublesGameData,
    doublesTournamentData,
    pptSinglesData,
    pptDoublesData
  );

  // useEffect(() => {
  //   setPlayers(playersS);
  // }, [playersS]);
  // Function to sort the players array
  const toggleSortOrder = () => (sortOrder === "asc" ? "desc" : "asc");

  const sortPlayers = (field: keyof Player) => {
    const sortedPlayers = [...players].sort((a, b) => {
      // Convert string values to numbers for comparison
      const valueA = a[field];
      const valueB = b[field];
      if (valueA < valueB) {
        return sortOrder === "asc" ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortOrder === "asc" ? 1 : -1;
      }
      return 0;
    });

    // Update the state with the sorted players
    setPlayers(sortedPlayers);
    // If the same field is being sorted, toggle the order; otherwise, start with 'asc'
    setSortOrder(sortField === field ? toggleSortOrder() : "asc");
    // Set the current field being sorted
    setSortField(field);
    forceUpdate();
  };

  return (
    <Container maxW="container.xl">
      <VStack spacing={4}>
        <Flex
          justifyContent="space-between"
          alignItems="center"
          w="full"
          py={2}
        >
          <Heading size="md">Simple Stats</Heading>
          <Button onClick={() => setPlayers(playersS)}>Singles</Button>
          <Button onClick={() => setPlayers(playersD)}>Doubles</Button>
        </Flex>
        <Box w="full" bg="gray.800" borderRadius="lg">
          <HStack
            justifyContent="space-between"
            p={4}
            borderBottomWidth="1px"
            borderColor="gray.600"
          >
            <Button
              flex="1"
              variant="ghost"
              onClick={() => sortPlayers("name")}
            >
              Name
            </Button>
            <Tooltip label="Points Per Game" fontSize="md">
              <Button
                flex="1"
                variant="ghost"
                onClick={() => sortPlayers("PPG")}
              >
                PPG
              </Button>
            </Tooltip>
            <Tooltip label="Points Per Tournament" fontSize="md">
              <Button
                flex="1"
                variant="ghost"
                onClick={() => sortPlayers("PPT")}
              >
                PPT
              </Button>
            </Tooltip>
            <Tooltip label="Points Per Stroke" fontSize="md">
              <Button
                flex="1"
                variant="ghost"
                onClick={() => sortPlayers("PPS")}
              >
                PPS
              </Button>
            </Tooltip>
          </HStack>
          {players.map((player: any, index) => (
            <HStack
              key={index}
              justifyContent="space-between"
              p={4}
              borderBottomWidth={index !== players.length - 1 ? "1px" : "none"}
              borderColor="gray.600"
            >
              <Text flex="1">{player.name}</Text>
              <Text flex="1" textAlign="center">
                {player.PPG}
              </Text>
              <Text flex="1" textAlign="center">
                {player.PPT}
              </Text>
              <Text flex="1" textAlign="center">
                {player.PPS}
              </Text>
            </HStack>
          ))}
        </Box>
      </VStack>
      <Center mt={"3vh"}>
        <Button
          onClick={() => router.push("/stats")}
          rightIcon={<ArrowForwardIcon />}
        >
          Full Stats
        </Button>
      </Center>
    </Container>
  );
};

const Home: React.FC = () => {
  return (
    <Box bg="gray.900" color="white" minH="100vh">
      <PlayerList />
    </Box>
  );
};

export default Home;
