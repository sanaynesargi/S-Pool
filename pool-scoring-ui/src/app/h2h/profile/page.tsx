"use client";
// pages/index.js
import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  VStack,
  Table,
  Text,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  FormControl,
  FormLabel,
  useToast,
  TableCaption,
  Button,
  Center,
  Grid,
  GridItem,
  HStack,
} from "@chakra-ui/react";
import axios from "axios";
import { apiUrl } from "../../../../utils/utils";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import GaugeChart from "react-gauge-chart";

export default function Profile() {
  return (
    <Center w="100vw" h="100vh">
      <Grid
        h="500px"
        w="500px"
        templateRows="repeat(2, 1fr)"
        templateColumns="repeat(6, 1fr)"
        gap={3}
      >
        <GridItem colSpan={2} borderRadius="md" bg="gray.700">
          <Center w="100%" h="100%">
            <VStack spacing={5}>
              <Heading>Sanay</Heading>
              <HStack>
                <VStack>
                  <Button colorScheme="blue"></Button>
                  <Text fontSize="10pt" fontWeight="bold">
                    PPG
                  </Text>
                </VStack>
                <VStack>
                  <Button colorScheme="green"></Button>
                  <Text fontSize="10pt" fontWeight="bold">
                    PPT
                  </Text>
                </VStack>
                <VStack>
                  <Button colorScheme="yellow"></Button>
                  <Text fontSize="10pt" fontWeight="bold">
                    PPS
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Center>
        </GridItem>
        <GridItem colSpan={2} borderRadius="md" bg="green.500">
          <Center w="100%" h="100%">
            <VStack spacing={3}>
              <Heading size="md" textAlign="center">
                Top Scoring Tournaments
              </Heading>

              <Box w="90%" h="50px" bg="black" borderRadius="md"></Box>
              <Box w="90%" h="50px" bg="black" borderRadius="md"></Box>
              <Box w="90%" h="50px" bg="black" borderRadius="md"></Box>
            </VStack>
          </Center>
        </GridItem>
        <GridItem colSpan={2} borderRadius="md" bg="blue.500">
          <Center w="100%" h="100%">
            <VStack spacing={3}>
              <Heading size="md" textAlign="center">
                Familiar Foes
              </Heading>

              <Box w="90%" h="50px" bg="black" borderRadius="md"></Box>
              <Box w="90%" h="50px" bg="black" borderRadius="md"></Box>
              <Box w="90%" h="50px" bg="black" borderRadius="md"></Box>
            </VStack>
          </Center>
        </GridItem>
        <GridItem colSpan={4} borderRadius="md" bg="gray.700">
          <Center w="100%" h="100%">
            <VStack spacing={3}>
              <Heading size="lg" textAlign="center">
                Cooking Scale
              </Heading>

              <GaugeChart id="gauge-chart2" nrOfLevels={10} percent={0.86} />
            </VStack>
          </Center>
        </GridItem>
        <GridItem colSpan={2} borderRadius="md" bg="tomato">
          <Center w="100%" h="100%">
            <VStack spacing={3}>
              <Heading size="md" textAlign="center">
                Current Streak
              </Heading>

              <Heading>W10</Heading>
            </VStack>
          </Center>
        </GridItem>
      </Grid>
    </Center>
  );
}
