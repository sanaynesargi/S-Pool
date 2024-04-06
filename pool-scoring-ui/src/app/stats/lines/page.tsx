"use client";

import React, { useState, useEffect, useReducer } from "react";
import axios from "axios";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Text,
  IconButton,
  Button,
  VStack,
  Input,
  Center,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Checkbox,
} from "@chakra-ui/react";
import { apiUrl } from "../../../../utils/utils";
import {
  AddIcon,
  DeleteIcon,
  MinusIcon,
  PlusSquareIcon,
} from "@chakra-ui/icons";

function gaussianRandom(mu: number, sigma: number) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mu + z * sigma;
}

function getRandomIndices(arr: any[], count: number) {
  let indices: any = [];
  const len = arr.length;

  // Generate unique random indices
  while (indices.length < count) {
    let randomIndex = Math.floor(Math.random() * len);
    if (!indices.includes(randomIndex)) {
      indices.push(randomIndex);
    }
  }

  return indices;
}

function hasSubArray(master: any, sub: any) {
  for (const elem of master) {
    if (elem[0] == sub[0] && elem[1] == sub[1]) {
      return true;
    }
  }

  return false;
}

const BettingLines = () => {
  const [playerAverages, setPlayerAverages] = useState({
    singles: [],
    doubles: [],
    singlesT: [],
    doublesT: [],
  });
  const [bettingLines, setBettingLines] = useState<any>([]);
  const [selectedIndices, setSelectedIndices] = useState<any>([]);
  const [bets, setBets] = useState<any>({});
  const [name, setName] = useState<string>();
  const [currentSelected, setCurrentSelected] = useState<any>([]);
  const [, forceUpdate] = useReducer((x: any) => x + 1, 0);
  const [mode, setMode] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [stateMode, setStateMode] = useState<any>(true);

  const countWins = (arr: any) => {
    let count = 0;

    for (const obj of arr) {
      if (obj.length >= 2 && obj[2]) {
        count += 1;
      }
    }

    return count;
  };

  useEffect(() => {
    const fetchAverages = async () => {
      try {
        const [singlesResponse, doublesResponse] = await Promise.all([
          axios.get(
            `http://${apiUrl}/player-actions-stats-averages?mode=singles&seasonId=2`
          ),
          axios.get(
            `http://${apiUrl}/player-actions-stats-averages?mode=doubles&seasonId=2`
          ),
        ]);

        const [singlesTResponse, doublesTResponse] = await Promise.all([
          axios.get(
            `http://${apiUrl}/average-points-per-game?mode=singles&seasonId=2`
          ),
          axios.get(
            `http://${apiUrl}/average-points-per-game?mode=doubles&seasonId=2`
          ),
        ]);

        setPlayerAverages({
          singles: singlesResponse.data,
          doubles: doublesResponse.data,
          doublesT: doublesTResponse.data,
          singlesT: singlesTResponse.data,
        });
      } catch (error) {
        console.error("Error fetching averages:", error);
      }
    };

    fetchAverages();
  }, []);

  useEffect(() => {
    const std = 3;
    let l: any = [];

    for (const [name, statObj] of Object.entries(
      mode ? playerAverages.singles : playerAverages.doubles
    )) {
      let playerLines: any = [];

      for (const obj of statObj as any) {
        const statName = obj["actionType"];
        const avg = obj["averageActionCount"];

        playerLines.push({
          player: name,
          line: Math.abs(gaussianRandom(avg, std)),
          mode: mode ? "singles" : "doubles",
          stat: statName,
        });
      }

      const selected: any = mode
        ? playerAverages.singlesT
        : playerAverages.doublesT;

      playerLines.push({
        player: name,
        line: Math.abs(gaussianRandom(parseFloat(selected[name as any]), 2.5)),
        mode: mode ? "singles" : "doubles",
        stat: "Points in Tournament",
      });

      let randomChoices = getRandomIndices(playerLines, 3);

      for (let choice of randomChoices) {
        let c = playerLines[choice];
        l.push({
          player: c.player,
          line: Math.round(c.line) + 0.5,
          mode: c.mode,
          stat: c.stat,
        });
      }
    }

    setBettingLines(l);
  }, [playerAverages, mode]);

  return (
    <Box>
      <HStack>
        <Table variant="simple" w="70%">
          <Thead>
            <Tr>
              <Th>Select</Th>
              <Th>Player</Th>
              <Th>Mode</Th>
              <Th>Stat</Th>
              <Th>Line</Th>
            </Tr>
          </Thead>
          <Tbody>
            {bettingLines.map((line: any, index: number) => {
              if (!line.line) {
                return null;
              }

              return (
                <Tr key={`${line.player}-${line.mode}-${gaussianRandom(1, 2)}`}>
                  <Td>
                    <HStack>
                      <IconButton
                        isDisabled={hasSubArray(selectedIndices, [
                          index,
                          "over",
                        ])}
                        onClick={() => {
                          let old = selectedIndices;
                          old.push([index, "over"]);

                          setCurrentSelected([index, "over"]);

                          setSelectedIndices(old);
                          forceUpdate();
                        }}
                        icon={<AddIcon />}
                        aria-label="+"
                        colorScheme="blue"
                      ></IconButton>
                      <IconButton
                        isDisabled={hasSubArray(selectedIndices, [
                          index,
                          "under",
                        ])}
                        onClick={() => {
                          let old = selectedIndices;
                          old.push([index, "under"]);

                          setCurrentSelected([index, "under"]);

                          setSelectedIndices(old);
                          forceUpdate();
                        }}
                        icon={<MinusIcon />}
                        aria-label="+"
                        colorScheme="red"
                      ></IconButton>
                    </HStack>
                  </Td>
                  <Td>{line.player}</Td>
                  <Td>{line.mode}</Td>
                  <Td>{line.stat}</Td>
                  <Td>{line.line.toFixed(1)}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
        <VStack
          mb="auto"
          alignItems="start"
          w="30%"
          justifyContent="center"
          h="100%"
        >
          <Input
            placeholder="Player Making Bet"
            onChange={(e) => setName(e.target.value!)}
            size="md"
            maxW="75%"
          />
          <Button
            onClick={() => {
              if (currentSelected[0] == -1) {
                alert("Select a bet");
                return;
              }

              let old = bets;

              if (!old[name!]) {
                old[name!] = [currentSelected];
              } else {
                old[name!].push(currentSelected);
              }

              setBets(old);
              setCurrentSelected(-1);
              forceUpdate();
            }}
            colorScheme="yellow"
          >
            Enter Bet
          </Button>
          <Button onClick={onOpen}>See All Bets</Button>
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent maxW="900px">
              <ModalHeader>Player Prop Bets</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Center overflowY="scroll">
                  {stateMode ? (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Delete</Th>
                          <Th>Person</Th>
                          <Th>Player</Th>
                          <Th>Stat</Th>
                          <Th>Prop</Th>
                          <Th>O/U</Th>
                          <Th>Won?</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {Object.keys(bets).map(
                          (name: string, index: number) => {
                            for (const grp of bets[name]) {
                              const [idx, type] = grp;
                              const line = bettingLines[idx];

                              return (
                                <Tr key={index}>
                                  <Td>
                                    <IconButton
                                      onClick={() => {
                                        let old = bets;
                                        let o = selectedIndices;

                                        let indexOf = o.indexOf([idx, type]);
                                        o.splice(indexOf, 1);
                                        setSelectedIndices(o);

                                        let nameOld = old[name!];
                                        let indexOf2 = nameOld.indexOf([
                                          idx,
                                          type,
                                        ]);
                                        nameOld.splice(indexOf2, 1);

                                        old[name!] = nameOld;
                                        setBets(old);

                                        forceUpdate();
                                      }}
                                      icon={<DeleteIcon />}
                                      aria-label="+"
                                      colorScheme="red"
                                    ></IconButton>
                                  </Td>
                                  <Td>{name}</Td>
                                  <Td>{line.player}</Td>
                                  <Td>{line.stat}</Td>
                                  <Td>{line.line.toFixed(1)}</Td>
                                  <Td>{type == "over" ? "Over" : "Under"}</Td>
                                  <Td>
                                    <Checkbox
                                      defaultChecked={
                                        bets[name][idx] &&
                                        bets[name][idx].length == 3
                                          ? bets[name][idx][2]
                                          : false
                                      }
                                      onChange={() => {
                                        let old = bets;
                                        let length =
                                          old[name][idx] &&
                                          old[name][idx].length == 3;

                                        let won = length
                                          ? old[name][idx][2]
                                          : false;

                                        if (
                                          !won &&
                                          old[name][idx] &&
                                          old[name][idx].length < 3
                                        ) {
                                          old[name][idx].push(true);
                                        } else {
                                          old[name][idx][2] = !(old[name][
                                            idx
                                          ] && old[name][idx][2]
                                            ? old[name][idx][2]
                                            : true);
                                        }

                                        setBets(old);
                                        forceUpdate();
                                      }}
                                    ></Checkbox>
                                  </Td>
                                </Tr>
                              );
                            }
                          }
                        )}
                      </Tbody>
                    </Table>
                  ) : (
                    Object.keys(bets).map((name: string, index: number) => {
                      return (
                        <Box
                          width="75%"
                          bgColor="gray.600"
                          key={index}
                          height="35%"
                          borderRadius="md"
                        >
                          <Center justifyContent="space-around">
                            <Text>{name}</Text>
                            <Text>
                              {countWins(bets[name])}/{bets[name].length}
                            </Text>
                          </Center>
                        </Box>
                      );
                    })
                  )}
                </Center>
              </ModalBody>

              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={onClose}>
                  Close
                </Button>
                <Button
                  variant="ghost"
                  mr={3}
                  onClick={() => setStateMode(!stateMode)}
                >
                  View Records/View Bets
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <Button onClick={() => setMode(!mode)} colorScheme="teal">
            Mode: {mode ? "Singles" : "Doubles"}
          </Button>
        </VStack>
      </HStack>
    </Box>
  );
};

export default BettingLines;
