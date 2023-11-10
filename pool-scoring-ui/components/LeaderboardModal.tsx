// LeaderboardModal.js
import React, { useMemo } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  Text,
} from "@chakra-ui/react";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerScores: { [playerName: string]: number };
  onScoreClick: (playerName: string) => void;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  playerScores,
  onScoreClick,
}) => {
  const sortedScores = useMemo(() => {
    return Object.entries(playerScores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([player, score]) => ({ player, score }));
  }, [playerScores]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Leaderboard</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={3}>
            {sortedScores.map(({ player, score }) => (
              <Text
                key={player}
                fontWeight="normal"
                cursor="pointer"
                _hover={{ textDecoration: "underline" }}
                onClick={() => onScoreClick(player)}
              >
                {player}: {score.toFixed(2)} points
              </Text>
            ))}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default LeaderboardModal;
