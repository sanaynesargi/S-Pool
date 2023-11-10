import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Wrap,
  Box,
  Text,
} from "@chakra-ui/react";

export type ActionType =
  | "No Result"
  | "Scratch"
  | "Ball In"
  | "8 Ball In"
  | "Opp Ball In"
  | "2 Ball In"
  | "3 Ball In"
  | "4+ Ball In"
  | "Opp. 8 Ball In";

interface Action {
  type: ActionType;
  color: string;
}

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionSelect: (selectedActions: Action[], selectedColors: string[]) => void;
  selectedActions: Action[];
}

const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  onActionSelect,
  selectedActions: initialSelectedActions,
}) => {
  const [selectedActions, setSelectedActions] = useState<Action[]>(
    initialSelectedActions
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedActions(initialSelectedActions);
    }
  }, [initialSelectedActions, isOpen]);

  const handleActionClick = (type: ActionType, color: string) => {
    const action = { type, color };
    setSelectedActions((prevActions) => {
      if (prevActions.some((a) => a.type === type)) {
        return prevActions.filter((a) => a.type !== type);
      } else {
        return [...prevActions, action];
      }
    });
  };

  const handleSave = () => {
    const selectedColors = selectedActions.map((action) => action.color);
    onActionSelect(selectedActions, selectedColors);
    onClose();
  };

  const renderSelectedColors = () => {
    return selectedActions.map((action, index) => (
      <Box key={index} bg={action.color} w="30px" h="30px" borderRadius="50%" />
    ));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Select Action</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Wrap spacing={4}>
            {Object.entries(actionColors).map(([action, color]) => (
              <Button
                key={action}
                bg={
                  selectedActions.some((a) => a.type === action)
                    ? color
                    : undefined
                }
                onClick={() => handleActionClick(action as ActionType, color)}
              >
                {action}
              </Button>
            ))}
          </Wrap>
          {/* <Box mt={4}>
            <Text mb={2}>Selected Colors:</Text>
            <Wrap>{renderSelectedColors()}</Wrap>
          </Box> */}
          <Button mt={4} colorScheme="blue" onClick={handleSave}>
            Save
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const actionColors: Record<ActionType, string> = {
  "No Result": "#A0AEC0", // Cool Gray
  Scratch: "#FC8181", // Vibrant Red
  "Ball In": "#48BB78", // Vibrant Green
  "8 Ball In": "#805AD5", // Vibrant Purple
  "Opp Ball In": "#FD6E48", // Vibrant Orange
  "2 Ball In": "#3182CE", // Vibrant Blue
  "3 Ball In": "#ED64A6", // Vibrant Pink
  "4+ Ball In": "#ECC94B", // Vibrant Yellow
  "Opp. 8 Ball In": "#2D3748", // Dark Gray (Almost Black)
};

export default ActionModal;
