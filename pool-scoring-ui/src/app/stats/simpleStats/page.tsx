"use client";

import {
  ArrowBackIcon,
  ArrowForwardIcon,
  ArrowRightIcon,
} from "@chakra-ui/icons";
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
  Select,
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

const createPlayers = (
  a: any,
  b: any,

  c: any,
  d: any,

  e: any,
  f: any,

  g: any,
  h: any
) => {
  let objS: any = [];
  let objD: any = [];

  for (const entry of a) {
    const bInd = getNameIndex(entry.name, b);
    const eInd = getNameIndex(entry.name, e);

    objS.push({
      name: entry.name,
      PPG: parseFloat(entry.number),
      PPT: parseFloat(b[bInd] ? b[bInd].number : 0),
      PPS: parseFloat(e[eInd] ? e[eInd].number : 0),
      BST: parseFloat(g[entry.name]["best"]["totalFpts"]),
      WRST: parseFloat(g[entry.name]["worst"]["totalFpts"]),
    });
  }

  for (const entry of c) {
    const dInd = getNameIndex(entry.name, d);
    const fInd = getNameIndex(entry.name, f);
    objD.push({
      name: entry.name,
      PPG: parseFloat(entry.number),
      PPT: parseFloat(d[dInd] ? d[dInd].number : 0),
      PPS: parseFloat(f[fInd] ? f[fInd].number : 0),
      BST: parseFloat(h[entry.name]?.best.totalFpts as any),
      WRST: parseFloat(h[entry.name]?.worst.totalFpts as any),
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
  BST: number;
  WRST: number;
};

// A utility type for the sorting order
type SortOrder = "asc" | "desc";

const PlayerList = () => {
  const [singlesGameData, setSinglesGameData] = useState([]);
  const [doublesGameData, setDoublesGameData] = useState([]);
  const [allStarGameData, setAllStarGameData] = useState([]);

  const [singlesTournamentData, setSinglesTournamentGameData] = useState([]);
  const [doublesTournamentData, setDoublesTournamentGameData] = useState([]);
  const [allStarTournamentData, setAllStarTournamentGameData] = useState([]);

  const [pptSinglesData, setPPTSinglesData] = useState([]);
  const [pptDoublesData, setPPTDoublesData] = useState([]);
  const [pptAllStarData, setPPTAllStarData] = useState([]);

  const [singlesBWT, setSinglesBWT] = useState<any>();
  const [doublesBWT, setDoublesBWT] = useState<any>();
  const [allStarBWT, setAllStarBWT] = useState<any>();

  const [mode, setMode] = useState(0);
  const [players, setPlayers] = useState([]);
  const [, forceUpdate] = useReducer((x: any) => x + 1, 0);
  const [sortField, setSortField] = useState<keyof Player | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");

  useEffect(() => {
    // Fetch the list of seasons
    const fetchSeasons = async () => {
      try {
        const response = await axios.get(`http://${apiUrl}/getSeasons`);
        setSeasons(response.data);
      } catch (error) {
        console.error("Error fetching seasons:", error);
      }
    };

    fetchSeasons();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const gamesResS = await axios.get(
        `http://${apiUrl}/average-points-per-tournament-game`,
        { params: { mode: "singles", seasonId: selectedSeason ?? null } }
      );

      const gamesResD = await axios.get(
        `http://${apiUrl}/average-points-per-tournament-game`,
        { params: { mode: "doubles", seasonId: selectedSeason ?? null } }
      );

      const gamesResA = await axios.get(
        `http://${apiUrl}/average-points-per-tournament-game`,
        { params: { mode: "allstar", seasonId: selectedSeason ?? null } }
      );

      const tournamentsResS = await axios.get(
        `http://${apiUrl}/average-points-per-game`,
        { params: { mode: "singles", seasonId: selectedSeason ?? null } }
      );

      const tournamentsResD = await axios.get(
        `http://${apiUrl}/average-points-per-game`,
        { params: { mode: "doubles", seasonId: selectedSeason ?? null } }
      );

      const tournamentsResA = await axios.get(
        `http://${apiUrl}/average-points-per-game`,
        { params: { mode: "allstar", seasonId: selectedSeason ?? null } }
      );

      const pptSingles = await axios.get(`http://${apiUrl}/player-ppt`, {
        params: { mode: "singles", seasonId: selectedSeason ?? null },
      });
      const pptDoubles = await axios.get(`http://${apiUrl}/player-ppt`, {
        params: { mode: "doubles", seasonId: selectedSeason ?? null },
      });
      const pptAllStar = await axios.get(`http://${apiUrl}/player-ppt`, {
        params: { mode: "allstar", seasonId: selectedSeason ?? null },
      });

      const bwtSingles = await axios.get(
        `http://${apiUrl}/tournamentBestWorst`,
        { params: { mode: "singles", seasonId: selectedSeason ?? null } }
      );
      const bwtDoubles = await axios.get(
        `http://${apiUrl}/tournamentBestWorst`,
        { params: { mode: "doubles", seasonId: selectedSeason ?? null } }
      );
      const bwtAllStar = await axios.get(
        `http://${apiUrl}/tournamentBestWorst`,
        { params: { mode: "allstar", seasonId: selectedSeason ?? null } }
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
      setAllStarGameData(sortData(gamesResA.data) as any);

      setSinglesTournamentGameData(sortData(tournamentsResS.data) as any);
      setDoublesTournamentGameData(sortData(tournamentsResD.data) as any);
      setAllStarTournamentGameData(sortData(tournamentsResA.data) as any);

      setPPTSinglesData(sortData(pptSingles.data) as any);
      setPPTDoublesData(sortData(pptDoubles.data) as any);
      setPPTAllStarData(sortData(pptAllStar.data) as any);

      setSinglesBWT(bwtSingles.data.playerBestWorst as any);
      setDoublesBWT(bwtDoubles.data.playerBestWorst as any);
      setAllStarBWT(bwtAllStar.data.playerBestWorst as any);

      setIsLoading(false);
    };

    fetchData();
  }, [selectedSeason]);

  const router = useRouter();

  const [playersS, playersD] = createPlayers(
    singlesGameData,
    singlesTournamentData,
    doublesGameData,
    doublesTournamentData,
    pptSinglesData,
    pptDoublesData,
    singlesBWT,
    doublesBWT
  );

  const [playersA, playersNPA] = createPlayers(
    allStarGameData,
    allStarTournamentData,
    allStarGameData,
    allStarTournamentData,
    pptAllStarData,
    pptAllStarData,
    allStarBWT,
    allStarBWT
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
          <HStack>
            <Heading size="md">Simple Stats</Heading>
            <Select
              placeholder="Select Season"
              onChange={(e) => {
                setSelectedSeason(e.target.value);
              }}
              maxW="md"
            >
              {Object.entries(seasons).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          </HStack>
          <Button
            onClick={() => {
              setPlayers(playersS);
              setMode(0);
            }}
          >
            Singles
          </Button>
          <Button
            onClick={() => {
              setMode(1);
              setPlayers(playersD);
            }}
          >
            Doubles
          </Button>
          <Button
            onClick={() => {
              setMode(2);
              setPlayers(playersA);
            }}
            colorScheme="orange"
          >
            All-Star
          </Button>
          <Button
            onClick={() => {
              setMode(2);
              setPlayers(playersA);
            }}
            colorScheme="yellow"
          >
            All-NPA
          </Button>
        </Flex>
        <Box w="full" bg="gray.800" borderRadius="lg">
          {isLoading ? null : (
            <>
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
                <Tooltip label="Best Tournament" fontSize="md">
                  <Button
                    flex="1"
                    variant="ghost"
                    onClick={() => sortPlayers("BST")}
                  >
                    BST
                  </Button>
                </Tooltip>
                <Tooltip label="Worst Tournament" fontSize="md">
                  <Button
                    flex="1"
                    variant="ghost"
                    onClick={() => sortPlayers("WRST")}
                  >
                    WRST
                  </Button>
                </Tooltip>
              </HStack>
              <>
                {players.map((player: any, index) => (
                  <HStack
                    key={index}
                    justifyContent="space-between"
                    p={4}
                    borderBottomWidth={
                      index !== players.length - 1 ? "1px" : "none"
                    }
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
                    <Text flex="1" textAlign="center">
                      {player.BST}
                    </Text>
                    <Text flex="1" textAlign="center">
                      {player.WRST}
                    </Text>
                  </HStack>
                ))}
              </>
            </>
          )}
        </Box>
      </VStack>
      <Center mt={"3vh"}>
        <HStack>
          <Button
            leftIcon={<ArrowBackIcon />}
            bg="blackAlpha.800"
            onClick={() => {
              router.push("/");
            }}
          >
            Back
          </Button>
          <Button
            onClick={() => router.push("/stats")}
            rightIcon={<ArrowForwardIcon />}
          >
            Full Stats
          </Button>
        </HStack>
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
