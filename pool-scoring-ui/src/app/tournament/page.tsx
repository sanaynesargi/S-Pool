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
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { apiUrl } from "../../../utils/utils";

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
                {action.actionCount}
              </Text>
            </VStack>
          ))}
        </HStack>
      </VStack>
    </Box>
  );
};

const TournamentSelector = ({
  tournamentId,
  onTournamentChange,
  tournaments,
}: any) => {
  return (
    <Select
      placeholder="Select tournament"
      value={tournamentId}
      onChange={(e) => onTournamentChange(Number(e.target.value))}
    >
      {tournaments.map((id: any) => (
        <option key={id} value={id}>{`Tournament ${id}`}</option>
      ))}
    </Select>
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

  const toast = useToast();

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
    <Box>
      <HStack mb={4} spacing={4} alignItems="center">
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
            } else {
              setPlayerData(playerDataD);
              setMatchups(matchupsD);
              setTournamentIds(tournamentIdsD);
              setCurrentTournament(playerDataD[0]?.tournamentId || null);
              setTournamentIds(tournamentIdsD);
            }
          }}
        >
          Mode: {mode ? "Singles" : "Doubles"}
        </Button>
      </HStack>
      <Tabs variant="enclosed">
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
  );
};

export default PlayerStatsComponent;
