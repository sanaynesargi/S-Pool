// AddPlayerModal.tsx
"use client";
import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Button,
  Text,
  Input,
  Stack,
} from "@chakra-ui/react";

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlayer: (playerName: string) => void;
  players: string[];
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  isOpen,
  onClose,
  onAddPlayer,
  players,
}) => {
  const [playerName, setPlayerName] = useState("");

  const handleAdd = () => {
    if (playerName.trim() !== "") {
      onAddPlayer(playerName.trim());
      setPlayerName("");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Players</ModalHeader>
        <ModalBody>
          <Input
            placeholder="Enter player name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            mb={3}
          />
          <Button onClick={handleAdd} colorScheme="blue">
            Add
          </Button>
          <Stack mt={4}>
            {players.map((player, index) => (
              <Text key={index}>{player}</Text>
            ))}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddPlayerModal;
