import React, { useCallback, useEffect, useReducer, useState } from "react";
import {
  Box,
  Grid,
  Button,
  Flex,
  Text,
  Center,
  Spacer,
  useToast,
  VStack,
  Icon,
  IconButton,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  useDisclosure,
} from "@chakra-ui/react";
import ActionModal, { ActionType } from "./ActionModal";
import MatchupPage from "./MatchupCreator";
import LeaderboardModal from "./LeaderboardModal";
import PlayerDetailsModal from "./PlayerDetailsModal";
import { ArrowDownIcon, ArrowUpIcon } from "@chakra-ui/icons";
import { SP } from "next/dist/shared/lib/utils";
import FantasyModal from "./TournamentView";

interface NameGridProps {
  names: string[];
  onNameClick: (name: string) => void;
  playerActionCounts: any;
  setPlayerActionCounts: any;
  standings: any;
  setStandings: any;
  updateGameCountsCallback: any;
  isGameStarted: boolean;
}

interface Action {
  type: ActionType;
  color: string;
}

export interface PlayerActionCounts {
  [playerName: string]: {
    [actionType: string]: number;
  };
}

interface PlayerScores {
  [playerName: string]: number;
}

interface PlayerDetails {
  playerName: string;
  actions: { type: string; points: number }[];
}

const saveStateToLocalStorage = (state: any) => {
  localStorage.setItem("nameGridState", JSON.stringify(state));
};

const loadStateFromLocalStorage = () => {
  const savedState = localStorage.getItem("nameGridState");
  return savedState ? JSON.parse(savedState) : null;
};

