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

function sortByName(arr: any) {
  const newArr = arr.sort((a: any, b: any) => {
    // Check if either string contains 'gp'
    let containsGpA = a.includes("GP");
    let containsGpB = b.includes("GP");

    // Prioritize strings containing 'gp'
    if (containsGpA && !containsGpB) {
      return -1;
    }
    if (!containsGpA && containsGpB) {
      return 1;
    }

    // If neither or both contain 'gp', sort alphabetically by name
    let nameA = a.split(" ")[1].toLowerCase();
    let nameB = b.split(" ")[1].toLowerCase();

    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }

    return 0;
  });

  newArr[newArr.length - 1] = newArr[newArr.length - 1].slice(0, -2);

  return newArr;
}

function ObjectToChakraText(obj: any, match: boolean, gp: number) {
  let keyValuePairs = [];

  if (!match) {
    // Filtering out keys 'name' and 'total', and then mapping to a formatted string
    keyValuePairs = Object.entries(obj)
      .filter(([key]) => key !== "name" && key !== "total")
      .map(([key, value]) => {
        // Adding a comma after each key-value pair except the last
        const separator = ", ";
        return `${value} ${getFirstLetters(key)}${separator}`;
      });

    keyValuePairs.splice(0, 0, `${gp} GP, `);
  } else {
    let index = 0;
    for (const blob of obj.actions) {
      const separator = ", ";
      const string = `${blob.actionCount} ${getFirstLetters(
        blob.actionType
      )}${separator}`;
      keyValuePairs.push(string);
      index++;
    }
    keyValuePairs.splice(0, 0, `${gp} GP, `);
  }

  return (
    <div>
      <Text>{sortByName(keyValuePairs)}</Text>
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

const getTotal = (obj: any, match: boolean) => {
  let t = 0;

  if (!match) {
    for (const key of Object.keys(obj)) {
      if (key == "name" || key == "total") {
        continue;
      }
      t += scoreMap[key];
    }
  } else {
    for (const blob of obj.actions) {
      t += blob.fpts;
    }
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

const PlayerStatsRow = ({ name, obj, idx, match, gp }: any) => {
  const cond = match ? idx % 2 == 0 : idx % 2 != 0;

  return (
    <Center key={idx}>
      <VStack align="start" spacing={0}>
        {cond ? (
          <HStack w="100%" justifyContent="space-between">
            <Text fontSize="lg" fontWeight="semibold">
              {getTotal(obj, match)}
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
                {getTotal(obj, match)}
              </Text>
            </HStack>
          </Center>
        )}
        <Text fontSize="xs" maxW="150px">
          {ObjectToChakraText(obj, match, gp)}
        </Text>
      </VStack>
    </Center>
  );
};

const FantasyModal = ({
  obj,
  match,
  id,
  p1,
  p2,
  gp1,
  gp2,
  gamesPlayed,
}: any) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button
        onClick={onOpen}
        opacity={match ? 0 : 100}
        pos={!match ? "relative" : "absolute"}
      >
        Tournament Stats
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.900" color="white">
          <ModalHeader>Tournament Stats</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Center>
              <Grid templateColumns="repeat(2, 1fr)" w="70%">
                {obj.map((player: any, index: number) => {
                  if (
                    player.tournamentId == id &&
                    [p1, p2].includes(player.playerName)
                  ) {
                    return (
                      <>
                        <PlayerStatsRow
                          key={index + 1123018129}
                          idx={index}
                          name={player.name ?? player.playerName}
                          obj={player}
                          match={match}
                          p1={p1}
                          p2={p2}
                          gp={
                            match
                              ? [player.name, player.playerName].includes(p1)
                                ? gp1
                                : gp2
                              : gamesPlayed[player.name]
                          }
                        />
                      </>
                    );
                  }
                })}
              </Grid>
            </Center>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default FantasyModal;
