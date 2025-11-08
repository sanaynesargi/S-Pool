"use client";
import React, { use, useState } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Button,
  useToast,
  HStack,
  Divider,
} from "@chakra-ui/react";
import { apiUrl } from "../../../utils/utils";

const AdminSeasonEntry: React.FC = () => {
  const [seasonName, setSeasonName] = useState("");
  const [startSinglesId, setStartSinglesId] = useState(0);
  const [endSinglesId, setEndSinglesId] = useState(0);
  const [startDoublesId, setStartDoublesId] = useState(0);
  const [endDoublesId, setEndDoublesId] = useState(0);
  const [allStars, setAllStars] = useState<any>([]);
  const [currentAllStar, setCurrentAllStar] = useState("");
  const [allStarSeasonId, setAllStarSeasonId] = useState(0);
  const toast = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/addSeason`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seasonName,
          startSinglesId,
          endSinglesId,
          startDoublesId,
          endDoublesId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.error?.includes("exists")) {
        toast({
          title: "Error",
          description: `Season Name Already Exists`,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Season added",
          description: `Added season!`,
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  };

  const handleSubmitAllStar = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/awards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          all_stars_only: true,
          AllNPA: {},
          AllStar: allStars,
          currentSeason: allStarSeasonId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "All-Stars Added",
        description: `Added All-Stars!`,
        status: "success",
        duration: 9000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  };

  return (
    <HStack p={5} w="100vw" spacing="20px">
      <form onSubmit={handleSubmit}>
        <FormControl isRequired mb={4}>
          <FormLabel htmlFor="seasonName">Season Name</FormLabel>
          <Input
            id="seasonName"
            type="text"
            value={seasonName}
            onChange={(e) => setSeasonName(e.target.value)}
          />
        </FormControl>
        <FormControl isRequired mb={4}>
          <FormLabel htmlFor="startSinglesId">Start Singles ID</FormLabel>
          <NumberInput
            value={startSinglesId}
            onChange={(valueString) => setStartSinglesId(parseInt(valueString))}
          >
            <NumberInputField id="startSinglesId" />
          </NumberInput>
        </FormControl>
        <FormControl isRequired mb={4}>
          <FormLabel htmlFor="endSinglesId">End Singles ID</FormLabel>
          <NumberInput
            value={endSinglesId}
            onChange={(valueString) => setEndSinglesId(parseInt(valueString))}
          >
            <NumberInputField id="endSinglesId" />
          </NumberInput>
        </FormControl>
        <FormControl isRequired mb={4}>
          <FormLabel htmlFor="startDoublesId">Start Doubles ID</FormLabel>
          <NumberInput
            value={startDoublesId}
            onChange={(valueString) => setStartDoublesId(parseInt(valueString))}
          >
            <NumberInputField id="startDoublesId" />
          </NumberInput>
        </FormControl>
        <FormControl isRequired mb={4}>
          <FormLabel htmlFor="endDoublesId">End Doubles ID</FormLabel>
          <NumberInput
            value={endDoublesId}
            onChange={(valueString) => setEndDoublesId(parseInt(valueString))}
          >
            <NumberInputField id="endDoublesId" />
          </NumberInput>
        </FormControl>
        <Button mt={4} colorScheme="blue" type="submit">
          Submit Season Data
        </Button>
      </form>
      <form onSubmit={handleSubmitAllStar}>
        <FormControl mb={4}>
          <FormLabel htmlFor="allStarName">All-Star Name</FormLabel>
          <Input
            id="allStarName"
            type="text"
            value={currentAllStar}
            onChange={(e) => setCurrentAllStar(e.target.value)}
          />
        </FormControl>
        <Button
          mb={4}
          onClick={() => {
            let old = allStars;
            old.push(currentAllStar);

            setAllStars(old);
            setCurrentAllStar("");
          }}
        >
          Add All Star
        </Button>
        <HStack mb={8} spacing={4}>
          {allStars.map((name: string) => {
            return (
              <Button bg="teal" onClick={() => {}}>
                {name}
              </Button>
            );
          })}
        </HStack>
        <FormControl isRequired mb={4}>
          <FormLabel htmlFor="allStarSeasonId">Season ID</FormLabel>
          <NumberInput
            value={allStarSeasonId}
            onChange={(valueString) =>
              setAllStarSeasonId(parseInt(valueString))
            }
          >
            <NumberInputField id="allStarSeasonId" />
          </NumberInput>
        </FormControl>

        <Button mt={4} colorScheme="blue" type="submit">
          Submit All-Star Data
        </Button>
      </form>
    </HStack>
  );
};

export default AdminSeasonEntry;
