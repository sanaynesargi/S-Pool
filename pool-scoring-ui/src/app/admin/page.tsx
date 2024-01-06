"use client";
import React, { useState } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Button,
  useToast,
} from "@chakra-ui/react";
import { apiUrl } from "../../../utils/utils";

const AdminSeasonEntry: React.FC = () => {
  const [seasonName, setSeasonName] = useState("");
  const [startSinglesId, setStartSinglesId] = useState(0);
  const [endSinglesId, setEndSinglesId] = useState(0);
  const [startDoublesId, setStartDoublesId] = useState(0);
  const [endDoublesId, setEndDoublesId] = useState(0);
  const toast = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch(`http://${apiUrl}/addSeason`, {
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

  return (
    <Box p={5}>
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
    </Box>
  );
};

export default AdminSeasonEntry;
