"use client";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip as TT,
} from "recharts";

import {
  Box,
  Select,
  Text,
  VStack,
  HStack,
  IconButton,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  useToast,
  Tooltip,
  Grid,
  Button,
  Divider,
  Center,
  Stack,
  Badge,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import { apiUrl } from "../../../utils/utils";
import { useRouter } from "next/navigation";
import FantasyModal from "../../../components/TournamentView";

const getFirstLetters = (str: string) =>
  str.includes(" ")
    ? str
        .split(" ")
        .map((word) => word[0])
        .join("")
    : str.charAt(0);

function reorderObject(obj: any) {
  const desiredOrder = [
    "Opp. 8 Ball In",
    "Opp Ball In",
    "Scratch",
    "No Result",
    "Ball In",
    "2 Ball In",
    "3 Ball In",
    "4+ Ball In",
    "8 Ball In",
  ];
  const orderedObj: any = {};

  desiredOrder.forEach((key) => {
    // Add the key with its value from obj or 0 if it doesn't exist
    if (obj.hasOwnProperty(key)) {
      orderedObj[key] = obj[key];
    }
  });

  return orderedObj;
}

function consolidateActions(actions: any) {
  const consolidated: any = {};
  let metadata;

  actions.forEach((action: any) => {
    const { actionType, actionCount } = action;

    if (!consolidated[actionType]) {
      // First time encountering this actionType, add it to the map.
      consolidated[actionType] = { ...action };
    } else {
      // Update the existing entry by summing the actionCount.
      consolidated[actionType].actionCount += actionCount;
      consolidated[actionType].fpts += action.fpts;
      consolidated[actionType].count += action.count;
    }
  });

  return Object.values(reorderObject(consolidated));
}

const PlayerStats = ({ playerName, totalFpts, actions, rating }: any) => {
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      mb={2}
      maxWidth="35vw"
      minWidth="35vw"
      overflowX="hidden"
      overflowY="hidden"
    >
      <VStack align="stretch">
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">
            {playerName} ({rating})
          </Text>
          <Text
            padding="8px"
            bg="blackAlpha.500"
            borderRadius="md"
          >{`FPTS: ${totalFpts}`}</Text>
        </HStack>
        <HStack align="stretch" justifyContent="space-between">
          {consolidateActions(actions).map((action: any) => (
            <VStack key={action.id}>
              <Tooltip
                label={`${action.actionType}: ${action.actionValue} FPTS`}
              >
                <Text fontWeight="semibold" opacity="80%">
                  {getFirstLetters(action.actionType)}
                </Text>
              </Tooltip>
              <Text fontWeight="semibold" opacity="80%">
                {action.actionCount > 0 ? action.actionCount : 0}
              </Text>
            </VStack>
          ))}
        </HStack>
      </VStack>
    </Box>
  );
};

function consolidateData(data: any) {
  const consolidated: any = {};

  data.forEach((item: any) => {
    const { type, count } = item;

    if (!consolidated[type]) {
      // First time encountering this type, add it to the map.
      consolidated[type] = { type, count };
    } else {
      // Update the existing entry by summing the count.
      consolidated[type].count += count;
    }
  });

  return Object.values(consolidated);
}

const convertDataToSleeperLog = (data: any) => {
  let log: any[] = [];

  for (const entry of data) {
    const playerName = entry["playerName"];
    const totalFpts = entry["totalFpts"];
    const tid = entry["tournamentId"];
    let condensedActions = [];

    for (let actionObj of entry.actions) {
      const type = getFirstLetters(actionObj["actionType"]);
      const count = actionObj["actionCount"];

      condensedActions.push({ type, count });
    }

    log.push({
      tid,
      playerName,
      totalFpts,
      actions: consolidateData(condensedActions),
    });
  }

  return log;
};

