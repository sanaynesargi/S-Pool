import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import AddPlayerModal from "./AddPlayerModal";
import { useRouter } from "next/navigation";

interface NavBarProps {
  onAddPlayers: (players: string[]) => void;
  setGameStarted: (isStarted: boolean) => void;
  isGameStarted: boolean;
  onEndGame: () => void;
  mode: any;
  setMode: any;
}

const Navbar: React.FC<NavBarProps> = ({
  onAddPlayers,
  setGameStarted,
  isGameStarted,
  onEndGame,
  mode,
  setMode,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    const stringPlayers = localStorage.getItem("players");
    if (stringPlayers && stringPlayers !== "[]") {
      const parsedPlayers = JSON.parse(stringPlayers);
      if (parsedPlayers.length > 0) {
        setPlayers(parsedPlayers);
        onAddPlayers(parsedPlayers);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("players", JSON.stringify(players));
  }, [players]);

  const router = useRouter();

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    onAddPlayers(players);
    setIsModalOpen(false);
  };

  const handleAddPlayer = (playerName: string) => {
    setPlayers((prevPlayers) => [...prevPlayers, playerName]);
  };

  const handleClearPlayers = () => {
    setPlayers([]);
    onAddPlayers([]);
    localStorage.removeItem("players");
    localStorage.removeItem("nameGridState");
    localStorage.removeItem("playerScores");
    localStorage.removeItem("isGameStarted");
  };

  const handleEndGame = async () => {
    await onEndGame();
  };

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      padding={4}
      bg="#63B3ED"
      color="#FFF"
      boxShadow="0 2px 4px rgba(0, 0, 0, 0.1)"
      zIndex="sticky"
    >
      <Box w="200px">
        <Text
          fontSize="lg"
          fontWeight="bold"
          _hover={{
            cursor: "pointer",
          }}
          onClick={() => {
            router.push("/");
          }}
        >
          S-Pool (8 Ball)
        </Text>
      </Box>

      <Flex>
        <Button
          bg="#68D391"
          color="#FFF"
          _hover={{ bg: "#48BB78", color: "#FFF" }}
          fontSize="sm"
          mr={2}
          onClick={() => {
            setMode(!mode);
          }}
          boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
        >
          Mode: {mode ? "Singles" : "Doubles"}
        </Button>
        <Button
          bg="#4FD1C5"
          color="#FFF"
          _hover={{ bg: "#38B2AC", color: "#FFF" }}
          fontSize="sm"
          mr={2}
          isDisabled={isGameStarted && players.length > 0}
          onClick={handleOpenModal}
          boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
        >
          Add Players
        </Button>
        <Button
          bg="#FC8181"
          color="#FFF"
          _hover={{ bg: "#F56565", color: "#FFF" }}
          fontSize="sm"
          mr={2}
          onClick={handleClearPlayers}
          boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
        >
          Clear Players
        </Button>
        <Button
          bg="#68D391"
          color="#FFF"
          _hover={{ bg: "#48BB78", color: "#FFF" }}
          isDisabled={players.length == 0}
          fontSize="sm"
          mr={2}
          onClick={handleStartGame}
          boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
        >
          Start Game
        </Button>
        <Button
          bg="#F6AD55"
          color="#FFF"
          _hover={{ bg: "#ED8936", color: "#FFF" }}
          fontSize="sm"
          onClick={() => {
            onOpen();
            // handleEndGame()
          }}
          isDisabled={!isGameStarted}
          boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
        >
          End Game
        </Button>
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef as any}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Submit Tournament Results
              </AlertDialogHeader>

              <AlertDialogBody>
                <Text fontWeight="semibold" fontSize="xl" color="gray.500">
                  Make Sure The Mode is Right:
                </Text>
                <Text fontWeight="semibold" fontSize="xl">
                  Mode: {mode ? "Singles" : "Doubles"}
                </Text>
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef as any} onClick={onClose}>
                  Go Back
                </Button>
                <Button
                  colorScheme="green"
                  onClick={() => {
                    handleEndGame();
                    onClose();
                  }}
                  ml={3}
                >
                  Send
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Flex>

      <AddPlayerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddPlayer={handleAddPlayer}
        players={players}
      />
    </Flex>
  );
};

export default Navbar;
