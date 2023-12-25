"use client";
import { useState, useEffect } from "react";
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
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import { apiUrl } from "../../../utils/utils";
import { useRouter } from "next/navigation";

const getFirstLetters = (str: string) =>
  str.includes(" ")
    ? str
        .split(" ")
        .map((word) => word[0])
        .join("")
    : str.charAt(0);

const PlayerStats = ({ playerName, totalFpts, actions }: any) => {
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      mb={2}
      maxWidth="35vw"
      minWidth="35vw"
      overflowX="scroll"
      overflowY="hidden"
    >
      <VStack align="stretch">
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">{playerName}</Text>
          <Text
            padding="8px"
            bg="blackAlpha.500"
            borderRadius="md"
          >{`FPTS: ${totalFpts}`}</Text>
        </HStack>
        <HStack align="stretch" justifyContent="space-between">
          {actions.map((action: any) => (
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
      actions: condensedActions,
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

  const [currentTournament, setCurrentTournament] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [matchups, setMatchups] = useState<any>([]);
  const [matchupsS, setMatchupsS] = useState<any>([]);
  const [matchupsD, setMatchupsD] = useState<any>([]);

  const [tournamentIds, setTournamentIds] = useState<any>([]);
  const [tournamentIdsS, setTournamentIdsS] = useState<any>([]);
  const [tournamentIdsD, setTournamentIdsD] = useState<any>([]);
  const [mode, setMode] = useState(true);
  const [playerLog, setPlayerLog] = useState<any>([]);

  const toast = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://${apiUrl}/tournamentData?mode=singles`
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
  }, [toast]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://${apiUrl}/tournamentData?mode=doubles`
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
  }, [toast]);

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
              setMode(!mode);

              if (!mode) {
                setPlayerData(playerDataS);
                setMatchups(matchupsS);
                setTournamentIds(tournamentIdsS);
                setCurrentTournament(playerDataS[0]?.tournamentId || null);
                setTournamentIds(tournamentIdsS);
                setPlayerLog(convertDataToSleeperLog(playerDataS));
              } else {
                setPlayerData(playerDataD);
                setMatchups(matchupsD);
                setTournamentIds(tournamentIdsD);
                setCurrentTournament(playerDataD[0]?.tournamentId || null);
                setTournamentIds(tournamentIdsD);
                setPlayerLog(convertDataToSleeperLog(playerDataD));
              }
            }}
          >
            Mode: {mode ? "Singles" : "Doubles"}
          </Button>
        </HStack>
        <Tabs variant="enclosed" mt={4}>
          <TabList>
            <Tab>Players</Tab>
            <Tab>Matchups</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <VStack>
                {sortedCurrentData.map((player: any) => (
                  <PlayerStats key={player.playerName} {...player} />
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
                      shadow="md"
                      bgGradient="linear(to-r, gray.700, gray.800)"
                      color="white"
                    >
                      <VStack spacing={2}>
                        <Text
                          fontSize="lg"
                          fontWeight="bold"
                          textDecoration="underline"
                        >
                          {match.player1} vs {match.player2}
                        </Text>
                        <Text fontSize="md" fontWeight="semibold">
                          Winner:{" "}
                          <Text as="span" fontWeight="bold">
                            {match.winner}
                          </Text>
                        </Text>
                        <HStack justify="space-between" w="full">
                          <Text>Balls Won: {match.ballsWon}</Text>
                          <Text>OT: {match.isOT ? "Yes" : "No"}</Text>
                        </HStack>
                      </VStack>
                    </Box>
                  );
                })}
              </Grid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      <Divider orientation="vertical" />
      <VStack w="50%" spacing={7}>
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
            <Center overflowY="scroll" w="100%">
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
