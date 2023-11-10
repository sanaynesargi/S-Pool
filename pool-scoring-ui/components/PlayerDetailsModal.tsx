import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Text,
} from "@chakra-ui/react";

interface Action {
  type: string;
  points: number;
}

const scoreMap: any = {
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

interface PlayerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  details?: {
    playerName?: string;
    actions?: Action[];
    [key: string]: any;
  };
}

const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({
  isOpen,
  onClose,
  details,
}) => {
  const actions = details?.actions || [];
  const playerName = details?.playerName || "Player";

  const actionCounts = actions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{playerName}'s Actions</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box mb={4}>
            {Object.entries(details || {})
              .filter(([key]) => key !== "playerName" && key !== "actions")
              .map(([key, value]) => (
                <Text key={key} fontSize="sm">
                  <strong>{key}:</strong> {value}
                </Text>
              ))}
          </Box>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Action</Th>
                <Th isNumeric>Action Count</Th>
                <Th isNumeric>Points Per</Th>
                <Th isNumeric>Total Points</Th>
              </Tr>
            </Thead>
            <Tbody>
              {Object.entries(actionCounts).map(([type, _]) => {
                const totalPoints = actions.reduce(
                  (total, action) =>
                    action.type === type ? total + action.points : total,
                  0
                );
                const pointsPerAction = totalPoints / scoreMap[type];
                return (
                  <Tr key={type}>
                    <Td>{type}</Td>
                    <Td isNumeric>{pointsPerAction.toFixed(2)}</Td>
                    <Td isNumeric>
                      {totalPoints == 0 || pointsPerAction == 0
                        ? 0
                        : (totalPoints / pointsPerAction).toFixed(2)}
                    </Td>
                    <Td isNumeric>{totalPoints.toFixed(2)}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PlayerDetailsModal;
