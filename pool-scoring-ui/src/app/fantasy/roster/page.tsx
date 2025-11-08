"use client";
import React, { useEffect, useReducer, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Divider,
  VStack,
  Badge,
  Heading,
  Center,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { apiUrl } from "../../../../utils/utils";
import PlayerSelectionModal from "../../../../components_fantasy/PlayerSelectionModal";
import { useRouter } from "next/navigation";

const positions = [
  "8 Balls In",
  "3+ Balls In",
  "1+ Balls In",
  "MOST Opp Ball In",
  "MOST Scratch",
];

const addScores = (scoresArr: any) => {
  let score = 0;

  for (const key of Object.keys(scoresArr)) {
    const value = scoresArr[key] ? scoresArr[key].value : 0;
    score += value;
  }

  return score;
};

const RosterPage = () => {
  const totalScore = positions.length * 0.0; // Example calculation, adjust as needed
  const [teamName, setTeamName] = useState("");
  const [availableNames, setAvailableNames] = useState<string[]>([]);

  const [T8BI, setT8BI] = useState("");
  const [FPBI, setFPBI] = useState("");
  const [OPBI, setOPBI] = useState("");
  const [OBI, setOBI] = useState("");
  const [S, setS] = useState("");
  const [GSS, setGSS] = useState("");
  const [guessMode, setGuessMode] = useState(true);
  const [guess, setGuess] = useState("");

  const [playerId, setPlayerId] = useState("");
  const [rosterData, setRosterData] = useState({});
  const [isRosterLocked, setIsRosterLocked] = useState(false);
  const [leagueId, setLeagueId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [scores, setScores] = useState<any>({});
  const errorToast = useToast();

  const isRosterComplete = () => {
    return T8BI && FPBI && OPBI && OBI && S && playerName && teamName;
  };

  useEffect(() => {
    const storedPlayerId = localStorage.getItem("lastSubmittedRoster");

    if (!storedPlayerId) {
      return;
    }

    const data = JSON.parse(storedPlayerId);

    if (data.playerId && data.leagueId) {
      setPlayerId(data.playerId);
      setLeagueId(data.leagueId);
      checkAndLoadRoster(data.playerId, data.leagueId);
    }
  }, []);

  const fillInPoints = async (
    roster: any,
    playerId: string,
    leagueId: string,
    adder: number
  ) => {
    const response = await fetch(`${apiUrl}/fantasy/getPlayerStats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roster,
        playerId,
        leagueId,
        adder,
      }),
    });

    const data = await response.json();

    setScores(data);
  };

  const checkAndLoadRoster = async (playerId: string, leagueId: string) => {
    try {
      const response = await fetch(
        `${apiUrl}/fantasy/checkPlayerInRoster?playerId=${playerId}&leagueId=${leagueId}`
      );

      const data = await response.json();
      if (data.message === "Player exists in rosters") {
        setIsRosterLocked(true);
        setRosterData(data.roster); // Set the roster data
        setT8BI(data.roster.T8BI);
        setFPBI(data.roster.FPBI);
        setOPBI(data.roster.OPBI);
        setOBI(data.roster.OBI);
        setS(data.roster.S);
        setGSS(data.roster.GSS);
        setTeamName(data.teamName);

        fillInPoints(data.roster, playerId, leagueId, 0);
      }
    } catch (error: any) {
      errorToast({
        title: "An error occurred",
        description: error.toString(),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const router = useRouter();

  const submitRoster = async () => {
    if (!isRosterComplete()) {
      errorToast({
        title: "Incomplete Roster",
        description: "Please fill all roster positions before submitting.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Prepare the data for submission
    const rosterDetails = { T8BI, FPBI, OPBI, OBI, S };
    const data = { leagueId, playerName, teamName, ...rosterDetails };

    // Submit data to the endpoint
    try {
      const response = await fetch(`${apiUrl}/fantasy/addPlayer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      localStorage.setItem("lastSubmittedRoster", JSON.stringify(responseData));

      router.refresh();
    } catch (error: any) {
      errorToast({
        title: "An error occurred",
        description: error.toString(),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const [, forceUpdate] = useReducer((x: any) => x + 1, 0);

  const onNameSelected = (name: string, idx: number) => {
    let temp = availableNames;

    const index = temp.indexOf(name);
    if (index > -1) {
      // only splice array when item is found
      temp.splice(index, 1); // 2nd parameter means remove one item only
    }

    setAvailableNames(temp);
    forceUpdate();

    switch (idx) {
      case 0: {
        setT8BI(name);
        break;
      }
      case 1: {
        setFPBI(name);
        break;
      }
      case 2: {
        setOPBI(name);
        break;
      }
      case 3: {
        setOBI(name);
        break;
      }
      case 4: {
        setS(name);
        break;
      }
      case 5: {
        setGSS(name);
        break;
      }
    }
  };

  const getValue = (idx: number) => {
    switch (idx) {
      case 0: {
        return T8BI;
      }
      case 1: {
        return FPBI;
      }
      case 2: {
        return OPBI;
      }
      case 3: {
        return OBI;
      }
      case 4: {
        return S;
      }
      case 5: {
        return GSS;
      }
    }
  };

  const getValueString = (idx: number) => {
    switch (idx) {
      case 0: {
        return "T8BI";
      }
      case 1: {
        return "FPBI";
      }
      case 2: {
        return "OPBI";
      }
      case 3: {
        return "OBI";
      }
      case 4: {
        return "S";
      }
      case 5: {
        return "GSS";
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const players = await fetch(`${apiUrl}/allPlayers?mode=singles`);

      if (!players.ok) {
        throw new Error(`HTTP error! status: ${players.status}`);
      }

      const pData = await players.json();

      setAvailableNames(pData.names);
    };

    fetchData();
  }, []);

  return (
    <Box maxW="lg" mx="auto" p={4} h="100vh">
      <VStack spacing={2} h="full" justify="space-around">
        {isRosterLocked ? (
          <Heading textAlign="center" size="lg">
            {teamName}
          </Heading>
        ) : (
          <Input
            size="lg"
            placeholder="Enter Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        )}
        {positions.map((position, index) => {
          if (availableNames.length == 0) {
            return;
          }

          return (
            <Flex
              key={index}
              align="center"
              w="100%"
              bg="gray.900"
              p="15px"
              borderRadius="lg"
            >
              <Badge
                colorScheme="blue"
                px={2}
                borderRadius="full"
                justifySelf="flex-start"
                minW="150px"
                maxW="150px"
              >
                <Text textAlign="center">{position}</Text>
              </Badge>
              <Center flex="1">
                {getValue(index) == "" ? (
                  <PlayerSelectionModal
                    names={availableNames}
                    onNameSelected={onNameSelected}
                    statIndex={index}
                  />
                ) : (
                  <>
                    <Text
                      fontSize="lg"
                      mr="10px"
                      _hover={{
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      {getValue(index)}
                    </Text>
                    {isRosterLocked && positions[index] == "Guess" ? (
                      <Input
                        placeholder="Enter Guess"
                        value={guess}
                        onChange={(e) => {
                          setGuess(e.target.value);
                          forceUpdate();
                        }}
                        maxW="150px"
                      />
                    ) : (
                      <Text
                        fontSize="lg"
                        mr={2}
                        _hover={{
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        {scores[getValueString(index) ?? ""]
                          ? scores[getValueString(index) ?? ""].value.toFixed(2)
                          : ""}
                      </Text>
                    )}
                  </>
                )}
              </Center>
            </Flex>
          );
        })}
        <Box textAlign="center" w="full">
          {!isRosterLocked ? (
            <>
              <Center>
                <VStack>
                  <Button colorScheme="green" size="lg" onClick={onOpen}>
                    Submit Roster
                  </Button>
                  <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay />
                    <ModalContent>
                      <ModalHeader>Submit Roster</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <Input
                          placeholder="Enter League ID"
                          value={leagueId}
                          onChange={(e) => setLeagueId(e.target.value)}
                        />
                        <Input
                          mt={4}
                          placeholder="Enter Player Name"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                        />
                      </ModalBody>
                      <ModalFooter>
                        <Button colorScheme="blue" onClick={submitRoster}>
                          Submit
                        </Button>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>
                  <Button
                    leftIcon={<ArrowBackIcon />}
                    bg="black"
                    w="full"
                    size="md"
                  >
                    Back
                  </Button>
                </VStack>
              </Center>
            </>
          ) : (
            <>
              <Heading size="md">Total Score</Heading>
              <Text fontSize="xl">{addScores(scores)}</Text>
              <Button
                leftIcon={<ArrowBackIcon />}
                bg="black"
                w="full"
                size="md"
                maxW="85px"
              >
                Back
              </Button>
            </>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default RosterPage;
