"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Button,
  useToast,
  FormControl,
  FormLabel,
  Select,
  HStack,
  Center,
  VStack,
  Spacer,
  Heading,
} from "@chakra-ui/react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { apiUrl } from "../../../utils/utils";
import { ArrowBackIcon, ArrowLeftIcon } from "@chakra-ui/icons";

const PlayerStatsTable = ({ players }: any) => {
  // Sample data for demonstration
  const playerStats = [
    { name: "Player 1", stat1: 85, stat2: 92, stat3: 78 },
    { name: "Player 2", stat1: 90, stat2: 88, stat3: 95 },
    { name: "Player 3", stat1: 78, stat2: 82, stat3: 90 },
    { name: "Player 4", stat1: 92, stat2: 85, stat3: 87 },
    { name: "Player 5", stat1: 86, stat2: 94, stat3: 83 },
  ];
  const [data, setData] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedMode, setSelectedMode] = useState("");
  const [seasonOptions, setSeasonOptions] = useState<any>([]);
  const errorToast = useToast();

  useEffect(() => {
    // Fetch the list of seasons
    axios
      .get(`http://${apiUrl}/getSeasons`)
      .then((response) => {
        let newArr = [];

        for (const obj of Object.entries(response.data)) {
          newArr.push({ label: obj[1], value: parseInt(obj[0]) });
        }

        setSeasonOptions(newArr);
      })
      .catch((error) => console.error("Error fetching seasons:", error));
  }, []);

  useEffect(() => {
    // Fetch data based on selectedSeason and selectedMode
    // Simulate fetching data from the backend using dummy data

    fetchData(selectedSeason, selectedMode);
  }, [selectedSeason, selectedMode]);

  const fetchData = (season: any, mode: any) => {
    // Simulate fetching data from the backend using dummy data
    let data: any = {};

    if (!mode) {
      errorToast({
        title: "Error Fetching Data",
        description: "Select Parameters",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    data = axios.get(`http://${apiUrl}/grades?mode=${mode}&seasonId=${season}`);

    data.then((resp: any) => {
      setData(resp.data as any);
    });
  };

  const [showNumberGrades, setShowNumberGrades] = useState(true);

  // Grade table
  const gradeTable: any = {
    "A+": { min: 90, max: 100, gpa: 4.33 },
    A: { min: 80, max: 89.99, gpa: 4.0 },
    "A-": { min: 75, max: 79.99, gpa: 3.67 },
    "B+": { min: 70, max: 74.99, gpa: 3.33 },
    B: { min: 65, max: 69.99, gpa: 3.0 },
    "B-": { min: 60, max: 64.99, gpa: 2.67 },
    "C+": { min: 55, max: 59.99, gpa: 2.33 },
    C: { min: 50, max: 54.99, gpa: 2.0 },
    "C-": { min: 45, max: 49.99, gpa: 1.67 },
    "D+": { min: 40, max: 44.99, gpa: 1.33 },
    D: { min: 35, max: 39.99, gpa: 1.0 },
    "D-": { min: 30, max: 34.99, gpa: 0.67 },
    F: { min: 0, max: 29.99, gpa: 0 },
    NOEVIDENCE: { min: 0, max: 29.99, gpa: 0 },
  };

  const modeOptions = [
    { label: "Singles", value: "singles" },
    { label: "Doubles", value: "doubles" },
  ];

  // Function to get letter grade based on GPA
  const getLetterGrade = (gpa: any) => {
    for (const [letter, range] of Object.entries(gradeTable)) {
      if (gpa >= (range as any).min && gpa <= (range as any).max) {
        return letter;
      }
    }
    return "F"; // Assign "F" grade if no range matches
  };

  // Function to calculate average of an array of numbers
  const calculateAverage = (array: any) => {
    const sum = array.reduce((acc: any, curr: any) => acc + curr, 0);
    return sum / array.length;
  };

  const router = useRouter();

  function convertToPlayerStats(data: any) {
    const scoreMap: { [a: string]: number } = {
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

    const playerStats: any = {};

    // Iterate over each category (e.g., "No Result", "Scratch", etc.)
    for (const category in data) {
      if (data.hasOwnProperty(category)) {
        const categoryData = data[category];

        // Iterate over each player within the category
        for (const player in categoryData) {
          if (categoryData.hasOwnProperty(player)) {
            const stats = categoryData[player];

            // If the player already exists, add stats to their existing data
            if (playerStats[player]) {
              playerStats[player][category] = stats;
            }
            // Otherwise, create a new entry for the player
            else {
              playerStats[player] = { [category]: stats };
            }

            // Add missing stats with a value of -1 if not present in the original data
            for (const stat in scoreMap) {
              if (scoreMap.hasOwnProperty(stat) && !playerStats[player][stat]) {
                playerStats[player][stat] = -1;
              }
            }
          }
        }
      }
    }

    return playerStats;
  }

  // Function to calculate GPA based on letter grades
  const calculateGPA = (player: any) => {
    const letterGrades = Object.values(player).map((value) => {
      return getLetterGrade(value);
    });

    let filteredGrades = [];

    for (let i = 1; i < letterGrades.length; i++) {
      filteredGrades.push(letterGrades[i]);
    }

    const totalGPA = filteredGrades.reduce(
      (acc, grade) => acc + gradeTable[grade].gpa,
      0
    );

    return totalGPA / filteredGrades.length;
  };

  return (
    <Box borderRadius="md" overflow="scroll" w="100vw" h="100vh">
      <VStack justifyContent={"start"}>
        <Heading>Report Card</Heading>
        <Heading fontSize="xl" color="gray.400">
          In Progress
        </Heading>
        <FormControl>
          <FormLabel>Select Mode</FormLabel>
          <Select
            placeholder="Select mode"
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            maxW="300px"
          >
            {modeOptions.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Select Season</FormLabel>
          <Select
            placeholder="Select season"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            maxW="300px"
          >
            {seasonOptions.map((option: any, index: any) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button
            mb={4}
            mt={4}
            onClick={() => setShowNumberGrades(!showNumberGrades)}
          >
            {showNumberGrades ? "Show Letter Grades" : "Show Number Grades"}
          </Button>
          <Spacer w="75px" />
          <Button
            mb={4}
            mt={4}
            onClick={() => router.push("/")}
            bg="black"
            leftIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
        </FormControl>
      </VStack>

      <Table colorScheme="teal" mx="auto" variant="striped">
        <Thead>
          <Tr>
            <Th>Player Name</Th>
            {Object.keys(data).map((name) => (
              <Th>{name}</Th>
            ))}
            <Th>Average</Th>
            <Th>GPA</Th>
          </Tr>
        </Thead>
        <Tbody>
          {Object.entries(convertToPlayerStats(data)).map(
            ([name, values]: any) => {
              return (
                <Tr key={1}>
                  <Td>{name}</Td>
                  {Object.values(values).map((val: any) => {
                    return (
                      <Td>
                        {showNumberGrades
                          ? val == -1
                            ? "*"
                            : val.toFixed(2)
                          : getLetterGrade(val)}
                      </Td>
                    );
                  })}

                  <Td>
                    {showNumberGrades
                      ? (
                          (Object as any)
                            .values(values as any)
                            .filter((value: any) => typeof value === "number")
                            .reduce((acc: any, curr: any) => acc + curr, 0) /
                          (Object.values(values).length - 1)
                        ).toFixed(2) + "%"
                      : getLetterGrade(
                          (Object as any)
                            .values(values)
                            .filter((value: any) => typeof value === "number")
                            .reduce((acc: any, curr: any) => acc + curr, 0) /
                            (Object.values(values).length - 1)
                        )}
                  </Td>
                  <Td>{calculateGPA(values).toFixed(2)}</Td>
                </Tr>
              );
            }
          )}
        </Tbody>
      </Table>
    </Box>
  );
};

export default PlayerStatsTable;
