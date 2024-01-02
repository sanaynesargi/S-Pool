import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  List,
  ListItem,
  useDisclosure,
  Center,
} from "@chakra-ui/react";

const PlayerSelectionModal = ({ names, onNameSelected, statIndex }: any) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [availableNames, setAvailableNames] = useState(names);

  const selectName = (name: any) => {
    onNameSelected(name, statIndex);
    setAvailableNames(availableNames.filter((n: any) => n !== name));
    onClose();
  };

  return (
    <>
      <Button onClick={onOpen}>Select Player</Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select a Player</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Center>
              <List>
                {availableNames.map((name: any) => (
                  <ListItem
                    key={name}
                    mb={2}
                    cursor="pointer"
                    onClick={() => selectName(name)}
                    padding="15px"
                    bg="gray.800"
                    borderRadius="md"
                    _hover={{ bg: "gray.500" }}
                  >
                    {name}
                  </ListItem>
                ))}
              </List>
            </Center>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default PlayerSelectionModal;