const NameGrid: React.FC<NameGridProps> = ({
  names,
  onNameClick,
  playerActionCounts,
  setPlayerActionCounts,
  standings,
  setStandings,
  updateGameCountsCallback,
  isGameStarted,
}) => {
  const [playerGamesPlayed, setPlayerGamesPlayed] = useState<any>({});
  const columns = 7;
  const totalBoxesPerPage = names.length * columns;
  const [, forceUpdate] = useReducer((x: any) => x + 1, 0);

  useEffect(() => {
    let s: any = {};
    for (let name of names) {
      s[name] = 0;
    }

    setPlayerGamesPlayed(s);
  }, []);

  const initialState = loadStateFromLocalStorage() || {
    actions: [Array(totalBoxesPerPage).fill(null)],
    playerScores: {},
    currentPage: 0,
  };

  const [actions, setActions] = useState<(Action[] | null)[][]>(
    initialState.actions
  );
  const [playerScores, setPlayerScores] = useState<PlayerScores>(
    initialState.playerScores
  );

  const [currentPage, setCurrentPage] = useState(initialState.currentPage);

  localStorage.setItem("playerScores", JSON.stringify(playerScores));

  useEffect(() => {
    const state = {
      actions,
      playerScores,
      currentPage,
    };
    saveStateToLocalStorage(state);
  }, [actions, playerScores, currentPage]);

  const [selectedGridBox, setSelectedGridBox] = useState<number | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [selectedPlayerDetails, setSelectedPlayerDetails] =
    useState<PlayerDetails | null>(null);

  const maxNum = names.length;

  const handleNonNameCellClick = (index: number) => {
    setIsActionModalOpen(true);
    setSelectedGridBox(index);
  };

  const handleScoreClick = (playerName: string) => {
    const actions = Object.entries(playerActionCounts[playerName] || {}).map(
      ([actionType, count]) => {
        return {
          type: actionType,
          points: calculateScore(actionType as ActionType) * (count as number),
        };
      }
    );
    setSelectedPlayerDetails({ playerName, actions });
  };

  const calculateScore = (actionType: ActionType): number => {
    const scoreMap: { [key in ActionType]: number } = {
      "No Result": 0,
      Scratch: -0.5,
      "Ball In": 1,
      "8 Ball In": 3,
      "Opp Ball In": -1,
      "2 Ball In": 2.25,
      "3 Ball In": 3.5,
      "4+ Ball In": 4.75,
      "Opp. 8 Ball In": -2,
    };
    return scoreMap[actionType];
  };

  const handleActionSelect = useCallback(
    (selectedActions: Action[]) => {
      if (selectedGridBox != null) {
        const updatedActions = actions[currentPage].slice();
        const prevActions = updatedActions[selectedGridBox] || [];

        // Calculate the differences between previous actions and new selected actions
        const actionsToAdd = selectedActions.filter(
          (newAction) =>
            !prevActions.some(
              (prevAction) => prevAction.type === newAction.type
            )
        );
        const actionsToRemove = prevActions.filter(
          (prevAction) =>
            !selectedActions.some(
              (newAction) => newAction.type === prevAction.type
            )
        );

        // Update the action list for the current grid box
        updatedActions[selectedGridBox] = selectedActions;
        const newActions = [...actions];
        newActions[currentPage] = updatedActions;
        setActions(newActions);

        const playerName = names[Math.floor(selectedGridBox / columns)];

        // Update the action counts and scores for the player
        const newCounts = { ...playerActionCounts };
        newCounts[playerName] = newCounts[playerName] || {};

        actionsToAdd.forEach((action) => {
          newCounts[playerName][action.type] =
            (newCounts[playerName][action.type] || 0) + 1;
        });

        actionsToRemove.forEach((action) => {
          newCounts[playerName][action.type] =
            (newCounts[playerName][action.type] || 1) - 1;
        });

        setPlayerActionCounts(newCounts);

        const newScores = { ...playerScores };
        newScores[playerName] =
          (newScores[playerName] || 0) +
          actionsToAdd.reduce(
            (sum, action) => sum + calculateScore(action.type),
            0
          ) -
          actionsToRemove.reduce(
            (sum, action) => sum + calculateScore(action.type),
            0
          );

        setPlayerScores(newScores);
        localStorage.setItem("playerScores", JSON.stringify(newScores));
      }
    },
    [
      selectedGridBox,
      actions,
      currentPage,
      names,
      columns,
      playerActionCounts,
      playerScores,
    ]
  );

  const handleActionModalClose = () => {
    setIsActionModalOpen(false);
    setSelectedGridBox(null);
  };

  const goToNextPage = () => {
    setCurrentPage(currentPage + 1);
    if (currentPage + 1 === actions.length) {
      setActions([...actions, Array(totalBoxesPerPage).fill(null)]);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  function convertObjectToArray(obj: any) {
    // Create an empty array to hold the converted objects
    let result = [];

    // Loop through each property in the object
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Create a new object with the name property
        let newObj: any = { name: key };

        // Add the inner object properties to the new object
        for (let prop in obj[key]) {
          if (obj[key].hasOwnProperty(prop)) {
            newObj[prop] = obj[key][prop];
          }
        }

        // Add the new object to the result array
        result.push(newObj);
      }
    }

    return result;
  }

  const bgColor = "#1A202C";
  const actionBgColor = "#2D3748";
  const defaultBgColor = "#393D47";

  const errorToast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Flex justifyContent="center" alignItems="center" mb={4}>
        <Button onClick={goToPreviousPage} isDisabled={currentPage === 0}>
          {"<"}
        </Button>
        <Text mx={4}>Page {currentPage + 1}</Text>
        <Button onClick={goToNextPage}>{">"}</Button>
      </Flex>
      <Grid
        templateColumns={`repeat(${columns}, 1fr)`}
        gap={4}
        w="100%"
        p={4}
        bg={bgColor}
      >
        {Array.from({ length: totalBoxesPerPage }).map((_, index) => {
          const isNameCell = index % columns === 0;
          const nameIndex = Math.floor(index / columns);
          const name = isNameCell ? names[nameIndex] : "";
          const actionList = actions[currentPage][index];

          return (
            <Box
              key={index}
              p={4}
              borderRadius="md"
              boxShadow="0 4px 8px 0 rgba(0,0,0,0.2)"
              bg={isNameCell ? defaultBgColor : actionBgColor}
              cursor={isNameCell ? "default" : "pointer"}
              onClick={() => {
                if (!isGameStarted) {
                  errorToast({
                    title: "Error Starting Game",
                    description:
                      "Please click 'Start Game' to finalize players and start your game.",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                  });
                  return;
                }
                if (isNameCell) {
                  onNameClick(name);
                } else {
                  handleNonNameCellClick(index);
                }
              }}
            >
              {isNameCell ? (
                <Center>
                  <Text fontSize="lg" fontWeight="bold">
                    {name}
                  </Text>
                  <Box ml={4}>
                    <HStack justifyContent="space-evenly">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScoreClick(name);
                        }}
                      >
                        Score
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          let newTotal;

                          if (standings[name] == maxNum) {
                            newTotal = 0;
                          } else {
                            newTotal = standings[name] + 1;
                          }

                          let newStandings = standings;
                          newStandings[name] = newTotal;

                          setStandings(newStandings);
                          forceUpdate();
                        }}
                        colorScheme="twitter"
                        type="button"
                      >
                        Rk: {standings[name]}
                      </Button>
                    </HStack>
                    <Spacer w={4} h={4} />
                    <HStack bgColor="gray.600" p={2} borderRadius="md">
                      <IconButton
                        icon={<ArrowUpIcon />}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();

                          let newGames = playerGamesPlayed;
                          newGames[name] = newGames[name] + 1;

                          setPlayerGamesPlayed(newGames);

                          updateGameCountsCallback(newGames);
                          forceUpdate();
                        }}
                        type="button"
                        colorScheme="orange"
                        aria-label="down"
                      />
                      <Button onClick={undefined} size="sm" colorScheme="teal">
                        GP: {playerGamesPlayed[name]}
                      </Button>
                      <IconButton
                        aria-label="down"
                        icon={<ArrowDownIcon />}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();

                          let newGames = playerGamesPlayed;
                          newGames[name] = newGames[name] - 1;

                          setPlayerGamesPlayed(newGames);

                          updateGameCountsCallback(newGames);
                          forceUpdate();
                        }}
                        type="button"
                        colorScheme="orange"
                      />
                    </HStack>
                  </Box>
                </Center>
              ) : (
                <Flex direction="column" gap="2">
                  {actionList &&
                    actionList.map((action, i) => (
                      <Box
                        bgColor={action.color}
                        padding={2.5}
                        borderRadius="md"
                      >
                        <Text key={i} fontWeight="bold" fontSize="sm">
                          {action.type}
                        </Text>
                      </Box>
                    ))}
                </Flex>
              )}
            </Box>
          );
        })}
      </Grid>

      <ActionModal
        isOpen={isActionModalOpen}
        onClose={handleActionModalClose}
        onActionSelect={handleActionSelect}
        selectedActions={
          selectedGridBox != null
            ? actions[currentPage][selectedGridBox] || []
            : []
        }
      />
      <Center mt={4}>
        <HStack spacing={3}>
          <Button
            colorScheme="blue"
            onClick={() => setIsLeaderboardModalOpen(true)}
          >
            Show Leaderboard
          </Button>
          <MatchupPage players={names} />
          <FantasyModal
            obj={convertObjectToArray(playerActionCounts)}
            gamesPlayed={playerGamesPlayed}
          />
        </HStack>
      </Center>

      {/* <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
        playerScores={playerScores}
        onScoreClick={handleScoreClick}
      /> */}

      {selectedPlayerDetails && (
        <PlayerDetailsModal
          isOpen={true}
          onClose={() => setSelectedPlayerDetails(null)}
          details={selectedPlayerDetails}
        />
      )}
    </>
  );
};

export default NameGrid;