const getStatColor = (value: string, count: number) => {
  switch (value) {
    case "NR": {
      return {
        colorScheme: count <= 15 ? "green" : count <= 35 ? "yellow" : "red",
      };
    }
    case "BI": {
      return {
        colorScheme: count >= 7 ? "green" : count >= 3 ? "yellow" : "red",
        bg: count >= 10 ? "#00FF00" : undefined,
      };
    }
    case "2BI": {
      return {
        colorScheme: count >= 3 ? "green" : count >= 1 ? "yellow" : "red",
        bg: count >= 5 ? "#00FF00" : undefined,
      };
    }
    case "3BI": {
      return {
        colorScheme: count >= 1 ? "green" : "red",
        bg: count >= 2 ? "#00FF00" : undefined,
      };
    }
    case "4BI": {
      return {
        colorScheme: count >= 1 ? "green" : "red",
        bg: count >= 2 ? "#00FF00" : undefined,
      };
    }
    case "S": {
      return {
        colorScheme: count <= 5 ? "green" : count <= 7 ? "yellow" : "red",
        bg: count <= 3 ? "#00FF00" : count >= 12 ? "#FF0000" : undefined,
      };
    }
    case "8BI": {
      return {
        colorScheme: count >= 5 ? "green" : count >= 3 ? "yellow" : "red",
        bg: count >= 7 ? "#00FF00" : undefined,
      };
    }
    case "OBI": {
      return {
        colorScheme: count <= 3 ? "green" : count <= 5 ? "yellow" : "red",
        bg: count <= 0 ? "#00FF00" : count >= 7 ? "#00FF00" : undefined,
      };
    }
    case "O8BI": {
      return {
        colorScheme: count == 0 ? "green" : count <= 1 ? "yellow" : "red",
        bg: count <= 0 ? "#00FF00" : count >= 2 ? "#00FF00" : undefined,
      };
    }
  }
};

const TournamentSelector = ({
  tournamentId,
  onTournamentChange,
  tournaments,
}: any) => {
  return (
    <HStack>
      <Select
        placeholder="Select tournament"
        value={tournamentId ?? ""}
        onChange={(e) => onTournamentChange(Number(e.target.value))}
      >
        {tournaments.map((id: any) => (
          <option key={id} value={id}>{`Tournament ${id}`}</option>
        ))}
      </Select>
    </HStack>
  );
};

