"use client";
// pages/index.js
import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  VStack,
  Table,
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
} from "@chakra-ui/react";
import axios from "axios";
import { apiUrl } from "../../../../utils/utils";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";

// Dummy data for options

const modeOptions = [
  { label: "Singles", value: "singles" },
  { label: "Doubles", value: "doubles" },
  { label: "All-Star", value: "allstar" },
  { label: "Both", value: "both" },
];

// Dummy data for player statistics

export default function Home() {
  const [data, setData] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedMode, setSelectedMode] = useState("");
  const [seasonOptions, setSeasonOptions] = useState<any>([]);
  const [sortConfig, setSortConfig] = useState<any>({
    key: null,
    direction: "",
  });
  const errorToast = useToast();
  const router = useRouter();

  useEffect(() => {
    // Fetch the list of seasons
    axios
      .get(`${apiUrl}/getSeasons`)
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

    if (mode === "singles") {
      data = axios.get(
        `${apiUrl}/get-records?mode=${mode}&seasonId=${season}`
      );
    } else if (mode === "doubles") {
      data = axios.get(
        `${apiUrl}/get-records-p?mode=${mode}&seasonId=${season}`
      );
    } else if (mode === "allstar") {
      data = axios.get(
        `${apiUrl}/get-records-p?mode=${mode}&seasonId=${season}`
      );
    } else {
      data = axios.get(
        `${apiUrl}/get-combined-records?seasonId=${season}`
      );
    }

    data.then((resp: any) => {
      // Sort data by winPercentage before setting it
      const sortedData = resp.data
        ? (resp.data as any[]).sort((a, b) => {
            if (sortConfig.key === "record") {
              // For sorting by wins (record)
              return sortConfig.direction === "ascending"
                ? a.wins - b.wins
                : b.wins - a.wins;
            } else {
              // For sorting by winPercentage
              return sortConfig.direction === "ascending"
                ? a.winPercentage - b.winPercentage
                : b.winPercentage - a.winPercentage;
            }
          })
        : [];
      setData(sortedData as any);
    });
  };

  const requestSort = (key: string) => {
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    fetchData(selectedSeason, selectedMode);
  }, [sortConfig]);

  return (
    <Container maxW="container.xl" py={10}>
      <Heading as="h1" mb={6}>
        Player Statistics
      </Heading>
      <VStack spacing={6} align="stretch">
        <FormControl>
          <FormLabel>Select Mode</FormLabel>
          <Select
            placeholder="Select mode"
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
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
          >
            {seasonOptions.map((option: any, index: any) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Table variant="striped" colorScheme="teal">
            <Thead>
              <Tr>
                <Th
                  _hover={{ cursor: "pointer" }}
                  onClick={() => requestSort("player")}
                >
                  Name
                </Th>
                <Th
                  _hover={{ cursor: "pointer" }}
                  onClick={() => requestSort("record")}
                >
                  Record
                </Th>
                <Th
                  _hover={{ cursor: "pointer" }}
                  onClick={() => requestSort("winPercentage")}
                >
                  Win Percentage
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((row: any, index: any) => (
                <Tr key={index}>
                  <Td>{row.player}</Td>
                  <Td>{`${row.wins}-${row.totalMatches - row.wins}`}</Td>
                  <Td>
                    <Box
                      width="100%"
                      height="24px"
                      bg="gray.200"
                      borderRadius="md"
                      position="relative"
                      overflow="hidden"
                    >
                      <Box
                        width={`${row.winPercentage}%`}
                        height="100%"
                        bg="teal.500"
                        borderRadius="md"
                        position="absolute"
                        top="0"
                        left="0"
                        transition="width 0.5s ease-in-out"
                      />
                      <Box
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        color="black"
                        fontWeight="bold"
                        fontSize="sm"
                        zIndex="1"
                      >
                        {row.winPercentage}%
                      </Box>
                    </Box>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        <Button
          leftIcon={<ArrowBackIcon />}
          maxW="120px"
          bg="blackAlpha.800"
          onClick={() => {
            router.push("/");
          }}
        >
          Back
        </Button>
      </VStack>
    </Container>
  );
}
