import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  NumberInput,
  NumberInputField,
  HStack,
  VStack,
  Checkbox,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  List,
  ListItem,
} from "@chakra-ui/react";

const MatchupForm = ({ players }: { players: string[] }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [playerOne, setPlayerOne] = useState("");
  const [playerTwo, setPlayerTwo] = useState("");
  const [isOT, setIsOT] = useState(false);
  const [ballsWon, setBallsWon] = useState("");
  const [matches, setMatches] = useState<any>([]);

  useEffect(() => {
    const savedMatches = localStorage.getItem("matches");
    if (savedMatches) {
      setMatches(JSON.parse(savedMatches));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("matches", JSON.stringify(matches));
  }, [matches]);

  const addMatch = (winner: string) => {
    const newMatch = {
      playerOne,
      playerTwo,
      winner,
      isOT,
      ballsWon: ballsWon === "" ? 0 : parseInt(ballsWon),
    };
    setMatches([...matches, newMatch]);
    setPlayerOne("");
    setPlayerTwo("");
    setIsOT(false);
    setBallsWon("");
  };

  const filterPlayers = (input: string, currentPlayer: string) => {
    return players.filter(
      (player) =>
        player.toLowerCase().includes(input.toLowerCase()) &&
        player !== currentPlayer
    );
  };

  const handleBallsWonChange = (valueString: string) =>
    setBallsWon(valueString);
  const handleSubmit = () => {
    alert(JSON.stringify(matches));
    onClose();
  };

  return (
    <VStack spacing={4}>
      <Button onClick={onOpen}>Enter Matchup Results</Button>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        closeOnOverlayClick={false}
        closeOnEsc={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Matchups</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={3} align="center">
                <VStack>
                  <Input
                    placeholder="Player 1"
                    value={playerOne}
                    onChange={(e) => setPlayerOne(e.target.value)}
                  />
                  {playerOne && (
                    <List>
                      {filterPlayers(playerOne, playerTwo).map((player) => (
                        <ListItem
                          key={player}
                          onClick={() => setPlayerOne(player)}
                          cursor="pointer"
                        >
                          {player}
                        </ListItem>
                      ))}
                    </List>
                  )}
                </VStack>
                <Text>vs</Text>

                <VStack>
                  <Input
                    placeholder="Player 2"
                    value={playerTwo}
                    onChange={(e) => setPlayerTwo(e.target.value)}
                  />
                  {playerTwo && (
                    <List>
                      {filterPlayers(playerTwo, playerOne).map((player) => (
                        <ListItem
                          key={player}
                          onClick={() => setPlayerTwo(player)}
                          cursor="pointer"
                        >
                          {player}
                        </ListItem>
                      ))}
                    </List>
                  )}
                </VStack>
                <NumberInput
                  min={0}
                  value={ballsWon}
                  onChange={handleBallsWonChange}
                >
                  <NumberInputField w="5vw" placeholder="Balls" />
                </NumberInput>
                <Checkbox
                  isChecked={isOT}
                  onChange={(e) => setIsOT(e.target.checked)}
                >
                  OT
                </Checkbox>
              </HStack>
              <HStack>
                <Button colorScheme="green" onClick={() => addMatch(playerOne)}>
                  Player 1 Wins
                </Button>
                <Button colorScheme="red" onClick={() => addMatch(playerTwo)}>
                  Player 2 Wins
                </Button>
              </HStack>
              <VStack>
                {matches.map((match: any, index: number) => (
                  <Box key={index} p={2} borderWidth="1px" borderRadius="md">
                    <Text>
                      {match.playerOne} vs {match.playerTwo}
                    </Text>
                    <Text>Winner: {match.winner}</Text>
                    <Text>Balls Won: {match.ballsWon}</Text>
                    <Text>OT: {match.isOT ? "Yes" : "No"}</Text>
                  </Box>
                ))}
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Back
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default MatchupForm;