const PlayerStatsComponent = () => {
  const [playerData, setPlayerData] = useState<any>([]);
  const [playerDataS, setPlayerDataS] = useState<any>([]);
  const [playerDataD, setPlayerDataD] = useState<any>([]);
  const [playerDataA, setPlayerDataA] = useState<any>([]);

  const [currentTournament, setCurrentTournament] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [matchups, setMatchups] = useState<any>([]);
  const [matchupsS, setMatchupsS] = useState<any>([]);
  const [matchupsD, setMatchupsD] = useState<any>([]);
  const [matchupsA, setMatchupsA] = useState<any>([]);

  const [tournamentIds, setTournamentIds] = useState<any>([]);
  const [tournamentIdsS, setTournamentIdsS] = useState<any>([]);
  const [tournamentIdsD, setTournamentIdsD] = useState<any>([]);
  const [tournamentIdsA, setTournamentIdsA] = useState<any>([]);

  const [mode, setMode] = useState(0);
  const [playerLog, setPlayerLog] = useState<any>([]);

  const toast = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");

  const [allPlayersS, setAllPlayersS] = useState([]);
  const [allPlayersD, setAllPlayersD] = useState([]);
  const [allPlayersA, setAllPlayersA] = useState([]);

  const router = useRouter();

  const [ratings, setRatings] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://${apiUrl}/tournamentData?mode=singles`
        );

        const playersS = await fetch(
          `http://${apiUrl}/allPlayers?mode=singles`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPlayerData(data.playerSummaries);
        setMatchups(data.matchups);
        setTournamentIds([
          ...new Set(
            data.playerSummaries.map((item: any) => item.tournamentId)
          ),
        ]);

        const pData = await playersS.json();
        setAllPlayersS(pData.names);

        setPlayerDataS(data.playerSummaries);
        setPlayerLog(convertDataToSleeperLog(data.playerSummaries));
        setMatchupsS(data.matchups);
        setTournamentIdsS([
          ...new Set(
            data.playerSummaries.map((item: any) => item.tournamentId)
          ),
        ]);

        setCurrentTournament(data.playerSummaries[0]?.tournamentId || null);
      } catch (error: any) {
        setError(error.message);
        toast({
          title: "Error fetching data.",
          description: error.message,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://${apiUrl}/tournamentData?mode=doubles`
        );

        const playersD = await fetch(
          `http://${apiUrl}/allPlayers?mode=doubles`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPlayerDataD(data.playerSummaries);
        setMatchupsD(data.matchups);
        setTournamentIdsD([
          ...new Set(
            data.playerSummaries.map((item: any) => item.tournamentId)
          ),
        ]);

        const pData = await playersD.json();
        setAllPlayersD(pData.names);

        //setCurrentTournament(data.playerSummaries[0]?.tournamentId || null);
      } catch (error: any) {
        setError(error.message);
        toast({
          title: "Error fetching data.",
          description: error.message,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://${apiUrl}/tournamentData?mode=allstar`
        );

        const playersA = await fetch(
          `http://${apiUrl}/allPlayers?mode=allstar`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPlayerDataA(data.playerSummaries);
        setMatchupsA(data.matchups);
        setTournamentIdsA([
          ...new Set(
            data.playerSummaries.map((item: any) => item.tournamentId)
          ),
        ]);

        const pData = await playersA.json();
        setAllPlayersA(pData.names);

        //setCurrentTournament(data.playerSummaries[0]?.tournamentId || null);
      } catch (error: any) {
        setError(error.message);
        toast({
          title: "Error fetching data.",
          description: error.message,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!currentTournament) {
      return;
    }

    const fetchRtg = async () => {
      try {
        const response = await fetch(
          `http://${apiUrl}/VIRAAJ_CALC?mode=${
            mode == 0 ? "singles" : mode == 1 ? "doubles" : "allstar"
          }&startId=${currentTournament}&stopId=${currentTournament}`
        );

        setRatings(await response.json());
      } catch (error: any) {
        setError(error.message);
        toast({
          title: "Error fetching data.",
          description: error.message,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      }
    };

    fetchRtg();
  }, [currentTournament]);

  const handleTournamentChange = (newId: any) => {
    setCurrentTournament(newId);
  };

  const navigateTournament = (direction: any) => {
    const currentIndex = tournamentIds.indexOf(currentTournament);
    const nextIndex =
      direction === "prev"
        ? Math.max(0, currentIndex - 1)
        : Math.min(tournamentIds.length - 1, currentIndex + 1);
    setCurrentTournament(tournamentIds[nextIndex]);
  };

  // Sort the player data for the current tournament by totalFpts in descending order
  const sortedCurrentData = playerData
    .filter((item: any) => item.tournamentId === currentTournament)
    .sort((a: any, b: any) => b.totalFpts - a.totalFpts);

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;

  const filterData = (data: any) => {
    let newObj: any = [];

    if (data.length > 0 && typeof currentTournament == "number") {
      let i = 0;
      for (const blob of data) {
        const fptsKey = `totalFpts${blob.playerName}`;
        let obj: any = {
          name: blob.playerName,
          tid: blob.tournamentId,
        };

        obj[fptsKey] = blob.totalFpts;

        newObj.push(obj);
        i++;
      }
    }

    const datat = newObj;
    const transformed: any = {};

    // Initialize a structure for each tid
    datat.forEach((item: any) => {
      if (!transformed[item.tid]) {
        transformed[item.tid] = { tid: item.tid };
      }
    });

    // Accumulate data for each tid
    datat.forEach((item: any) => {
      const yKey = "y" + item.name;
      transformed[item.tid][yKey] = item[`totalFpts${item.name}`];
    });

    return Object.values(transformed);
  };

  const lineColors = ["yellow", "red", "orange", "green", "white", "violet"];

  const getMatchupsLen = (tid: number, name: string) => {
    let i = 0;

    for (const match of matchups) {
      if (match.tournamentId !== tid) {
        continue;
      }

      if (![match.player1, match.player2].includes(name)) {
        continue;
      }

      i++;
    }

    return i;
  };

  return (
    <HStack w="100%" h="100vh">
      <Box alignSelf="start" w="50%">
        <HStack mt={4} spacing={4} alignItems="center">
          <Button
            leftIcon={<ArrowBackIcon />}
            bg="blackAlpha.800"
            onClick={() => {
              router.push("/");
            }}
          >
            Back
          </Button>
          <IconButton
            aria-label="Previous tournament"
            icon={<ChevronLeftIcon />}
            onClick={() => navigateTournament("prev")}
            isDisabled={currentTournament === null}
            size="lg"
            colorScheme="teal"
            variant="outline"
          />
          <Box width="full" maxW="300px">
            <TournamentSelector
              tournamentId={currentTournament}
              onTournamentChange={handleTournamentChange}
              tournaments={tournamentIds}
            />
          </Box>
          <IconButton
            aria-label="Next tournament"
            icon={<ChevronRightIcon />}
            onClick={() => navigateTournament("next")}
            isDisabled={currentTournament === null}
            size="lg"
            colorScheme="teal"
            variant="outline"
          />
          <Button
            onClick={() => {
              setMode(mode == 2 ? 0 : mode + 1);

              const fixedMode = mode + 1 == 3 ? 0 : mode + 1;

              if (fixedMode == 0) {
                setPlayerData(playerDataS);
                setMatchups(matchupsS);
                setTournamentIds(tournamentIdsS);
                setCurrentTournament(playerDataS[0]?.tournamentId || null);
                setTournamentIds(tournamentIdsS);
                setPlayerLog(convertDataToSleeperLog(playerDataS));
              } else if (fixedMode == 1) {
                setPlayerData(playerDataD);
                setMatchups(matchupsD);
                setTournamentIds(tournamentIdsD);
                setCurrentTournament(playerDataD[0]?.tournamentId || null);
                setTournamentIds(tournamentIdsD);
                setPlayerLog(convertDataToSleeperLog(playerDataD));
              } else if (fixedMode == 2) {
                console.log(playerDataA);
                setPlayerData(playerDataA);
                setMatchups(matchupsA);
                setTournamentIds(tournamentIdsA);
                setCurrentTournament(playerDataA[0]?.tournamentId || null);
                setTournamentIds(tournamentIdsA);
                setPlayerLog(convertDataToSleeperLog(playerDataA));
              }
            }}
          >
            Mode: {mode == 0 ? "Singles" : mode == 1 ? "Doubles" : "All-Star"}
          </Button>
        </HStack>
        <Tabs variant="enclosed" mt={4}>
          <TabList>
            <Tab>Players</Tab>
            <Tab>Matchups</Tab>
            <Tab>Player History</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <VStack>
                {sortedCurrentData.map((player: any) => (
                  <PlayerStats
                    key={player.playerName}
                    {...player}
                    rating={
                      ratings[player.playerName]?.finalVJ.toFixed(2) ?? "Unr"
                    }
                  />
                ))}
              </VStack>
            </TabPanel>
            <TabPanel>
              <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                {matchups.map((match: any, index: any) => {
                  if (match.tournamentId !== currentTournament) {
                    return null;
                  }
                  return (
                    <Box
                      key={index}
                      p={4}
                      borderWidth="2px"
                      borderRadius="lg"
                      shadow="lg"
                      color="white"
                      bg="gray.800"
                      border="1px solid gray.700"
                    >
                      <VStack spacing={2} _hover={{ cursor: "pointer" }}>
                        <Text
                          fontSize="lg"
                          fontWeight="bold"
                          textDecoration="underline"
                        >
                          {match.player1} vs {match.player2}
                        </Text>
                        <FantasyModal
                          obj={playerData}
                          match={true}
                          id={currentTournament}
                          p1={match.player1}
                          p2={match.player2}
                          gp1={getMatchupsLen(currentTournament, match.player1)}
                          gp2={getMatchupsLen(currentTournament, match.player2)}
                        />
                        <Button
                          fontSize="md"
                          fontWeight="semibold"
                          colorScheme="green"
                        >
                          <Text as="span" fontWeight="bold">
                            Winner: {match.winner}
                          </Text>
                        </Button>
                        <HStack justify="space-between" w="full">
                          <Badge
                            colorScheme={
                              match.ballsWon > 4
                                ? "green"
                                : match.ballsWon > 0
                                ? "yellow"
                                : "teal"
                            }
                            borderRadius="lg"
                          >
                            <Text>Balls Won: {match.ballsWon}</Text>
                          </Badge>
                          <Badge
                            colorScheme={match.isOT ? "green" : "red"}
                            borderRadius="lg"
                          >
                            <Text>OT: {match.isOT ? "Yes" : "No"}</Text>
                          </Badge>
                        </HStack>
                      </VStack>
                    </Box>
                  );
                })}
              </Grid>
            </TabPanel>
            <TabPanel>
              <Box p={5} shadow="md" borderWidth="1px">
                <LineChart
                  width={600}
                  height={300}
                  data={filterData(playerData)}
                  id="recharts2-clip"
                >
                  <XAxis dataKey="tid" />
                  <YAxis />
                  <TT
                    contentStyle={{
                      backgroundColor: "#000",
                      borderColor: "black",
                      borderRadius: "md",
                    }}
                  />
                  <Legend />
                  {(mode ? allPlayersS ?? [] : allPlayersD ?? []).map(
                    (obj: any, index: number) => {
                      if (selectedPlayer) {
                        if (obj != selectedPlayer) {
                          return;
                        }
                      }
                      return (
                        <Line
                          key={index}
                          connectNulls={true}
                          type="monotone"
                          dataKey={`y${obj}`}
                          stroke={lineColors[index - 1]}
                        />
                      );
                    }
                  )}
                </LineChart>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      <Divider orientation="vertical" />

      <VStack w="50%" spacing={7} pos="absolute" right={-10} top={10}>
        <Select
          placeholder="Select Player"
          onChange={(e) => {
            setSelectedPlayer(e.target.value);
          }}
          position="fixed"
          top={10}
          bottom={0}
          right={10}
          maxW="200px"
        >
          {Array(Object.values(playerData)).map((value: any) => {
            return Object.values(value).map((v: any) => {
              if (v.tournamentId != currentTournament) {
                return;
              }

              return <option>{v.playerName}</option>;
            });
          })}
        </Select>
        {playerLog.map((value: any) => {
          if (value.playerName != selectedPlayer) {
            return;
          }

          return (
            <Center overflowY="clip" w="100%">
              <HStack w="100%">
                <VStack>
                  <Text fontWeight="semibold">ID</Text>
                  <Button
                    paddingTop="3px"
                    paddingBottom="3px"
                    paddingLeft="15px"
                    paddingRight="15px"
                    borderRadius="md"
                    colorScheme="green"
                  >
                    {value.tid}
                  </Button>
                </VStack>
                <VStack>
                  <Text fontWeight="bold">Name</Text>
                  <Button
                    paddingTop="3px"
                    paddingBottom="3px"
                    paddingLeft="15px"
                    paddingRight="15px"
                    borderRadius="md"
                    colorScheme="teal"
                  >
                    {value.playerName}
                  </Button>
                </VStack>
                <VStack>
                  <Text fontWeight="bold">FPTS</Text>
                  <Button
                    paddingTop="3px"
                    paddingBottom="3px"
                    paddingLeft="15px"
                    paddingRight="15px"
                    borderRadius="md"
                    colorScheme={
                      value.totalFpts >= 16
                        ? "green"
                        : value.totalFpts >= 10
                        ? "yellow"
                        : "red"
                    }
                    bg={
                      value.totalFpts <= 0
                        ? "#FF0000"
                        : value.totalFpts >= 20
                        ? "#00FF00"
                        : undefined
                    }
                  >
                    {value.totalFpts}
                  </Button>
                </VStack>
                {value.actions.map((value: any) => {
                  const count = value.count > 0 ? value.count : 0;
                  const colorProps = getStatColor(value.type, count);
                  return (
                    <VStack>
                      <Text fontWeight="bold">{value.type}</Text>
                      <Button {...colorProps}>{count}</Button>
                    </VStack>
                  );
                })}
              </HStack>
            </Center>
          );
        })}
      </VStack>
    </HStack>
  );
};

export default PlayerStatsComponent;
