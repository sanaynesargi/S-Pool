import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Button,
  VStack,
  Text,
  Grid,
  Center,
  Box,
  HStack,
} from "@chakra-ui/react";

function ObjectToChakraText(obj: any) {
  // Filtering out keys 'name' and 'total', and then mapping to a formatted string
  const keyValuePairs = Object.entries(obj)
    .filter(([key]) => key !== "name" && key !== "total")
    .map(([key, value], index, array) => {
      // Adding a comma after each key-value pair except the last
      const separator = index < array.length - 1 ? ", " : "";
      return `${value} ${getFirstLetters(key)}${separator}`;
    });

  return (
    <div>
      <Text>{keyValuePairs}</Text>
    </div>
  );
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

const getTotal = (obj: any) => {
  let t = 0;

  for (const key of Object.keys(obj)) {
    if (key == "name" || key == "total") {
      continue;
    }

    t += scoreMap[key];
  }

  return t;
};

const getFirstLetters = (str: string) =>
  str.includes(" ")
    ? str
        .split(" ")
        .map((word) => word[0])
        .join("")
    : str.charAt(0);

const PlayerStatsRow = ({ name, obj, idx }: any) => (
  <Center key={idx}>
    <VStack align="start" spacing={0}>
      {idx % 2 != 0 ? (
        <HStack w="100%" justifyContent="space-between">
          <Text fontSize="lg" fontWeight="semibold">
            {getTotal(obj)}
          </Text>
          <Text>-</Text>
          <Text fontSize="lg" fontWeight="semibold">
            {name}
          </Text>
        </HStack>
      ) : (
        <Center>
          <HStack w="100%" justifyContent="space-between">
            <Text fontSize="lg" fontWeight="semibold">
              {name}
            </Text>
            <Text>-</Text>
            <Text fontSize="lg" fontWeight="semibold">
              {getTotal(obj)}
            </Text>
          </HStack>
        </Center>
      )}
      <Text fontSize="xs" maxW="150px">
        {ObjectToChakraText(obj)}
      </Text>
    </VStack>
  </Center>
);

const FantasyModal = ({ obj }: any) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button onClick={onOpen}>Tournament Stats</Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.900" color="white">
          <ModalHeader>Tournament Stats</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Center>
              <Grid templateColumns="repeat(2, 1fr)" w="70%">
                {obj.map((player: any, index: number) => (
                  <PlayerStatsRow
                    key={index + 1123018129}
                    idx={index}
                    name={player.name}
                    obj={player}
                  />
                ))}
              </Grid>
            </Center>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default FantasyModal;
